import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ArrowUpRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTournaments } from '../context/TournamentContext';

const ChampionshipHub = () => {
    const { tournaments } = useTournaments();
    const [activeTab, setActiveTab] = useState('Weekly');

    const filteredChampionships = useMemo(() =>
        tournaments.filter(c => c.tier === activeTab),
        [activeTab, tournaments]
    );

    return (
        <section id="tournaments" className="championship-section">
            <div className="section-container">
                <div className="ch-header">
                    <div className="ch-title-area">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <span className="ch-badge">Competitive Hub</span>
                            <h2 className="ch-title">Trading battles</h2>
                        </motion.div>
                    </div>

                    <div className="ch-tabs">
                        {['Weekly', 'Monthly'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`ch-tab ${activeTab === tab ? 'active' : ''}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`ch-grid ${filteredChampionships.length === 1 ? 'single' : ''}`}>
                    <AnimatePresence mode="popLayout">
                        {filteredChampionships.map((camp) => (
                            <motion.div
                                key={camp.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                whileHover={{ y: -8, boxShadow: '0 20px 40px -10px rgba(0, 102, 255, 0.3)' }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="tournament-card"
                            >
                                <div className="card-image-wrapper">
                                    <img src={camp.image || camp.cover} alt={camp.title} className="tournament-card-image" />
                                    <div className="live-badge">
                                        <div className="live-dot" />
                                        LIVE BATTLE
                                    </div>
                                </div>

                                <div className="tournament-card-content">
                                    <h3 className="card-title">{camp.title}</h3>

                                    <div className="card-stats">
                                        {[
                                            { label: 'Reward', value: camp.prize, color: '#fff' },
                                            { label: 'Entry Fee', value: camp.fee, color: '#fff' },
                                            { label: camp.timeLabel, value: camp.timeLeft.split(' ')[0], color: 'var(--primary)' }
                                        ].map((item, idx) => (
                                            <div key={idx} className="card-stat">
                                                <div className="card-stat-label">{item.label}</div>
                                                <div className="card-stat-value" style={{ color: item.color }}>
                                                    {item.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        className="btn-primary card-btn"
                                        onClick={() => window.open(camp.registrationLink, '_blank')}
                                    >
                                        Join Tournament <ArrowUpRight size={20} />
                                    </button>

                                    <div className="card-participants">
                                        <Users size={18} color="var(--primary)" />
                                        Players Joined: <span>{camp.participants.toLocaleString()}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="ch-view-all"
                >
                    <Link to="/tournaments">
                        <button className="btn-outline view-all-btn">
                            View All Tournaments <ArrowRight size={18} />
                        </button>
                    </Link>
                </motion.div>
            </div>

            <style>{`
                .championship-section {
                    background: linear-gradient(180deg, var(--bg-color) 0%, #0a0a0c 100%);
                }

                .ch-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 40px;
                    flex-wrap: wrap;
                    gap: 20px;
                }

                .ch-badge {
                    color: var(--primary);
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    font-size: 0.8rem;
                    display: block;
                }

                .ch-title {
                    margin-top: 8px;
                    font-size: clamp(1.75rem, 4vw, 2.5rem);
                }

                .ch-tabs {
                    display: flex;
                    background: var(--surface);
                    padding: 4px;
                    border-radius: 16px;
                    border: 1px solid var(--panel-border);
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
                }

                .ch-tab {
                    padding: 8px 24px;
                    border-radius: 12px;
                    border: none;
                    background: transparent;
                    color: var(--text-dim);
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 0.85rem;
                    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .ch-tab.active {
                    background: var(--primary);
                    color: #fff;
                    box-shadow: 0 4px 12px var(--primary-glow);
                }

                .ch-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
                    gap: 24px;
                }

                .ch-grid.single {
                    grid-template-columns: minmax(340px, 600px);
                    justify-content: start;
                }

                .card-image-wrapper {
                    position: relative;
                }

                .live-badge {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    z-index: 3;
                    background: rgba(255, 50, 50, 0.2);
                    backdrop-filter: blur(10px);
                    color: #ff4d4d;
                    padding: 6px 16px;
                    border-radius: 50px;
                    border: 1px solid rgba(255, 50, 50, 0.4);
                    font-size: 0.75rem;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    box-shadow: 0 0 15px rgba(255, 50, 50, 0.3);
                }

                .live-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: currentColor;
                    box-shadow: 0 0 10px currentColor;
                }

                .card-title {
                    font-size: clamp(1.5rem, 3vw, 2rem);
                    margin-bottom: 24px;
                    font-weight: 900;
                }

                .card-stats {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 2px;
                    background: var(--panel-border);
                    border-radius: 16px;
                    overflow: hidden;
                    margin-bottom: 24px;
                    border: 1px solid var(--panel-border);
                }

                .card-stat {
                    background: rgba(18, 18, 22, 0.8);
                    padding: 16px 8px;
                    text-align: center;
                }

                .card-stat-label {
                    font-size: 0.65rem;
                    color: var(--text-muted);
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 6px;
                }

                .card-stat-value {
                    font-size: clamp(0.9rem, 2vw, 1.1rem);
                    font-weight: 900;
                }

                .card-btn {
                    width: 100%;
                    height: 56px;
                    font-size: 1rem;
                }

                .card-participants {
                    margin-top: 20px;
                    text-align: center;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 10px;
                    color: var(--text-dim);
                    font-size: 0.9rem;
                    font-weight: 600;
                }

                .card-participants span {
                    color: #fff;
                    font-weight: 800;
                }

                .ch-view-all {
                    text-align: center;
                    margin-top: 40px;
                }

                .ch-view-all a {
                    text-decoration: none;
                }

                .view-all-btn {
                    padding: 16px 32px;
                }

                @media (max-width: 768px) {
                    .ch-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .ch-grid {
                        grid-template-columns: 1fr;
                    }
                    .ch-grid.single {
                        grid-template-columns: 1fr;
                    }
                    .card-stat {
                        padding: 12px 6px;
                    }
                    .tournament-card-content {
                        padding: 24px !important;
                    }
                }

                @media (max-width: 480px) {
                    .ch-tab {
                        padding: 8px 16px;
                        font-size: 0.8rem;
                    }
                    .live-badge {
                        font-size: 0.65rem;
                        padding: 5px 12px;
                    }
                }
            `}</style>
        </section>
    );
};

export default ChampionshipHub;
