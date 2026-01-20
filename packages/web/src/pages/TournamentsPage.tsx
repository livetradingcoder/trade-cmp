import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Trophy, Calendar, Clock, Filter, Search, Info } from "lucide-react";
import { useTournaments } from "../context/TournamentContext";

const TournamentsPage = () => {
  const { tournaments } = useTournaments();
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [tooltipIndex, setTooltipIndex] = useState<{ cardIndex: number; tooltip: string; position: { top: number; left: number } } | null>(null);

  const Tooltip = ({ text, cardIndex, tooltip }: { text: string; cardIndex: number; tooltip: string }) => {
    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltipIndex({
        cardIndex,
        tooltip,
        position: {
          top: rect.top - 10,
          left: rect.left + rect.width / 2,
        },
      });
    };

    const handleMouseLeave = () => {
      setTooltipIndex(null);
    };
    
    return (
      <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "4px" }}>
        <span>{text}</span>
        <div
          style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Info size={14} color='var(--text-muted)' style={{ cursor: "help", flexShrink: 0 }} />
        </div>
      </div>
    );
  };

  const tabs = ["All", "Weekly", "Bi-Weekly", "Monthly"];

  const filteredChampionships = tournaments.filter((c) => {
    const matchesTab = activeTab === "All" || c.tier === activeTab;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <section style={{ minHeight: "100vh", paddingTop: "80px" }}>
      <div className='section-container'>
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
            <div
              style={{
                padding: "16px",
                background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                borderRadius: "16px",
                boxShadow: "0 0 30px var(--primary-glow)",
              }}
            >
              <Trophy size={32} color='#fff' />
            </div>
            <div>
           
              <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>All Competitions</h1>
            </div>
          </div>
          <p style={{ color: "var(--text-dim)", fontSize: "1.1rem", maxWidth: "600px" }}>
            Join live trading competitions, prove your skills, and win real rewards. Choose from weekly, bi-weekly, and monthly challenges.
          </p>
        </motion.div>

        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='filters-bar'
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px",
            padding: "20px",
            background: "var(--surface)",
            borderRadius: "16px",
            border: "1px solid var(--panel-border)",
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              background: "var(--bg-color)",
              padding: "4px",
              borderRadius: "12px",
              border: "1px solid var(--panel-border)",
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "10px 24px",
                  borderRadius: "10px",
                  border: "none",
                  background: activeTab === tab ? "var(--primary)" : "transparent",
                  color: activeTab === tab ? "#fff" : "var(--text-dim)",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  transition: "0.3s ease",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "var(--bg-color)",
              padding: "12px 20px",
              borderRadius: "12px",
              border: "1px solid var(--panel-border)",
              flex: "1",
              maxWidth: "400px",
              minWidth: "200px",
            }}
          >
            <Search size={20} color='var(--text-muted)' />
            <input
              type='text'
              placeholder='Search competitions...'
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

          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-dim)" }}>
            <Filter size={18} />
            <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>{filteredChampionships.length} competitions</span>
          </div>
        </motion.div>

        {/* Tournament Grid */}
        <div
          className='tournaments-grid'
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "24px",
          }}
        >
          <AnimatePresence mode='popLayout'>
            {filteredChampionships.map((camp, index) => (
              <motion.div
                key={camp.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ y: -8, boxShadow: "0 20px 40px -10px rgba(0, 102, 255, 0.3)" }}
                className='tournament-card'
              >
                <div style={{ position: "relative" }}>
                  <img src={camp.image || camp.cover} alt={camp.title} className='tournament-card-image' />
                  <div
                    style={{
                      position: "absolute",
                      top: "20px",
                      left: "20px",
                      zIndex: 3,
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(255, 50, 50, 0.2)",
                        backdropFilter: "blur(10px)",
                        color: "#ff4d4d",
                        padding: "6px 14px",
                        borderRadius: "50px",
                        border: "1px solid rgba(255, 50, 50, 0.4)",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        textTransform: "uppercase",
                      }}
                    >
                      <div
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "currentColor",
                          boxShadow: "0 0 8px currentColor",
                        }}
                      />
                      LIVE
                    </div>
                    <div
                      style={{
                        background: "rgba(0, 102, 255, 0.2)",
                        backdropFilter: "blur(10px)",
                        color: "var(--primary)",
                        padding: "6px 14px",
                        borderRadius: "50px",
                        border: "1px solid rgba(0, 102, 255, 0.4)",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                      }}
                    >
                      {camp.tier}
                    </div>
                  </div>
                </div>

                <div className='tournament-card-content'>
                  <h3 style={{ fontSize: "1.75rem", marginBottom: "20px", fontWeight: 900 }}>{camp.title}</h3>

                  {/* Required Participants and Seats Left - Left side info */}
                  <div
                    style={{
                      display: "flex",
                      gap: "24px",
                      marginBottom: "24px",
                      padding: "12px 16px",
                      background: "rgba(0, 102, 255, 0.05)",
                      border: "1px solid rgba(0, 102, 255, 0.1)",
                      borderRadius: "12px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                        Required Participants
                      </div>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-main)" }}>
                        {camp.fee || camp.participants?.toLocaleString() || "N/A"}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                        Seats Left
                      </div>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--primary)" }}>
                        {camp.timeLeft?.split(" ")[0] || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "2px",
                      background: "var(--panel-border)",
                      borderRadius: "12px",
                      overflow: "hidden",
                      marginBottom: "24px",
                    }}
                  >
                    {[
                      { icon: Trophy, label: "Prize Pool", value: camp.prize, tooltip: null },
                      {
                        icon: Calendar,
                        label: "Minimum Capital Required",
                        value: camp.fee,
                        tooltip: "capital",
                      },
                      {
                        icon: Clock,
                        label: "Seats Left",
                        value: camp.timeLeft?.split(" ")[0] || camp.timeLeft,
                        tooltip: null,
                      },
                    ]
                      .filter((item) => item.value)
                      .map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: "rgba(18, 18, 22, 0.8)",
                            padding: "16px 8px",
                            textAlign: "center",
                            position: "relative",
                          }}
                        >
                          <item.icon size={16} color='var(--primary)' style={{ marginBottom: "8px" }} />
                          <div
                            style={{
                              fontSize: "0.6rem",
                              color: "var(--text-muted)",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              marginBottom: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                              flexWrap: "wrap",
                            }}
                          >
                            {item.tooltip ? (
                              <Tooltip text={item.label} cardIndex={index} tooltip={item.tooltip} />
                            ) : (
                              <span>{item.label}</span>
                            )}
                          </div>
                          <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>{item.value}</div>
                        </div>
                      ))}
                  </div>

                  <button
                    className='btn-primary'
                    style={{ width: "100%", height: "56px", fontSize: "1rem" }}
                    onClick={() => window.open(camp.registrationLink, "_blank")}
                  >
                    Join Competition <ArrowUpRight size={18} />
                  </button>

                  <div
                    style={{
                      marginTop: "16px",
                      textAlign: "center",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "8px",
                      color: "var(--text-dim)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    No fees. No profit splits. Your capital stays yours.
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Tooltip Portal */}
        {tooltipIndex && (
          <div
            style={{
              position: "fixed",
              top: `${tooltipIndex.position.top}px`,
              left: `${tooltipIndex.position.left}px`,
              transform: "translate(-50%, -100%)",
              marginBottom: "8px",
              padding: "12px 16px",
              background: "rgba(18, 18, 22, 0.98)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              fontSize: "0.75rem",
              color: "#fff",
              maxWidth: "320px",
              minWidth: "280px",
              zIndex: 10000,
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              whiteSpace: "normal",
              lineHeight: "1.5",
              pointerEvents: "none",
            }}
          >
            {tooltipIndex.tooltip === "capital" &&
              "Participants are free to trade with any higher amount they are comfortable with. The stated amount represents the minimum personal trading capital required. Your capital stays in your account at all times, and all the profits made will be yours."}
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "6px solid rgba(18, 18, 22, 0.98)",
              }}
            />
          </div>
        )}

        {filteredChampionships.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: "center",
              padding: "80px 20px",
              color: "var(--text-dim)",
            }}
          >
            <Trophy size={64} color='var(--text-muted)' style={{ marginBottom: "24px", opacity: 0.5 }} />
            <h3 style={{ marginBottom: "8px" }}>No competitions found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default TournamentsPage;
