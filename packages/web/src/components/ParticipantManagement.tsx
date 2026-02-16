import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Clock, UserCheck, UserX, Ban } from "lucide-react";
import "../styles/ParticipantManagement.css";

interface Tournament {
  id: string | number;
  title: string;
}

interface User {
  _id: string;
  email: string;
  fp_account_number: string;
  display_name?: string;
  account_verified: boolean;
}

interface Participant {
  id: string;
  tournament_id: string;
  user: User;
  status: "pending" | "approved" | "declined" | "disqualified";
  referral_code_verified: boolean;
  applied_at: string;
  reviewed_at?: string;
  reviewed_by?: { username: string };
  decline_reason?: string;
  disqualified_at?: string;
  disqualified_by?: { username: string };
  disqualification_reason?: string;
  notes?: string;
}

interface ParticipantManagementProps {
  tournaments: Tournament[];
}

const ParticipantManagement = ({ tournaments }: ParticipantManagementProps) => {
  const [selectedTournament, setSelectedTournament] = useState<string | number>("");
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "declined" | "disqualified">("pending");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reasonDialog, setReasonDialog] = useState<{ open: boolean; type: "decline" | "disqualify"; participantId: string } | null>(null);
  const [reason, setReason] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:3001");

  useEffect(() => {
    if (tournaments.length > 0 && !selectedTournament) {
      setSelectedTournament(tournaments[0].id);
    }
  }, [tournaments]);

  useEffect(() => {
    if (selectedTournament) {
      fetchParticipants();
    }
  }, [selectedTournament]);

  const fetchParticipants = async () => {
    if (!selectedTournament) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/participants/${selectedTournament}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants || []);
      }
    } catch (error) {
      console.error("Failed to fetch participants:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (participantId: string) => {
    setActionLoading(participantId);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/participants/${participantId}/approve`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        await fetchParticipants();
      } else {
        alert("Failed to approve participant");
      }
    } catch (error) {
      console.error("Failed to approve participant:", error);
      alert("Failed to approve participant");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async () => {
    if (!reasonDialog) return;

    setActionLoading(reasonDialog.participantId);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/participants/${reasonDialog.participantId}/decline`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        await fetchParticipants();
        setReasonDialog(null);
        setReason("");
      } else {
        alert("Failed to decline participant");
      }
    } catch (error) {
      console.error("Failed to decline participant:", error);
      alert("Failed to decline participant");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisqualify = async () => {
    if (!reasonDialog) return;

    setActionLoading(reasonDialog.participantId);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/participants/${reasonDialog.participantId}/disqualify`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        await fetchParticipants();
        setReasonDialog(null);
        setReason("");
      } else {
        alert("Failed to disqualify participant");
      }
    } catch (error) {
      console.error("Failed to disqualify participant:", error);
      alert("Failed to disqualify participant");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredParticipants = participants.filter((p) => p.status === activeTab);

  const getStatusCounts = () => {
    return {
      pending: participants.filter((p) => p.status === "pending").length,
      approved: participants.filter((p) => p.status === "approved").length,
      declined: participants.filter((p) => p.status === "declined").length,
      disqualified: participants.filter((p) => p.status === "disqualified").length,
    };
  };

  const counts = getStatusCounts();

  return (
    <div className="participant-management">
      {/* Header */}
      <div className="participant-header">
        <h2>Participant Management</h2>
        <div className="tournament-selector">
          <label>Tournament:</label>
          <select value={selectedTournament} onChange={(e) => setSelectedTournament(e.target.value)}>
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="participant-tabs">
        <button
          className={`tab-button ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          <Clock size={18} />
          Pending
          <span className="tab-badge">{counts.pending}</span>
        </button>
        <button
          className={`tab-button ${activeTab === "approved" ? "active" : ""}`}
          onClick={() => setActiveTab("approved")}
        >
          <UserCheck size={18} />
          Approved
          <span className="tab-badge">{counts.approved}</span>
        </button>
        <button
          className={`tab-button ${activeTab === "declined" ? "active" : ""}`}
          onClick={() => setActiveTab("declined")}
        >
          <UserX size={18} />
          Declined
          <span className="tab-badge">{counts.declined}</span>
        </button>
        <button
          className={`tab-button ${activeTab === "disqualified" ? "active" : ""}`}
          onClick={() => setActiveTab("disqualified")}
        >
          <Ban size={18} />
          Disqualified
          <span className="tab-badge">{counts.disqualified}</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading participants...</p>
        </div>
      ) : filteredParticipants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No {activeTab} participants</h3>
          <p>There are no participants with {activeTab} status for this tournament.</p>
        </div>
      ) : (
        <div className="participant-list">
          <AnimatePresence mode="popLayout">
            {filteredParticipants.map((participant) => (
              <motion.div
                key={participant.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="participant-card"
              >
                <div className="participant-card-header">
                  <div className="participant-info">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <h3>{participant.user.email}</h3>
                      {!participant.referral_code_verified && (
                        <span
                          style={{
                            background: "rgba(251, 191, 36, 0.1)",
                            color: "#fbbf24",
                            border: "1px solid rgba(251, 191, 36, 0.3)",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "0.7rem",
                            fontWeight: "700",
                            textTransform: "uppercase",
                          }}
                          title="This user's FP Markets account was not registered with the platform's referral code"
                        >
                          ⚠️ No Referral Code
                        </span>
                      )}
                    </div>
                    <div className="participant-meta">
                      <span>
                        <strong>Account:</strong> ****{participant.user.fp_account_number.slice(-4)}
                      </span>
                      <span>
                        <strong>Applied:</strong> {new Date(participant.applied_at).toLocaleDateString()}
                      </span>
                      {participant.reviewed_at && (
                        <span>
                          <strong>Reviewed:</strong> {new Date(participant.reviewed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {!participant.referral_code_verified && (
                      <div style={{ marginTop: "8px", fontSize: "0.85rem", color: "#fbbf24", fontStyle: "italic" }}>
                        ⚠️ This user may need to be manually transferred under the referral code. Coordinate with FP Markets team before approving.
                      </div>
                    )}
                    {participant.decline_reason && (
                      <div style={{ marginTop: "8px", fontSize: "0.85rem", color: "#ef4444" }}>
                        <strong>Reason:</strong> {participant.decline_reason}
                      </div>
                    )}
                    {participant.disqualification_reason && (
                      <div style={{ marginTop: "8px", fontSize: "0.85rem", color: "#fb923c" }}>
                        <strong>Reason:</strong> {participant.disqualification_reason}
                      </div>
                    )}
                  </div>
                  <div className="participant-actions">
                    {participant.status === "pending" && (
                      <>
                        <button
                          className="action-button approve"
                          onClick={() => handleApprove(participant.id)}
                          disabled={actionLoading === participant.id}
                        >
                          <Check size={16} />
                          Approve
                        </button>
                        <button
                          className="action-button decline"
                          onClick={() => setReasonDialog({ open: true, type: "decline", participantId: participant.id })}
                          disabled={actionLoading === participant.id}
                        >
                          <X size={16} />
                          Decline
                        </button>
                      </>
                    )}
                    {participant.status === "approved" && (
                      <button
                        className="action-button disqualify"
                        onClick={() => setReasonDialog({ open: true, type: "disqualify", participantId: participant.id })}
                        disabled={actionLoading === participant.id}
                      >
                        <Ban size={16} />
                        Disqualify
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Reason Dialog */}
      <AnimatePresence>
        {reasonDialog && (
          <div className="reason-dialog-overlay" onClick={() => setReasonDialog(null)}>
            <motion.div
              className="reason-dialog"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>{reasonDialog.type === "decline" ? "Decline Participant" : "Disqualify Participant"}</h3>
              {reasonDialog.type === "decline" && (
                <div className="predefined-reasons">
                  <button
                    type="button"
                    className={`predefined-reason-btn ${reason === "No referral Code" ? "active" : ""}`}
                    onClick={() => setReason("No referral Code")}
                  >
                    No referral Code
                  </button>
                  <button
                    type="button"
                    className={`predefined-reason-btn ${reason === "Balance required not match" ? "active" : ""}`}
                    onClick={() => setReason("Balance required not match")}
                  >
                    Balance required not match
                  </button>
                </div>
              )}
              <textarea
                placeholder="Enter reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div className="reason-dialog-actions">
                <button className="action-button view" onClick={() => setReasonDialog(null)}>
                  Cancel
                </button>
                <button
                  className={`action-button ${reasonDialog.type === "decline" ? "decline" : "disqualify"}`}
                  onClick={reasonDialog.type === "decline" ? handleDecline : handleDisqualify}
                  disabled={!reason.trim()}
                >
                  {reasonDialog.type === "decline" ? "Decline" : "Disqualify"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ParticipantManagement;
