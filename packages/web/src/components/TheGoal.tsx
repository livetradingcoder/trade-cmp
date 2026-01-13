import { motion } from "framer-motion";
import { ASSETS } from "../constants";

const TheGoal = () => {
  return (
    <section id='goal' className='the-goal-section'>
      <div className='section-container'>
        <div className='goal-container'>
          {/* Decorative gradients inside the box */}
          <div className='goal-gradient' />

          <div className='goal-content'>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className='goal-title'>
                The Goal is <br />
                <span className='text-gradient'>Simple!</span>
              </h2>
              <div className='goal-text'>
                <p>Achieve the highest percentage gain by trading the instruments listed on the competition's banner.</p>
                <p>
                  When the competition ends at the specified time, the <span className='highlight'>top performers</span> with the best
                  results will win prizes.
                </p>
              </div>

              <div className='goal-stats'>
                <div className='goal-stat'>
                  <div className='goal-stat-value'>100%</div>
                  <div className='goal-stat-label'>Transparent</div>
                </div>
                <div className='goal-divider' />
                <div className='goal-stat'>
                  <div className='goal-stat-value'>#1</div>
                  <div className='goal-stat-label'>Elite Venue</div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className='goal-visual'>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className='goal-visual-inner'
            >
              <img src={ASSETS.REWARD_TIERS} alt='Rewards' className='goal-main-image' />

              <motion.img
                animate={{ x: [0, 10, 0], y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                src={ASSETS.LEADERBOARD_SNIPPET}
                alt='Leaderboard'
                className='goal-floating-image leaderboard'
              />

              {/* <motion.img
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                src={ASSETS.USER_BADGE}
                alt='Winner'
                className='goal-floating-image badge'
              /> */}

              <motion.img
                animate={{ rotate: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                src={ASSETS.CHEST}
                alt='Chest'
                className='goal-floating-image chest'
              />
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        .the-goal-section {
          position: relative;
          overflow: hidden;
          padding: 80px 24px;
        }

        .goal-container {
          background: rgba(18, 18, 22, 0.4);
          backdrop-filter: blur(30px);
          border-radius: 40px;
          border: 1px solid var(--panel-border);
          padding: 80px 0px 0px 60px;
          display: flex;
          gap: 60px;
          align-items: flex-end;
          position: relative;
          overflow: hidden;
        }

        .goal-gradient {
          position: absolute;
          top: -10%;
          right: -10%;
          width: 40%;
          height: 40%;
          background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%);
          opacity: 0.3;
          z-index: 0;
        }

        .goal-content {
          flex: 1;
          z-index: 1;
        }

        .goal-title {
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          line-height: 1;
          margin-bottom: 40px;
        }

        .goal-text {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .goal-text p {
          color: var(--text-dim);
          font-size: clamp(1rem, 2vw, 1.4rem);
          line-height: 1.6;
        }

        .goal-text .highlight {
          color: #fff;
          font-weight: 900;
          text-decoration: underline;
          text-decoration-color: var(--primary);
        }

        .goal-stats {
          margin-top: 48px;
          display: flex;
          padding-bottom: 60px;
          gap: 40px;
          align-items: center;
        }

        .goal-stat-value {
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 900;
          color: var(--primary);
        }

        .goal-stat-label {
          font-size: 0.9rem;
          color: var(--text-muted);
          font-weight: 700;
          text-transform: uppercase;
        }

        .goal-divider {
          width: 1px;
          height: 60px;
          background: var(--panel-border);
        }

        .goal-visual {
          flex: 1.4;
          position: relative;
          z-index: 1;
          display: flex;
          align-items: flex-end;
          margin-bottom: -0px;
        }

        .goal-visual-inner {
          position: relative;
          display: flex;
          align-items: flex-end;
        }

        .goal-main-image {
          width: 100%;
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.4));
          margin-bottom: 0;
        }

        .goal-floating-image {
          position: absolute;
          filter: drop-shadow(var(--shadow-premium));
        }

        .goal-floating-image.leaderboard {
          top: -10%;
          left: 10%;
          width: clamp(150px, 25vw, 250px);
        }

        .goal-floating-image.badge {
          bottom: -10%;
          left: -15%;
          width: clamp(120px, 18vw, 220px);
        }

        .goal-floating-image.chest {
          bottom: 0;
          right: 40px;
          width: clamp(100px, 16vw, 160px);
          filter: drop-shadow(0 30px 60px rgba(0,0,0,0.6));
        }

        @media (max-width: 1024px) {
          .goal-container {
            flex-direction: column;
            padding: 60px 40px 0 40px;
            gap: 40px;
          }
          .goal-content {
            text-align: center;
          }
          .goal-stats {
            justify-content: center;
          }
          .goal-visual {
            width: 100%;
            max-width: 500px;
            margin-bottom: -60px;
          }
          .goal-floating-image.leaderboard {
            top: -10%;
            left: -%;
          }
          .goal-floating-image.badge {
            bottom: -5%;
            left: -5%;
          }
          .goal-floating-image.chest {
            bottom: -20px;
            right: -20px;
          }
        }

        @media (max-width: 768px) {
          .goal-container {
            padding: 40px 24px 0 24px;
            border-radius: 24px;
          }
          .goal-visual {
            margin-bottom: -40px;
          }
          .goal-title {
            margin-bottom: 24px;
          }
          .goal-text {
            gap: 16px;
          }
          .goal-stats {
            margin-top: 32px;
            gap: 24px;
          }
          .goal-divider {
            height: 40px;
          }
          .goal-floating-image.leaderboard,
          .goal-floating-image.badge,
          .goal-floating-image.chest {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .goal-container {
            padding: 32px 20px 0 20px;
          }
          .goal-visual {
            margin-bottom: -32px;
          }
        }
      `}</style>
    </section>
  );
};

export default TheGoal;
