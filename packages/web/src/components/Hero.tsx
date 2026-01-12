import { motion } from "framer-motion";
import { Gamepad2, Trophy, User } from "lucide-react";
import { Link } from "react-router-dom";
import { ASSETS } from "../constants";

const Hero = () => {
  return (
    <section className='hero-section'>
      <div className='bg-glow-top'></div>
      <div className='bg-grid'></div>

      <div className='section-container hero-container'>
        <div className='hero-content'>
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
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className='hero-visual-inner'
            >
              <div className='hero-image-container'>
                <img src={ASSETS.LAPTOP} alt='Platform' className='hero-image' />

                {/* Floating Elements - Glossy */}
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className='floating-element floating-top'
                >
                  <div className='floating-badge'>
                    <div className='badge-icon gold'>
                      <Trophy size={24} color='#000' />
                    </div>
                    <div>
                      <div className='badge-title'>$50K REWARD</div>
                      <div className='badge-subtitle success'>+11.34% ROI</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className='floating-element floating-bottom'
                >
                  <div className='floating-badge' style={{ borderLeft: "4px solid var(--primary)" }}>
                    <div className='badge-icon surface'>
                      <User size={24} color='var(--primary)' />
                    </div>
                    <div>
                      <div className='badge-title'>SATOSHIGHOST</div>
                      <div className='badge-subtitle'>ELITE RANK #3</div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Background Glow behind image */}
              <div className='hero-glow'></div>
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        .hero-section {
          position: relative;
          overflow: visible;
        }

        .hero-container {
          padding-top: 60px;
          padding-bottom: 30px;
          min-height: calc(100vh - 120px);
          display: flex;
          align-items: center;
        }

        .hero-content {
          display: flex;
          align-items: center;
          gap: 60px;
          width: 100%;
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
          flex: 1.2;
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

        .hero-image-container {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .hero-image {
          width: 130%;
          max-width: 800px;
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 0 80px rgba(0, 102, 255, 0.2));
          margin-right: -60px;
        }

        .floating-element {
          position: absolute;
          z-index: 2;
        }

        .floating-top {
          top: -5%;
          left: -5%;
        }

        .floating-bottom {
          bottom: 5%;
          right: 5%;
        }

        .badge-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: grid;
          place-items: center;
        }

        .badge-icon.gold {
          background: linear-gradient(135deg, #ffcc00, #ff9900);
          box-shadow: 0 8px 16px rgba(255, 204, 0, 0.3);
        }

        .badge-icon.surface {
          background: var(--surface);
          border: 1px solid var(--panel-border);
        }

        .badge-title {
          font-weight: 900;
          color: #fff;
        }

        .badge-subtitle {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-dim);
        }

        .badge-subtitle.success {
          color: var(--success);
        }

        .hero-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 120%;
          height: 120%;
          background: radial-gradient(circle, var(--primary-glow) 0%, transparent 60%);
          z-index: 0;
          opacity: 0.4;
        }

        @media (max-width: 1024px) {
          .hero-container {
            min-height: auto;
            padding-top: 40px;
            padding-bottom: 40px;
          }

          .hero-content {
            flex-direction: column;
            gap: 40px;
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
            max-width: 400px;
            margin: 0 auto;
          }

          .hero-image {
            width: 100%;
            margin-right: 0;
          }

          .floating-top {
            top: 5%;
            left: 0;
            transform: scale(0.85);
          }

          .floating-bottom {
            bottom: 15%;
            right: 0;
            transform: scale(0.85);
          }
        }

        @media (max-width: 768px) {
          .hero-container {
            padding-top: 30px;
            padding-bottom: 30px;
            padding-left: 20px;
            padding-right: 20px;
          }

          .hero-content {
            gap: 24px;
          }

          .hero-text {
            padding: 0;
          }

          .hero-visual {
            max-width: 320px;
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

          .floating-badge {
            padding: 10px 14px;
            gap: 10px;
          }

          .badge-icon {
            width: 36px;
            height: 36px;
            border-radius: 10px;
          }

          .badge-icon svg {
            width: 18px;
            height: 18px;
          }

          .badge-title {
            font-size: 0.75rem;
          }

          .badge-subtitle {
            font-size: 0.65rem;
          }

          .floating-top {
            left: -5px;
            top: 0;
            transform: scale(0.8);
          }

          .floating-bottom {
            right: -5px;
            bottom: 10%;
            transform: scale(0.8);
          }
        }

        @media (max-width: 480px) {
          .hero-container {
            padding-top: 16px;
            padding-bottom: 24px;
            padding-left: 16px;
            padding-right: 16px;
          }

          .hero-content {
            gap: 16px;
          }

          .hero-visual {
            max-width: 280px;
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

          .floating-element {
            transform: scale(0.65);
            transform-origin: center;
          }

          .floating-top {
            left: -15px;
            top: 5%;
          }

          .floating-bottom {
            right: -15px;
            bottom: 15%;
          }

          .trader-avatar {
            width: 26px;
            height: 26px;
            margin-left: -8px;
          }

          .traders-avatars {
            margin-left: 8px;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;
