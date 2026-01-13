import { motion } from "framer-motion";
import { Gamepad2, User, Wallet, Unlock, Brain, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { ASSETS } from "../constants";

const features = [
  {
    icon: Wallet,
    title: "No Entry Barrier",
    description: "Trade with your own capital. Pure skill-based competition.",
  },
  {
    icon: Unlock,
    title: "Flexible Rules",
    description: "Freedom to trade your way. No arbitrary drawdowns.",
  },
  {
    icon: Brain,
    title: "Trade Your Strategy",
    description: "Scalping, swinging, or hedging—your style, your rules.",
  },
  {
    icon: Crown,
    title: "100% Autonomy",
    description: "Complete control over your trading decisions.",
  },
];

const Hero = () => {
  return (
    <section className='hero-section'>
      <div className='bg-glow-top'></div>
      <div className='bg-grid'></div>

      <div className='section-container hero-container'>
        {/* Main Hero Content */}
        <div className='hero-main'>
          <div className='hero-text'>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className='hero-badge'>Real Competition. Real Rewards.</span>
              <h1 className='text-gradient hero-title'>
                Trade. Compete. <br /> Win Real Money.
              </h1>
              <p className='hero-description'>No funded accounts. No profit splits.</p>

              <div className='hero-cta'>
                <Link to='/tournaments'>
                  <button className='btn-primary hero-btn'>
                    <Gamepad2 size={24} /> Enter the competition
                  </button>
                </Link>
                <div className='hero-traders'>
                  <div className='traders-avatars'>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className='trader-avatar'>
                        <User size={14} />
                      </div>
                    ))}
                  </div>
                  <span>14k+ Active Traders</span>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                className='hero-bullets'
              >
                {["Trade with your own capital", "Keep 100% of your profits", "Win real money — not demo points"].map((text, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 + index * 0.08 }}
                    className='hero-bullet-item'
                  >
                    <div className='bullet-checkmark'>
                      <span>✔</span>
                    </div>
                    <span className='bullet-text'>{text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>

          <div className='hero-visual'>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className='hero-visual-inner'
            >
              <div className='hero-image-wrapper'>
                <img src={ASSETS.HERO_IMAGE} alt='Trading Platform' className='hero-image' />
                <div className='hero-image-glow'></div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
          className='hero-features-grid'
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
              className='hero-feature-card'
            >
              <div className='feature-icon'>
                <feature.icon size={24} />
              </div>
              <div className='feature-content'>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <style>{`
        .hero-section {
          position: relative;
          overflow: visible;
        }

        .hero-container {
          padding-top: 40px;
          padding-bottom: 60px;
        }

        .hero-main {
          display: flex;
          align-items: center;
          gap: 60px;
          width: 100%;
          margin-bottom: 60px;
        }

        .hero-text {
          flex: 1;
          max-width: 100%;
        }

        .hero-badge {
          color: var(--primary);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-size: 0.8rem;
          display: block;
          margin-bottom: 16px;
        }

        .hero-title {
          font-size: clamp(2.5rem, 6vw, 3.5rem);
        }

        .hero-description {
          color: var(--text-dim);
          font-size: clamp(1rem, 2vw, 1.25rem);
          margin-top: 24px;
          margin-bottom: 32px;
          max-width: 540px;
          line-height: 1.5;
        }

        .hero-cta {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          align-items: center;
        }

        .hero-cta a {
          text-decoration: none;
        }

        .hero-btn {
          padding: 18px 36px;
        }

        .hero-traders {
          display: flex;
          align-items: center;
          gap: 16px;
          color: var(--text-muted);
          font-weight: 600;
        }

        .traders-avatars {
          display: flex;
          margin-left: 10px;
        }

        .trader-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #1a1b1e;
          border: 2px solid var(--bg-color);
          margin-left: -10px;
          display: grid;
          place-items: center;
        }

        .hero-visual {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-visual-inner {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-image-wrapper {
          position: relative;
          width: 100%;
          max-width: 550px;
        }

        .hero-image {
          width: 100%;
          height: auto;
          border-radius: 20px;
          object-fit: cover;
          position: relative;
          z-index: 1;
          box-shadow: 0 25px 80px rgba(0, 102, 255, 0.15),
                      0 10px 40px rgba(0, 0, 0, 0.4);
        }

        .hero-image-glow {
          position: absolute;
          inset: -20%;
          background: radial-gradient(circle, rgba(0, 102, 255, 0.2) 0%, transparent 60%);
          z-index: 0;
          filter: blur(40px);
        }

        .hero-bullets {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 40px;
        }

        .hero-bullet-item {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .bullet-checkmark {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .bullet-checkmark span {
          color: #ffffff;
          font-size: 14px;
          line-height: 1;
          display: block;
        }

        .bullet-text {
          color: var(--text-dim);
          font-size: 1rem;
          font-weight: 500;
          letter-spacing: -0.01em;
          line-height: 1.5;
        }

        .hero-bullet-item:hover .bullet-checkmark {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.12);
        }

        /* Feature Cards Grid - 2x2 */
        .hero-features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          max-width: 100%;
        }

        .hero-feature-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 24px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .hero-feature-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(0, 102, 255, 0.2);
          transform: translateY(-2px);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(0, 102, 255, 0.15) 0%, rgba(102, 126, 234, 0.1) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          flex-shrink: 0;
        }

        .feature-content h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 6px;
        }

        .feature-content p {
          font-size: 0.9rem;
          color: var(--text-dim);
          line-height: 1.5;
        }

        @media (max-width: 1024px) {
          .hero-container {
            padding-top: 40px;
            padding-bottom: 40px;
          }

          .hero-main {
            flex-direction: column;
            gap: 40px;
            margin-bottom: 40px;
          }

          .hero-text {
            text-align: center;
            order: 1;
          }

          .hero-description {
            margin-left: auto;
            margin-right: auto;
          }

          .hero-cta {
            justify-content: center;
          }

          .hero-bullets {
            align-items: center;
            margin-top: 32px;
            gap: 14px;
          }

          .hero-visual {
            order: 0;
            width: 100%;
            max-width: 450px;
            margin: 0 auto;
          }

          .hero-features-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
        }

        @media (max-width: 768px) {
          .hero-container {
            padding-top: 30px;
            padding-bottom: 30px;
            padding-left: 20px;
            padding-right: 20px;
          }

          .hero-main {
            gap: 24px;
            margin-bottom: 32px;
          }

          .hero-text {
            padding: 0;
          }

          .hero-visual {
            max-width: 350px;
          }

          .hero-badge {
            font-size: 0.65rem;
            letter-spacing: 0.15em;
            margin-bottom: 12px;
          }

          .hero-title {
            font-size: 2.2rem;
          }

          .hero-description {
            font-size: 0.95rem;
            margin-top: 16px;
            margin-bottom: 24px;
          }

          .hero-btn {
            padding: 14px 24px;
            font-size: 0.9rem;
          }

          .hero-traders span {
            font-size: 0.8rem;
          }

          .hero-features-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .hero-feature-card {
            padding: 20px;
          }

          .feature-icon {
            width: 44px;
            height: 44px;
          }

          .feature-content h3 {
            font-size: 1rem;
          }

          .feature-content p {
            font-size: 0.85rem;
          }
        }

        @media (max-width: 480px) {
          .hero-container {
            padding-top: 16px;
            padding-bottom: 24px;
            padding-left: 16px;
            padding-right: 16px;
          }

          .hero-main {
            gap: 16px;
            margin-bottom: 24px;
          }

          .hero-visual {
            max-width: 300px;
          }

          .hero-title {
            font-size: 2rem;
            line-height: 1.1;
          }

          .hero-badge {
            font-size: 0.6rem;
            letter-spacing: 0.12em;
          }

          .hero-description {
            font-size: 0.85rem;
            margin-top: 12px;
            margin-bottom: 20px;
            padding: 0;
          }

          .hero-cta {
            flex-direction: column;
            width: 100%;
            gap: 14px;
            padding: 0;
          }

          .hero-btn {
            width: 100%;
            padding: 14px 20px;
            font-size: 0.85rem;
          }

          .hero-traders {
            justify-content: center;
          }

          .hero-traders span {
            font-size: 0.75rem;
          }

          .hero-bullets {
            margin-top: 24px;
            gap: 12px;
          }

          .bullet-checkmark {
            width: 22px;
            height: 22px;
            border-radius: 5px;
          }

          .bullet-checkmark span {
            font-size: 12px;
          }

          .bullet-text {
            font-size: 0.9rem;
          }

          .trader-avatar {
            width: 26px;
            height: 26px;
            margin-left: -8px;
          }

          .traders-avatars {
            margin-left: 8px;
          }

          .hero-feature-card {
            padding: 16px;
            gap: 12px;
          }

          .feature-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
          }

          .feature-icon svg {
            width: 20px;
            height: 20px;
          }

          .feature-content h3 {
            font-size: 0.95rem;
          }

          .feature-content p {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;
