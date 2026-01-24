import { motion } from "framer-motion";
import { UserPlus, BarChart2, Trophy, Wallet } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Create Account",
    desc: "Register and verify.",
    color: "#667eea",
  },
  {
    icon: Wallet,
    number: "02",
    title: "Choose a Competition",
    desc: "Daily, weekly, or monthly events.",
    color: "#f093fb",
  },
  {
    icon: BarChart2,
    number: "03",
    title: "Trade Live Markets",
    desc: "Your strategy. Real execution.",
    color: "#00d9ff",
  },
  {
    icon: Trophy,
    number: "04",
    title: "Win & Withdraw",
    desc: "Top performers share the prize pool.",
    color: "#ffd700",
  },
];

const HowItWorks = () => {
  return (
    <section id='how-it-works' className='how-it-works-section'>
      <div className='hiw-bg-gradient' />

      <div className='section-container'>
        {/* Header */}
        <div className='hiw-header'>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className='hiw-title'>
              How It <span className='text-gradient'>Works</span>
            </h2>
            <p className='hiw-subtitle'>Start competing in just 4 simple steps</p>
          </motion.div>
        </div>

        {/* Steps - Horizontal Timeline */}
        <div className='hiw-timeline'>
          <div className='hiw-timeline-line' />

          <div className='hiw-steps'>
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className='hiw-step'
              >
                {/* Step Number Circle */}
                <div className='hiw-step-dot' style={{ background: step.color }}>
                  <span>{step.number}</span>
                </div>

                {/* Card */}
                <div className='hiw-step-card'>
                  <div className='hiw-step-icon' style={{ background: `${step.color}15`, borderColor: `${step.color}30` }}>
                    <step.icon size={24} style={{ color: step.color }} />
                  </div>
                  <h3 className='hiw-step-title'>{step.title}</h3>
                  <p className='hiw-step-desc'>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className='hiw-cta'>
          <Link to='/competitions'>
            <button className='btn-primary hiw-btn'>Start Competing Now</button>
          </Link>
        </motion.div>
      </div>

      <style>{`
        .how-it-works-section {
          padding: 40px 24px;
          position: relative;
          overflow: hidden;
        }

        .hiw-bg-gradient {
          position: absolute;
          inset: 0;
          // background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(102, 126, 234, 0.08) 0%, transparent 50%)
          pointer-events: none;
        }

        .hiw-header {
          text-align: center;
          margin-bottom: 80px;
          position: relative;
          z-index: 1;
        }

        .hiw-badge {
          display: inline-block;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(240, 147, 251, 0.15) 100%);
          color: #667eea;
          padding: 10px 24px;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 20px;
          border: 1px solid rgba(102, 126, 234, 0.2);
        }

        .hiw-title {
          font-size: clamp(2.2rem, 5vw, 3.5rem);
          margin-bottom: 16px;
          font-weight: 800;
        }

        .hiw-subtitle {
          color: var(--text-dim);
          font-size: 1.15rem;
          max-width: 500px;
          margin: 0 auto;
        }

        .hiw-timeline {
          position: relative;
          max-width: 1200px;
          margin: 0 auto 60px;
        }

        .hiw-timeline-line {
          position: absolute;
          top: 24px;
          left: 10%;
          right: 10%;
          height: 3px;
          background: linear-gradient(90deg, 
            #667eea 0%, 
            #f093fb 33%, 
            #00d9ff 66%, 
            #ffd700 100%
          );
          border-radius: 2px;
          opacity: 0.3;
        }

        .hiw-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          position: relative;
        }

        .hiw-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .hiw-step-dot {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          position: relative;
          z-index: 2;
          box-shadow: 0 0 30px currentColor;
        }

        .hiw-step-dot span {
          color: #000;
          font-size: 0.9rem;
          font-weight: 900;
        }

        .hiw-step-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          padding: 28px 24px;
          width: 100%;
          transition: all 0.3s ease;
        }

        .hiw-step-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-4px);
        }

        .hiw-step-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          border: 1px solid;
        }

        .hiw-step-title {
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 10px;
          color: var(--text-main);
        }

        .hiw-step-desc {
          color: var(--text-dim);
          font-size: 0.9rem;
          line-height: 1.6;
          margin: 0;
        }

        .hiw-cta {
          text-align: center;
        }

        .hiw-cta a {
          text-decoration: none;
        }

        .hiw-btn {
          padding: 16px 40px;
          font-size: 1rem;
        }

        @media (max-width: 1024px) {
          .hiw-steps {
            grid-template-columns: repeat(2, 1fr);
            gap: 40px 24px;
          }

          .hiw-timeline-line {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .how-it-works-section {
            padding: 60px 16px;
          }

          .hiw-header {
            margin-bottom: 50px;
          }

          .hiw-steps {
            grid-template-columns: 1fr;
            gap: 32px;
            max-width: 400px;
            margin: 0 auto;
          }

          .hiw-step-dot {
            width: 40px;
            height: 40px;
            margin-bottom: 20px;
          }

          .hiw-step-card {
            padding: 24px 20px;
          }

          .hiw-step-icon {
            width: 48px;
            height: 48px;
          }
        }

        @media (max-width: 480px) {
          .hiw-badge {
            font-size: 0.75rem;
            padding: 8px 18px;
          }

          .hiw-step-card {
            padding: 20px 16px;
          }

          .hiw-step-title {
            font-size: 1.05rem;
          }

          .hiw-step-desc {
            font-size: 0.85rem;
          }

          .hiw-btn {
            width: 100%;
            padding: 14px 32px;
          }
        }
      `}</style>
    </section>
  );
};

export default HowItWorks;
