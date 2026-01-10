/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

// Use relative URLs in production (nginx proxies /api to backend)
// Only use full URL for local development
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:3001");

export interface Tournament {
  id: number;
  title: string;
  tier: string;
  prize: string;
  fee: string;
  participants: number;
  timeLabel: string;
  timeLeft: string;
  cover: string;
  image?: string;
  registrationLink: string;
}

interface TournamentContextType {
  tournaments: Tournament[];
  isAdmin: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateTournament: (id: number, data: Partial<Tournament>) => Promise<boolean>;
  createTournament: (data: Omit<Tournament, "id">) => Promise<boolean>;
  deleteTournament: (id: number) => Promise<boolean>;
  refreshTournaments: () => Promise<void>;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

// Fallback data when backend is not available
const FALLBACK_TOURNAMENTS: Tournament[] = [
  {
    id: 1,
    title: "January Clash",
    tier: "Weekly",
    prize: "50K Challenge",
    fee: "$10",
    participants: 1481,
    timeLabel: "Ends in",
    timeLeft: "27d 20:17:59",
    cover:
      "https://firebasestorage.googleapis.com/v0/b/fortraders-production.firebasestorage.app/o/public%2Ftournament_cover%2Fe2207b07-3cdb-4e1b-96d8-1763c85679ae.jpg?alt=media",
    registrationLink: "https://tradingview.com",
  },
  {
    id: 2,
    title: "Wednesday Clash",
    tier: "Weekly",
    prize: "50K Challenge",
    fee: "$10",
    participants: 18,
    timeLabel: "Starts in",
    timeLeft: "4d 20:17:59",
    cover:
      "https://firebasestorage.googleapis.com/v0/b/fortraders-production.firebasestorage.app/o/public%2Ftournament_cover%2Fe2207b07-3cdb-4e1b-96d8-1763c85679ae.jpg?alt=media",
    registrationLink: "https://tradingview.com",
  },
  {
    id: 3,
    title: "February Clash",
    tier: "Monthly",
    prize: "50K Challenge",
    fee: "$25",
    participants: 7,
    timeLabel: "Starts in",
    timeLeft: "30d 20:17:59",
    cover:
      "https://firebasestorage.googleapis.com/v0/b/fortraders-production.firebasestorage.app/o/public%2Ftournament_cover%2Fe2207b07-3cdb-4e1b-96d8-1763c85679ae.jpg?alt=media",
    registrationLink: "https://tradingview.com",
  },
];

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [tournaments, setTournaments] = useState<Tournament[]>(FALLBACK_TOURNAMENTS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTournaments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tournaments`);
      if (response.ok) {
        const data = await response.json();
        setTournaments(data);
      }
    } catch {
      console.log("Using fallback tournament data");
      setTournaments(FALLBACK_TOURNAMENTS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
    // Check if admin session exists
    const adminSession = sessionStorage.getItem("isAdmin");
    if (adminSession === "true") {
      setIsAdmin(true);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        setIsAdmin(true);
        sessionStorage.setItem("isAdmin", "true");
        return true;
      } else if (response.status === 401) {
        // Invalid credentials from backend
        return false;
      }
      // For other errors (500, etc), try fallback
      throw new Error("Server error");
    } catch {
      // Fallback: check hardcoded credentials when backend is down or has errors
      if (username === "admin" && password === "admin") {
        setIsAdmin(true);
        sessionStorage.setItem("isAdmin", "true");
        return true;
      }
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem("isAdmin");
  };

  const updateTournament = async (id: number, data: Partial<Tournament>): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/tournaments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchTournaments();
        return true;
      }
    } catch {
      // Fallback: update locally when backend is down
      setTournaments((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
      return true;
    }
    return false;
  };

  const createTournament = async (data: Omit<Tournament, "id">): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/tournaments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchTournaments();
        return true;
      }
    } catch {
      // Fallback: add locally when backend is down
      const newTournament = {
        ...data,
        id: Math.max(...tournaments.map((t) => t.id)) + 1,
      };
      setTournaments((prev) => [...prev, newTournament]);
      return true;
    }
    return false;
  };

  const deleteTournament = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/tournaments/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchTournaments();
        return true;
      }
    } catch {
      // Fallback: delete locally when backend is down
      setTournaments((prev) => prev.filter((t) => t.id !== id));
      return true;
    }
    return false;
  };

  const refreshTournaments = async () => {
    await fetchTournaments();
  };

  return (
    <TournamentContext.Provider
      value={{
        tournaments,
        isAdmin,
        isLoading,
        login,
        logout,
        updateTournament,
        createTournament,
        deleteTournament,
        refreshTournaments,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournaments() {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error("useTournaments must be used within a TournamentProvider");
  }
  return context;
}
