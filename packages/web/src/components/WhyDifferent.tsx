import { motion } from "framer-motion";
import { X, Check,  } from "lucide-react";

const WhyDifferent = () => {
  const comparisons = [
    { negative: "Funded accounts", positive: "Your own capital" },
    { negative: "Profit splits", positive: "Keep 100% profits" },
    { negative: "Fake payouts", positive: "Real cash rewards" },
    { negative: "Artificial Rules", positive: "Market Executions" },
  ];

  return (
    <section className='why-different-section'>
      <div className='wd-bg-elements'>
        <div className='wd-glow-left' />
        <div className='wd-glow-right' />
      </div>

      <div className='section-container'>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className='wd-header'>
          <h2 className='wd-title'>
            This Is <span className='text-gradient-alt'>Not</span> a Prop Firm
          </h2>
          <p className='wd-subtitle'>We're building something completely different</p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className='wd-comparison'
        >
          <div className='wd-comparison-header'>
            <div className='wd-header-cell wd-header-negative'>
              <X size={18} />
              <span>Others</span>
            </div>
            <div className='wd-header-cell wd-header-positive'>
              <Check size={18} />
              <span>Live Trading League</span>
            </div>
          </div>

          <div className='wd-comparison-body'>
            {comparisons.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className='wd-row'
              >
                <div className='wd-cell wd-cell-negative'>
                  <div className='wd-icon-negative'>
                    <X size={14} />
                  </div>
                  <span>{item.negative}</span>
                </div>
                <div className='wd-cell wd-cell-positive'>
                  <div className='wd-icon-positive'>
                    <Check size={14} />
                  </div>
                  <span>{item.positive}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className='wd-footer'
        >
          <p>Trade on a globally regulated, award-winning broker with institutional-grade execution</p>
        </motion.div>
      </div>

      <style>{`
        .why-different-section {
          position: relative;
          padding: 0px 24px 0px 24px;
          overflow: hidden;
        }

        .wd-bg-elements {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .wd-glow-left {
          position: absolute;
          top: 20%;
          left: -10%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255, 100, 100, 0.08) 0%, transparent 70%);
          filter: blur(60px);
        }

        .wd-glow-right {
          position: absolute;
          bottom: 20%;
          right: -10%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(0, 255, 136, 0.08) 0%, transparent 70%);
          filter: blur(60px);
        }

        .wd-header {
          text-align: center;
          margin-bottom: 60px;
          position: relative;
          z-index: 1;
        }

        .wd-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-dim);
          padding: 10px 20px;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .wd-title {
          font-size: clamp(2.2rem, 5vw, 3.5rem);
          font-weight: 800;
          margin-bottom: 16px;
          line-height: 1.1;
        }

        .text-gradient-alt {
          background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .wd-subtitle {
          color: var(--text-dim);
          font-size: 1.15rem;
        }

        .wd-comparison {
          max-width: 800px;
          margin: 0 auto 60px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 24px;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        .wd-comparison-header {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        .wd-header-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 20px;
          font-weight: 700;
          font-size: 1rem;
        }

        .wd-header-negative {
          background: rgba(255, 100, 100, 0.1);
          color: #ff6b6b;
          border-bottom: 2px solid rgba(255, 100, 100, 0.3);
        }

        .wd-header-positive {
          background: rgba(0, 255, 136, 0.1);
          color: var(--success);
          border-bottom: 2px solid rgba(0, 255, 136, 0.3);
        }

        .wd-comparison-body {
          display: flex;
          flex-direction: column;
        }

        .wd-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          transition: background 0.2s ease;
        }

        .wd-row:last-child {
          border-bottom: none;
        }

        .wd-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .wd-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 24px;
        }

        .wd-cell-negative {
          border-right: 1px solid rgba(255, 255, 255, 0.04);
        }

        .wd-cell span {
          font-size: 0.95rem;
          font-weight: 500;
        }

        .wd-cell-negative span {
          color: var(--text-dim);
          text-decoration: line-through;
          text-decoration-color: rgba(255, 100, 100, 0.5);
        }

        .wd-cell-positive span {
          color: var(--text-main);
        }

        .wd-icon-negative {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(255, 100, 100, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ff6b6b;
          flex-shrink: 0;
        }

        .wd-icon-positive {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(0, 255, 136, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--success);
          flex-shrink: 0;
        }

        .wd-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          max-width: 800px;
          margin: 0 auto;
          padding: 24px 32px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
          border: 1px solid rgba(102, 126, 234, 0.2);
          border-radius: 16px;
          position: relative;
          z-index: 1;
        }

        .wd-footer-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .wd-footer p {
          color: var(--text-main);
          font-size: 1.1rem;
          font-weight: 500;
          line-height: 1.6;
          margin: 0;
          width: 100%;
          text-align: center;
        }

        @media (max-width: 768px) {
          .why-different-section {
            padding: 60px 16px;
          }

          .wd-header {
            margin-bottom: 40px;
          }

          .wd-header-cell {
            padding: 16px;
            font-size: 0.9rem;
          }

          .wd-header-cell span {
            display: none;
          }

          .wd-header-negative::after {
            content: 'Others';
          }

          .wd-header-positive::after {
            content: 'Us';
          }

          .wd-cell {
            padding: 16px;
            gap: 10px;
          }

          .wd-cell span {
            font-size: 0.85rem;
          }

          .wd-icon-negative,
          .wd-icon-positive {
            width: 24px;
            height: 24px;
            border-radius: 6px;
          }

          .wd-footer {
            flex-direction: column;
            text-align: center;
            padding: 20px;
            gap: 12px;
          }

          .wd-footer-icon {
            width: 40px;
            height: 40px;
          }

          .wd-footer p {
            font-size: 1rem;
          }
        }

        @media (max-width: 480px) {
          .wd-badge {
            font-size: 0.75rem;
            padding: 8px 16px;
          }

          .wd-cell {
            padding: 14px 12px;
          }

          .wd-cell span {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </section>
  );
};

export default WhyDifferent;
