import { motion } from 'framer-motion';
import { Wallet, Unlock, Brain, Crown } from 'lucide-react';

const features = [
    {
        icon: Wallet,
        title: "Low Entry Barrier",
        description: "Affordable entry fees with massive prize pools. Pure skill-based competition."
    },
    {
        icon: Unlock,
        title: "Flexible Rules",
        description: "Freedom to trade your way. No arbitrary drawdowns or complex constraints."
    },
    {
        icon: Brain,
        title: "Trade Your Strategy",
        description: "Scalping, swinging, or hedging—your style, your rules."
    },
    {
        icon: Crown,
        title: "100% Autonomy",
        description: "Complete control over your trading decisions and account management."
    },
];

const KeyFeatures = () => {
    return (
        <section id="about" className="key-features-section">
            <div className="section-container">
                <div className="kf-header">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="kf-title"
                    >
                        Why Top Traders <br />
                        <span className="text-gradient">Choose The Arena</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="kf-subtitle"
                    >
                        Experience the freedom of true trading competition. Skill-based rewards for top performers.
                    </motion.p>
                </div>

                <div className="kf-grid">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-panel kf-card"
                        >
                            <div className="kf-icon">
                                <feature.icon size={28} />
                            </div>
                            <h3 className="kf-card-title">{feature.title}</h3>
                            <p className="kf-card-desc">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            <style>{`
                .key-features-section {
                    position: relative;
                    z-index: 10;
                    padding: 80px 24px;
                }

                .kf-header {
                    text-align: center;
                    margin-bottom: 60px;
                }

                .kf-title {
                    font-size: clamp(2rem, 5vw, 3rem);
                    font-weight: 800;
                    margin-bottom: 24px;
                    line-height: 1.1;
                }

                .kf-subtitle {
                    color: var(--text-dim);
                    font-size: clamp(1rem, 2vw, 1.2rem);
                    max-width: 600px;
                    margin: 0 auto;
                }

                .kf-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 24px;
                    max-width: 1340px;
                    margin: 0 auto;
                }

                .kf-card {
                    padding: 32px;
                    transition: var(--transition-smooth);
                    cursor: default;
                }

                .kf-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 16px;
                    background: rgba(0, 102, 255, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 24px;
                    color: var(--primary);
                }

                .kf-card-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-bottom: 12px;
                    color: var(--text-main);
                }

                .kf-card-desc {
                    color: var(--text-dim);
                    line-height: 1.6;
                }

                @media (max-width: 768px) {
                    .key-features-section {
                        padding: 60px 16px;
                    }
                    .kf-header {
                        margin-bottom: 40px;
                    }
                    .kf-grid {
                        gap: 16px;
                    }
                    .kf-card {
                        padding: 24px;
                    }
                }

                @media (max-width: 480px) {
                    .kf-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </section>
    );
};

export default KeyFeatures;
