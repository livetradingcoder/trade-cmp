import { motion } from 'framer-motion';

const stats = [
    { label: "Total Paid Out", value: "$2.4M+" },
    { label: "Active Traders", value: "14,240" },
    { label: "Tournaments", value: "152" },
    { label: "Avg. ROI", value: "+28.5%" }
];

const StatsBar = () => {
    return (
        <div className="stats-bar">
            <div className="section-container">
                <div className="stats-grid">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="stat-item"
                        >
                            <h3 className="stat-value">{stat.value}</h3>
                            <p className="stat-label">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            <style>{`
                .stats-bar {
                    position: relative;
                    z-index: 10;
                    background: var(--surface);
                    border-top: 1px solid var(--panel-border);
                    border-bottom: 1px solid var(--panel-border);
                    padding: 20px 0;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 24px;
                    text-align: center;
                }

                .stat-value {
                    font-size: clamp(1.5rem, 4vw, 2.5rem);
                    font-weight: 900;
                    margin-bottom: 4px;
                    background: linear-gradient(180deg, #fff 0%, #aaa 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .stat-label {
                    color: var(--text-dim);
                    font-size: clamp(0.7rem, 1.5vw, 0.9rem);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }

                @media (max-width: 768px) {
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 16px;
                    }
                    .stats-bar {
                        padding: 16px 0;
                    }
                }

                @media (max-width: 400px) {
                    .stats-grid {
                        gap: 12px;
                    }
                }
            `}</style>
        </div>
    );
};

export default StatsBar;
