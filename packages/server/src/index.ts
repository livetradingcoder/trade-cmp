import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import connectDB from "./config/database";
import cloudinary from "./config/cloudinary";
import Tournament from "./models/Tournament";
import Admin from "./models/Admin";
import { generateToken, verifyToken, AuthRequest } from "./middleware/auth";
import { upload } from "./middleware/upload";
import { sendPasswordResetEmail } from "./utils/email";

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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
