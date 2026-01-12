import { motion } from "framer-motion";
import { X, Check, ArrowRight } from "lucide-react";

const WhyDifferent = () => {
  const negatives = ["No funded accounts", "No profit splits", "No fake payouts", "No demo competitions"];
  const positives = ["Real traders", "Real capital", "Real rewards"];

  return (
    <section className='why-different-section'>
      <div className='section-container'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='wd-header'
        >
          <span className='wd-badge'>The Difference</span>
          <h2 className='wd-title'>
            Why This is <span className='text-gradient'>Different?</span>
          </h2>
          <p className='wd-subtitle'>This Is Not a Prop Firm.</p>
        </motion.div>

        <div className='wd-content'>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className='wd-column wd-negatives'
          >
            <div className='wd-list'>
              {negatives.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className='wd-item wd-item-negative'
                >
                  <div className='wd-icon-negative'>
                    <X size={18} />
                  </div>
                  <span className='wd-text'>{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className='wd-column wd-positives'
          >
            <div className='wd-list'>
              {positives.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className='wd-item wd-item-positive'
                >
                  <div className='wd-icon-positive'>
                    <Check size={18} />
                  </div>
                  <span className='wd-text'>{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className='wd-footer'
        >
          <div className='wd-footer-content'>
            <ArrowRight size={20} className='wd-arrow' />
            <p className='wd-footer-text'>
              Trade on a globally regulated, award-winning broker known for institutional-grade execution.
            </p>
          </div>
        </motion.div>
      </div>

      <style>{`
        .why-different-section {
          position: relative;
          padding: 80px 24px 0;
          background: linear-gradient(180deg, #0a0a0c 0%, var(--bg-color) 100%);
        }

        .why-different-section .section-container {
          padding-bottom: 40px;
        }

        .wd-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .wd-badge {
          color: var(--primary);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-size: 0.8rem;
          display: block;
          margin-bottom: 16px;
        }

        .wd-title {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          margin-bottom: 16px;
          line-height: 1.1;
        }

        .wd-subtitle {
          color: var(--text-dim);
          font-size: clamp(1.1rem, 2vw, 1.4rem);
          font-weight: 600;
        }

        .wd-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          max-width: 900px;
          margin: 0 auto 40px;
        }

        .wd-column {
          display: flex;
          flex-direction: column;
        }

        .wd-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .wd-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 24px;
          background: rgba(18, 18, 22, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          transition: var(--transition-smooth);
        }

        .wd-item:hover {
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateX(4px);
        }

        .wd-item-negative:hover {
          border-color: rgba(255, 100, 100, 0.3);
        }

        .wd-item-positive:hover {
          border-color: rgba(0, 255, 136, 0.3);
        }

        .wd-icon-negative {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255, 100, 100, 0.15);
          border: 1px solid rgba(255, 100, 100, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #ff6464;
        }

        .wd-icon-positive {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(0, 255, 136, 0.15);
          border: 1px solid rgba(0, 255, 136, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--success);
        }

        .wd-text {
          color: var(--text-main);
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .wd-footer {
          max-width: 800px;
          margin: 0 auto 0;
        }

        .wd-footer-content {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 32px 40px;
          background: rgba(0, 102, 255, 0.1);
          border: 1px solid rgba(0, 102, 255, 0.3);
          border-radius: 20px;
          backdrop-filter: blur(20px);
        }

        .wd-arrow {
          color: var(--primary);
          flex-shrink: 0;
        }

        .wd-footer-text {
          color: var(--text-main);
          font-size: 1.1rem;
          font-weight: 500;
          line-height: 1.6;
          margin: 0;
        }

        @media (max-width: 768px) {
          .why-different-section {
            padding: 60px 16px 0;
          }

          .why-different-section .section-container {
            padding-bottom: 30px;
          }

          .wd-header {
            margin-bottom: 40px;
          }

          .wd-content {
            grid-template-columns: 1fr;
            gap: 32px;
            margin-bottom: 40px;
          }

          .wd-item {
            padding: 16px 20px;
          }

          .wd-footer-content {
            flex-direction: column;
            align-items: flex-start;
            padding: 24px;
            gap: 16px;
          }

          .wd-arrow {
            transform: rotate(90deg);
          }

          .wd-footer-text {
            font-size: 1rem;
          }
        }

        @media (max-width: 480px) {
          .wd-item {
            padding: 14px 18px;
            gap: 12px;
          }

          .wd-icon-negative,
          .wd-icon-positive {
            width: 32px;
            height: 32px;
          }

          .wd-text {
            font-size: 0.9rem;
          }

          .wd-footer-content {
            padding: 20px;
          }
        }
      `}</style>
    </section>
  );
};

export default WhyDifferent;
