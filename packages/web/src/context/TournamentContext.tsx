/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

// Use relative URLs in production (nginx proxies /api to backend)
// Only use full URL for local development
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:3001");

export interface Tournament {
  id: string | number; // MongoDB returns string ID
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

interface Settings {
  affiliateCode: string;
}

interface TournamentContextType {
  tournaments: Tournament[];
  settings: Settings;
  isAdmin: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateTournament: (id: string | number, data: Partial<Tournament>) => Promise<boolean>;
  createTournament: (data: Omit<Tournament, "id">) => Promise<boolean>;
  deleteTournament: (id: string | number) => Promise<boolean>;
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
  const [settings, setSettings] = useState<Settings>({ affiliateCode: "" });
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

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings({
          affiliateCode: data.affiliateCode || "",
        });
      }
    } catch {
      console.log("Using default settings");
    }
  };

  useEffect(() => {
    fetchTournaments();
    fetchSettings();
    // Check if admin token exists and verify it
    const token = localStorage.getItem("adminToken");
    if (token) {
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setIsAdmin(true);
      } else {
        localStorage.removeItem("adminToken");
      }
    } catch {
      localStorage.removeItem("adminToken");
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("adminToken", data.token);
        setIsAdmin(true);
        return true;
      } else if (response.status === 401) {
        return false;
      }
      throw new Error("Server error");
    } catch {
      // Fallback: check hardcoded credentials when backend is down
      if (username === "admin" && password === "admin123") {
        setIsAdmin(true);
        localStorage.setItem("adminToken", "fallback-token");
        return true;
      }
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem("adminToken");
  };

  const updateTournament = async (id: string | number, data: Partial<Tournament>): Promise<boolean> => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/tournaments/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/tournaments`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
        id: `temp-${Date.now()}`, // Use temporary string ID for fallback
      };
      setTournaments((prev) => [...prev, newTournament]);
      return true;
    }
    return false;
  };

  const deleteTournament = async (id: string | number): Promise<boolean> => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/tournaments/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
        settings,
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
