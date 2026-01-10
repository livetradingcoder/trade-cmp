import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Admin login
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (admin && admin.password === password) {
      res.json({ success: true, message: "Login successful" });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all tournaments
app.get("/api/tournaments", async (req, res) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { id: "asc" },
    });
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tournaments" });
  }
});

// Get single tournament
app.get("/api/tournaments/:id", async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (tournament) {
      res.json(tournament);
    } else {
      res.status(404).json({ error: "Tournament not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tournament" });
  }
});

// Create tournament
app.post("/api/tournaments", async (req, res) => {
  try {
    const tournament = await prisma.tournament.create({
      data: req.body,
    });
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: "Failed to create tournament" });
  }
});

// Update tournament
app.put("/api/tournaments/:id", async (req, res) => {
  try {
    const tournament = await prisma.tournament.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: "Failed to update tournament" });
  }
});

// Delete tournament
app.delete("/api/tournaments/:id", async (req, res) => {
  try {
    await prisma.tournament.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete tournament" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
