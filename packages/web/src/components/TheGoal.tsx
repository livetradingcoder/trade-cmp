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
          padding: 50px 24px;
        }

        .goal-container {
          background: rgba(18, 18, 22, 0.4);
          backdrop-filter: blur(30px);
          border-radius: 32px;
          border: 1px solid var(--panel-border);
          padding: 50px 0px 0px 50px;
          display: flex;
          gap: 40px;
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
          font-size: clamp(2rem, 5vw, 3.5rem);
          line-height: 1;
          margin-bottom: 28px;
        }

        .goal-text {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .goal-text p {
          color: var(--text-dim);
          font-size: clamp(0.95rem, 1.8vw, 1.2rem);
          line-height: 1.5;
        }

        .goal-text .highlight {
          color: #fff;
          font-weight: 900;
          text-decoration: underline;
          text-decoration-color: var(--primary);
        }

        .goal-stats {
          margin-top: 32px;
          display: flex;
          padding-bottom: 40px;
          gap: 32px;
          align-items: center;
        }

        .goal-stat-value {
          font-size: clamp(1.5rem, 3.5vw, 2rem);
          font-weight: 900;
          color: var(--primary);
        }

        .goal-stat-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 700;
          text-transform: uppercase;
        }

        .goal-divider {
          width: 1px;
          height: 48px;
          background: var(--panel-border);
        }

        .goal-visual {
          flex: 1.3;
          position: relative;
          z-index: 1;
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
          margin-bottom: 0;
          margin-right: 0;
        }

        .goal-visual-inner {
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
        }

        .goal-main-image {
          width: 100%;
          max-height: 320px;
          object-fit: contain;
          object-position: right bottom;
          filter: drop-shadow(0 16px 32px rgba(0,0,0,0.4));
          margin-bottom: 0;
        }

        .goal-floating-image {
          position: absolute;
          filter: drop-shadow(var(--shadow-premium));
        }

        .goal-floating-image.leaderboard {
          top: -10%;
          right: 60%;
          left: auto;
          width: clamp(120px, 20vw, 200px);
        }

        .goal-floating-image.badge {
          bottom: -10%;
          right: 70%;
          left: auto;
          width: clamp(100px, 15vw, 180px);
        }

        .goal-floating-image.chest {
          bottom: 0;
          right: 20px;
          width: clamp(80px, 14vw, 130px);
          filter: drop-shadow(0 24px 48px rgba(0,0,0,0.6));
        }

        @media (max-width: 1024px) {
          .the-goal-section {
            padding: 40px 24px;
          }
          .goal-container {
            flex-direction: column;
            padding: 40px 32px 0 32px;
            gap: 32px;
            border-radius: 24px;
          }
          .goal-content {
            text-align: center;
          }
          .goal-stats {
            justify-content: center;
            padding-bottom: 32px;
          }
          .goal-visual {
            width: 100%;
            max-width: 400px;
            margin-bottom: -40px;
            margin: 0 auto -40px auto;
            justify-content: center;
          }
          .goal-visual-inner {
            justify-content: center;
          }
          .goal-main-image {
            max-height: 280px;
            object-position: center bottom;
          }
          .goal-floating-image.leaderboard {
            top: -10%;
            left: 0;
            right: auto;
          }
          .goal-floating-image.badge {
            bottom: -5%;
            left: -5%;
            right: auto;
          }
          .goal-floating-image.chest {
            bottom: -15px;
            right: -15px;
          }
        }

        @media (max-width: 768px) {
          .the-goal-section {
            padding: 32px 16px;
          }
          .goal-container {
            padding: 32px 20px 0 20px;
            border-radius: 20px;
          }
          .goal-visual {
            margin-bottom: -32px;
            max-width: 350px;
          }
          .goal-main-image {
            max-height: 240px;
          }
          .goal-title {
            margin-bottom: 20px;
          }
          .goal-text {
            gap: 12px;
          }
          .goal-stats {
            margin-top: 24px;
            gap: 20px;
            padding-bottom: 24px;
          }
          .goal-divider {
            height: 36px;
          }
          .goal-floating-image.leaderboard,
          .goal-floating-image.badge,
          .goal-floating-image.chest {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .the-goal-section {
            padding: 24px 12px;
          }
          .goal-container {
            padding: 24px 16px 0 16px;
            border-radius: 16px;
          }
          .goal-visual {
            margin-bottom: -24px;
            max-width: 300px;
          }
          .goal-main-image {
            max-height: 200px;
          }
          .goal-title {
            margin-bottom: 16px;
          }
          .goal-stats {
            margin-top: 20px;
            padding-bottom: 20px;
          }
        }
      `}</style>
    </section>
  );
};

export default TheGoal;
