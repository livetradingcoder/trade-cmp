import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Plus,
  Edit3,
  Save,
  X,
  LogOut,
  Lock,
  User,
  Shield,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Link as LinkIcon,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Key,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Info,
  Settings,
  Gift,
  Bell,
  Activity,
  Mail,
  Loader,
} from "lucide-react";
import { useTournaments, type Tournament } from "../context/TournamentContext";
import { ImageUpload } from "../components/ImageUpload";
import { useNavigate } from "react-router-dom";
import ParticipantManagement from "../components/ParticipantManagement";
import CompetitionManagement from "../components/CompetitionManagement";

type ViewMode = "list" | "create" | "edit" | "password" | "settings" | "participants" | "manage";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { tournaments, isAdmin, login, logout, updateTournament, createTournament, deleteTournament } = useTournaments();

  // Auth state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [managingTournament, setManagingTournament] = useState<Tournament | null>(null);

  // Form state
  const [formData, setFormData] = useState<Omit<Tournament, "id">>({
    title: "",
    tier: "Weekly",
    prize: "",
    fee: "",
    participants: 0,
    timeLabel: "Seats Left",
    timeLeft: "",
    cover:
      "https://firebasestorage.googleapis.com/v0/b/fortraders-production.firebasestorage.app/o/public%2Ftournament_cover%2Fe2207b07-3cdb-4e1b-96d8-1763c85679ae.jpg?alt=media",
    image: "",
    registrationLink: "",
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Settings state
  const [affiliateCode, setAffiliateCode] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState({ type: "", text: "" });

  // SMTP Settings state
  const [smtpSettings, setSmtpSettings] = useState({
    host: "",
    port: "587",
    secure: false,
    user: "",
    pass: "",
    from: ""
  });
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [isSavingSMTP, setIsSavingSMTP] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [smtpMessage, setSmtpMessage] = useState({ type: "", text: "" });

  // Pending participants state
  const [pendingCounts, setPendingCounts] = useState<Record<string | number, number>>({});
  const [totalPending, setTotalPending] = useState(0);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });
  const [showCapitalTooltip, setShowCapitalTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const infoIconRef = useRef<HTMLDivElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:3001");

  useEffect(() => {
    if (showCapitalTooltip && infoIconRef.current) {
      const rect = infoIconRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - 10,
        left: rect.left + rect.width / 2,
      });
    }
  }, [showCapitalTooltip]);

  // Fetch affiliate code on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/settings/affiliateCode`);
        if (response.ok) {
          const data = await response.json();
          setAffiliateCode(data.value || "");
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };
    if (isAdmin) {
      fetchSettings();
    }
  }, [isAdmin, API_URL]);

  // Fetch SMTP settings on mount
  useEffect(() => {
    const fetchSMTPSettings = async () => {
      try {
        const keys = ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'smtp_from'];
        const settings: Record<string, string> = {};

        for (const key of keys) {
          const response = await fetch(`${API_URL}/api/settings/${key}`);
          if (response.ok) {
            const data = await response.json();
            settings[key.replace('smtp_', '')] = data.value || "";
          }
        }

        setSmtpSettings({
          host: settings.host || "",
          port: settings.port || "587",
          secure: settings.secure === "true",
          user: settings.user || "",
          pass: settings.pass ? "••••••••" : "", // Mask existing password
          from: settings.from || ""
        });
      } catch (error) {
        console.error("Failed to fetch SMTP settings:", error);
      }
    };

    if (isAdmin) {
      fetchSMTPSettings();
    }
  }, [isAdmin, API_URL]);

  // Fetch pending participants count
  useEffect(() => {
    const fetchPendingCounts = async () => {
      if (!isAdmin || tournaments.length === 0) return;

      try {
        const token = localStorage.getItem("adminToken");
        const counts: Record<string | number, number> = {};
        let total = 0;

        // Fetch participants for each tournament
        await Promise.all(
          tournaments.map(async (tournament) => {
            try {
              const response = await fetch(`${API_URL}/api/participants/${tournament.id}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (response.ok) {
                const data = await response.json();
                const participants = data.participants || [];
                const pendingCount = participants.filter((p: any) => p.status === "pending").length;
                counts[tournament.id] = pendingCount;
                total += pendingCount;
              }
            } catch (error) {
              console.error(`Failed to fetch participants for tournament ${tournament.id}:`, error);
            }
          })
        );

        setPendingCounts(counts);
        setTotalPending(total);
      } catch (error) {
        console.error("Failed to fetch pending counts:", error);
      }
    };

    fetchPendingCounts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCounts, 30000);
    return () => clearInterval(interval);
  }, [isAdmin, tournaments, API_URL]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    const success = await login(username, password);
    if (!success) {
      setLoginError("Invalid username or password");
    }
    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    logout();
    setUsername("");
    setPassword("");
    setViewMode("list");
  };

  const resetForm = () => {
    setFormData({
      title: "",
      tier: "Weekly",
      prize: "",
      fee: "",
      participants: 0,
      timeLabel: "Seats Left",
      timeLeft: "",
      cover:
        "https://firebasestorage.googleapis.com/v0/b/fortraders-production.firebasestorage.app/o/public%2Ftournament_cover%2Fe2207b07-3cdb-4e1b-96d8-1763c85679ae.jpg?alt=media",
      image: "",
      registrationLink: "",
    });
  };

  const startCreate = () => {
    resetForm();
    setViewMode("create");
    setSaveMessage({ type: "", text: "" });
  };

  const startEdit = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setFormData({
      title: tournament.title,
      tier: tournament.tier,
      prize: tournament.prize,
      fee: tournament.fee,
      participants: tournament.participants,
      timeLabel: tournament.timeLabel,
      timeLeft: tournament.timeLeft,
      cover: tournament.cover,
      image: tournament.image || "",
      registrationLink: tournament.registrationLink,
    });
    setViewMode("edit");
    setSaveMessage({ type: "", text: "" });
  };

  const startManage = (tournament: Tournament) => {
    setManagingTournament(tournament);
    setViewMode("manage");
  };

  const handleSave = async () => {
    if (!formData.title || !formData.registrationLink || !formData.cover) {
      setSaveMessage({ type: "error", text: "Please fill in all required fields (Title, Registration Link, Cover Image)" });
      return;
    }

    setIsSaving(true);
    setSaveMessage({ type: "", text: "" });

    try {
      if (viewMode === "create") {
        const success = await createTournament(formData);
        if (success) {
          setSaveMessage({ type: "success", text: "Competition created successfully!" });
          setTimeout(() => {
            setViewMode("list");
            resetForm();
          }, 1500);
        } else {
          setSaveMessage({ type: "error", text: "Failed to create competition" });
        }
      } else if (viewMode === "edit" && editingTournament) {
        const success = await updateTournament(editingTournament.id, formData);
        if (success) {
          setSaveMessage({ type: "success", text: "Competition updated successfully!" });
          setTimeout(() => {
            setViewMode("list");
            setEditingTournament(null);
          }, 1500);
        } else {
          setSaveMessage({ type: "error", text: "Failed to update competition" });
        }
      }
    } catch {
      setSaveMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (confirm("Are you sure you want to delete this competition? This action cannot be undone.")) {
      const success = await deleteTournament(id);
      if (!success) {
        alert("Failed to delete competition");
      }
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/admin/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        setPasswordSuccess("Password changed successfully!");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => setViewMode("list"), 2000);
      } else {
        const data = await response.json();
        setPasswordError(data.error || "Failed to change password");
      }
    } catch {
      setPasswordError("Network error. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const cancelAction = () => {
    setViewMode("list");
    setEditingTournament(null);
    setManagingTournament(null);
    resetForm();
    setSaveMessage({ type: "", text: "" });
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordError("");
    setPasswordSuccess("");
    setSettingsMessage({ type: "", text: "" });
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setSettingsMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/settings/affiliateCode`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: affiliateCode }),
      });

      if (response.ok) {
        setSettingsMessage({ type: "success", text: "Affiliate code saved successfully!" });
      } else {
        setSettingsMessage({ type: "error", text: "Failed to save settings" });
      }
    } catch {
      setSettingsMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveSMTPSettings = async () => {
    setIsSavingSMTP(true);
    setSmtpMessage({ type: "", text: "" });
    const token = localStorage.getItem("adminToken");

    try {
      // Save each setting individually
      const settings = {
        smtp_host: smtpSettings.host,
        smtp_port: smtpSettings.port,
        smtp_secure: smtpSettings.secure.toString(),
        smtp_user: smtpSettings.user,
        smtp_pass: smtpSettings.pass === "••••••••" ? undefined : smtpSettings.pass, // Skip if unchanged
        smtp_from: smtpSettings.from
      };

      for (const [key, value] of Object.entries(settings)) {
        if (value === undefined) continue; // Skip unchanged password

        const response = await fetch(`${API_URL}/api/settings/${key}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ value })
        });

        if (!response.ok) throw new Error(`Failed to save ${key}`);
      }

      setSmtpMessage({ type: "success", text: "SMTP settings saved successfully!" });
    } catch (error) {
      setSmtpMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to save SMTP settings" });
    } finally {
      setIsSavingSMTP(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      setSmtpMessage({ type: "error", text: "Please enter a test email address" });
      return;
    }

    setIsTestingEmail(true);
    setSmtpMessage({ type: "", text: "" });
    const token = localStorage.getItem("adminToken");

    try {
      const response = await fetch(`${API_URL}/api/settings/smtp/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ testEmail })
      });

      const data = await response.json();

      if (response.ok) {
        setSmtpMessage({ type: "success", text: "Test email sent successfully! Check your inbox." });
      } else {
        setSmtpMessage({ type: "error", text: data.error || "Failed to send test email" });
      }
    } catch (error) {
      setSmtpMessage({ type: "error", text: "Network error: " + (error instanceof Error ? error.message : "Unknown error") });
    } finally {
      setIsTestingEmail(false);
    }
  };

  // Login Screen
  if (!isAdmin) {
    return (
      <div className='admin-login-page'>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='login-container'>
          <div className='login-header'>
            <div className='login-icon'>
              <Shield size={40} />
            </div>
            <h1>Admin Portal</h1>
            <p>Sign in to manage competitions</p>
          </div>

          <form onSubmit={handleLogin} className='login-form'>
            <div className='input-group'>
              <User size={18} className='input-icon' />
              <input type='text' placeholder='Username' value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>

            <div className='input-group'>
              <Lock size={18} className='input-icon' />
              <input
                type={showPassword ? "text" : "password"}
                placeholder='Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type='button' className='password-toggle' onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <AnimatePresence>
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className='error-message'
                >
                  <AlertCircle size={16} />
                  {loginError}
                </motion.div>
              )}
            </AnimatePresence>

            <button type='submit' className='login-btn' disabled={isLoggingIn}>
              {isLoggingIn ? <span className='loading-spinner' /> : <>Sign In</>}
            </button>
          </form>

          <button className='back-btn' onClick={() => navigate("/")}>
            <ArrowLeft size={16} /> Back to Home
          </button>
        </motion.div>

        <style>{loginStyles}</style>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className='admin-dashboard'>
      {/* Sidebar */}
      <aside className='sidebar'>
        <div className='sidebar-header'>
          <div className='logo'>
            <Trophy size={24} />
            <span>LTL - Admin</span>
          </div>
        </div>

        <nav className='sidebar-nav'>
          <button className={`nav-item ${viewMode === "list" ? "active" : ""}`} onClick={() => cancelAction()}>
            <Trophy size={20} />
            <span>Competitions</span>
          </button>
          <button className={`nav-item ${viewMode === "participants" ? "active" : ""}`} onClick={() => setViewMode("participants")}>
            <Users size={20} />
            <span>Participants</span>
            {totalPending > 0 && <span className='notification-badge'>{totalPending}</span>}
          </button>
          <button className={`nav-item ${viewMode === "settings" ? "active" : ""}`} onClick={() => setViewMode("settings")}>
            <Settings size={20} />
            <span>Settings</span>
          </button>
          <button className={`nav-item ${viewMode === "password" ? "active" : ""}`} onClick={() => setViewMode("password")}>
            <Key size={20} />
            <span>Change Password</span>
          </button>
        </nav>

        <div className='sidebar-footer'>
          <button className='home-btn' onClick={() => navigate("/")}>
            <ArrowLeft size={18} />
            <span>Back to Home</span>
          </button>
          <button className='logout-btn' onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className='main-content'>
        <AnimatePresence mode='wait'>
          {viewMode === "list" && (
            <motion.div
              key='list'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className='content-section'
            >
              <div className='section-header'>
                <div>
                  <h1>Competitions</h1>
                  <p>Manage your trading competitions</p>
                </div>
                <button className='create-btn' onClick={startCreate}>
                  <Plus size={20} />
                  <span>Create Competition</span>
                </button>
              </div>

              <div className='tournaments-grid'>
                {tournaments.map((tournament) => (
                  <motion.div
                    key={tournament.id}
                    layout
                    className='tournament-card'
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className='card-cover' style={{ backgroundImage: `url(${tournament.cover})` }}>
                      <span className={`tier-badge ${tournament.tier.toLowerCase()}`}>{tournament.tier}</span>
                      {pendingCounts[tournament.id] > 0 && (
                        <span className='pending-indicator' title={`${pendingCounts[tournament.id]} pending participants`}>
                          <Bell size={14} />
                          {pendingCounts[tournament.id]}
                        </span>
                      )}
                    </div>
                    <div className='card-content'>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <h3 style={{ margin: 0 }}>{tournament.title}</h3>
                        <span className={`status-indicator ${tournament.status || 'draft'}`}>
                          <Activity size={12} />
                          {tournament.status || 'draft'}
                        </span>
                      </div>
                      <div className='card-stats'>
                        <div className='stat'>
                          <Trophy size={14} />
                          <span>Prize: {tournament.prize}</span>
                        </div>
                        <div className='stat'>
                          <Calendar size={14} />
                          <span>Capital: {tournament.fee}</span>
                        </div>
                        <div className='stat'>
                          <Users size={14} />
                          <span>Required: {tournament.participants}</span>
                        </div>
                        <div className='stat'>
                          <Clock size={14} />
                          <span>Seats Left: {tournament.timeLeft}</span>
                        </div>
                      </div>
                      <div className='card-actions'>
                        <button className='edit-btn' onClick={() => startEdit(tournament)}>
                          <Edit3 size={16} />
                          Edit
                        </button>
                        <button className='manage-btn' onClick={() => startManage(tournament)}>
                          <Settings size={16} />
                          Manage
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {tournaments.length === 0 && (
                  <div className='empty-state'>
                    <Sparkles size={48} />
                    <h3>No Competitions Yet</h3>
                    <p>Create your first competition to get started</p>
                    <button className='create-btn' onClick={startCreate}>
                      <Plus size={20} />
                      Create Competition
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {(viewMode === "create" || viewMode === "edit") && (
            <motion.div
              key='form'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className='content-section'
            >
              <div className='section-header'>
                <div>
                  <h1>{viewMode === "create" ? "Create Competition" : "Edit Competition"}</h1>
                  <p>{viewMode === "create" ? "Set up a new trading competition" : `Editing: ${editingTournament?.title}`}</p>
                </div>
                <button className='cancel-btn' onClick={cancelAction}>
                  <X size={20} />
                  <span>Cancel</span>
                </button>
              </div>

              <div className='form-container'>
                <div className='form-grid'>
                  {/* Basic Info */}
                  <div className='form-section'>
                    <h3>
                      <Trophy size={18} /> Basic Information
                    </h3>

                    <div className='form-group'>
                      <label>Competition Title *</label>
                      <input
                        type='text'
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder='e.g., January Clash'
                      />
                    </div>

                    <div className='form-row'>
                      <div className='form-group'>
                        <label>Tier</label>
                        <select value={formData.tier} onChange={(e) => setFormData({ ...formData, tier: e.target.value })}>
                          <option value='Weekly'>Weekly</option>
                          <option value='Bi-Weekly'>Bi-Weekly</option>
                          <option value='Monthly'>Monthly</option>
                        </select>
                      </div>
                      <div className='form-group'>
                        <label>Required Participants</label>
                        <input
                          type='number'
                          value={formData.participants}
                          onChange={(e) => setFormData({ ...formData, participants: parseInt(e.target.value) || 0 })}
                          min='0'
                          placeholder='e.g., 100'
                        />
                      </div>
                    </div>
                  </div>

                  {/* Prize & Fee */}
                  <div className='form-section'>
                    <h3>
                      <DollarSign size={18} /> Prize Pool & Capital
                    </h3>

                    <div className='form-row'>
                      <div className='form-group'>
                        <label>Prize Pool</label>
                        <input
                          type='text'
                          value={formData.prize}
                          onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                          placeholder='e.g., $50,000'
                        />
                      </div>
                      <div className='form-group'>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          Minimum Capital Required
                          <div
                            ref={infoIconRef}
                            style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
                            onMouseEnter={() => setShowCapitalTooltip(true)}
                            onMouseLeave={() => setShowCapitalTooltip(false)}
                          >
                            <Info size={14} color='var(--text-muted)' style={{ cursor: "help" }} />
                            {showCapitalTooltip && (
                              <>
                                <div
                                  style={{
                                    position: "fixed",
                                    top: `${tooltipPosition.top}px`,
                                    left: `${tooltipPosition.left}px`,
                                    transform: "translate(-50%, -100%)",
                                    marginBottom: "8px",
                                    padding: "12px 16px",
                                    background: "rgba(18, 18, 22, 0.98)",
                                    backdropFilter: "blur(10px)",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    borderRadius: "8px",
                                    fontSize: "0.75rem",
                                    color: "#fff",
                                    maxWidth: "320px",
                                    minWidth: "280px",
                                    zIndex: 10000,
                                    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                                    whiteSpace: "normal",
                                    lineHeight: "1.5",
                                    pointerEvents: "none",
                                  }}
                                >
                                  Participants are free to trade with any higher amount they are comfortable with. The stated amount represents the minimum personal trading capital required. Your capital stays in your account at all times, and all the profits made will be yours.
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: "100%",
                                      left: "50%",
                                      transform: "translateX(-50%)",
                                      width: 0,
                                      height: 0,
                                      borderLeft: "6px solid transparent",
                                      borderRight: "6px solid transparent",
                                      borderTop: "6px solid rgba(18, 18, 22, 0.98)",
                                    }}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </label>
                        <input
                          type='text'
                          value={formData.fee}
                          onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                          placeholder='e.g., $500'
                        />
                      </div>
                    </div>
                  </div>

                  {/* Seats Left */}
                  <div className='form-section'>
                    <h3>
                      <Clock size={18} /> Seats Left
                    </h3>

                    <div className='form-row'>
                      <div className='form-group'>
                        <label>Seats Left</label>
                        <input
                          type='text'
                          value={formData.timeLeft}
                          onChange={(e) => setFormData({ ...formData, timeLeft: e.target.value })}
                          placeholder='e.g., 25'
                        />
                      </div>
                      <div className='form-group'>
                        <label>Time Label (Legacy - Optional)</label>
                        <select value={formData.timeLabel} onChange={(e) => setFormData({ ...formData, timeLabel: e.target.value })}>
                          <option value='Seats Left'>Seats Left</option>
                          <option value='Starts in'>Starts in</option>
                          <option value='Ends in'>Ends in</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Registration */}
                  <div className='form-section full-width'>
                    <h3>
                      <LinkIcon size={18} /> Registration
                    </h3>

                    <div className='form-group'>
                      <label>Registration Link *</label>
                      <input
                        type='url'
                        value={formData.registrationLink}
                        onChange={(e) => setFormData({ ...formData, registrationLink: e.target.value })}
                        placeholder='https://example.com/register'
                      />
                    </div>
                  </div>

                  {/* Images */}
                  <div className='form-section full-width'>
                    <h3>
                      <ImageIcon size={18} /> Images
                    </h3>

                    <div className='image-uploads'>
                      <ImageUpload
                        label='Cover Image *'
                        value={formData.cover}
                        onChange={(url) => setFormData({ ...formData, cover: url })}
                      />
                      <ImageUpload
                        label='Additional Image (Optional)'
                        value={formData.image || ""}
                        onChange={(url) => setFormData({ ...formData, image: url })}
                      />
                    </div>
                  </div>
                </div>

                {/* Save Message */}
                <AnimatePresence>
                  {saveMessage.text && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`save-message ${saveMessage.type}`}
                    >
                      {saveMessage.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                      {saveMessage.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className='form-actions'>
                  <button className='cancel-btn' onClick={cancelAction}>
                    Cancel
                  </button>
                  <button className='save-btn' onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <span className='loading-spinner' />
                    ) : (
                      <>
                        <Save size={18} />
                        {viewMode === "create" ? "Create Competition" : "Save Changes"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {viewMode === "password" && (
            <motion.div
              key='password'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className='content-section'
            >
              <div className='section-header'>
                <div>
                  <h1>Change Password</h1>
                  <p>Update your admin password</p>
                </div>
              </div>

              <div className='password-form-container'>
                <form onSubmit={handlePasswordChange} className='password-form'>
                  <div className='form-group'>
                    <label>Current Password</label>
                    <div className='password-input'>
                      <input
                        type='password'
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className='form-group'>
                    <label>New Password</label>
                    <div className='password-input'>
                      <input
                        type='password'
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className='form-group'>
                    <label>Confirm New Password</label>
                    <div className='password-input'>
                      <input
                        type='password'
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {passwordError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className='error-message'
                      >
                        <AlertCircle size={16} />
                        {passwordError}
                      </motion.div>
                    )}
                    {passwordSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className='success-message'
                      >
                        <CheckCircle size={16} />
                        {passwordSuccess}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className='form-actions'>
                    <button type='button' className='cancel-btn' onClick={cancelAction}>
                      Cancel
                    </button>
                    <button type='submit' className='save-btn' disabled={isChangingPassword}>
                      {isChangingPassword ? (
                        <span className='loading-spinner' />
                      ) : (
                        <>
                          <Key size={18} />
                          Change Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {viewMode === "participants" && (
            <motion.div
              key='participants'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className='content-section'
            >
              <ParticipantManagement tournaments={tournaments} />
            </motion.div>
          )}

          {viewMode === "manage" && managingTournament && (
            <motion.div
              key='manage'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className='content-section'
            >
              <CompetitionManagement
                tournament={managingTournament}
                onBack={cancelAction}
                onEdit={() => startEdit(managingTournament)}
                onDelete={() => handleDelete(managingTournament.id)}
                onStatusChange={cancelAction}
              />
            </motion.div>
          )}

          {viewMode === "settings" && (
            <motion.div
              key='settings'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className='content-section'
            >
              <div className='section-header'>
                <div>
                  <h1>Settings</h1>
                  <p>Manage platform settings</p>
                </div>
              </div>

              <div className='settings-container'>
                <div className='settings-section'>
                  <div className='settings-section-header'>
                    <Gift size={20} />
                    <h3>Affiliate Code</h3>
                  </div>
                  <p className='settings-description'>
                    This code will be displayed on the competitions page for new users to use when signing up.
                  </p>

                  <div className='form-group'>
                    <label>Affiliate Code</label>
                    <input
                      type='text'
                      value={affiliateCode}
                      onChange={(e) => setAffiliateCode(e.target.value.toUpperCase())}
                      placeholder='e.g., AFFASAD'
                      style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>

                  <AnimatePresence>
                    {settingsMessage.text && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={settingsMessage.type === 'success' ? 'success-message' : 'error-message'}
                      >
                        {settingsMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {settingsMessage.text}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className='form-actions'>
                    <button type='button' className='save-btn' onClick={handleSaveSettings} disabled={isSavingSettings}>
                      {isSavingSettings ? (
                        <span className='loading-spinner' />
                      ) : (
                        <>
                          <Save size={18} />
                          Save Settings
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* SMTP Configuration Section */}
                <div className='settings-section'>
                  <div className='settings-section-header'>
                    <Mail size={20} />
                    <h3>Email (SMTP) Configuration</h3>
                  </div>
                  <p className='settings-description'>
                    Configure SMTP settings for sending emails. Changes take effect immediately.
                  </p>

                  <div className='form-group'>
                    <label>SMTP Host</label>
                    <input
                      type='text'
                      value={smtpSettings.host}
                      onChange={(e) => setSmtpSettings({...smtpSettings, host: e.target.value})}
                      placeholder='smtp.gmail.com'
                    />
                  </div>

                  <div className='smtp-input-row'>
                    <div className='form-group'>
                      <label>SMTP Port</label>
                      <input
                        type='number'
                        value={smtpSettings.port}
                        onChange={(e) => setSmtpSettings({...smtpSettings, port: e.target.value})}
                        placeholder='587'
                      />
                    </div>

                    <div className='form-group smtp-checkbox-group'>
                      <label>
                        <input
                          type='checkbox'
                          checked={smtpSettings.secure}
                          onChange={(e) => setSmtpSettings({...smtpSettings, secure: e.target.checked})}
                        />
                        <span>Use TLS/SSL</span>
                      </label>
                    </div>
                  </div>

                  <div className='form-group'>
                    <label>SMTP Username</label>
                    <input
                      type='text'
                      value={smtpSettings.user}
                      onChange={(e) => setSmtpSettings({...smtpSettings, user: e.target.value})}
                      placeholder='your-email@gmail.com'
                    />
                  </div>

                  <div className='form-group'>
                    <label>SMTP Password</label>
                    <div className='password-input-wrapper'>
                      <input
                        type={showSmtpPassword ? "text" : "password"}
                        value={smtpSettings.pass}
                        onChange={(e) => setSmtpSettings({...smtpSettings, pass: e.target.value})}
                        placeholder='Enter SMTP password'
                      />
                      <button
                        type='button'
                        className='toggle-password'
                        onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      >
                        {showSmtpPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className='form-group'>
                    <label>From Email Address</label>
                    <input
                      type='email'
                      value={smtpSettings.from}
                      onChange={(e) => setSmtpSettings({...smtpSettings, from: e.target.value})}
                      placeholder='noreply@livetradingleague.com'
                    />
                  </div>

                  {/* Test Email Section */}
                  <div className='test-email-section'>
                    <h4>Test Email Configuration</h4>
                    <div className='form-group'>
                      <label>Send Test Email To</label>
                      <input
                        type='email'
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder='your-email@example.com'
                      />
                    </div>
                    <button
                      type='button'
                      onClick={handleTestEmail}
                      disabled={isTestingEmail || !testEmail}
                      className='test-button'
                    >
                      {isTestingEmail ? (
                        <>
                          <Loader className='spinner' size={16} />
                          Sending Test Email...
                        </>
                      ) : (
                        <>
                          <Mail size={16} />
                          Send Test Email
                        </>
                      )}
                    </button>
                  </div>

                  {/* Success/Error Messages */}
                  <AnimatePresence>
                    {smtpMessage.text && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={smtpMessage.type === 'success' ? 'success-message' : 'error-message'}
                      >
                        {smtpMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {smtpMessage.text}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Buttons */}
                  <div className='form-actions'>
                    <button
                      type='button'
                      onClick={() => {
                        // Reset to original values (refetch)
                        window.location.reload();
                      }}
                      className='cancel-btn'
                    >
                      Cancel
                    </button>
                    <button
                      type='button'
                      onClick={handleSaveSMTPSettings}
                      disabled={isSavingSMTP}
                      className='save-btn'
                    >
                      {isSavingSMTP ? (
                        <span className='loading-spinner' />
                      ) : (
                        <>
                          <Save size={18} />
                          Save SMTP Settings
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{dashboardStyles}</style>
    </div>
  );
};

const loginStyles = `
  .admin-login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%);
    padding: 20px;
    position: relative;
    overflow: hidden;
  }

  .admin-login-page::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at 30% 30%, rgba(102, 126, 234, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 70% 70%, rgba(240, 147, 43, 0.06) 0%, transparent 50%);
    animation: rotate 30s linear infinite;
  }

  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .login-container {
    background: rgba(20, 20, 30, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    padding: 48px;
    width: 100%;
    max-width: 420px;
    position: relative;
    z-index: 1;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .login-header {
    text-align: center;
    margin-bottom: 36px;
  }

  .login-icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    color: white;
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  }

  .login-header h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #fff;
    margin-bottom: 8px;
    font-family: 'Space Grotesk', sans-serif;
  }

  .login-header p {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.95rem;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .input-group {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-icon {
    position: absolute;
    left: 16px;
    color: rgba(255, 255, 255, 0.4);
    pointer-events: none;
  }

  .input-group input {
    width: 100%;
    padding: 16px 48px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #fff;
    font-size: 1rem;
    transition: all 0.3s ease;
  }

  .input-group input:focus {
    outline: none;
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.1);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
  }

  .input-group input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  .password-toggle {
    position: absolute;
    right: 16px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    padding: 4px;
    display: flex;
    transition: color 0.2s;
  }

  .password-toggle:hover {
    color: rgba(255, 255, 255, 0.7);
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 10px;
    color: #f87171;
    font-size: 0.9rem;
  }

  .login-btn {
    padding: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 8px;
  }

  .login-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
  }

  .login-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 24px;
    padding: 12px 20px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
    justify-content: center;
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.2);
    color: white;
  }
`;

const dashboardStyles = `
  .admin-dashboard {
    display: flex;
    min-height: 100vh;
    background: #0a0a0f;
  }

  .sidebar {
    width: 260px;
    background: rgba(20, 20, 30, 0.95);
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    position: fixed;
    height: 100vh;
    z-index: 100;
  }

  .sidebar-header {
    padding: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #fff;
    font-weight: 700;
    font-size: 1.1rem;
  }

  .logo svg {
    color: #667eea;
  }

  .sidebar-nav {
    flex: 1;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: transparent;
    border: none;
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
    text-align: left;
  }

  .nav-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
  }

  .nav-item.active {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
    color: #667eea;
  }

  .nav-item {
    position: relative;
  }

  .notification-badge {
    position: absolute;
    top: 10px;
    right: 12px;
    background: #ef4444;
    color: white;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
    }
    50% {
      box-shadow: 0 2px 12px rgba(239, 68, 68, 0.8);
    }
  }

  .sidebar-footer {
    padding: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .home-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: rgba(102, 126, 234, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.2);
    border-radius: 12px;
    color: #667eea;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
  }

  .home-btn:hover {
    background: rgba(102, 126, 234, 0.2);
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 12px;
    color: #f87171;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
  }

  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.2);
  }

  .main-content {
    flex: 1;
    margin-left: 260px;
    padding: 32px;
    min-height: 100vh;
  }

  .content-section {
    max-width: 1200px;
    margin: 0 auto;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .section-header h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #fff;
    margin-bottom: 4px;
  }

  .section-header p {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.95rem;
  }

  .create-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .create-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  }

  .cancel-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .cancel-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .tournaments-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
  }

  .tournament-card {
    background: rgba(20, 20, 30, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .tournament-card:hover {
    transform: translateY(-4px);
    border-color: rgba(102, 126, 234, 0.3);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }

  .card-cover {
    height: 160px;
    background-size: cover;
    background-position: center;
    position: relative;
  }

  .pending-indicator {
    position: absolute;
    top: 12px;
    left: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    background: rgba(239, 68, 68, 0.95);
    color: white;
    border-radius: 50px;
    font-size: 0.75rem;
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
    animation: pulse 2s ease-in-out infinite;
    cursor: help;
  }

  .status-indicator {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: capitalize;
    white-space: nowrap;
  }

  .status-indicator.active {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .status-indicator.draft {
    background: rgba(251, 191, 36, 0.15);
    color: #fbbf24;
    border: 1px solid rgba(251, 191, 36, 0.3);
  }

  .status-indicator.completed,
  .status-indicator.archived {
    background: rgba(148, 163, 184, 0.15);
    color: #94a3b8;
    border: 1px solid rgba(148, 163, 184, 0.3);
  }

  .tier-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 6px 12px;
    border-radius: 50px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .tier-badge.weekly {
    background: rgba(102, 126, 234, 0.9);
    color: white;
  }

  .tier-badge.bi-weekly {
    background: rgba(139, 92, 246, 0.9);
    color: white;
  }

  .tier-badge.monthly {
    background: rgba(240, 147, 43, 0.9);
    color: white;
  }

  .card-content {
    padding: 20px;
    position: relative;
    z-index: 2;
  }

  .card-content h3 {
    font-size: 1.15rem;
    font-weight: 700;
    color: #fff;
    margin-bottom: 12px;
  }

  .card-stats {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 6px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.85rem;
  }

  .stat svg {
    color: #667eea;
  }

  .card-actions {
    display: flex;
    gap: 10px;
    position: relative;
    z-index: 3;
  }

  .edit-btn, .delete-btn, .manage-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .edit-btn {
    background: rgba(102, 126, 234, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.3);
    color: #667eea;
  }

  .edit-btn:hover {
    background: rgba(102, 126, 234, 0.2);
  }

  .manage-btn {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #22c55e;
  }

  .manage-btn:hover {
    background: rgba(34, 197, 94, 0.2);
  }

  .delete-btn {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
  }

  .delete-btn:hover {
    background: rgba(239, 68, 68, 0.2);
  }

  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 80px 40px;
    background: rgba(20, 20, 30, 0.5);
    border: 2px dashed rgba(255, 255, 255, 0.1);
    border-radius: 20px;
  }

  .empty-state svg {
    color: rgba(102, 126, 234, 0.5);
    margin-bottom: 20px;
  }

  .empty-state h3 {
    font-size: 1.25rem;
    color: #fff;
    margin-bottom: 8px;
  }

  .empty-state p {
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 24px;
  }

  /* Form Styles */
  .form-container {
    background: rgba(20, 20, 30, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 32px;
    position: relative;
    overflow: visible;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    position: relative;
    overflow: visible;
  }

  .form-section {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 24px;
    position: relative;
    overflow: visible;
  }

  .form-section.full-width {
    grid-column: 1 / -1;
  }

  .form-section h3 {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1rem;
    font-weight: 600;
    color: #667eea;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group:last-child {
    margin-bottom: 0;
  }

  .form-group label {
    display: block;
    font-size: 0.85rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 8px;
  }

  .form-group input,
  .form-group select {
    width: 100%;
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: #fff;
    font-size: 0.95rem;
    transition: all 0.2s ease;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
  }

  .form-group input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  .form-group select {
    cursor: pointer;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .image-uploads {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }

  .save-message {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    border-radius: 12px;
    margin: 24px 0;
    font-size: 0.95rem;
  }

  .save-message.success {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #22c55e;
  }

  .save-message.error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .save-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .save-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  }

  .save-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  /* Password Form */
  .password-form-container {
    max-width: 480px;
  }

  .password-form {
    background: rgba(20, 20, 30, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 32px;
  }

  .password-input {
    position: relative;
  }

  .settings-container {
    max-width: 600px;
  }

  .settings-section {
    background: rgba(20, 20, 30, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 32px;
  }

  .settings-section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
    color: var(--primary);
  }

  .settings-section-header h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #fff;
    margin: 0;
  }

  .settings-description {
    color: var(--text-dim);
    font-size: 0.9rem;
    margin-bottom: 24px;
    line-height: 1.5;
  }

  .password-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .password-input-wrapper input {
    flex: 1;
    padding-right: 45px;
  }

  .toggle-password {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    padding: 5px;
    display: flex;
    align-items: center;
    transition: color 0.2s ease;
  }

  .toggle-password:hover {
    color: rgba(255, 255, 255, 0.9);
  }

  .smtp-input-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    align-items: end;
  }

  .smtp-checkbox-group {
    display: flex;
    align-items: center;
    margin-bottom: 0;
  }

  .smtp-checkbox-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    margin-bottom: 0;
  }

  .smtp-checkbox-group input[type="checkbox"] {
    width: auto;
    margin: 0;
    cursor: pointer;
  }

  .smtp-checkbox-group span {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
  }

  .test-email-section {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .test-email-section h4 {
    margin-bottom: 1rem;
    color: rgba(255, 255, 255, 0.9);
    font-size: 1rem;
    font-weight: 600;
  }

  .test-button {
    margin-top: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .test-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .test-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .test-button .spinner {
    animation: spin 0.8s linear infinite;
  }

  .settings-section + .settings-section {
    margin-top: 2rem;
  }

  .success-message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-radius: 10px;
    color: #22c55e;
    font-size: 0.9rem;
    margin-bottom: 16px;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
    
    .image-uploads {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .sidebar {
      transform: translateX(-100%);
    }

    .main-content {
      margin-left: 0;
      padding: 20px;
    }

    .section-header {
      flex-direction: column;
      align-items: stretch;
    }

    .tournaments-grid {
      grid-template-columns: 1fr;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .form-container {
      padding: 20px;
    }
  }
`;

export default AdminDashboard;
