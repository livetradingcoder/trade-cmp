import { motion } from "framer-motion";
import {
  FileText,
  Building,
  Handshake,
  Users,
  Trophy,
  BarChart3,
  Calculator,
  Gift,
  ClipboardCheck,
  AlertCircle,
  Scale,
  Eye,
  Database,
  RefreshCw,
  Gavel,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import termsData from "../data/termsData.json";

// Map icon names from JSON to actual icon components
const iconMap: Record<string, LucideIcon> = {
  Building,
  Handshake,
  Users,
  Trophy,
  BarChart3,
  Calculator,
  Gift,
  ClipboardCheck,
  AlertCircle,
  Scale,
  Eye,
  Database,
  RefreshCw,
  Gavel,
  CheckCircle2,
};

// Reusable bullet list component
const BulletList = ({
  items,
  color = "var(--primary)",
  fontSize = "0.95rem",
}: {
  items: string[];
  color?: string;
  fontSize?: string;
}) => (
  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
    {items.map((item, idx) => (
      <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "10px", color: "var(--text-dim)", fontSize }}>
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
            marginTop: "8px",
          }}
        />
        {item}
      </li>
    ))}
  </ul>
);

// Subsection component for nested content
const Subsection = ({ subsection }: { subsection: any }) => {
  const getSubsectionStyle = (type?: string) => {
    switch (type) {
      case "warning":
        return {
          background: "rgba(255, 204, 0, 0.1)",
          borderLeft: "4px solid var(--accent)",
          titleColor: "var(--accent)",
        };
      case "info":
        return {
          background: "rgba(0, 102, 255, 0.05)",
          borderLeft: "4px solid var(--primary)",
          titleColor: "var(--primary)",
        };
      default:
        return {
          background: "rgba(0, 102, 255, 0.03)",
          borderLeft: "3px solid var(--panel-border)",
          titleColor: "var(--text-main)",
        };
    }
  };

  const style = getSubsectionStyle(subsection.type);

  return (
    <div
      style={{
        background: style.background,
        padding: "20px",
        borderRadius: "12px",
        borderLeft: style.borderLeft,
        marginTop: "16px",
      }}
    >
      {subsection.title && (
        <h4 style={{ fontSize: "1rem", marginBottom: "12px", fontWeight: 700, color: style.titleColor }}>
          {subsection.title}
        </h4>
      )}
      {subsection.introText && (
        <p style={{ color: "var(--text-dim)", lineHeight: 1.8, marginBottom: "12px", fontSize: "0.95rem" }}>
          {subsection.introText}
        </p>
      )}
      {subsection.paragraphs?.map((p: string, idx: number) => (
        <p key={idx} style={{ color: "var(--text-dim)", lineHeight: 1.8, marginBottom: "12px", fontSize: "0.95rem" }}>
          {p}
        </p>
      ))}
      {subsection.items && (
        <BulletList
          items={subsection.items}
          color={subsection.type === "warning" ? "var(--accent)" : "var(--primary)"}
          fontSize="0.9rem"
        />
      )}
    </div>
  );
};

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
            {termsData.header.badge}
          </span>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", marginBottom: "8px" }}>{termsData.header.title}</h1>
          <p style={{ color: "var(--text-dim)", fontSize: "1.2rem", marginBottom: "16px", fontWeight: 500 }}>
            {termsData.header.subtitle}
          </p>
          <p style={{ color: "var(--text-dim)", fontSize: "1rem", maxWidth: "700px", margin: "0 auto" }}>
            {termsData.header.description}
          </p>
        </motion.div>

        {/* All Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {termsData.sections.map((section, idx) => {
            const IconComponent = iconMap[section.icon];
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + idx * 0.03 }}
                style={{
                  background: "var(--surface)",
                  padding: "32px",
                  borderRadius: "20px",
                  border: "1px solid var(--panel-border)",
                }}
              >
                {/* Section Header */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}>
                  {IconComponent && (
                    <div
                      style={{
                        padding: "12px",
                        background: "rgba(0, 102, 255, 0.1)",
                        borderRadius: "12px",
                        flexShrink: 0,
                      }}
                    >
                      <IconComponent size={24} color='var(--primary)' />
                    </div>
                  )}
                  <h2 style={{ fontSize: "1.35rem", color: "var(--primary)", margin: 0, paddingTop: "8px" }}>
                    {section.number}. {section.title}
                  </h2>
                </div>

                {/* Paragraphs */}
                {section.paragraphs?.map((paragraph, pIdx) => (
                  <p key={pIdx} style={{ color: "var(--text-dim)", lineHeight: 1.8, marginBottom: "16px" }}>
                    {paragraph}
                  </p>
                ))}

                {/* Intro Text + Items */}
                {section.introText && (
                  <p style={{ color: "var(--text-dim)", lineHeight: 1.8, marginBottom: "16px" }}>{section.introText}</p>
                )}
                {section.items && !section.subsections && <BulletList items={section.items} />}

                {/* Clarifications Box */}
                {section.clarifications && (
                  <div
                    style={{
                      background: "rgba(0, 102, 255, 0.05)",
                      padding: "20px",
                      borderRadius: "12px",
                      marginTop: "16px",
                    }}
                  >
                    <h4 style={{ fontSize: "1rem", marginBottom: "12px", fontWeight: 700 }}>{section.clarifications.title}</h4>
                    <BulletList items={section.clarifications.items} fontSize="0.9rem" />
                  </div>
                )}

                {/* Additional Paragraphs */}
                {section.additionalParagraphs?.map((paragraph, pIdx) => (
                  <p key={pIdx} style={{ color: "var(--text-dim)", lineHeight: 1.8, marginTop: "16px" }}>
                    {paragraph}
                  </p>
                ))}

                {/* Subsections */}
                {section.subsections?.map((subsection, sIdx) => (
                  <Subsection key={sIdx} subsection={subsection} />
                ))}

                {/* Footer */}
                {section.footer && (
                  <p
                    style={{
                      color: "var(--text-dim)",
                      lineHeight: 1.8,
                      marginTop: "20px",
                      fontWeight: section.footerBold ? 600 : 400,
                    }}
                  >
                    {section.footer}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>

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
          Last updated: {termsData.lastUpdated}
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
