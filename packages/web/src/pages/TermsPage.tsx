import { motion } from "framer-motion";
import { FileText, Shield, Users, Trophy, Wallet, AlertCircle, Handshake, Scale } from "lucide-react";

const TermsPage = () => {
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
              <FileText size={32} color='#fff' />
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
            Legal Information
          </span>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", marginBottom: "16px" }}>Terms & Conditions</h1>
          <p style={{ color: "var(--text-dim)", fontSize: "1.1rem", maxWidth: "700px", margin: "0 auto" }}>
            Please read these terms carefully before using our platform. By participating in our competitions, you agree to these terms.
          </p>
        </motion.div>

        {/* General Terms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: "60px" }}
        >
          <h2 style={{ fontSize: "1.75rem", marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
            <Shield size={28} color='var(--primary)' />
            General Terms & Conditions
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {[
              {
                icon: Users,
                title: "1. Company Scope",
                content:
                  "This platform operates exclusively as an online competition, marketing, and referral platform. The company does not provide brokerage services, investment services, proprietary trading, portfolio management, or financial advisory services.",
              },
              {
                icon: Handshake,
                title: "2. No Brokerage Relationship",
                content:
                  "The company is not a broker, dealer, market maker, or proprietary trading firm. All trading activities are conducted directly between users and third-party regulated brokerage firms.",
              },
              {
                icon: Wallet,
                title: "3. No Client Funds",
                content:
                  "The company does not receive, hold, manage, safeguard, or control client funds, trading capital, deposits, or withdrawals. All funds remain at all times with third-party brokers.",
              },
              {
                icon: Trophy,
                title: "4. Competitions",
                content:
                  "Competitions hosted on the platform are intended for performance comparison, engagement, and marketing purposes only. Rankings are calculated using predefined metrics obtained from third-party brokers or tracking systems.",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
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

        {/* Rewards Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: "var(--surface)",
            padding: "32px",
            borderRadius: "20px",
            border: "1px solid var(--panel-border)",
            marginBottom: "40px",
          }}
        >
          <h3 style={{ fontSize: "1.25rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
            <Trophy size={24} color='var(--accent)' />
            5. Rewards & Prizes
          </h3>
          <p style={{ color: "var(--text-dim)", marginBottom: "20px", lineHeight: 1.7 }}>
            Any rewards, prizes, or incentives offered through competitions are:
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              "Fixed and predefined",
              "Funded by the brokers",
              "Not derived from pooled trading capital",
              "Not based on profit sharing or capital allocation",
            ].map((item, idx) => (
              <li
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
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
                  }}
                />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Additional Terms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "60px" }}
        >
          {[
            {
              icon: AlertCircle,
              title: "6. No Investment Advice",
              content:
                "All information provided on the platform is for general informational and entertainment purposes only and does not constitute investment advice, trading advice, or financial recommendations.",
            },
            {
              icon: Handshake,
              title: "7. Affiliate & Referral Revenue",
              content:
                "The company generates revenue solely from referral, affiliate, and performance-based commissions paid by third-party brokerage partners for marketing and client introduction services.",
            },
            {
              icon: Scale,
              title: "8. Limitation of Liability",
              content:
                "The company shall not be liable for any trading losses, broker actions, execution quality, account performance, or financial outcomes arising from users' trading activities.",
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + idx * 0.05 }}
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
        </motion.div>

        {/* Competition Terms */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div
            style={{
              background: "linear-gradient(135deg, rgba(0, 102, 255, 0.1), rgba(0, 200, 255, 0.05))",
              padding: "40px",
              borderRadius: "24px",
              border: "1px solid rgba(0, 102, 255, 0.2)",
              marginBottom: "40px",
            }}
          >
            <h2 style={{ fontSize: "1.75rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              <Trophy size={28} color='var(--primary)' />
              Competition Terms & Conditions
            </h2>
            <p style={{ color: "var(--text-dim)", lineHeight: 1.7 }}>
              The following terms apply specifically to all competitions hosted on the platform.
            </p>
          </div>

          {/* Competition Terms Content */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {/* Section 1 */}
            <div
              style={{
                background: "var(--surface)",
                padding: "32px",
                borderRadius: "20px",
                border: "1px solid var(--panel-border)",
              }}
            >
              <h3 style={{ fontSize: "1.25rem", marginBottom: "20px", color: "var(--primary)" }}>1. Platform Role & Scope</h3>
              <p style={{ color: "var(--text-dim)", lineHeight: 1.8, marginBottom: "16px" }}>
                The platform operates exclusively as a competition and performance-ranking platform. It does not provide brokerage services,
                investment services, asset management, portfolio management, or financial advice.
              </p>
              <p style={{ color: "var(--text-dim)", lineHeight: 1.8 }}>
                Participants trade independently through third-party brokers of their own choice. The platform does not execute trades, hold
                funds, access client accounts, or manage capital.
              </p>
            </div>

            {/* Section 2 */}
            <div
              style={{
                background: "var(--surface)",
                padding: "32px",
                borderRadius: "20px",
                border: "1px solid var(--panel-border)",
              }}
            >
              <h3 style={{ fontSize: "1.25rem", marginBottom: "20px", color: "var(--primary)" }}>
                2. Performance Ranking & Winner Selection
              </h3>
              <p style={{ color: "var(--text-dim)", lineHeight: 1.8, marginBottom: "16px" }}>
                Competition rankings are determined solely for competitive and evaluative purposes. The winner of the competition is
                determined exclusively based on the highest percentage return achieved during the competition period, as reflected in the
                participant's trading account statistics provided by an external, third-party broker.
              </p>

              <div
                style={{
                  background: "rgba(0, 102, 255, 0.05)",
                  padding: "20px",
                  borderRadius: "12px",
                  marginBottom: "20px",
                }}
              >
                <h4 style={{ fontSize: "1rem", marginBottom: "12px", fontWeight: 700 }}>Additional Clarifications:</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    "Absolute profit amounts are not considered",
                    "Account size, deposits, withdrawals, or leverage levels are not relevant",
                    "Rankings are calculated purely on percentage performance",
                    "Percentage returns are used only for competition ranking purposes",
                  ].map((item, idx) => (
                    <li
                      key={idx}
                      style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-dim)", fontSize: "0.9rem" }}
                    >
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <p style={{ color: "var(--text-dim)", lineHeight: 1.8 }}>
                All performance data is displayed for entertainment and competitive evaluation only and does not represent investment
                performance, investment advice, or financial recommendations.
              </p>

              <div
                style={{
                  background: "rgba(255, 204, 0, 0.1)",
                  padding: "20px",
                  borderRadius: "12px",
                  marginTop: "20px",
                  borderLeft: "4px solid var(--accent)",
                }}
              >
                <h4 style={{ fontSize: "1rem", marginBottom: "12px", fontWeight: 700, color: "var(--accent)" }}>
                  2.1 Performance Calculation & Disqualification Criteria
                </h4>
                <p style={{ color: "var(--text-dim)", lineHeight: 1.8, marginBottom: "12px", fontSize: "0.95rem" }}>
                  Percentage performance is calculated exclusively based on the participant's initial deposit amount at the start of the
                  competition period.
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    "The initial deposit represents the baseline reference value for all percentage calculations",
                    "Subsequent deposits do not affect performance calculations",
                    "Withdrawals do not reset or modify the initial reference amount",
                  ].map((item, idx) => (
                    <li
                      key={idx}
                      style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-dim)", fontSize: "0.9rem" }}
                    >
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <p style={{ color: "var(--text-dim)", lineHeight: 1.8, marginTop: "16px", fontSize: "0.95rem" }}>
                  If a participant's trading account balance reaches zero (0), the participant is considered to have lost the competition
                  and is automatically disqualified from ranking.
                </p>
              </div>
            </div>

            {/* Section 3 */}
            <div
              style={{
                background: "var(--surface)",
                padding: "32px",
                borderRadius: "20px",
                border: "1px solid var(--panel-border)",
              }}
            >
              <h3 style={{ fontSize: "1.25rem", marginBottom: "20px", color: "var(--primary)" }}>3. No Brokerage, No Capital Handling</h3>
              <p style={{ color: "var(--text-dim)", lineHeight: 1.8, marginBottom: "16px" }}>The platform:</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  "Does not act as a broker or intermediary",
                  "Does not accept, store, or control user funds",
                  "Does not provide funded accounts or capital allocation",
                  "Does not interfere with or influence trading decisions",
                ].map((item, idx) => (
                  <li
                    key={idx}
                    style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-dim)", fontSize: "0.95rem" }}
                  >
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
              <p style={{ color: "var(--text-dim)", lineHeight: 1.8, marginTop: "16px" }}>
                All trading activity occurs entirely outside the platform, directly between the participant and their chosen broker.
              </p>
            </div>

            {/* Section 4 */}
            <div
              style={{
                background: "var(--surface)",
                padding: "32px",
                borderRadius: "20px",
                border: "1px solid var(--panel-border)",
              }}
            >
              <h3 style={{ fontSize: "1.25rem", marginBottom: "20px", color: "var(--primary)" }}>4. Third-Party Brokers & Independence</h3>
              <p style={{ color: "var(--text-dim)", lineHeight: 1.8, marginBottom: "16px" }}>Participants are fully responsible for:</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  "Selecting their own broker",
                  "Opening and maintaining their own trading accounts",
                  "Complying with the broker's terms, regulations, and local laws",
                ].map((item, idx) => (
                  <li
                    key={idx}
                    style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-dim)", fontSize: "0.95rem" }}
                  >
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
              <p style={{ color: "var(--text-dim)", lineHeight: 1.8, marginTop: "16px" }}>
                The platform has no control or ownership over third-party broker systems, pricing, execution, or account data.
              </p>
            </div>

            {/* Section 5 */}
            <div
              style={{
                background: "var(--surface)",
                padding: "32px",
                borderRadius: "20px",
                border: "1px solid var(--panel-border)",
              }}
            >
              <h3 style={{ fontSize: "1.25rem", marginBottom: "20px", color: "var(--primary)" }}>5. Affiliate & Referral Relationships</h3>
              <p style={{ color: "var(--text-dim)", lineHeight: 1.8, marginBottom: "16px" }}>
                The platform may participate in broker affiliate or Introducing Broker (IB) programs.
              </p>
              <p style={{ color: "var(--text-dim)", lineHeight: 1.8, marginBottom: "16px" }}>Any commissions earned:</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  "Are based on marketing and referral activity only",
                  "Do not involve client funds",
                  "Do not affect competition results or rankings",
                  "Do not create a client-broker relationship between the platform and participants",
                ].map((item, idx) => (
                  <li
                    key={idx}
                    style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-dim)", fontSize: "0.95rem" }}
                  >
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Section 6 */}
            <div
              style={{
                background: "var(--surface)",
                padding: "32px",
                borderRadius: "20px",
                border: "1px solid var(--panel-border)",
              }}
            >
              <h3 style={{ fontSize: "1.25rem", marginBottom: "20px", color: "var(--primary)" }}>6. No Investment Advice Disclaimer</h3>
              <p style={{ color: "var(--text-dim)", lineHeight: 1.8, marginBottom: "16px" }}>
                Content, rankings, statistics, and competition results:
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  "Are not financial advice",
                  "Are not investment recommendations",
                  "Should not be interpreted as guidance for trading or investing decisions",
                ].map((item, idx) => (
                  <li
                    key={idx}
                    style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-dim)", fontSize: "0.95rem" }}
                  >
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
              <p style={{ color: "var(--text-dim)", lineHeight: 1.8, marginTop: "16px", fontWeight: 600 }}>
                Participants trade at their own risk and discretion.
              </p>
            </div>

            {/* Section 7 */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(0, 102, 255, 0.1), rgba(0, 200, 255, 0.05))",
                padding: "32px",
                borderRadius: "20px",
                border: "1px solid rgba(0, 102, 255, 0.2)",
              }}
            >
              <h3 style={{ fontSize: "1.25rem", marginBottom: "20px", color: "var(--primary)" }}>
                7. Entertainment & Skill-Based Competition
              </h3>
              <p style={{ color: "var(--text-dim)", lineHeight: 1.8, marginBottom: "16px" }}>
                The competition is designed as a skill-based, entertainment-focused performance comparison.
              </p>
              <p style={{ color: "var(--text-dim)", lineHeight: 1.8, marginBottom: "16px" }}>It is not:</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {["A trading service", "An investment product", "A financial instrument", "A profit-sharing scheme"].map((item, idx) => (
                  <li
                    key={idx}
                    style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-dim)", fontSize: "0.95rem" }}
                  >
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
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

export default TermsPage;
