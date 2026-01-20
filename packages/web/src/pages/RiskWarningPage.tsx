import { motion } from "framer-motion";
import { Info, TrendingUp, Target, Brain, Shield, CheckCircle, Lightbulb, BookOpen } from "lucide-react";

const RiskWarningPage = () => {
  return (
    <section style={{ minHeight: "100vh", paddingTop: "80px", paddingBottom: "80px" }}>
      <div className='section-container'>
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: "60px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                padding: "16px",
                background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                borderRadius: "16px",
                boxShadow: "0 0 30px var(--primary-glow)",
              }}
            >
              <Info size={32} color='#fff' />
            </div>
          </div>
          <span
            style={{
              color: "var(--primary)",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              fontSize: "0.8rem",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Trading Information
          </span>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", marginBottom: "16px" }}>Risk Awareness</h1>
          <p style={{ color: "var(--text-dim)", fontSize: "1.1rem", maxWidth: "700px", margin: "0 auto" }}>
            Understanding the trading landscape helps you make informed decisions. Here's what every trader should know.
          </p>
        </motion.div>

        {/* Positive Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: "linear-gradient(135deg, rgba(0, 102, 255, 0.1), rgba(0, 200, 255, 0.05))",
            padding: "32px",
            borderRadius: "20px",
            border: "1px solid rgba(0, 102, 255, 0.2)",
            marginBottom: "48px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <Lightbulb size={28} color='var(--primary)' style={{ flexShrink: 0, marginTop: "4px" }} />
            <div>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "12px", color: "var(--primary)", fontWeight: 700 }}>
                Knowledge is Power
              </h3>
              <p style={{ color: "var(--text-dim)", lineHeight: 1.8, margin: 0 }}>
                Trading financial markets offers exciting opportunities for those who approach it with the right mindset and preparation. 
                Like any skill-based activity, success comes from education, practice, and disciplined execution. Our platform is designed 
                to help you compete, learn, and grow as a trader.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Key Considerations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ marginBottom: "48px" }}
        >
          <h2 style={{ fontSize: "1.75rem", marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
            <BookOpen size={28} color='var(--primary)' />
            Key Considerations
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {[
              {
                icon: Target,
                title: "Trade Responsibly",
                content:
                  "Successful traders only use capital they're comfortable with. Set clear budgets for your trading activities and stick to them. This approach lets you trade with confidence and without unnecessary pressure.",
              },
              {
                icon: TrendingUp,
                title: "Understand Market Dynamics",
                content:
                  "Financial markets naturally move up and down. Understanding these movements and having a solid strategy helps you navigate different market conditions. Education and practice are your best tools.",
              },
              {
                icon: Brain,
                title: "Master Your Mindset",
                content:
                  "Trading is as much about psychology as it is about analysis. Developing emotional discipline, patience, and a clear trading plan will significantly improve your decision-making process.",
              },
              {
                icon: Shield,
                title: "Use Risk Management",
                content:
                  "Smart traders always protect their capital. Using stop-losses, proper position sizing, and diversification are proven techniques that professional traders employ to manage their portfolios effectively.",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + idx * 0.05 }}
                style={{
                  background: "var(--surface)",
                  padding: "28px",
                  borderRadius: "16px",
                  border: "1px solid var(--panel-border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                  <div
                    style={{
                      padding: "12px",
                      background: "rgba(0, 102, 255, 0.1)",
                      borderRadius: "12px",
                      flexShrink: 0,
                    }}
                  >
                    <item.icon size={20} color='var(--primary)' />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", marginBottom: "12px", fontWeight: 700 }}>{item.title}</h3>
                    <p style={{ color: "var(--text-dim)", lineHeight: 1.7, margin: 0 }}>{item.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Competition Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            background: "var(--surface)",
            padding: "32px",
            borderRadius: "20px",
            border: "1px solid var(--panel-border)",
            marginBottom: "48px",
          }}
        >
          <h3 style={{ fontSize: "1.25rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
            <CheckCircle size={24} color='var(--success)' />
            Why Our Platform Works for You
          </h3>
          <p style={{ color: "var(--text-dim)", marginBottom: "20px", lineHeight: 1.7 }}>
            Our competition format is designed with your success in mind:
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              "You trade with your own capital — keeping 100% of your profits",
              "Rankings based on percentage returns level the playing field",
              "No hidden fees or profit splits — what you earn is yours",
              "Learn from competing alongside other traders",
              "Real market conditions help you develop genuine skills",
              "Compete at your own pace with various competition durations",
            ].map((item, idx) => (
              <li
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  color: "var(--text-main)",
                  fontSize: "0.95rem",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "var(--success)",
                    flexShrink: 0,
                    marginTop: "8px",
                  }}
                />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Tips for Success */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: "linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 200, 100, 0.05))",
            padding: "32px",
            borderRadius: "20px",
            border: "1px solid rgba(0, 255, 136, 0.2)",
            marginBottom: "48px",
          }}
        >
          <h3 style={{ fontSize: "1.25rem", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
            <Lightbulb size={24} color='var(--success)' />
            Tips for Trading Success
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {[
              "Start with education — learn before you trade",
              "Practice with a demo account first",
              "Develop a clear trading strategy",
              "Keep a trading journal to track progress",
              "Set realistic goals and expectations",
              "Never stop learning and improving",
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px",
                  background: "rgba(0, 0, 0, 0.2)",
                  borderRadius: "12px",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "6px",
                    background: "var(--success)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#000",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}
                </div>
                <span style={{ color: "var(--text-main)", fontSize: "0.9rem" }}>{item}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Important Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            background: "var(--surface)",
            padding: "24px",
            borderRadius: "16px",
            border: "1px solid var(--panel-border)",
          }}
        >
          <h4 style={{ fontSize: "1rem", marginBottom: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
            <Info size={18} color='var(--primary)' />
            Important Note
          </h4>
          <p style={{ color: "var(--text-dim)", lineHeight: 1.7, margin: 0, fontSize: "0.9rem" }}>
            Trading involves both opportunities and challenges. We encourage all participants to trade responsibly, 
            continue learning, and only use capital they're comfortable with. Our platform provides the arena — 
            your skills, discipline, and preparation determine your success.
          </p>
        </motion.div>

        {/* Last Updated */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            marginTop: "60px",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
        >
          Last updated: January 2026
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .section-container {
            padding: 0 16px;
          }
        }
      `}</style>
    </section>
  );
};

export default RiskWarningPage;
