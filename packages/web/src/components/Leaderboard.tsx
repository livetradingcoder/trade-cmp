import { Award, User, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { TOP_TRADERS } from '../constants';

const Leaderboard = () => {
    return (
        <section id="leaderboard" style={{ background: 'var(--bg-color)' }}>
            <div className="section-container">
                <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <span style={{
                            color: 'var(--primary)',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.2em',
                            fontSize: '0.8rem',
                            marginBottom: '16px',
                            display: 'block'
                        }}>
                            Hall of Fame
                        </span>
                        <h2 style={{ fontSize: '4rem' }}>Global Leaderboard</h2>
                    </motion.div>
                </div>

                <div className="glass-panel" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--panel-border)' }}>
                                {['Rank', 'Trader', 'Win Streak', 'ROI %', 'P&L', 'Status'].map((h, i) => (
                                    <th key={i} style={{ padding: '24px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {TOP_TRADERS.map((trader, i) => (
                                <motion.tr
                                    key={trader.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{
                                        borderBottom: i === TOP_TRADERS.length - 1 ? 'none' : '1px solid var(--panel-border)',
                                        transition: '0.2s'
                                    }}
                                    className="leaderboard-row"
                                >
                                    <td style={{ padding: '24px', fontWeight: 900, fontSize: '1.25rem' }}>
                                        {i === 0 ? <Award color="#FFcc00" size={28} /> : i === 1 ? <Award color="#cbd5e1" size={24} /> : i === 2 ? <Award color="#92400e" size={24} /> : `#${trader.rank}`}
                                    </td>
                                    <td style={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '14px',
                                                background: 'var(--surface)',
                                                display: 'grid',
                                                placeItems: 'center',
                                                border: '1px solid var(--panel-border)'
                                            }}>
                                                <User size={22} color={i === 0 ? 'var(--primary)' : 'var(--text-dim)'} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{trader.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase' }}>{trader.tier}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 700 }}>
                                            <Zap size={18} fill="var(--accent)" /> {trader.streak}
                                        </div>
                                    </td>
                                    <td style={{ padding: '24px', fontWeight: 900, color: 'var(--success)', fontSize: '1.1rem' }}>{trader.roi}</td>
                                    <td style={{ padding: '24px', fontWeight: 800 }}>{trader.pnl}</td>
                                    <td style={{ padding: '24px' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            background: 'rgba(0, 255, 136, 0.1)',
                                            color: 'var(--success)',
                                            width: 'fit-content',
                                            padding: '4px 12px',
                                            borderRadius: '50px',
                                            border: '1px solid rgba(0, 255, 136, 0.2)'
                                        }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }}></div>
                                            LIVE
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--panel-border)' }}>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: 600 }}>
                            Showing top 5 traders of the current cycle. Weekly reset in <span style={{ color: 'var(--primary)' }}>2d 04h 12m</span>.
                        </span>
                    </div>
                </div>
            </div>

            <style>{`
        .leaderboard-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }
      `}</style>
        </section>
    );
};

export default Leaderboard;
