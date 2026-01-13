import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
    console.error("❌ MongoDB connection error:", error);
    console.log("\n⚠️  MongoDB is not available. Please:");
    console.log("   1. Install MongoDB: brew install mongodb-community");
    console.log("   2. Start MongoDB: brew services start mongodb-community");
    console.log("   3. Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas");
    console.log("   4. Update MONGODB_URI in your .env file\n");

    // Don't exit in development, just warn
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
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
        email: "admin@tradearena.com",
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
