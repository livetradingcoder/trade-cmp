import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Award, User } from "lucide-react";
import "../styles/LeaderboardManagement.css";

interface Tournament {
  id: string | number;
  title: string;
  status?: string;
}

interface LeaderboardEntry {
  rank: number;
  user: {
    email: string;
    display_name?: string;
    fp_account_number: string;
  };
  roi: number;
  pnl: number;
  trades: number;
  win_rate: number;
  updated_at: string;
}

interface LeaderboardManagementProps {
  tournaments: Tournament[];
}

const LeaderboardManagement = ({ tournaments }: LeaderboardManagementProps) => {
  const [selectedTournament, setSelectedTournament] = useState<string | number>("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  useEffect(() => {
    if (tournaments.length > 0 && !selectedTournament) {
      setSelectedTournament(tournaments[0].id);
    }
  }, [tournaments]);

  useEffect(() => {
    if (selectedTournament) {
      fetchLeaderboard();
    }
  }, [selectedTournament]);

  const fetchLeaderboard = async () => {
    if (!selectedTournament) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/leaderboard/${selectedTournament}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPnL = (pnl: number) => {
    const sign = pnl >= 0 ? "+" : "";
    return `${sign}$${pnl.toLocaleString()}`;
  };

  const formatROI = (roi: number) => {
    const sign = roi >= 0 ? "+" : "";
    return `${sign}${roi.toFixed(2)}%`;
  };

  return (
    <div className="leaderboard-management">
      {/* Header */}
      <div className="leaderboard-header">
        <h2>Leaderboard</h2>
        <div className="tournament-selector">
          <label>Tournament:</label>
          <select value={selectedTournament} onChange={(e) => setSelectedTournament(e.target.value)}>
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.title} {tournament.status !== "active" && `(${tournament.status})`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏆</div>
          <h3>No leaderboard data</h3>
          <p>There are no leaderboard entries for this tournament yet.</p>
        </div>
      ) : (
        <div className="leaderboard-table-wrapper">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Trader</th>
                <th>ROI</th>
                <th>P&L</th>
                <th>Trades</th>
                <th>Win Rate</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <motion.tr
                  key={entry.user.email}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={index < 3 ? "top-three" : ""}
                >
                  <td className="rank-cell">
                    {index === 0 ? (
                      <Award color="#FFcc00" size={24} />
                    ) : index === 1 ? (
                      <Award color="#cbd5e1" size={22} />
                    ) : index === 2 ? (
                      <Award color="#92400e" size={22} />
                    ) : (
                      <span className="rank-number">#{entry.rank}</span>
                    )}
                  </td>
                  <td>
                    <div className="trader-info">
                      <div className="trader-avatar">
                        <User size={18} />
                      </div>
                      <div>
                        <div className="trader-name">
                          {entry.user.display_name || entry.user.email}
                        </div>
                        <div className="trader-account">
                          ****{entry.user.fp_account_number.slice(-4)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`roi ${entry.roi >= 0 ? "positive" : "negative"}`}>
                      {formatROI(entry.roi)}
                    </span>
                  </td>
                  <td>
                    <span className={`pnl ${entry.pnl >= 0 ? "positive" : "negative"}`}>
                      {formatPnL(entry.pnl)}
                    </span>
                  </td>
                  <td>{entry.trades}</td>
                  <td>
                    <span className="win-rate">{entry.win_rate.toFixed(1)}%</span>
                  </td>
                  <td className="updated-at">
                    {new Date(entry.updated_at).toLocaleDateString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaderboardManagement;
