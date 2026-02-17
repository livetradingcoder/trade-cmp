import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Trophy, Calendar, Clock, Filter, Search, Info, Gift, Copy, Check, Users } from "lucide-react";
import { useTournaments } from "../context/TournamentContext";
import JoinCompetitionDialog from "../components/JoinCompetitionDialog";

const TournamentsPage = () => {
  const { tournaments, settings } = useTournaments();
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState<string>("");
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<{ id: string; title: string } | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const affiliateCode = settings.affiliateCode;

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    };
  }, []);

  // Dismiss tooltip on scroll
  useEffect(() => {
    const dismiss = () => {
      setActiveTooltip(null);
      setTooltipPosition(null);
    };
    window.addEventListener("scroll", dismiss, true);
    return () => window.removeEventListener("scroll", dismiss, true);
  }, []);

  const handleCopyCode = () => {
    if (affiliateCode) {
      navigator.clipboard.writeText(affiliateCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const TooltipTrigger = ({ text, tooltipKey, tooltipContent }: { text: string; tooltipKey: string; tooltipContent: string }) => {
    const triggerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
      // Clear any pending hide timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      const rect = triggerRef.current?.getBoundingClientRect();

      if (rect) {
        const tooltipWidth = 320;
        const padding = 8;
        const centerX = rect.left + rect.width / 2;
        let left = Math.max(padding, Math.min(centerX - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding));

        setTooltipPosition({
          top: rect.top - 10,
          left,
        });
        setTooltipContent(tooltipContent);
        setActiveTooltip(tooltipKey);
      }
    };

    const handleMouseLeave = () => {
      // Clear any pending show timeout
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }

      // Delay hiding to allow smooth transition
      hideTimeoutRef.current = setTimeout(() => {
        setActiveTooltip(null);
        setTooltipPosition(null);
      }, 150);
    };

    return (
      <div
        ref={triggerRef}
        className="tooltip-trigger"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
      >
        <span style={{
          fontWeight: 'bold',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: '1.2',
          textAlign: 'center'
        }}>{text}</span>
        <Info
          size={12}
          color={activeTooltip === tooltipKey ? 'var(--primary)' : 'var(--text-muted)'}
          className="tooltip-icon"
          style={{ cursor: 'help' }}
        />
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
    <section className="tournaments-section">
      <div className='section-container'>
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="page-header">
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
            Join live trading competitions, prove your skills, and win real rewards. Choose from weekly, bi-weekly, and monthly competitions.
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

        {/* Affiliate Code Banner - Only show if affiliate code is set */}
        {affiliateCode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="affiliate-banner"
          >
            <div className="affiliate-icon">
              <Gift size={24} />
            </div>
            <div className="affiliate-content">
              <span className="affiliate-text">
                <strong>To join the competitions, broker account must be created using the following affiliate code:</strong>
              </span>
              <div className="affiliate-code-wrapper">
                <span className="affiliate-code">{affiliateCode}</span>
                <button
                  className="copy-btn"
                  onClick={handleCopyCode}
                  title="Copy code"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

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

                  <div className="card-stats-grid">
                    {[
                      {
                        icon: Trophy,
                        label: "Prize Pool",
                        value: camp.prize,
                        tooltipKey: `prize-${camp.id}`,
                        tooltipContent: "The total prize pool distributed among top performers. Winners are determined by the highest percentage gains during the competition period."
                      },
                      {
                        icon: Users,
                        label: "Required Participants",
                        value: camp.participants?.toString() || "N/A",
                        tooltipKey: `participants-${camp.id}`,
                        tooltipContent: "The minimum number of participants needed for the competition to start. Once this threshold is reached, the competition begins and prizes are guaranteed.",
                      },
                      {
                        icon: Calendar,
                        label: "Minimum Capital",
                        value: camp.fee,
                        tooltipKey: `capital-${camp.id}`,
                        tooltipContent: "The minimum trading capital required to participate. You can trade with any higher amount you're comfortable with. Your capital stays in your account at all times, and all profits are 100% yours.",
                      },
                      {
                        icon: Clock,
                        label: "Seats Left",
                        value: camp.timeLeft?.split(" ")[0] || camp.timeLeft,
                        tooltipKey: `seats-${camp.id}`,
                        tooltipContent: "Remaining spots available in this competition. Join now to secure your place before all seats are filled!",
                      },
                    ]
                      .filter((item) => item.value)
                      .map((item, idx) => (
                        <div key={idx} className="card-stat-cell">
                          <item.icon size={16} color='var(--primary)' className="stat-icon" />
                          <div className="stat-label">
                            <TooltipTrigger text={item.label} tooltipKey={item.tooltipKey} tooltipContent={item.tooltipContent} />
                          </div>
                          <div className="stat-value">{item.value}</div>
                        </div>
                      ))}
                  </div>

                  <button
                    className='btn-primary card-join-btn'
                    onClick={() => {
                      setActiveTooltip(null);
                      setTooltipPosition(null);
                      setSelectedTournament({ id: camp.id.toString(), title: camp.title });
                      setDialogOpen(true);
                    }}
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

        <AnimatePresence>
          {activeTooltip && tooltipPosition && (
            <motion.div
              key={activeTooltip}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="tooltip-popup"
              style={{
                position: "fixed",
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                transform: `translateY(-100%)`,
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
                zIndex: 999,
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                whiteSpace: "normal",
                lineHeight: "1.5",
                pointerEvents: "none",
              }}
            >
              {tooltipContent}
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
            </motion.div>
          )}
        </AnimatePresence>

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

      <style>{`
        .tournaments-section {
          min-height: 100vh;
          padding-top: 60px;
        }

        .page-header {
          margin-bottom: 32px;
        }

        .filters-bar {
          margin-bottom: 16px !important;
        }

        .affiliate-banner {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 24px;
          margin-bottom: 28px;
          background: linear-gradient(135deg, rgba(0, 102, 255, 0.08) 0%, rgba(112, 0, 255, 0.08) 100%);
          border: 1px solid rgba(0, 102, 255, 0.2);
          border-radius: 14px;
          position: relative;
          overflow: hidden;
        }

        .affiliate-banner::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 102, 255, 0.5), transparent);
        }

        .affiliate-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          border-radius: 12px;
          flex-shrink: 0;
          color: #fff;
          box-shadow: 0 4px 16px var(--primary-glow);
        }

        .affiliate-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex: 1;
          gap: 16px;
          flex-wrap: wrap;
        }

        .affiliate-text {
          color: var(--text-dim);
          font-size: 1.05rem;
          font-weight: 500;
          line-height: 1.5;
        }

        .affiliate-code-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(0, 0, 0, 0.3);
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .affiliate-code {
          font-family: var(--font-mono);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--primary);
          letter-spacing: 0.1em;
        }

        .copy-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: var(--primary);
          border: none;
          border-radius: 6px;
          color: #fff;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .copy-btn:hover {
          background: #005ce6;
          transform: translateY(-1px);
        }

        .tournaments-grid {
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)) !important;
        }

        .card-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2px;
          background: var(--panel-border);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .card-stat-cell {
          background: rgba(18, 18, 22, 0.8);
          padding: 14px 6px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .card-stat-cell .stat-icon {
          margin-bottom: 6px;
        }

        .stat-label {
          font-size: clamp(0.5rem, 1.5vw, 0.6rem);
          color: var(--text-muted);
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 4px;
          line-height: 1.2;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 3.5em; /* Enough space for 2 lines of text + icon gap */
        }

        .stat-value {
          font-size: clamp(0.8rem, 2vw, 0.95rem);
          font-weight: 800;
          text-align: center;
        }

        .card-join-btn {
          width: 100%;
          height: 56px;
          font-size: clamp(0.85rem, 2vw, 1rem);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        @media (max-width: 1024px) {
          .tournaments-section {
            padding-top: 50px;
          }

          .page-header {
            margin-bottom: 28px;
          }

          .tournaments-grid {
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)) !important;
            gap: 20px !important;
          }
        }

        @media (max-width: 768px) {
          .tournaments-section {
            padding-top: 40px;
          }

          .page-header {
            margin-bottom: 24px;
          }

          .filters-bar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            padding: 16px !important;
          }

          .filters-bar > div:first-child {
            width: 100%;
            overflow-x: auto;
          }

          .filters-bar > div:nth-child(2) {
            max-width: 100% !important;
          }

          .affiliate-banner {
            flex-direction: column;
            text-align: center;
            padding: 20px 16px;
            gap: 12px;
          }

          .affiliate-content {
            flex-direction: column;
            gap: 12px;
          }

          .affiliate-text {
            font-size: 1rem;
          }

          .tournaments-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }

          .card-stats-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 1px;
          }

          .card-stat-cell {
            padding: 12px 4px;
          }

          .stat-label {
            font-size: 0.5rem;
          }

          .stat-value {
            font-size: 0.85rem;
          }

          .card-join-btn {
            height: 52px;
            font-size: 0.9rem;
          }
        }

        @media (max-width: 480px) {
          .tournaments-section {
            padding-top: 30px;
          }

          .page-header {
            margin-bottom: 20px;
          }

          .page-header h1 {
            font-size: 1.75rem !important;
          }

          .page-header p {
            font-size: 0.95rem !important;
          }

          .filters-bar {
            padding: 12px !important;
            gap: 10px !important;
          }

          .filters-bar button {
            padding: 8px 16px !important;
            font-size: 0.8rem !important;
          }

          .affiliate-banner {
            padding: 16px 12px;
          }

          .affiliate-icon {
            width: 40px;
            height: 40px;
          }

          .affiliate-icon svg {
            width: 20px;
            height: 20px;
          }

          .affiliate-text {
            font-size: 1rem;
          }

          .affiliate-code {
            font-size: 1rem;
          }

          .copy-btn {
            padding: 5px 10px;
            font-size: 0.75rem;
          }

          .card-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1px;
          }

          .card-stat-cell {
            padding: 10px 6px;
          }

          .stat-label {
            font-size: 0.55rem;
          }

          .stat-value {
            font-size: 0.8rem;
          }

          .card-join-btn {
            height: 48px;
            font-size: 0.85rem;
          }
        }

        /* Tooltip Styles */
        .tooltip-trigger {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: help;
        }

        .tooltip-icon {
          flex-shrink: 0;
          transition: color 0.2s ease;
        }

        .tooltip-trigger:hover .tooltip-icon {
          color: var(--primary) !important;
        }

        .tooltip-popup {
          max-width: 320px;
          min-width: 280px;
          z-index: 999;
        }

        @media (max-width: 480px) {
          .tooltip-popup {
            max-width: 260px;
            min-width: 220px;
          }
        }
      `}</style>

      {/* Join Competition Dialog */}
      {selectedTournament && (
        <JoinCompetitionDialog
          isOpen={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setSelectedTournament(null);
          }}
          tournamentId={selectedTournament.id}
          tournamentTitle={selectedTournament.title}
          referralCode={affiliateCode}
        />
      )}
    </section>
  );
};

export default TournamentsPage;
