import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const RETRY_MS = 10000;

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb://localhost:27017/trade_arena";

    // Set connection options with timeout
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,
    });

    console.log("✅ MongoDB connected successfully");
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);

    // Auto-seed admin if not exists
    await seedAdminIfNeeded();
  } catch (error) {
    // Never exit the process — that causes a deploy crash-loop on hosts like
    // Railway when the DB IP is not yet whitelisted. Keep the server (and its
    // health check) up and retry; mongoose connects as soon as the network/IP
    // allowlist is fixed.
    console.error("❌ MongoDB connection error:", error instanceof Error ? error.message : error);
    console.log(
      `↻ Server stays up; retrying MongoDB in ${RETRY_MS / 1000}s. ` +
        `If on a cloud host, check the DB IP allowlist (e.g. MongoDB Atlas Network Access).`
    );
    setTimeout(() => {
      void connectDB();
    }, RETRY_MS);
  }
};

// Seed default admin user if none exists
const seedAdminIfNeeded = async () => {
  try {
    // Dynamic import to avoid circular dependency
    const Admin = (await import("../models/Admin")).default;

    const existingAdmin = await Admin.findOne({});
    if (!existingAdmin) {
      console.log("🌱 Seeding default admin user...");

      const hashedPassword = await bcrypt.hash("admin123", 10);
      await Admin.create({
        username: "admin",
        email: "admin@LiveTradingLeague.com",
        password: hashedPassword,
      });

      console.log("✅ Default admin created (username: admin, password: admin123)");
      console.log("⚠️  Please change the default password after first login!");
    }
  } catch (error) {
    console.log("⚠️  Admin seeding skipped:", error instanceof Error ? error.message : "Unknown error");
  }
};

// Handle connection events
mongoose.connection.on("disconnected", () => {
  console.log("⚠️  MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err);
});

mongoose.connection.on("reconnected", () => {
  console.log("✅ MongoDB reconnected");
});

export default connectDB;
