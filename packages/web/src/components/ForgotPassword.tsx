import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

interface ForgotPasswordProps {
  onBack: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:3001");

export const ForgotPassword = ({ onBack }: ForgotPasswordProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSent(true);
      } else {
        setError(data.message || "Failed to send reset email");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{
        background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
        backdropFilter: "blur(20px)",
        borderRadius: "24px",
        padding: "40px",
        maxWidth: "450px",
        width: "90%",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-dim)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "24px",
          fontSize: "0.9rem",
        }}
      >
        <ArrowLeft size={18} />
        Back to Login
      </button>

      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Mail size={32} color="white" />
              </div>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "1.8rem" }}>Forgot Password?</h2>
              <p style={{ color: "var(--text-dim)", fontSize: "0.95rem", margin: 0 }}>
                Enter your email and we'll send you a reset link
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "24px" }}>
                <input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "16px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "2px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    color: "var(--text)",
                    fontSize: "1rem",
                    transition: "all 0.3s ease",
                  }}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: "rgba(255, 107, 107, 0.1)",
                    border: "1px solid rgba(255, 107, 107, 0.3)",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    marginBottom: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    color: "#ff6b6b",
                  }}
                >
                  <AlertCircle size={20} />
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "16px",
                  background: loading
                    ? "rgba(102, 126, 234, 0.5)"
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  borderRadius: "12px",
                  color: "white",
                  fontSize: "1.05rem",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: "center" }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #51cf66 0%, #37b24d 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <CheckCircle size={32} color="white" />
            </div>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "1.8rem" }}>Check Your Email</h2>
            <p style={{ color: "var(--text-dim)", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "32px" }}>
              If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
            </p>
            <button
              onClick={onBack}
              style={{
                width: "100%",
                padding: "16px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "12px",
                color: "var(--text)",
                fontSize: "1.05rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Back to Login
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
