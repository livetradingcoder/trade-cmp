import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import connectDB from "./config/database";
import cloudinary from "./config/cloudinary";
import Tournament from "./models/Tournament";
import Admin from "./models/Admin";
import Settings from "./models/Settings";
import User from "./models/User";
import Participant from "./models/Participant";
import LeaderboardCache from "./models/LeaderboardCache";
import { generateToken, verifyToken, AuthRequest } from "./middleware/auth";
import { upload } from "./middleware/upload";
import { sendPasswordResetEmail } from "./utils/email";
import { sendEmail, emailTemplates } from "./utils/emailService";
import { encrypt } from "./utils/encryption";
import { createEmailTransporter, getSMTPSettings } from "./utils/smtpConfig";
import { syncTournament } from "./services/sync/syncTournament";
import { startSyncScheduler } from "./services/sync/scheduler";
import { probeFpMarkets } from "./services/brokers/fpMarketsConnector";
import { getBrokerConnector } from "./services/brokers";
import BrokerIntegration from "./models/BrokerIntegration";
import TradingAccount from "./models/TradingAccount";
import SyncRun from "./models/SyncRun";

// Load environment variables
dotenv.config({ path: "../../.env" });

const app = express();
// Use fixed internal port 3001 for backend - nginx proxies to this
// Don't use process.env.PORT as that's for the main container (nginx)
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: "mongodb" });
});

// Bootstrap helper: report this server's outbound IP so it can be whitelisted
// in MongoDB Atlas and by the broker. Remove once the IP is recorded.
app.get("/api/egress-ip", async (_req, res) => {
  try {
    const ip = (await (await fetch("https://api.ipify.org")).text()).trim();
    res.json({ egress_ip: ip });
  } catch (error: any) {
    res.status(502).json({ error: error?.message || "IP lookup failed" });
  }
});

// ==================== AUTH ENDPOINTS ====================

// Admin login with JWT
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = generateToken(admin._id.toString(), admin.username);

    res.json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Forgot password - Send reset email
app.post("/api/admin/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: "If that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Save token and expiry to database
    admin.resetPasswordToken = hashedToken;
    admin.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await admin.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

    // Send email
    await sendPasswordResetEmail(admin.email, resetToken, resetUrl);

    res.json({
      success: true,
      message: "If that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Error sending reset email" });
  }
});

// Reset password
app.post("/api/admin/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Hash the token to match database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find admin with valid token
    const admin = await Admin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Update password
    admin.password = password;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

    res.json({
      success: true,
      message: "Password reset successful. You can now login.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Error resetting password" });
  }
});

// Verify token endpoint
app.get("/api/admin/verify", verifyToken, (req: AuthRequest, res) => {
  res.json({
    success: true,
    admin: {
      id: req.adminId,
      username: req.username,
    },
  });
});

// Change password
app.post("/api/admin/change-password", verifyToken, async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current password and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }

  try {
    const admin = await Admin.findById(req.adminId);

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const isPasswordValid = await admin.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Update password (will be hashed by pre-save hook)
    admin.password = newPassword;
    await admin.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// ==================== IMAGE UPLOAD ENDPOINTS ====================

// Upload image to Cloudinary
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "trade-arena/tournaments",
          resource_type: "image",
          transformation: [
            { width: 1200, height: 600, crop: "limit" },
            { quality: "auto", fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file!.buffer);
    });

    const uploadResult = result as any;

    res.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// ==================== TOURNAMENT ENDPOINTS ====================

// Get all tournaments
app.get("/api/tournaments", async (req, res) => {
  try {
    const tournaments = await Tournament.find().sort({ createdAt: 1 });
    // Transform _id to id for frontend compatibility
    const transformedTournaments = tournaments.map((t) => ({
      id: t._id.toString(),
      title: t.title,
      tier: t.tier,
      prize: t.prize,
      fee: t.fee,
      participants: t.participants,
      timeLabel: t.timeLabel,
      timeLeft: t.timeLeft,
      cover: t.cover,
      image: t.image,
      registrationLink: t.registrationLink,
      status: t.status,
      start_date: t.start_date,
      end_date: t.end_date,
    }));
    res.json(transformedTournaments);
  } catch (error) {
    console.error("Fetch tournaments error:", error);
    res.status(500).json({ error: "Failed to fetch tournaments" });
  }
});

// Get single tournament
app.get("/api/tournaments/:id", async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (tournament) {
      // Transform _id to id for frontend compatibility
      const transformed = {
        id: tournament._id.toString(),
        title: tournament.title,
        tier: tournament.tier,
        prize: tournament.prize,
        fee: tournament.fee,
        participants: tournament.participants,
        timeLabel: tournament.timeLabel,
        timeLeft: tournament.timeLeft,
        cover: tournament.cover,
        image: tournament.image,
        registrationLink: tournament.registrationLink,
        status: tournament.status,
        start_date: tournament.start_date,
        end_date: tournament.end_date,
      };
      res.json(transformed);
    } else {
      res.status(404).json({ error: "Tournament not found" });
    }
  } catch (error) {
    console.error("Fetch tournament error:", error);
    res.status(500).json({ error: "Failed to fetch tournament" });
  }
});

// Create tournament (protected)
app.post("/api/tournaments", verifyToken, async (req: AuthRequest, res) => {
  try {
    // Validate required fields
    if (!req.body.title || !req.body.registrationLink) {
      return res.status(400).json({
        error: "Title and registration link are required",
      });
    }

    // Set defaults for optional fields
    const tournamentData = {
      ...req.body,
      tier: req.body.tier || "Weekly",
      prize: req.body.prize || "",
      fee: req.body.fee || "",
      participants: req.body.participants || 0,
      timeLabel: req.body.timeLabel || "Seats Left",
      timeLeft: req.body.timeLeft || "",
      image: req.body.image || "",
      status: req.body.status || "draft",
      start_date: req.body.start_date || null,
      end_date: req.body.end_date || null,
      cover:
        req.body.cover ||
        "https://firebasestorage.googleapis.com/v0/b/fortraders-production.firebasestorage.app/o/public%2Ftournament_cover%2Fe2207b07-3cdb-4e1b-96d8-1763c85679ae.jpg?alt=media",
    };

    const tournament = await Tournament.create(tournamentData);
    // Transform _id to id for frontend compatibility
    const transformed = {
      id: tournament._id.toString(),
      title: tournament.title,
      tier: tournament.tier,
      prize: tournament.prize,
      fee: tournament.fee,
      participants: tournament.participants,
      timeLabel: tournament.timeLabel,
      timeLeft: tournament.timeLeft,
      cover: tournament.cover,
      image: tournament.image,
      registrationLink: tournament.registrationLink,
      status: tournament.status,
      start_date: tournament.start_date,
      end_date: tournament.end_date,
    };
    res.json(transformed);
  } catch (error) {
    console.error("Create tournament error:", error);
    res.status(500).json({
      error: "Failed to create tournament",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Update tournament (protected)
app.put("/api/tournaments/:id", verifyToken, async (req: AuthRequest, res) => {
  try {
    // Filter out undefined values but keep empty strings
    const updateData = { ...req.body };

    const tournament = await Tournament.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (tournament) {
      // Transform _id to id for frontend compatibility
      const transformed = {
        id: tournament._id.toString(),
        title: tournament.title,
        tier: tournament.tier,
        prize: tournament.prize,
        fee: tournament.fee,
        participants: tournament.participants,
        timeLabel: tournament.timeLabel,
        timeLeft: tournament.timeLeft,
        cover: tournament.cover,
        image: tournament.image,
        registrationLink: tournament.registrationLink,
        status: tournament.status,
        start_date: tournament.start_date,
        end_date: tournament.end_date,
      };
      res.json(transformed);
    } else {
      res.status(404).json({ error: "Tournament not found" });
    }
  } catch (error) {
    console.error("Update tournament error:", error);
    res.status(500).json({
      error: "Failed to update tournament",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Delete tournament (protected)
app.delete("/api/tournaments/:id", verifyToken, async (req: AuthRequest, res) => {
  try {
    const tournament = await Tournament.findByIdAndDelete(req.params.id);
    if (tournament) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Tournament not found" });
    }
  } catch (error) {
    console.error("Delete tournament error:", error);
    res.status(500).json({ error: "Failed to delete tournament" });
  }
});

// ==================== USER ENDPOINTS ====================

// Register user
app.post("/api/users/register", async (req, res) => {
  const { email, fp_account_number, referral_code_used, is_new_user } = req.body;

  try {
    // Validate required fields
    if (!email || !fp_account_number) {
      return res.status(400).json({
        success: false,
        message: "Email and FP Markets account number are required"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { fp_account_number }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or account number already exists"
      });
    }

    // Create new user
    const user = await User.create({
      email: email.toLowerCase(),
      fp_account_number,
      referral_code_used,
      is_new_user: is_new_user !== undefined ? is_new_user : true,
      account_verified: false,
    });

    res.json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        email: user.email,
        fp_account_number: user.fp_account_number,
        account_verified: user.account_verified,
      },
    });
  } catch (error) {
    console.error("User registration error:", error);
    res.status(500).json({ success: false, message: "Failed to register user" });
  }
});

// Get user by ID
app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        fp_account_number: user.fp_account_number,
        display_name: user.display_name,
        account_verified: user.account_verified,
        verified_at: user.verified_at,
        is_new_user: user.is_new_user,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
});

// ==================== PARTICIPANT ENDPOINTS ====================

// Apply to tournament
app.post("/api/participants/apply", async (req, res) => {
  const { tournament_id, email, fp_account_number, referral_code_used, is_new_user } = req.body;

  try {
    // Validate required fields
    if (!tournament_id || !email || !fp_account_number) {
      return res.status(400).json({
        success: false,
        message: "Tournament ID, email, and account number are required"
      });
    }

    // Check if tournament exists
    const tournament = await Tournament.findById(tournament_id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }

    // FP Markets has no real account/referral-verification endpoint (only the
    // performance API exists). New users are assumed to have used the referral
    // code since they registered through our link; existing users are always
    // flagged for manual admin verification against FP's IB portal.
    const referralCodeVerified = !!is_new_user;

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = await User.create({
        email: email.toLowerCase(),
        fp_account_number,
        referral_code_used,
        is_new_user: is_new_user !== undefined ? is_new_user : true,
        account_verified: false,
      });
    }

    // Check if user already applied to this tournament
    const existingParticipant = await Participant.findOne({
      tournament_id,
      user_id: user._id,
    });

    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: "You have already applied to this tournament",
        participant: {
          id: existingParticipant._id,
          status: existingParticipant.status,
        },
      });
    }

    // Create participant application with referral code verification status
    const participant = await Participant.create({
      tournament_id,
      user_id: user._id,
      status: "pending",
      referral_code_verified: referralCodeVerified,
      applied_at: new Date(),
    });

    // Send email notification
    await sendEmail(
      email,
      emailTemplates.applicationSubmitted(email, tournament.title)
    );

    res.json({
      success: true,
      message: "Application submitted successfully. Pending admin review.",
      participant: {
        id: participant._id,
        tournament_id: participant.tournament_id,
        status: participant.status,
        referral_code_verified: referralCodeVerified,
        applied_at: participant.applied_at,
      },
    });
  } catch (error) {
    console.error("Apply to tournament error:", error);
    res.status(500).json({ success: false, message: "Failed to submit application" });
  }
});

// Get participants for a tournament (protected - admin only)
app.get("/api/participants/:tournamentId", verifyToken, async (req: AuthRequest, res) => {
  try {
    const participants = await Participant.find({
      tournament_id: req.params.tournamentId
    })
      .populate("user_id", "email fp_account_number display_name account_verified")
      .populate("reviewed_by", "username")
      .populate("disqualified_by", "username")
      .sort({ applied_at: -1 });

    res.json({
      success: true,
      participants: participants.map(p => ({
        id: p._id,
        tournament_id: p.tournament_id,
        user: p.user_id,
        status: p.status,
        applied_at: p.applied_at,
        reviewed_at: p.reviewed_at,
        reviewed_by: p.reviewed_by,
        decline_reason: p.decline_reason,
        disqualified_at: p.disqualified_at,
        disqualified_by: p.disqualified_by,
        disqualification_reason: p.disqualification_reason,
        notes: p.notes,
      })),
    });
  } catch (error) {
    console.error("Get participants error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch participants" });
  }
});

// Approve participant (protected - admin only)
app.put("/api/participants/:id/approve", verifyToken, async (req: AuthRequest, res) => {
  try {
    const participant = await Participant.findById(req.params.id);

    if (!participant) {
      return res.status(404).json({ success: false, message: "Participant not found" });
    }

    if (participant.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot approve participant with status: ${participant.status}`
      });
    }

    participant.status = "approved";
    participant.reviewed_at = new Date();
    participant.reviewed_by = req.adminId as any;
    await participant.save();

    // Populate user info and tournament for email
    await participant.populate("user_id", "email fp_account_number");
    await participant.populate("tournament_id", "title start_date end_date");

    // Send approval email with the tournament's real dates
    const user = participant.user_id as any;
    const tournament = participant.tournament_id as any;
    const formatDate = (value?: Date) =>
      value
        ? new Date(value).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "To be announced";
    await sendEmail(
      user.email,
      emailTemplates.applicationApproved(
        user.email,
        tournament.title,
        formatDate(tournament.start_date),
        formatDate(tournament.end_date)
      )
    );

    res.json({
      success: true,
      message: "Participant approved successfully",
      participant: {
        id: participant._id,
        status: participant.status,
        reviewed_at: participant.reviewed_at,
        user: participant.user_id,
      },
    });
  } catch (error) {
    console.error("Approve participant error:", error);
    res.status(500).json({ success: false, message: "Failed to approve participant" });
  }
});

// Decline participant (protected - admin only)
app.put("/api/participants/:id/decline", verifyToken, async (req: AuthRequest, res) => {
  const { reason } = req.body;

  try {
    const participant = await Participant.findById(req.params.id);

    if (!participant) {
      return res.status(404).json({ success: false, message: "Participant not found" });
    }

    if (participant.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot decline participant with status: ${participant.status}`
      });
    }

    participant.status = "declined";
    participant.reviewed_at = new Date();
    participant.reviewed_by = req.adminId as any;
    participant.decline_reason = reason || "Application declined";
    await participant.save();

    // Populate user info and tournament for email
    await participant.populate("user_id", "email fp_account_number");
    await participant.populate("tournament_id", "title");

    // Send decline email
    const user = participant.user_id as any;
    const tournament = participant.tournament_id as any;
    await sendEmail(
      user.email,
      emailTemplates.applicationDeclined(
        user.email,
        tournament.title,
        participant.decline_reason || "Application declined"
      )
    );

    res.json({
      success: true,
      message: "Participant declined",
      participant: {
        id: participant._id,
        status: participant.status,
        reviewed_at: participant.reviewed_at,
        decline_reason: participant.decline_reason,
        user: participant.user_id,
      },
    });
  } catch (error) {
    console.error("Decline participant error:", error);
    res.status(500).json({ success: false, message: "Failed to decline participant" });
  }
});

// Disqualify participant (protected - admin only)
app.put("/api/participants/:id/disqualify", verifyToken, async (req: AuthRequest, res) => {
  const { reason } = req.body;

  try {
    const participant = await Participant.findById(req.params.id);

    if (!participant) {
      return res.status(404).json({ success: false, message: "Participant not found" });
    }

    if (participant.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: `Can only disqualify approved participants. Current status: ${participant.status}`
      });
    }

    participant.status = "disqualified";
    participant.disqualified_at = new Date();
    participant.disqualified_by = req.adminId as any;
    participant.disqualification_reason = reason || "Disqualified by admin";
    await participant.save();

    // Populate user info and tournament for email
    await participant.populate("user_id", "email fp_account_number");
    await participant.populate("tournament_id", "title");

    // Send disqualification email
    const user = participant.user_id as any;
    const tournament = participant.tournament_id as any;
    await sendEmail(
      user.email,
      emailTemplates.participantDisqualified(
        user.email,
        tournament.title,
        participant.disqualification_reason || "Disqualified by admin"
      )
    );

    res.json({
      success: true,
      message: "Participant disqualified",
      participant: {
        id: participant._id,
        status: participant.status,
        disqualified_at: participant.disqualified_at,
        disqualification_reason: participant.disqualification_reason,
        user: participant.user_id,
      },
    });
  } catch (error) {
    console.error("Disqualify participant error:", error);
    res.status(500).json({ success: false, message: "Failed to disqualify participant" });
  }
});

// ==================== MOCK BROKER API ENDPOINTS ====================
// These endpoints simulate FP Markets broker responses for local development
// Replace with real broker integration when API is available

// Mock account validation
app.post("/api/broker/validate", async (req, res) => {
  const { account_number, email, referral_code } = req.body;

  try {
    // Simulate validation logic
    const isValid = account_number && email;
    const emailMatch = email && email.includes("@");

    // Randomly return referral_code_used true/false (50/50 chance)
    // This simulates real-world scenario where some users have referral code, some don't
    const referralCodeUsed = Math.random() > 0.5;

    // Mock response matching FP Markets expected format
    res.json({
      valid: isValid,
      account_number,
      email_match: emailMatch,
      referral_code_used: referralCodeUsed,
      account_status: "active",
      account_created_at: new Date().toISOString(),
      account_type: "live",
      account_balance: 15000.00,
      user_info: {
        first_name: "John",
        last_name_masked: "D***",
      },
    });
  } catch (error) {
    console.error("Mock broker validate error:", error);
    res.status(500).json({ error: "Validation failed" });
  }
});

// Mock account info
app.get("/api/broker/info", async (req, res) => {
  const { account_number } = req.query;

  try {
    if (!account_number) {
      return res.status(400).json({ error: "Account number is required" });
    }

    // Mock response matching FP Markets expected format
    res.json({
      account_number,
      account_status: "active",
      account_type: "live",
      account_created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      currency: "USD",
      account_balance: 15000.00,
      user_info: {
        first_name: "John",
        last_name_masked: "D***",
      },
    });
  } catch (error) {
    console.error("Mock broker info error:", error);
    res.status(500).json({ error: "Failed to fetch account info" });
  }
});

// Mock performance data
app.post("/api/broker/performance", async (req, res) => {
  const { account_numbers, start_date, end_date, metrics } = req.body;

  try {
    if (!account_numbers || !Array.isArray(account_numbers)) {
      return res.status(400).json({ error: "account_numbers array is required" });
    }

    // Generate mock performance data for each account
    const accounts = account_numbers.map((account_number, index) => {
      const roi = Math.random() * 100 - 20; // Random ROI between -20% and 80%
      const starting_balance = 10000 + (index * 1000);
      const current_balance = starting_balance * (1 + roi / 100);

      return {
        account_number,
        user_info: {
          first_name: ["John", "Jane", "Mike", "Sarah", "David"][index % 5],
          last_name_masked: ["D***", "S***", "J***", "W***", "B***"][index % 5],
        },
        metrics: {
          roi: parseFloat(roi.toFixed(2)),
          starting_balance: parseFloat(starting_balance.toFixed(2)),
          current_balance: parseFloat(current_balance.toFixed(2)),
        },
        last_trade_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
      };
    });

    // Mock response matching FP Markets expected format
    res.json({
      start_date: start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: end_date || new Date().toISOString(),
      accounts,
    });
  } catch (error) {
    console.error("Mock broker performance error:", error);
    res.status(500).json({ error: "Failed to fetch performance data" });
  }
});

// ==================== SETTINGS ENDPOINTS ====================

// Get all settings (public)
app.get("/api/settings", async (req, res) => {
  try {
    const settings = await Settings.find();
    const settingsObj: Record<string, string> = {};
    settings.forEach((s) => {
      settingsObj[s.key] = s.key === "smtp_pass" && s.value ? "••••••••" : s.value;
    });
    res.json(settingsObj);
  } catch (error) {
    console.error("Fetch settings error:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// Get specific setting (public)
app.get("/api/settings/:key", async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: req.params.key });
    if (setting) {
      // Mask SMTP password for security
      let value = setting.value;
      if (req.params.key === "smtp_pass" && value) {
        value = "••••••••";
      }
      res.json({ key: setting.key, value });
    } else {
      res.json({ key: req.params.key, value: "" });
    }
  } catch (error) {
    console.error("Fetch setting error:", error);
    res.status(500).json({ error: "Failed to fetch setting" });
  }
});

// Update setting (protected)
app.put("/api/settings/:key", verifyToken, async (req: AuthRequest, res) => {
  try {
    let { value } = req.body;

    // Encrypt SMTP password before storing
    if (req.params.key === "smtp_pass" && value) {
      value = encrypt(value);
    }

    const setting = await Settings.findOneAndUpdate(
      { key: req.params.key },
      { value },
      { new: true, upsert: true }
    );

    // Mask password in response
    let responseValue = setting.value;
    if (req.params.key === "smtp_pass" && responseValue) {
      responseValue = "••••••••";
    }

    res.json({ key: setting.key, value: responseValue });
  } catch (error) {
    console.error("Update setting error:", error);
    res.status(500).json({ error: "Failed to update setting" });
  }
});

// Test SMTP configuration (protected)
app.post("/api/settings/smtp/test", verifyToken, async (req: AuthRequest, res) => {
  const { testEmail } = req.body;

  try {
    if (!testEmail) {
      return res.status(400).json({ error: "Test email address is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return res.status(400).json({ error: "Invalid email address format" });
    }

    // Get SMTP settings
    const smtpSettings = await getSMTPSettings();

    if (!smtpSettings || !smtpSettings.host || !smtpSettings.user) {
      return res.status(400).json({
        error: "SMTP not configured. Please configure SMTP settings first.",
      });
    }

    // Create transporter
    const transporter = await createEmailTransporter();

    if (!transporter) {
      return res.status(500).json({
        error: "Failed to create email transporter. Check your SMTP settings.",
      });
    }

    // Send test email
    await transporter.sendMail({
      from: smtpSettings.from || "noreply@livetradingleague.com",
      to: testEmail,
      subject: "SMTP Configuration Test - LiveTradingLeague",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">SMTP Configuration Test</h2>
          <p>Congratulations! Your SMTP email settings are working correctly.</p>
          <p>This test email was sent from your LiveTradingLeague admin panel to verify your email configuration.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            <strong>SMTP Configuration Details:</strong><br>
            Host: ${smtpSettings.host}<br>
            Port: ${smtpSettings.port}<br>
            Secure: ${smtpSettings.secure ? "Yes (TLS/SSL)" : "No"}<br>
            User: ${smtpSettings.user}<br>
            From: ${smtpSettings.from}
          </p>
        </div>
      `,
      text: `SMTP Configuration Test\n\nCongratulations! Your SMTP email settings are working correctly.\n\nThis test email was sent from your LiveTradingLeague admin panel to verify your email configuration.\n\nSMTP Configuration Details:\nHost: ${smtpSettings.host}\nPort: ${smtpSettings.port}\nSecure: ${smtpSettings.secure ? "Yes (TLS/SSL)" : "No"}\nUser: ${smtpSettings.user}\nFrom: ${smtpSettings.from}`,
    });

    res.json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
    });
  } catch (error) {
    console.error("SMTP test error:", error);

    // Provide detailed error message
    let errorMessage = "Failed to send test email. ";
    if (error instanceof Error) {
      if (error.message.includes("Invalid login")) {
        errorMessage += "Invalid SMTP username or password.";
      } else if (error.message.includes("ECONNREFUSED")) {
        errorMessage += "Could not connect to SMTP server. Check host and port.";
      } else if (error.message.includes("ETIMEDOUT")) {
        errorMessage += "Connection timed out. Check your network and SMTP settings.";
      } else {
        errorMessage += error.message;
      }
    }

    res.status(500).json({ error: errorMessage });
  }
});

// ==================== BROKER SYNC SETUP (admin) ====================

// Ensure a broker integration exists for a connector type (idempotent upsert).
// Capability flags come from the connector implementation itself.
app.post("/api/admin/broker-integrations", verifyToken, async (req: AuthRequest, res) => {
  const { type, name } = req.body;

  try {
    if (!type) {
      return res.status(400).json({ success: false, message: "type is required" });
    }

    let connector;
    try {
      connector = getBrokerConnector(type);
    } catch {
      return res.status(400).json({
        success: false,
        message: `Unsupported broker connector: ${type}`,
      });
    }

    const integration = await BrokerIntegration.findOneAndUpdate(
      { type },
      {
        $set: {
          name: name || type,
          enabled: true,
          supports_raw_trades: connector.supportsRawTrades,
          supports_snapshots: connector.supportsSnapshots,
          supports_broker_metrics: connector.supportsBrokerMetrics,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, integration });
  } catch (error) {
    console.error("Broker integration ensure error:", error);
    res.status(500).json({ success: false, message: "Failed to ensure broker integration" });
  }
});

// List broker integrations
app.get("/api/admin/broker-integrations", verifyToken, async (_req: AuthRequest, res) => {
  try {
    const integrations = await BrokerIntegration.find().sort({ type: 1 });
    res.json({ success: true, integrations });
  } catch (error) {
    console.error("Broker integration list error:", error);
    res.status(500).json({ success: false, message: "Failed to list broker integrations" });
  }
});

// Assign an approved participant's trading account to a broker integration so
// syncTournament picks it up. broker_account_number defaults to the user's
// registered FP account number.
app.post("/api/admin/trading-accounts", verifyToken, async (req: AuthRequest, res) => {
  const { participant_id, broker_integration_id, broker_account_number } = req.body;

  try {
    if (!participant_id || !broker_integration_id) {
      return res.status(400).json({
        success: false,
        message: "participant_id and broker_integration_id are required",
      });
    }

    const participant = await Participant.findById(participant_id).populate(
      "user_id",
      "fp_account_number email"
    );
    if (!participant) {
      return res.status(404).json({ success: false, message: "Participant not found" });
    }
    if (participant.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: `Participant must be approved (current status: ${participant.status})`,
      });
    }

    const integration = await BrokerIntegration.findById(broker_integration_id);
    if (!integration) {
      return res.status(404).json({ success: false, message: "Broker integration not found" });
    }

    const user = participant.user_id as any;
    const accountNumber = broker_account_number || user.fp_account_number;

    const account = await TradingAccount.create({
      user_id: user._id,
      participant_id: participant._id,
      tournament_id: participant.tournament_id,
      broker_integration_id: integration._id,
      broker_account_number: accountNumber,
      status: "active",
      validated_at: new Date(),
    });

    res.json({ success: true, account });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A trading account with this number already exists for the tournament",
      });
    }
    console.error("Trading account create error:", error);
    res.status(500).json({ success: false, message: "Failed to create trading account" });
  }
});

// List trading accounts for a tournament
app.get("/api/admin/trading-accounts/:tournamentId", verifyToken, async (req: AuthRequest, res) => {
  try {
    const accounts = await TradingAccount.find({ tournament_id: req.params.tournamentId })
      .populate("user_id", "email fp_account_number display_name")
      .populate("participant_id", "status")
      .populate("broker_integration_id", "type name enabled");
    res.json({ success: true, accounts });
  } catch (error) {
    console.error("Trading account list error:", error);
    res.status(500).json({ success: false, message: "Failed to list trading accounts" });
  }
});

// Diagnostic: one live signed call to FP Markets (protected - admin only).
// Proves request signing + IP whitelisting end to end from this server's IP.
// Optional ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD override the date window.
app.get("/api/admin/fp-test", verifyToken, async (req: AuthRequest, res) => {
  try {
    const startDate =
      typeof req.query.start_date === "string" ? req.query.start_date : undefined;
    const endDate =
      typeof req.query.end_date === "string" ? req.query.end_date : undefined;

    const result = await probeFpMarkets({ startDate, endDate });
    res.json({
      success: true,
      base_url: result.baseUrl,
      requested_accounts: result.requestedAccounts,
      start_date: result.startDate,
      end_date: result.endDate,
      accounts_count: result.accountsReturned.length,
      accounts: result.accountsReturned,
    });
  } catch (error: any) {
    // 502: we reached out but the broker rejected us (bad IP / signature / token)
    // or config is missing. The message carries the broker's exact reason.
    res.status(502).json({
      success: false,
      message: error?.message || "FP Markets probe failed",
    });
  }
});

// Trigger a broker sync for a tournament (protected - admin only)
app.post("/api/admin/sync/:tournamentId", verifyToken, async (req: AuthRequest, res) => {
  try {
    const result = await syncTournament(req.params.tournamentId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Sync error:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to sync tournament",
    });
  }
});

// List recent sync runs for a tournament, most recent first (protected - admin only)
app.get("/api/admin/sync-runs/:tournamentId", verifyToken, async (req: AuthRequest, res) => {
  try {
    const runs = await SyncRun.find({ tournament_id: req.params.tournamentId })
      .sort({ started_at: -1 })
      .limit(20);
    res.json({ success: true, runs });
  } catch (error) {
    console.error("Sync run list error:", error);
    res.status(500).json({ success: false, message: "Failed to list sync runs" });
  }
});

// Get leaderboard for a tournament (protected - admin only)
// Public: leaderboard response is already sanitized (masked account numbers,
// no balances) — no admin auth needed, matches spec's public leaderboard requirement.
app.get("/api/leaderboard/:tournamentId", async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const cache = await LeaderboardCache.findOne({ tournament_id: tournamentId });

    if (!cache) {
      return res.json({
        leaderboard: [],
        fetched_at: null,
        expires_at: null,
        stale: true,
      });
    }

    res.json({
      leaderboard: cache.rankings.map((r) => ({
        rank: r.rank,
        participant_id: r.participant_id,
        trading_account_id: r.trading_account_id,
        display_name: r.display_name,
        account_masked: r.account_masked,
        roi: r.roi,
        pnl: r.pnl,
        win_rate: r.win_rate,
        trade_count: r.trade_count,
        calculation_source: r.calculation_source,
        calculation_status: r.calculation_status,
        updated_at: r.updated_at,
      })),
      fetched_at: cache.fetched_at,
      expires_at: cache.expires_at,
      stale: cache.expires_at.getTime() < Date.now(),
    });
  } catch (error) {
    console.error("Fetch leaderboard error:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// Don't call app.listen() in serverless environment
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
  startSyncScheduler();
}

// Export for Vercel serverless
export default app;
