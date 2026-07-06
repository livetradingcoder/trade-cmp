import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, ExternalLink, AlertCircle } from "lucide-react";
import "../styles/JoinCompetitionDialog.css";

interface JoinCompetitionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  tournamentTitle: string;
  referralCode?: string;
}

const JoinCompetitionDialog = ({
  isOpen,
  onClose,
  tournamentId,
  tournamentTitle,
  referralCode = "AFFASAD",
}: JoinCompetitionDialogProps) => {
  const [userType, setUserType] = useState<"new" | "existing" | null>(null);
  const [email, setEmail] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [hasCreatedAccount, setHasCreatedAccount] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenBrokerRegistration = () => {
    window.open(
      "https://portal.fptrading.com/register?fpm-affiliate-utm-source=IB&fpm-affiliate-agt=477779",
      "_blank"
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email || !accountNumber) {
      setError("Please fill in all required fields");
      return;
    }

    if (!acceptedTerms) {
      setError("You must accept the Terms & Conditions to continue");
      return;
    }

    if (userType === "new" && !hasCreatedAccount) {
      setError("Please confirm that you created an account with the referral code");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:3001")}/api/participants/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tournament_id: tournamentId,
          email: email.toLowerCase(),
          fp_account_number: accountNumber,
          referral_code_used: userType === "new" ? referralCode : undefined,
          is_new_user: userType === "new",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit application");
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setUserType(null);
    setEmail("");
    setAccountNumber("");
    setHasCreatedAccount(false);
    setAcceptedTerms(false);
    setError("");
    setSuccess(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetForm, 300);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="dialog-overlay" onClick={handleClose}>
        <motion.div
          className="dialog-content"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="dialog-header">
            <div>
              <h2>Join Competition</h2>
              <p className="dialog-subtitle">{tournamentTitle}</p>
            </div>
            <button className="close-button" onClick={handleClose}>
              <X size={24} />
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <motion.div
              className="success-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Check size={20} />
              <span>Application submitted successfully! Pending admin review.</span>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={20} />
              <span>{error}</span>
            </motion.div>
          )}

          {/* User Type Selection */}
          {!userType && !success && (
            <div className="dialog-body">
              <h3 className="section-title">Do you have an FPTrading account?</h3>
              <div className="user-type-buttons">
                <button
                  className="user-type-button"
                  onClick={() => setUserType("existing")}
                >
                  <div className="user-type-icon">✓</div>
                  <div>
                    <div className="user-type-title">Yes, I have an FPTrading account with your referral code</div>
                  </div>
                </button>
                <button
                  className="user-type-button"
                  onClick={() => setUserType("new")}
                >
                  <div className="user-type-icon">+</div>
                  <div>
                    <div className="user-type-title">I'm new. Create an FPTrading account with your referral code.</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Application Form */}
          {userType && !success && (
            <form className="dialog-body" onSubmit={handleSubmit}>
              {/* Existing User - Referral Code Notice */}
              {userType === "existing" && (
                <div className="referral-section" style={{ marginBottom: "24px" }}>
                  <div className="referral-banner">
                    <div className="referral-icon">⚠️</div>
                    <div>
                      <div className="referral-title">Referral Code Required</div>
                      <div className="referral-description">
                        Your FPTrading account must have been created using our referral code <strong>{referralCode}</strong>. If your account was not registered with this code, please contact support to have it transferred before applying.
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* New User - Referral Code Section */}
              {userType === "new" && (
                <div className="referral-section">
                  <div className="referral-banner">
                    <div className="referral-icon">🎁</div>
                    <div>
                      <div className="referral-title">Important: Use Referral Code</div>
                      <div className="referral-description">
                        You must create your FPTrading account using this referral code
                      </div>
                    </div>
                  </div>
                  <div className="referral-code-box">
                    <span className="referral-code">{referralCode}</span>
                    <button
                      type="button"
                      className="copy-button"
                      onClick={handleCopyCode}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="broker-link-button"
                    onClick={handleOpenBrokerRegistration}
                  >
                    Create FPTrading account
                    <ExternalLink size={16} />
                  </button>
                  <div className="checkbox-field">
                    <input
                      type="checkbox"
                      id="created-account"
                      checked={hasCreatedAccount}
                      onChange={(e) => setHasCreatedAccount(e.target.checked)}
                    />
                    <label htmlFor="created-account">
                      I created my account using the referral code above
                    </label>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="form-fields">
                <div className="form-field">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="account-number">FPTrading Account Number *</label>
                  <input
                    type="text"
                    id="account-number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="12345678"
                    required
                  />
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="terms-section">
                <div className="checkbox-field">
                  <input
                    type="checkbox"
                    id="accept-terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    required
                  />
                  <label htmlFor="accept-terms">
                    I have read and accept the{" "}
                    <a href="/terms" target="_blank" rel="noopener noreferrer">
                      Terms & Conditions
                    </a>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="dialog-actions">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setUserType(null)}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="button-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default JoinCompetitionDialog;
