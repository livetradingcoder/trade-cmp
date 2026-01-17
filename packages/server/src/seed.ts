import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/database";
import Tournament from "./models/Tournament";
import Admin from "./models/Admin";

// Load environment variables
dotenv.config({ path: "../../.env" });

const TOURNAMENT_COVER =
  "https://firebasestorage.googleapis.com/v0/b/fortraders-production.firebasestorage.app/o/public%2Ftournament_cover%2Fe2207b07-3cdb-4e1b-96d8-1763c85679ae.jpg?alt=media";

async function main() {
  try {
    // Connect to database
    await connectDB();

    console.log("🌱 Starting database seed...\n");

    // Get admin credentials from environment
    const adminUsername = process.env.ADMIN_USERNAME || "ltl-admin-1";
    const adminPassword = process.env.ADMIN_PASSWORD || "Adm!n2026";
    const adminEmail = `${adminUsername}@livetradingleague.com`;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: adminUsername });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists");
      console.log("   Username:", existingAdmin.username);
      console.log("   Email:", existingAdmin.email);
      console.log("   (Skipping admin creation)\n");
    } else {
      // Create default admin
      await Admin.create({
        username: adminUsername,
        email: adminEmail,
        password: adminPassword,
      });

      console.log("✅ Admin user created");
      console.log("   Username:", adminUsername);
      console.log("   Email:", adminEmail);
      console.log("   Password:", adminPassword);
      console.log("   ⚠️  Please change the password after first login!\n");
    }

    // Check existing tournaments
    const existingTournaments = await Tournament.countDocuments();

    if (existingTournaments > 0) {
      console.log(`⚠️  Found ${existingTournaments} existing tournament(s)`);
      console.log("   (Skipping tournament creation)\n");
    } else {
      // Create initial tournaments
      const tournaments = [
        {
          title: "January Clash",
          tier: "Weekly",
          prize: "50K Challenge",
          fee: "$10",
          participants: 1481,
          timeLabel: "Ends in",
          timeLeft: "27d 20:17:59",
          cover: TOURNAMENT_COVER,
          image: TOURNAMENT_COVER,
          registrationLink: "https://tradingview.com",
        },
        {
          title: "Wednesday Clash",
          tier: "Weekly",
          prize: "50K Challenge",
          fee: "$10",
          participants: 18,
          timeLabel: "Starts in",
          timeLeft: "4d 20:17:59",
          cover: TOURNAMENT_COVER,
          image: TOURNAMENT_COVER,
          registrationLink: "https://tradingview.com",
        },
        {
          title: "February Clash",
          tier: "Monthly",
          prize: "50K Challenge",
          fee: "$25",
          participants: 7,
          timeLabel: "Starts in",
          timeLeft: "30d 20:17:59",
          cover: TOURNAMENT_COVER,
          image: TOURNAMENT_COVER,
          registrationLink: "https://tradingview.com",
        },
      ];

      await Tournament.insertMany(tournaments);
      console.log(`✅ Created ${tournaments.length} initial tournaments\n`);
    }

    console.log("🎉 Database seeded successfully!");
  } catch (error) {
    console.error("❌ Seeding error:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
    }
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("👋 Database connection closed");
  }
}

main();
