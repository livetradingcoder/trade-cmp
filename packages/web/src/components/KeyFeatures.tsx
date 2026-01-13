import { motion } from "framer-motion";
import { Wallet, Unlock, Brain, Crown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Wallet,
    title: "No Entry Barrier",
    description: "Trade with your own capital. Pure skill-based competition.",
    color: "#667eea",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    icon: Unlock,
    title: "Flexible Rules",
    description: "Freedom to trade your way. No arbitrary drawdowns or complex constraints.",
    color: "#00d9ff",
    gradient: "linear-gradient(135deg, #00d9ff 0%, #0066ff 100%)",
  },
  {
    icon: Brain,
    title: "Trade Your Strategy",
    description: "Scalping, swinging, or hedging—your style, your rules, your profits.",
    color: "#f093fb",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  {
    icon: Crown,
    title: "100% Autonomy",
    description: "Complete control over your trading decisions and account management.",
    color: "#ffd700",
    gradient: "linear-gradient(135deg, #ffd700 0%, #ff9500 100%)",
  },
];

const KeyFeatures = () => {
  return (
    <section id='about' className='key-features-section'>
      <div className='kf-bg-glow' />

      <div className='section-container'>
        <div className='kf-header'>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className='kf-badge'>Why Choose Us</span>
            <h2 className='kf-title'>
              Why Top Traders <br />
              <span className='text-gradient'>Choose The League</span>
            </h2>
            <p className='kf-subtitle'>Experience the freedom of true trading competition with skill-based rewards</p>
          </motion.div>
        </div>

        <div className='kf-grid'>
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className='kf-card'
              style={{ "--card-color": feature.color, "--card-gradient": feature.gradient } as React.CSSProperties}
            >
              <div className='kf-card-glow' />
              <div className='kf-card-content'>
                <div className='kf-icon-wrapper'>
                  <div className='kf-icon'>
                    <feature.icon size={26} />
                  </div>
                  <span className='kf-number'>0{index + 1}</span>
                </div>
                <h3 className='kf-card-title'>{feature.title}</h3>
                <p className='kf-card-desc'>{feature.description}</p>
              </div>
              <div className='kf-card-line' />
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className='kf-cta'>
          <Link to='/tournaments'>
            <button className='kf-cta-btn'>
              Start Trading Now
              <ArrowRight size={18} />
            </button>
          </Link>
        </motion.div>
      </div>

      <style>{`
        .key-features-section {
          position: relative;
          z-index: 10;
          padding: 80px 24px;
          overflow: hidden;
        }

        .kf-bg-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(102, 126, 234, 0.08) 0%, transparent 60%);
          pointer-events: none;
        }

        .kf-header {
          text-align: center;
          margin-bottom: 70px;
          position: relative;
          z-index: 1;
        }

        .kf-badge {
          display: inline-block;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
          color: #667eea;
          padding: 10px 24px;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 20px;
          border: 1px solid rgba(102, 126, 234, 0.25);
        }

        .kf-title {
          font-size: clamp(2.2rem, 5vw, 3.5rem);
          font-weight: 800;
          margin-bottom: 20px;
          line-height: 1.1;
        }

        .kf-subtitle {
          color: var(--text-dim);
          font-size: 1.15rem;
          max-width: 550px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .kf-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          max-width: 1340px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .kf-card {
          position: relative;
          background: rgba(18, 18, 22, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 24px;
          padding: 32px 28px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .kf-card:hover {
          transform: translateY(-8px);
          border-color: var(--card-color);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3),
                      0 0 40px color-mix(in srgb, var(--card-color) 20%, transparent);
        }

        .kf-card-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 120px;
          background: var(--card-gradient);
          opacity: 0;
          transition: opacity 0.4s ease;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 100%);
        }

        .kf-card:hover .kf-card-glow {
          opacity: 1;
        }

        .kf-card-content {
          position: relative;
          z-index: 1;
        }

        .kf-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .kf-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: var(--card-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 8px 20px color-mix(in srgb, var(--card-color) 30%, transparent);
        }

        .kf-number {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--text-muted);
          opacity: 0.5;
        }

        .kf-card-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 12px;
          color: var(--text-main);
        }

        .kf-card-desc {
          color: var(--text-dim);
          line-height: 1.7;
          font-size: 0.95rem;
        }

        .kf-card-line {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--card-gradient);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s ease;
        }

        .kf-card:hover .kf-card-line {
          transform: scaleX(1);
        }

        .kf-cta {
          text-align: center;
          margin-top: 60px;
          position: relative;
          z-index: 1;
        }

        .kf-cta a {
          text-decoration: none;
        }

        .kf-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 36px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .kf-cta-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(102, 126, 234, 0.35);
        }

        .kf-cta-btn svg {
          transition: transform 0.3s ease;
        }

        .kf-cta-btn:hover svg {
          transform: translateX(4px);
        }

        @media (max-width: 1100px) {
          .kf-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .key-features-section {
            padding: 70px 16px;
          }

          .kf-header {
            margin-bottom: 50px;
          }

          .kf-grid {
            gap: 16px;
          }

          .kf-card {
            padding: 28px 24px;
          }

          .kf-cta {
            margin-top: 40px;
          }
        }

        @media (max-width: 600px) {
          .kf-grid {
            grid-template-columns: 1fr;
          }

          .kf-badge {
            font-size: 0.75rem;
            padding: 8px 18px;
          }

          .kf-cta-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
};

export default KeyFeatures;
