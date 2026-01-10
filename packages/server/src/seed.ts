import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TOURNAMENT_COVER =
  "https://firebasestorage.googleapis.com/v0/b/fortraders-production.firebasestorage.app/o/public%2Ftournament_cover%2Fe2207b07-3cdb-4e1b-96d8-1763c85679ae.jpg?alt=media";

async function main() {
  // Clear existing data
  await prisma.tournament.deleteMany();
  await prisma.admin.deleteMany();

  // Create default admin
  await prisma.admin.create({
    data: {
      username: "admin",
      password: "admin",
    },
  });

  console.log("✅ Admin user created (username: admin, password: admin)");

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

  for (const tournament of tournaments) {
    await prisma.tournament.create({
      data: tournament,
    });
  }

  console.log("✅ Initial tournaments created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
