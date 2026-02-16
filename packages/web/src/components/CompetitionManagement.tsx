import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Trophy, AlertTriangle, Trash2, Calendar, DollarSign, Edit3, Activity, Award, Play, CheckCircle, Archive, Clock } from "lucide-react";
import ParticipantManagement from "./ParticipantManagement";
import LeaderboardManagement from "./LeaderboardManagement";
import "../styles/CompetitionManagement.css";

interface CompetitionTournament {
  id: string | number;
  title: string;
  tier: string;
  prize: string;
  fee: string;
  participants: number;
  timeLabel: string;
  timeLeft: string;
  cover: string;
  image?: string;
  registrationLink: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

interface CompetitionManagementProps {
  tournament: CompetitionTournament;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange?: () => void;
}

type TabType = "participants" | "leaderboard";

const CompetitionManagement = ({ tournament, onBack, onEdit, onDelete, onStatusChange }: CompetitionManagementProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("participants");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:3001");

  const updateStatus = async (newStatus: string, additionalData?: { start_date?: string; end_date?: string }) => {
    setIsUpdatingStatus(true);
    setStatusMessage(null);

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/tournaments/${tournament.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          ...additionalData,
        }),
      });

      if (response.ok) {
        setStatusMessage({ type: "success", text: `Competition status updated to ${newStatus}` });
        setTimeout(() => {
          if (onStatusChange) onStatusChange();
        }, 1500);
      } else {
        setStatusMessage({ type: "error", text: "Failed to update competition status" });
      }
    } catch (error) {
      console.error("Status update error:", error);
      setStatusMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleStartCompetition = () => {
    if (confirm("Are you sure you want to start this competition? This will make it active and visible to participants.")) {
      const now = new Date().toISOString();
      updateStatus("active", { start_date: now });
    }
  };

  const handleCompleteCompetition = () => {
    if (confirm("Are you sure you want to complete this competition? This will end the competition and finalize results.")) {
      const now = new Date().toISOString();
      updateStatus("completed", { end_date: now });
    }
  };

  const handleArchiveCompetition = () => {
    if (confirm("Are you sure you want to archive this competition? It will be moved to archived competitions.")) {
      updateStatus("archived");
    }
  };

  return (
    <div className="competition-management">
      {/* Header */}
      <div className="competition-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Competitions
        </button>
        <div className="competition-title-section">
          <h1>{tournament.title}</h1>
        </div>
        <button className="edit-button" onClick={onEdit}>
          <Edit3 size={18} />
          Edit Details
        </button>
      </div>

      {/* Info Cards and Status Management - Side by Side */}
      <div className="info-and-status-container">
        {/* Competition Info Cards */}
        <div className="competition-info-cards">
          <div className="info-card">
            <Trophy size={18} />
            <div>
              <div className="info-label">Prize Pool</div>
              <div className="info-value">{tournament.prize}</div>
            </div>
          </div>
          <div className="info-card">
            <DollarSign size={18} />
            <div>
              <div className="info-label">Min. Capital</div>
              <div className="info-value">{tournament.fee}</div>
            </div>
          </div>
          <div className="info-card">
            <Users size={18} />
            <div>
              <div className="info-label">Required Participants</div>
              <div className="info-value">{tournament.participants}</div>
            </div>
          </div>
          <div className="info-card">
            <Calendar size={18} />
            <div>
              <div className="info-label">Seats Left</div>
              <div className="info-value">{tournament.timeLeft}</div>
            </div>
          </div>
          <div className="info-card">
            <Activity size={18} />
            <div>
              <div className="info-label">Status</div>
              <div className="info-value" style={{ textTransform: 'capitalize' }}>
                {tournament.status || "draft"}
              </div>
            </div>
          </div>
          <div className="info-card">
            <Award size={18} />
            <div>
              <div className="info-label">Tier</div>
              <div className="info-value">{tournament.tier}</div>
            </div>
          </div>
        </div>

        {/* Competition Status Management */}
        <div className="status-management-section">
          <div className="status-management-header">
            <Activity size={18} />
            <h3>Competition Status</h3>
          </div>
          <div className="status-management-content">
            <div className="current-status">
              <span className="status-label">Current Status:</span>
              <span className={`status-badge-large ${tournament.status || 'draft'}`}>
                {tournament.status === 'active' && <Play size={14} />}
                {tournament.status === 'completed' && <CheckCircle size={14} />}
                {tournament.status === 'archived' && <Archive size={14} />}
                {tournament.status === 'draft' && <Clock size={14} />}
                {(tournament.status || 'draft').toUpperCase()}
              </span>
            </div>

            {statusMessage && (
              <div className={`status-message ${statusMessage.type}`}>
                {statusMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                {statusMessage.text}
              </div>
            )}

            <div className="status-actions">
              {(tournament.status === 'draft' || !tournament.status) && (
                <button
                  className="status-action-button start"
                  onClick={handleStartCompetition}
                  disabled={isUpdatingStatus}
                >
                  <Play size={16} />
                  Start
                </button>
              )}

              {tournament.status === 'active' && (
                <button
                  className="status-action-button complete"
                  onClick={handleCompleteCompetition}
                  disabled={isUpdatingStatus}
                >
                  <CheckCircle size={16} />
                  Complete
                </button>
              )}

              {tournament.status === 'completed' && (
                <button
                  className="status-action-button archive"
                  onClick={handleArchiveCompetition}
                  disabled={isUpdatingStatus}
                >
                  <Archive size={16} />
                  Archive
                </button>
              )}

              {tournament.status === 'archived' && (
                <div className="archived-notice">
                  <Archive size={16} />
                  <span>Archived</span>
                </div>
              )}
            </div>

            {(tournament.start_date || tournament.end_date) && (
              <div className="status-info">
                {tournament.start_date && (
                  <div className="status-date">
                    <strong>Started:</strong> {new Date(tournament.start_date).toLocaleString()}
                  </div>
                )}
                {tournament.end_date && (
                  <div className="status-date">
                    <strong>Ended:</strong> {new Date(tournament.end_date).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="management-tabs">
        <button
          className={`tab-button ${activeTab === "participants" ? "active" : ""}`}
          onClick={() => setActiveTab("participants")}
        >
          <Users size={18} />
          Participants
        </button>
        <button
          className={`tab-button ${activeTab === "leaderboard" ? "active" : ""}`}
          onClick={() => setActiveTab("leaderboard")}
        >
          <Trophy size={18} />
          Leaderboard
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "participants" && (
          <motion.div
            key="participants"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ParticipantManagement tournaments={[tournament]} />
          </motion.div>
        )}
        {activeTab === "leaderboard" && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <LeaderboardManagement tournaments={[tournament]} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Danger Zone */}
      <div className="danger-zone">
        <div className="danger-zone-header">
          <AlertTriangle size={20} />
          <h3>Danger Zone</h3>
        </div>
        <div className="danger-zone-content">
          <div className="danger-zone-info">
            <h4>Delete Competition</h4>
            <p>Once you delete a competition, there is no going back. This will permanently delete all associated data including participants and leaderboard entries.</p>
          </div>
          <button className="delete-button" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 size={18} />
            Delete Competition
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteDialog && (
          <div className="dialog-overlay" onClick={() => setShowDeleteDialog(false)}>
            <motion.div
              className="dialog delete-dialog"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dialog-header">
                <AlertTriangle size={24} color="#ef4444" />
                <h3>Delete Competition</h3>
              </div>
              <div className="dialog-content">
                <p>Are you sure you want to delete this competition? This action cannot be undone.</p>
                <p className="dialog-warning">
                  This will permanently delete all associated data including participants and leaderboard entries.
                </p>
              </div>
              <div className="dialog-actions">
                <button className="dialog-button cancel" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </button>
                <button
                  className="dialog-button delete"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    onDelete();
                  }}
                >
                  <Trash2 size={16} />
                  Delete Competition
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompetitionManagement;
