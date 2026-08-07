import { useState, useEffect } from "react";
import { Award, User, Trophy, Search, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useTournaments } from "../context/TournamentContext";

interface LeaderboardEntry {
  rank: number;
  participant_id: string;
  display_name: string;
  account_masked: string;
  roi: number;
  pnl: number;
  currency?: string;
  trade_count: number;
  win_rate: number;
  updated_at: string;
}

const LeaderboardPage = () => {
  const { tournaments } = useTournaments();
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [competitionFilter, setCompetitionFilter] = useState<"active" | "archived">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:3001");

  // Filter tournaments by status
  const activeTournaments = tournaments.filter(t => t.status === "active");
  const archivedTournaments = tournaments.filter(t => t.status === "archived" || t.status === "completed");
  const displayedTournaments = competitionFilter === "active" ? activeTournaments : archivedTournaments;

  // Set default tournament when tournaments load or filter changes
  useEffect(() => {
    if (displayedTournaments.length > 0 && !selectedTournament) {
      setSelectedTournament(displayedTournaments[0].id.toString());
    } else if (displayedTournaments.length > 0 && !displayedTournaments.find(t => t.id.toString() === selectedTournament)) {
      setSelectedTournament(displayedTournaments[0].id.toString());
    }
  }, [displayedTournaments, selectedTournament]);

  // Fetch leaderboard when tournament changes
  useEffect(() => {
    if (selectedTournament) {
      fetchLeaderboard();
    }
  }, [selectedTournament]);

  const fetchLeaderboard = async () => {
    if (!selectedTournament) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/leaderboard/${selectedTournament}`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaderboard = leaderboard.filter((entry) =>
    entry.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currencySymbol = (code?: string) => {
    const c = (code || "USD").toUpperCase();
    const map: Record<string, string> = { USD: "$", EUR: "€", GBP: "£" };
    return map[c] || `${c} `;
  };
  const formatPnL = (pnl: number, currency?: string) => {
    const sign = pnl >= 0 ? "+" : "";
    return `${sign}${currencySymbol(currency)}${pnl.toLocaleString()}`;
  };

  const formatROI = (roi: number) => {
    const sign = roi >= 0 ? "+" : "";
    return `${sign}${roi.toFixed(1)}%`;
  };

  return (
    <section style={{ minHeight: "100vh", paddingTop: "80px" }}>
      <div className='section-container'>
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: "48px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                padding: "16px",
                background: "linear-gradient(135deg, #FFcc00, #ff9900)",
                borderRadius: "16px",
                boxShadow: "0 0 30px rgba(255, 204, 0, 0.3)",
              }}
            >
              <Trophy size={32} color='#000' />
            </div>
          </div>
          <span
            style={{
              color: "var(--primary)",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              fontSize: "0.8rem",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Hall of Fame
          </span>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 4rem)", marginBottom: "16px" }}>Global Leaderboard</h1>
          <p style={{ color: "var(--text-dim)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
            Track the top performing traders in real-time. Compete to earn your place among the elite.
          </p>
        </motion.div>

        {/* Competition Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          <button
            onClick={() => setCompetitionFilter("active")}
            style={{
              padding: "12px 32px",
              borderRadius: "12px",
              background: competitionFilter === "active" ? "var(--primary)" : "var(--surface)",
              color: competitionFilter === "active" ? "#fff" : "var(--text-dim)",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.95rem",
              transition: "0.3s ease",
              border: competitionFilter === "active" ? "none" : "1px solid var(--panel-border)",
            }}
          >
            Active Competitions
          </button>
          <button
            onClick={() => setCompetitionFilter("archived")}
            style={{
              padding: "12px 32px",
              borderRadius: "12px",
              background: competitionFilter === "archived" ? "var(--primary)" : "var(--surface)",
              color: competitionFilter === "archived" ? "#fff" : "var(--text-dim)",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.95rem",
              transition: "0.3s ease",
              border: competitionFilter === "archived" ? "none" : "1px solid var(--panel-border)",
            }}
          >
            Archived Competitions
          </button>
        </motion.div>

        {/* Tournament Selector */}
        {displayedTournaments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "32px",
            }}
          >
            <select
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              style={{
                padding: "12px 20px",
                background: "var(--surface)",
                border: "1px solid var(--panel-border)",
                borderRadius: "12px",
                color: "var(--text-main)",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: "pointer",
                minWidth: "300px",
              }}
            >
              {displayedTournaments.map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.title}
                </option>
              ))}
            </select>
          </motion.div>
        )}

        {/* Empty State */}
        {displayedTournaments.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              textAlign: "center",
              padding: "80px 40px",
              background: "var(--surface)",
              borderRadius: "20px",
              border: "2px dashed var(--panel-border)",
            }}
          >
            <Trophy size={64} color="var(--text-muted)" style={{ marginBottom: "24px" }} />
            <h3 style={{ fontSize: "1.5rem", marginBottom: "12px" }}>
              No {competitionFilter} competitions
            </h3>
            <p style={{ color: "var(--text-dim)", fontSize: "1rem" }}>
              {competitionFilter === "active"
                ? "There are no active competitions at the moment. Check back soon!"
                : "No archived competitions available yet."}
            </p>
          </motion.div>
        )}

        {/* Leaderboard Content */}
        {displayedTournaments.length > 0 && (
          <>
            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: "var(--surface)",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  border: "1px solid var(--panel-border)",
                  minWidth: "250px",
                }}
              >
                <Search size={18} color='var(--text-muted)' />
                <input
                  type='text'
                  placeholder='Search trader...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "var(--text-main)",
                    fontSize: "0.9rem",
                    width: "100%",
                  }}
                />
              </div>
            </motion.div>

            {/* Leaderboard Table */}
            {loading ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "80px 20px",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid rgba(255, 255, 255, 0.1)",
                    borderTopColor: "var(--primary)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <p style={{ color: "var(--text-dim)", fontSize: "0.95rem" }}>Loading leaderboard...</p>
              </motion.div>
            ) : filteredLeaderboard.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  textAlign: "center",
                  padding: "80px 40px",
                  background: "var(--surface)",
                  borderRadius: "20px",
                  border: "2px dashed var(--panel-border)",
                }}
              >
                <Trophy size={64} color="var(--text-muted)" style={{ marginBottom: "24px" }} />
                <h3 style={{ fontSize: "1.5rem", marginBottom: "12px" }}>No leaderboard data</h3>
                <p style={{ color: "var(--text-dim)", fontSize: "1rem" }}>
                  {searchQuery ? "No traders found matching your search." : "Leaderboard data will appear here once the competition starts."}
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className='glass-panel leaderboard-table-wrapper'
                style={{ overflow: "hidden" }}
              >
                {/* Desktop Table */}
                <div className='desktop-table' style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--panel-border)" }}>
                        {["Rank", "Trader", "ROI %", "P&L", "Trades", "Win Rate", "Status"].map((h, i) => (
                          <th
                            key={i}
                            style={{
                              padding: "20px 16px",
                              textAlign: "left",
                              color: "var(--text-muted)",
                              fontSize: "0.7rem",
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                              {h} <ChevronDown size={12} />
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeaderboard.map((entry, i) => (
                        <motion.tr
                          key={entry.participant_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          style={{
                            borderBottom: i === filteredLeaderboard.length - 1 ? "none" : "1px solid var(--panel-border)",
                            background: i < 3 ? `rgba(255, 204, 0, ${0.03 - i * 0.01})` : "transparent",
                          }}
                          className='leaderboard-row'
                        >
                          <td style={{ padding: "20px 16px", fontWeight: 900, fontSize: "1.1rem" }}>
                            {i === 0 ? (
                              <Award color='#FFcc00' size={28} />
                            ) : i === 1 ? (
                              <Award color='#cbd5e1' size={24} />
                            ) : i === 2 ? (
                              <Award color='#92400e' size={24} />
                            ) : (
                              `#${entry.rank}`
                            )}
                          </td>
                          <td style={{ padding: "20px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "12px",
                                  background: "var(--surface)",
                                  display: "grid",
                                  placeItems: "center",
                                  border: i < 3 ? "2px solid var(--accent)" : "1px solid var(--panel-border)",
                                }}
                              >
                                <User size={20} color={i < 3 ? "var(--accent)" : "var(--text-dim)"} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: "1rem" }}>
                                  {entry.display_name}
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", fontFamily: "monospace" }}>
                                  {entry.account_masked}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "20px 16px", fontWeight: 900, color: entry.roi >= 0 ? "var(--success)" : "#ef4444", fontSize: "1rem" }}>
                            {formatROI(entry.roi)}
                          </td>
                          <td style={{ padding: "20px 16px", fontWeight: 800, color: entry.pnl >= 0 ? "var(--success)" : "#ef4444" }}>
                            {formatPnL(entry.pnl, entry.currency)}
                          </td>
                          <td style={{ padding: "20px 16px" }}>{entry.trade_count > 0 ? entry.trade_count : "—"}</td>
                          <td style={{ padding: "20px 16px" }}>{entry.trade_count > 0 ? `${entry.win_rate.toFixed(1)}%` : "—"}</td>
                          <td style={{ padding: "20px 16px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                background: "rgba(0, 255, 136, 0.1)",
                                color: "var(--success)",
                                width: "fit-content",
                                padding: "4px 12px",
                                borderRadius: "50px",
                                border: "1px solid rgba(0, 255, 136, 0.2)",
                              }}
                            >
                              <div
                                style={{
                                  width: "6px",
                                  height: "6px",
                                  borderRadius: "50%",
                                  background: "var(--success)",
                                  boxShadow: "0 0 8px var(--success)",
                                }}
                              />
                              LIVE
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className='mobile-cards' style={{ display: "none" }}>
                  {filteredLeaderboard.map((entry, i) => (
                    <motion.div
                      key={entry.participant_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{
                        padding: "20px",
                        borderBottom: i === filteredLeaderboard.length - 1 ? "none" : "1px solid var(--panel-border)",
                        background: i < 3 ? `rgba(255, 204, 0, ${0.03 - i * 0.01})` : "transparent",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ fontWeight: 900, fontSize: "1.25rem", width: "40px" }}>
                            {i === 0 ? (
                              <Award color='#FFcc00' size={28} />
                            ) : i === 1 ? (
                              <Award color='#cbd5e1' size={24} />
                            ) : i === 2 ? (
                              <Award color='#92400e' size={24} />
                            ) : (
                              `#${entry.rank}`
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800 }}>{entry.display_name}</div>
                            <span style={{ fontSize: "0.7rem", color: "var(--text-dim)", fontFamily: "monospace" }}>
                              {entry.account_masked}
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 900, color: entry.roi >= 0 ? "var(--success)" : "#ef4444" }}>
                            {formatROI(entry.roi)}
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>{formatPnL(entry.pnl, entry.currency)}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
                          {entry.trade_count > 0 ? `${entry.trade_count} trades • ${entry.win_rate.toFixed(1)}% win rate` : "trades & win rate not reported by broker"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            background: "rgba(0, 255, 136, 0.1)",
                            color: "var(--success)",
                            padding: "4px 10px",
                            borderRadius: "50px",
                          }}
                        >
                          LIVE
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    background: "rgba(255,255,255,0.01)",
                    borderTop: "1px solid var(--panel-border)",
                  }}
                >
                  <span style={{ color: "var(--text-dim)", fontSize: "0.9rem", fontWeight: 600 }}>
                    Showing top {filteredLeaderboard.length} traders • Live rankings
                  </span>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .leaderboard-row:hover {
          background: rgba(255, 255, 255, 0.02) !important;
        }
        @media (max-width: 768px) {
          .desktop-table { display: none !important; }
          .mobile-cards { display: block !important; }
        }
      `}</style>
    </section>
  );
};

export default LeaderboardPage;
