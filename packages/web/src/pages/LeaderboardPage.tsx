import { useState } from "react";
import { Award, User, Zap, Trophy, TrendingUp, Clock, Search, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { TOP_TRADERS } from "../constants";

// Extended mock data for full leaderboard
const EXTENDED_TRADERS = [
  ...TOP_TRADERS,
  { rank: 6, name: "WhaleHunter", pnl: "+$10,200", roi: "54%", streak: 2, tier: "Gold" },
  { rank: 7, name: "DiamondHands", pnl: "+$8,400", roi: "48%", streak: 6, tier: "Silver" },
  { rank: 8, name: "MoonRider", pnl: "+$7,100", roi: "42%", streak: 3, tier: "Silver" },
  { rank: 9, name: "BullRunner", pnl: "+$5,800", roi: "38%", streak: 1, tier: "Silver" },
  { rank: 10, name: "CryptoNinja", pnl: "+$4,500", roi: "32%", streak: 4, tier: "Bronze" },
];

const LeaderboardPage = () => {
  const [timeFilter, setTimeFilter] = useState("Weekly");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTraders = EXTENDED_TRADERS.filter((trader) => trader.name.toLowerCase().includes(searchQuery.toLowerCase()));

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

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='stats-overview'
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          {[
            { icon: Trophy, label: "Prize Pool", value: "$125K", color: "var(--accent)" },
            { icon: User, label: "Active Traders", value: "14,240", color: "var(--primary)" },
            { icon: TrendingUp, label: "Avg. ROI", value: "+28.5%", color: "var(--success)" },
            { icon: Clock, label: "Reset In", value: "2d 04h", color: "var(--secondary)" },
          ].map((stat, idx) => (
            <div
              key={idx}
              style={{
                background: "var(--surface)",
                padding: "24px",
                borderRadius: "16px",
                border: "1px solid var(--panel-border)",
                textAlign: "center",
              }}
            >
              <stat.icon size={24} color={stat.color} style={{ marginBottom: "12px" }} />
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                {stat.label}
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='filters-bar'
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          {/* Time Filter */}
          <div
            style={{
              display: "flex",
              background: "var(--surface)",
              padding: "4px",
              borderRadius: "12px",
              border: "1px solid var(--panel-border)",
            }}
          >
            {["Daily", "Weekly", "Monthly", "All Time"].map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: timeFilter === filter ? "var(--primary)" : "transparent",
                  color: timeFilter === filter ? "#fff" : "var(--text-dim)",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  transition: "0.3s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Search */}
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
                  {["Rank", "Trader", "Win Streak", "ROI %", "P&L", "Tier", "Status"].map((h, i) => (
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
                {filteredTraders.map((trader, i) => (
                  <motion.tr
                    key={trader.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      borderBottom: i === filteredTraders.length - 1 ? "none" : "1px solid var(--panel-border)",
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
                        `#${trader.rank}`
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
                          <div style={{ fontWeight: 800, fontSize: "1rem" }}>{trader.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "20px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent)", fontWeight: 700 }}>
                        <Zap size={16} fill='var(--accent)' /> {trader.streak}
                      </div>
                    </td>
                    <td style={{ padding: "20px 16px", fontWeight: 900, color: "var(--success)", fontSize: "1rem" }}>{trader.roi}</td>
                    <td style={{ padding: "20px 16px", fontWeight: 800 }}>{trader.pnl}</td>
                    <td style={{ padding: "20px 16px" }}>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "50px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background:
                            trader.tier === "Elite"
                              ? "rgba(0, 102, 255, 0.15)"
                              : trader.tier === "Gold"
                              ? "rgba(255, 204, 0, 0.15)"
                              : trader.tier === "Silver"
                              ? "rgba(203, 213, 225, 0.15)"
                              : "rgba(146, 64, 14, 0.15)",
                          color:
                            trader.tier === "Elite"
                              ? "var(--primary)"
                              : trader.tier === "Gold"
                              ? "var(--accent)"
                              : trader.tier === "Silver"
                              ? "#cbd5e1"
                              : "#92400e",
                          textTransform: "uppercase",
                        }}
                      >
                        {trader.tier}
                      </span>
                    </td>
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
            {filteredTraders.map((trader, i) => (
              <motion.div
                key={trader.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  padding: "20px",
                  borderBottom: i === filteredTraders.length - 1 ? "none" : "1px solid var(--panel-border)",
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
                        `#${trader.rank}`
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800 }}>{trader.name}</div>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: trader.tier === "Elite" ? "var(--primary)" : "var(--accent)",
                          textTransform: "uppercase",
                        }}
                      >
                        {trader.tier}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900, color: "var(--success)" }}>{trader.roi}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>{trader.pnl}</div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent)", fontSize: "0.85rem" }}>
                    <Zap size={14} fill='var(--accent)' /> {trader.streak} streak
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
              Showing top {filteredTraders.length} traders • {timeFilter} rankings • Reset in{" "}
              <span style={{ color: "var(--primary)" }}>2d 04h 12m</span>
            </span>
          </div>
        </motion.div>
      </div>

      <style>{`
        .leaderboard-row:hover {
          background: rgba(255, 255, 255, 0.02) !important;
        }
        @media (max-width: 768px) {
          .desktop-table { display: none !important; }
          .mobile-cards { display: block !important; }
          .filters-bar { flex-direction: column; align-items: stretch !important; }
          .filters-bar > div { width: 100% !important; max-width: none !important; min-width: auto !important; }
          .filters-bar > div:first-child { overflow-x: auto; }
          .stats-overview { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </section>
  );
};

export default LeaderboardPage;
