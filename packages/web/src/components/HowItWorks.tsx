import { motion } from "framer-motion";
import { UserPlus, BarChart2, Trophy, ArrowRight, Wallet, Target, Shield, Zap } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Create Your Account",
    desc: "Sign up in seconds with just your email. Quick verification to start exploring the platform.",
    details: ["Quick registration", "Secure verification", "Instant access"],
  },
  {
    icon: Wallet,
    number: "02",
    title: "Choose a Tournament",
    desc: "Browse daily, weekly, or monthly competitions. Various entry tiers with prize pools up to $50K.",
    details: ["Multiple tiers", "Various durations", "Flexible entry"],
  },
  {
    icon: BarChart2,
    number: "03",
    title: "Trade & Compete",
    desc: "Execute trades using real-time market data. Your P&L is tracked live on the global leaderboard.",
    details: ["Real-time tracking", "Live leaderboard", "Fair competition"],
  },
  {
    icon: Trophy,
    number: "04",
    title: "Win & Withdraw",
    desc: "Top performers share the prize pool. Instant payouts directly to your connected wallet.",
    details: ["Instant payouts", "Fast withdrawals", "Multiple winners"],
  },
];

const features = [
  { icon: Shield, title: "Secure Trading", desc: "Bank-grade security for all transactions" },
  { icon: Target, title: "Fair Play", desc: "Anti-manipulation systems ensure equal opportunity" },
  { icon: Zap, title: "Real-Time", desc: "Live updates and instant trade execution" },
];

const HowItWorks = () => {
  return (
    <section id='how-it-works' className='how-it-works-section'>
      <div className='section-container'>
        {/* Header */}
        <div className='hiw-header'>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className='hiw-badge'>Easy Start</span>
            <h2 className='hiw-title'>
              How It <span className='text-gradient'>Works</span>
            </h2>
            <p className='hiw-subtitle'>From signup to winning - here's everything you need to know to start competing in just minutes.</p>
          </motion.div>
        </div>

        {/* Steps Timeline */}
        <div className='hiw-steps-container'>
          {/* Connection Line - Desktop */}
          <div className='hiw-connection-line' />

          <div className='hiw-steps'>
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className='hiw-step-card'
              >
                {/* Step Number */}
                <div className='hiw-step-number'>{step.number}</div>

                {/* Icon */}
                <div className='hiw-step-icon'>
                  <step.icon size={28} color='var(--primary)' />
                </div>

                {/* Content */}
                <h3 className='hiw-step-title'>{step.title}</h3>
                <p className='hiw-step-desc'>{step.desc}</p>

                {/* Details */}
                <ul className='hiw-step-details'>
                  {step.details.map((detail, idx) => (
                    <li key={idx}>
                      <ArrowRight size={12} color='var(--primary)' />
                      {detail}
                    </li>
                  ))}
                </ul>

                {/* Arrow to next step - Desktop */}
                {i < steps.length - 1 && (
                  <div className='hiw-step-arrow'>
                    <ArrowRight size={20} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Features */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className='hiw-features'>
          {features.map((feature, i) => (
            <div key={i} className='hiw-feature'>
              <feature.icon size={24} color='var(--primary)' />
              <div>
                <h4>{feature.title}</h4>
                <p>{feature.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className='hiw-cta'>
          <p>Ready to start your trading journey?</p>
          <a href='/tournaments'>
            <button className='btn-primary'>
              View Tournaments <ArrowRight size={18} />
            </button>
          </a>
        </motion.div>
      </div>

      <style>{`
        .how-it-works-section {
          padding: 100px 0;
          background: linear-gradient(180deg, var(--bg-color) 0%, #0a0a0c 100%);
          position: relative;
        }

        .hiw-header {
          text-align: center;
          margin-bottom: 80px;
        }

        .hiw-badge {
          display: inline-block;
          background: rgba(0, 102, 255, 0.1);
          color: var(--primary);
          padding: 8px 20px;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 16px;
          border: 1px solid rgba(0, 102, 255, 0.2);
        }

        .hiw-title {
          font-size: clamp(2rem, 5vw, 3.5rem);
          margin-bottom: 16px;
        }

        .hiw-subtitle {
          color: var(--text-dim);
          font-size: 1.1rem;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .hiw-steps-container {
          position: relative;
          margin-bottom: 80px;
        }

        .hiw-connection-line {
          position: absolute;
          top: 100px;
          left: 10%;
          right: 10%;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--primary), var(--primary), transparent);
          opacity: 0.15;
          z-index: 0;
        }

        .hiw-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          position: relative;
          z-index: 1;
        }

        .hiw-step-card {
          background: var(--surface);
          padding: 32px 24px;
          border-radius: 20px;
          border: 1px solid var(--panel-border);
          text-align: center;
          position: relative;
          transition: all 0.3s ease;
        }

        .hiw-step-card:hover {
          border-color: rgba(0, 102, 255, 0.3);
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .hiw-step-number {
          position: absolute;
          top: -12px;
          left: 24px;
          background: var(--primary);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 900;
          padding: 4px 12px;
          border-radius: 50px;
        }

        .hiw-step-icon {
          width: 72px;
          height: 72px;
          background: var(--bg-color);
          border-radius: 50%;
          display: grid;
          place-items: center;
          margin: 0 auto 24px auto;
          border: 1px solid var(--panel-border);
          box-shadow: 0 0 30px var(--primary-glow);
        }

        .hiw-step-title {
          font-size: 1.25rem;
          margin-bottom: 12px;
          font-weight: 800;
        }

        .hiw-step-desc {
          color: var(--text-dim);
          font-size: 0.9rem;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .hiw-step-details {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .hiw-step-details li {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--text-muted);
          justify-content: center;
        }

        .hiw-step-arrow {
          position: absolute;
          top: 50%;
          right: -20px;
          transform: translateY(-50%);
          color: var(--text-muted);
          opacity: 0.3;
        }

        .hiw-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 60px;
        }

        .hiw-feature {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(0, 102, 255, 0.05);
          padding: 24px;
          border-radius: 16px;
          border: 1px solid rgba(0, 102, 255, 0.1);
        }

        .hiw-feature h4 {
          font-size: 1rem;
          margin-bottom: 4px;
          font-weight: 700;
        }

        .hiw-feature p {
          font-size: 0.85rem;
          color: var(--text-dim);
          margin: 0;
        }

        .hiw-cta {
          text-align: center;
        }

        .hiw-cta p {
          color: var(--text-dim);
          margin-bottom: 20px;
          font-size: 1.1rem;
        }

        .hiw-cta a {
          text-decoration: none;
        }

        @media (max-width: 1100px) {
          .hiw-steps {
            grid-template-columns: repeat(2, 1fr);
          }
          .hiw-connection-line {
            display: none;
          }
          .hiw-step-arrow {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .how-it-works-section {
            padding: 60px 0;
          }
          .hiw-header {
            margin-bottom: 48px;
          }
          .hiw-steps {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .hiw-step-card {
            padding: 28px 20px;
          }
          .hiw-features {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .hiw-feature {
            padding: 20px;
          }
        }
      `}</style>
    </section>
  );
};

export default HowItWorks;
