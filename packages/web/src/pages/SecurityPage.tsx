import { motion } from "framer-motion";
import { Shield, Lock, Eye, Server, Key, CheckCircle, Globe, Heart, Fingerprint, Sparkles } from "lucide-react";

const SecurityPage = () => {
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
                background: "linear-gradient(135deg, #00ff88, #00cc6a)",
                borderRadius: "16px",
                boxShadow: "0 0 30px rgba(0, 255, 136, 0.4)",
              }}
            >
              <Shield size={32} color='#000' />
            </div>
          </div>
          <span
            style={{
              color: "var(--success)",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              fontSize: "0.8rem",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Your Protection
          </span>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", marginBottom: "16px" }}>Security & Trust</h1>
          <p style={{ color: "var(--text-dim)", fontSize: "1.1rem", maxWidth: "700px", margin: "0 auto" }}>
            Your security is our priority. Discover how we protect your data and ensure a safe, trustworthy platform experience.
          </p>
        </motion.div>

        {/* Security Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            marginBottom: "60px",
          }}
        >
          {[
            {
              icon: Lock,
              title: "SSL Encryption",
              description: "All data is encrypted using industry-standard SSL/TLS protocols for secure communication",
              color: "#00ff88",
            },
            {
              icon: Shield,
              title: "Your Capital, Your Control",
              description: "We never hold or access your trading funds — they stay safely in your broker account",
              color: "var(--primary)",
            },
            {
              icon: Server,
              title: "Reliable Infrastructure",
              description: "Enterprise-grade hosting ensures the platform is always available when you need it",
              color: "var(--accent)",
            },
            {
              icon: Key,
              title: "Secure Authentication",
              description: "Advanced password protection and secure session management keep your account safe",
              color: "#00ff88",
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              style={{
                background: "var(--surface)",
                padding: "28px",
                borderRadius: "20px",
                border: "1px solid var(--panel-border)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: `${item.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <item.icon size={28} color={item.color} />
              </div>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "8px", fontWeight: 700 }}>{item.title}</h3>
              <p style={{ color: "var(--text-dim)", fontSize: "0.9rem", margin: 0, lineHeight: 1.6 }}>{item.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Data Protection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ marginBottom: "48px" }}
        >
          <h2 style={{ fontSize: "1.75rem", marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
            <Eye size={28} color='var(--primary)' />
            Privacy & Data Protection
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {[
              {
                icon: Fingerprint,
                title: "Minimal Data Collection",
                content:
                  "We only collect what's necessary to provide you with the best experience. Your sensitive financial data and broker credentials are never stored on our platform.",
              },
              {
                icon: Heart,
                title: "Your Privacy Matters",
                content:
                  "Your personal information is never sold or shared for marketing purposes. We respect your privacy and handle your data with the utmost care.",
              },
              {
                icon: Sparkles,
                title: "Transparent Practices",
                content:
                  "We believe in being open about how we operate. You can request information about your data or deletion of your account at any time.",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.05 }}
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
                      background: "rgba(0, 255, 136, 0.1)",
                      borderRadius: "12px",
                      flexShrink: 0,
                    }}
                  >
                    <item.icon size={20} color='var(--success)' />
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

        {/* Platform Security */}
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
            <CheckCircle size={24} color='var(--success)' />
            How We Keep You Safe
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
            {[
              "HTTPS encryption on every page",
              "Secure password hashing",
              "Protected API endpoints",
              "Regular security updates",
              "Input validation & sanitization",
              "Session security management",
              "Protection against common vulnerabilities",
              "Continuous platform monitoring",
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  background: "rgba(0, 0, 0, 0.2)",
                  borderRadius: "10px",
                }}
              >
                <CheckCircle size={18} color='var(--success)' style={{ flexShrink: 0 }} />
                <span style={{ color: "var(--text-main)", fontSize: "0.9rem" }}>{item}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trading Account Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            background: "var(--surface)",
            padding: "32px",
            borderRadius: "20px",
            border: "1px solid var(--panel-border)",
            marginBottom: "48px",
          }}
        >
          <h3 style={{ fontSize: "1.25rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
            <Globe size={24} color='var(--primary)' />
            Your Trading Account
          </h3>
          <p style={{ color: "var(--text-dim)", marginBottom: "20px", lineHeight: 1.7 }}>
            Your trading accounts remain completely under your control:
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              "Your accounts are held directly with regulated brokers you choose",
              "We never access your broker login credentials",
              "All funds stay in your account at all times",
              "You maintain full control over deposits and withdrawals",
              "Performance tracking uses read-only data or your submissions",
              "Choose reputable, regulated brokers for the best experience",
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
                    background: "var(--primary)",
                    flexShrink: 0,
                    marginTop: "8px",
                  }}
                />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Best Practices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: "linear-gradient(135deg, rgba(0, 102, 255, 0.1), rgba(0, 200, 255, 0.05))",
            padding: "32px",
            borderRadius: "20px",
            border: "1px solid rgba(0, 102, 255, 0.2)",
            marginBottom: "48px",
          }}
        >
          <h3 style={{ fontSize: "1.25rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
            <Key size={24} color='var(--primary)' />
            Security Best Practices
          </h3>
          <p style={{ color: "var(--text-dim)", marginBottom: "20px", lineHeight: 1.7 }}>
            Help us keep your account secure with these simple tips:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {[
              "Use a strong, unique password",
              "Keep your login details private",
              "Be aware of phishing attempts",
              "Use secure networks when possible",
              "Keep your devices updated",
              "Contact us if you notice anything unusual",
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
                    background: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
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

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          style={{
            background: "var(--surface)",
            padding: "24px",
            borderRadius: "16px",
            border: "1px solid var(--panel-border)",
            textAlign: "center",
          }}
        >
          <h4 style={{ fontSize: "1rem", marginBottom: "12px", fontWeight: 700 }}>
            Questions or Concerns?
          </h4>
          <p style={{ color: "var(--text-dim)", lineHeight: 1.7, margin: 0, fontSize: "0.9rem" }}>
            We're here to help! If you have any questions about security or notice anything unusual, 
            please don't hesitate to reach out. Your peace of mind is important to us.
          </p>
        </motion.div>

        {/* Last Updated */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
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

export default SecurityPage;
