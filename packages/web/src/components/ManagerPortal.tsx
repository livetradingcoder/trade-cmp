import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, X, Lock, User, Edit3, Trash2, ExternalLink, Save, XCircle, LogOut, Trophy, Plus, Info } from "lucide-react";
import { useTournaments, type Tournament } from "../context/TournamentContext";

interface ManagerPortalProps {
  onClose: () => void;
}

interface FieldWithTooltipProps {
  label: string;
  tooltip: string;
  children: React.ReactNode;
}

const FieldWithTooltip = ({ label, tooltip, children }: FieldWithTooltipProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
        <label style={{ fontSize: "0.85rem", color: "var(--text-dim)", fontWeight: 500 }}>{label}</label>
        <div
          style={{ position: "relative", display: "inline-flex" }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info size={14} color='var(--text-muted)' style={{ cursor: "help" }} />
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              style={{
                position: "absolute",
                bottom: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                marginBottom: "8px",
                background: "rgba(0, 0, 0, 0.95)",
                color: "#fff",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "0.75rem",
                zIndex: 1000,
                pointerEvents: "none",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
                maxWidth: "250px",
                whiteSpace: "normal",
                textAlign: "left",
              }}
            >
              {tooltip}
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
                  borderTop: "6px solid rgba(0, 0, 0, 0.95)",
                }}
              />
            </motion.div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};

const ManagerPortal = ({ onClose }: ManagerPortalProps) => {
  const { tournaments, isAdmin, login, logout, updateTournament, createTournament, deleteTournament } = useTournaments();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editData, setEditData] = useState<Partial<Tournament>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [newTournament, setNewTournament] = useState<Omit<Tournament, "id">>({
    title: "",
    tier: "Weekly",
    prize: "",
    fee: "",
    participants: 0,
    timeLabel: "Starts in",
    timeLeft: "",
    cover:
      "https://firebasestorage.googleapis.com/v0/b/fortraders-production.firebasestorage.app/o/public%2Ftournament_cover%2Fe2207b07-3cdb-4e1b-96d8-1763c85679ae.jpg?alt=media",
    image: "",
    registrationLink: "",
  });

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
  };

  const startEditing = (tournament: Tournament) => {
    setEditingId(tournament.id);
    // Copy ALL fields from the tournament to ensure nothing is lost
    setEditData({
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
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEditing = async () => {
    if (editingId) {
      // Filter out undefined values but keep empty strings and zeros
      const updateData = Object.entries(editData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      const success = await updateTournament(editingId, updateData);
      if (success) {
        setEditingId(null);
        setEditData({});
      }
    }
  };

  const handleDelete = async (id: string | number) => {
    if (confirm("Are you sure you want to delete this competition?")) {
      await deleteTournament(id);
    }
  };

  const handleCreate = async () => {
    if (newTournament.title && newTournament.registrationLink) {
      const success = await createTournament(newTournament);
      if (success) {
        setIsCreating(false);
        setNewTournament({
          title: "",
          tier: "Weekly",
          prize: "",
          fee: "",
          participants: 0,
          timeLabel: "Starts in",
          timeLeft: "",
          cover:
            "https://firebasestorage.googleapis.com/v0/b/fortraders-production.firebasestorage.app/o/public%2Ftournament_cover%2Fe2207b07-3cdb-4e1b-96d8-1763c85679ae.jpg?alt=media",
          image: "",
          registrationLink: "",
        });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='portal-overlay'
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(2, 2, 3, 0.95)",
        backdropFilter: "blur(30px)",
        zIndex: 2000,
        display: "grid",
        placeItems: "center",
        overflowY: "auto",
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 40 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className='glass-panel portal-panel'
        style={{
          width: "100%",
          maxWidth: isAdmin ? "900px" : "480px",
          background: "var(--panel-bg)",
          border: "1px solid var(--glass-border)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
          margin: "auto",
        }}
      >
        {/* Header */}
        <div
          className='portal-header'
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--panel-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                padding: "12px",
                background: "rgba(0, 102, 255, 0.1)",
                borderRadius: "14px",
                border: "1px solid rgba(0, 102, 255, 0.2)",
              }}
            >
              <ShieldCheck size={28} color='var(--primary)' />
            </div>
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "4px" }}>{isAdmin ? "Admin Portal" : "Admin Login"}</h2>
              {isAdmin && <p style={{ color: "var(--success)", fontSize: "0.85rem", fontWeight: 600 }}>● Authenticated</p>}
            </div>
          </div>
          <div className='header-buttons' style={{ display: "flex", gap: "12px" }}>
            {isAdmin && (
              <button
                onClick={handleLogout}
                style={{
                  background: "rgba(255, 100, 100, 0.1)",
                  border: "1px solid rgba(255, 100, 100, 0.3)",
                  color: "#ff6464",
                  cursor: "pointer",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                <LogOut size={16} /> Logout
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--panel-border)",
                color: "#fff",
                cursor: "pointer",
                padding: "10px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='portal-content'>
          <AnimatePresence mode='wait'>
            {!isAdmin ? (
              /* Login Form */
              <motion.form
                key='login'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleLogin}
                style={{ display: "flex", flexDirection: "column", gap: "20px" }}
              >
                <p style={{ color: "var(--text-dim)", textAlign: "center", marginBottom: "8px" }}>
                  Enter your admin credentials to manage competitions
                </p>

                <div style={{ position: "relative" }}>
                  <User
                    size={18}
                    color='var(--text-muted)'
                    style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }}
                  />
                  <input
                    type='text'
                    placeholder='Username'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "16px 16px 16px 48px",
                      background: "var(--surface)",
                      border: "1px solid var(--panel-border)",
                      borderRadius: "12px",
                      color: "var(--text-main)",
                      fontSize: "1rem",
                      outline: "none",
                    }}
                  />
                </div>

                <div style={{ position: "relative" }}>
                  <Lock
                    size={18}
                    color='var(--text-muted)'
                    style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }}
                  />
                  <input
                    type='password'
                    placeholder='Password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "16px 16px 16px 48px",
                      background: "var(--surface)",
                      border: "1px solid var(--panel-border)",
                      borderRadius: "12px",
                      color: "var(--text-main)",
                      fontSize: "1rem",
                      outline: "none",
                    }}
                  />
                </div>

                {loginError && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      color: "#ff6464",
                      fontSize: "0.9rem",
                      textAlign: "center",
                      padding: "12px",
                      background: "rgba(255, 100, 100, 0.1)",
                      borderRadius: "8px",
                    }}
                  >
                    {loginError}
                  </motion.p>
                )}

                <button
                  type='submit'
                  disabled={isLoggingIn}
                  className='btn-primary'
                  style={{
                    width: "100%",
                    padding: "16px",
                    fontSize: "1rem",
                    marginTop: "8px",
                  }}
                >
                  {isLoggingIn ? "Logging in..." : "Login"}
                </button>
              </motion.form>
            ) : (
              /* Admin Dashboard */
              <motion.div key='dashboard' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className='dashboard-header' style={{ marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "10px" }}>
                    <Trophy size={22} color='var(--primary)' />
                    Manage Competitions
                  </h3>
                  <button onClick={() => setIsCreating(true)} className='btn-primary' style={{ padding: "10px 20px", fontSize: "0.85rem" }}>
                    <Plus size={18} /> Add Competition
                  </button>
                </div>

                {/* Create Competition Form */}
                <AnimatePresence>
                  {isCreating && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        background: "var(--surface)",
                        padding: "24px",
                        borderRadius: "16px",
                        marginBottom: "20px",
                        border: "1px solid var(--primary)",
                        overflow: "hidden",
                      }}
                    >
                      <h4 style={{ marginBottom: "16px", color: "var(--primary)" }}>New Competition</h4>
                      <div className='portal-grid'>
                        <FieldWithTooltip
                          label='Title'
                          tooltip='The name of the competition that will be displayed to users (e.g., "January Clash", "Wednesday Clash")'
                        >
                          <input
                            type='text'
                            placeholder='Title'
                            value={newTournament.title}
                            onChange={(e) => setNewTournament({ ...newTournament, title: e.target.value })}
                            style={inputStyle}
                          />
                        </FieldWithTooltip>
                        <FieldWithTooltip
                          label='Tier'
                          tooltip='The competition frequency type. Weekly competitions run every week, Monthly competitions run once per month.'
                        >
                          <select
                            value={newTournament.tier}
                            onChange={(e) => setNewTournament({ ...newTournament, tier: e.target.value })}
                            style={inputStyle}
                          >
                            <option value='Weekly'>Weekly</option>
                            <option value='Monthly'>Monthly</option>
                          </select>
                        </FieldWithTooltip>
                        <FieldWithTooltip
                          label='Prize'
                          tooltip='The prize or challenge description shown to participants (e.g., "50K Challenge", "$5,000 Prize Pool")'
                        >
                          <input
                            type='text'
                            placeholder='Prize (e.g., 50K Challenge)'
                            value={newTournament.prize}
                            onChange={(e) => setNewTournament({ ...newTournament, prize: e.target.value })}
                            style={inputStyle}
                          />
                        </FieldWithTooltip>
                        <FieldWithTooltip
                          label='Entry Fee'
                          tooltip='The entry fee or cost to join the competition (e.g., "$10", "Free", "$25")'
                        >
                          <input
                            type='text'
                            placeholder='Entry Fee (e.g., $10)'
                            value={newTournament.fee}
                            onChange={(e) => setNewTournament({ ...newTournament, fee: e.target.value })}
                            style={inputStyle}
                          />
                        </FieldWithTooltip>
                        <FieldWithTooltip
                          label='Registration Link'
                          tooltip='The full URL where users can register for this competition. This link will be displayed and used for registration.'
                        >
                          <input
                            type='text'
                            placeholder='Registration Link'
                            value={newTournament.registrationLink}
                            onChange={(e) => setNewTournament({ ...newTournament, registrationLink: e.target.value })}
                            style={{ ...inputStyle, gridColumn: "1 / -1" }}
                          />
                        </FieldWithTooltip>
                        <FieldWithTooltip
                          label='Time Label'
                          tooltip='The label showing the time status (e.g., "Starts in" for upcoming, "Ends in" for active)'
                        >
                          <select
                            value={newTournament.timeLabel}
                            onChange={(e) => setNewTournament({ ...newTournament, timeLabel: e.target.value })}
                            style={inputStyle}
                          >
                            <option value='Starts in'>Starts in</option>
                            <option value='Ends in'>Ends in</option>
                          </select>
                        </FieldWithTooltip>
                        <FieldWithTooltip
                          label='Time Left'
                          tooltip='The remaining time in format: "7d 12:30:45" (days hours:minutes:seconds)'
                        >
                          <input
                            type='text'
                            placeholder='e.g., 7d 12:30:45'
                            value={newTournament.timeLeft}
                            onChange={(e) => setNewTournament({ ...newTournament, timeLeft: e.target.value })}
                            style={inputStyle}
                          />
                        </FieldWithTooltip>
                        <FieldWithTooltip label='Participants' tooltip='The total number of participants'>
                          <input
                            type='number'
                            placeholder='Participants'
                            value={newTournament.participants}
                            onChange={(e) => setNewTournament({ ...newTournament, participants: parseInt(e.target.value) || 0 })}
                            style={inputStyle}
                            min='0'
                          />
                        </FieldWithTooltip>
                        <FieldWithTooltip label='Cover Image URL' tooltip='The main cover/banner image URL for the tournament card'>
                          <input
                            type='text'
                            placeholder='Cover Image URL'
                            value={newTournament.cover}
                            onChange={(e) => setNewTournament({ ...newTournament, cover: e.target.value })}
                            style={{ ...inputStyle, gridColumn: "1 / -1" }}
                          />
                        </FieldWithTooltip>
                        <FieldWithTooltip
                          label='Additional Image URL (optional)'
                          tooltip='An optional additional image. Leave empty to use only the cover image.'
                        >
                          <input
                            type='text'
                            placeholder='Additional Image URL (optional)'
                            value={newTournament.image || ""}
                            onChange={(e) => setNewTournament({ ...newTournament, image: e.target.value })}
                            style={{ ...inputStyle, gridColumn: "1 / -1" }}
                          />
                        </FieldWithTooltip>
                      </div>
                      <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                        <button onClick={handleCreate} className='btn-primary' style={{ padding: "10px 20px", fontSize: "0.85rem" }}>
                          <Save size={16} /> Create
                        </button>
                        <button
                          onClick={() => setIsCreating(false)}
                          style={{
                            padding: "10px 20px",
                            background: "transparent",
                            border: "1px solid var(--panel-border)",
                            borderRadius: "10px",
                            color: "var(--text-dim)",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Competition List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {tournaments.map((tournament) => (
                    <motion.div
                      key={tournament.id}
                      layout
                      style={{
                        background: "var(--surface)",
                        padding: "20px",
                        borderRadius: "14px",
                        border: editingId === tournament.id ? "1px solid var(--primary)" : "1px solid var(--panel-border)",
                      }}
                    >
                      {editingId === tournament.id ? (
                        /* Edit Mode */
                        <div>
                          <div className='portal-grid' style={{ marginBottom: "16px" }}>
                            <FieldWithTooltip
                              label='Title'
                              tooltip='The name of the competition that will be displayed to users (e.g., "January Clash", "Wednesday Clash")'
                            >
                              <input
                                type='text'
                                placeholder='Title'
                                value={editData.title || ""}
                                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                style={inputStyle}
                              />
                            </FieldWithTooltip>
                            <FieldWithTooltip
                              label='Tier'
                              tooltip='The competition frequency type. Weekly competitions run every week, Monthly competitions run once per month.'
                            >
                              <select
                                value={editData.tier || "Weekly"}
                                onChange={(e) => setEditData({ ...editData, tier: e.target.value })}
                                style={inputStyle}
                              >
                                <option value='Weekly'>Weekly</option>
                                <option value='Monthly'>Monthly</option>
                              </select>
                            </FieldWithTooltip>
                            <FieldWithTooltip
                              label='Prize'
                              tooltip='The prize or challenge description shown to participants (e.g., "50K Challenge", "$5,000 Prize Pool")'
                            >
                              <input
                                type='text'
                                placeholder='Prize'
                                value={editData.prize || ""}
                                onChange={(e) => setEditData({ ...editData, prize: e.target.value })}
                                style={inputStyle}
                              />
                            </FieldWithTooltip>
                            <FieldWithTooltip
                              label='Entry Fee'
                              tooltip='The entry fee or cost to join the competition (e.g., "$10", "Free", "$25")'
                            >
                              <input
                                type='text'
                                placeholder='Entry Fee (e.g., $10)'
                                value={editData.fee || ""}
                                onChange={(e) => setEditData({ ...editData, fee: e.target.value })}
                                style={inputStyle}
                              />
                            </FieldWithTooltip>
                            <FieldWithTooltip
                              label='Registration Link'
                              tooltip='The full URL where users can register for this competition. This link will be displayed and used for registration.'
                            >
                              <input
                                type='text'
                                placeholder='Registration Link'
                                value={editData.registrationLink || ""}
                                onChange={(e) => setEditData({ ...editData, registrationLink: e.target.value })}
                                style={{ ...inputStyle, gridColumn: "1 / -1" }}
                              />
                            </FieldWithTooltip>
                            <FieldWithTooltip label='Cover Image URL' tooltip='The main cover/banner image URL for the tournament card'>
                              <input
                                type='text'
                                placeholder='Cover Image URL'
                                value={editData.cover || ""}
                                onChange={(e) => setEditData({ ...editData, cover: e.target.value })}
                                style={{ ...inputStyle, gridColumn: "1 / -1" }}
                              />
                            </FieldWithTooltip>
                            <FieldWithTooltip
                              label='Additional Image URL (optional)'
                              tooltip='An optional additional image that can be displayed. Leave empty to use only the cover image.'
                            >
                              <input
                                type='text'
                                placeholder='Additional Image URL (optional)'
                                value={editData.image || ""}
                                onChange={(e) => setEditData({ ...editData, image: e.target.value })}
                                style={{ ...inputStyle, gridColumn: "1 / -1" }}
                              />
                            </FieldWithTooltip>
                            <FieldWithTooltip
                              label='Time Label'
                              tooltip='The label showing the time status of the competition (e.g., "Starts in" for upcoming, "Ends in" for active)'
                            >
                              <select
                                value={editData.timeLabel || "Starts in"}
                                onChange={(e) => setEditData({ ...editData, timeLabel: e.target.value })}
                                style={inputStyle}
                              >
                                <option value='Starts in'>Starts in</option>
                                <option value='Ends in'>Ends in</option>
                              </select>
                            </FieldWithTooltip>
                            <FieldWithTooltip
                              label='Time Left'
                              tooltip='The remaining time for the competition in format: "7d 12:30:45" (days hours:minutes:seconds)'
                            >
                              <input
                                type='text'
                                placeholder='e.g., 7d 12:30:45'
                                value={editData.timeLeft || ""}
                                onChange={(e) => setEditData({ ...editData, timeLeft: e.target.value })}
                                style={inputStyle}
                              />
                            </FieldWithTooltip>
                            <FieldWithTooltip label='Participants' tooltip='The current number of participants in this competition'>
                              <input
                                type='number'
                                placeholder='Participants'
                                value={editData.participants ?? 0}
                                onChange={(e) => setEditData({ ...editData, participants: parseInt(e.target.value) || 0 })}
                                style={inputStyle}
                                min='0'
                              />
                            </FieldWithTooltip>
                          </div>
                          <div style={{ display: "flex", gap: "10px" }}>
                            <button
                              onClick={saveEditing}
                              style={{
                                padding: "8px 16px",
                                background: "var(--primary)",
                                border: "none",
                                borderRadius: "8px",
                                color: "#fff",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                              }}
                            >
                              <Save size={14} /> Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              style={{
                                padding: "8px 16px",
                                background: "transparent",
                                border: "1px solid var(--panel-border)",
                                borderRadius: "8px",
                                color: "var(--text-dim)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "0.85rem",
                              }}
                            >
                              <XCircle size={14} /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <div className='tournament-item-view'>
                          <div className='tournament-info'>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
                              <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>{tournament.title}</span>
                              <span
                                style={{
                                  padding: "4px 10px",
                                  background: tournament.tier === "Weekly" ? "rgba(0, 102, 255, 0.15)" : "rgba(255, 204, 0, 0.15)",
                                  color: tournament.tier === "Weekly" ? "var(--primary)" : "var(--accent)",
                                  borderRadius: "50px",
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                }}
                              >
                                {tournament.tier}
                              </span>
                            </div>
                            <div className='tournament-meta' style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
                              <span>
                                Prize: <strong style={{ color: "var(--success)" }}>{tournament.prize}</strong>
                              </span>
                              <span>
                                Entry: <strong>{tournament.fee}</strong>
                              </span>
                              <span>
                                Participants: <strong>{tournament.participants ?? 0}</strong>
                              </span>
                            </div>
                            <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                              <ExternalLink size={12} color='var(--text-muted)' />
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", wordBreak: "break-all" }}>
                                {tournament.registrationLink.length > 50
                                  ? tournament.registrationLink.substring(0, 50) + "..."
                                  : tournament.registrationLink}
                              </span>
                            </div>
                          </div>
                          <div className='portal-actions'>
                            <button
                              onClick={() => startEditing(tournament)}
                              style={{
                                padding: "10px",
                                background: "rgba(0, 102, 255, 0.1)",
                                border: "1px solid rgba(0, 102, 255, 0.3)",
                                borderRadius: "10px",
                                color: "var(--primary)",
                                cursor: "pointer",
                              }}
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(tournament.id)}
                              style={{
                                padding: "10px",
                                background: "rgba(255, 100, 100, 0.1)",
                                border: "1px solid rgba(255, 100, 100, 0.3)",
                                borderRadius: "10px",
                                color: "#ff6464",
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {tournaments.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "var(--text-dim)",
                    }}
                  >
                    No competitions yet. Click "Add Competition" to create one.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <style>{`
        .btn-close-hover:hover {
          background: #25262b;
          border-color: #fff;
        }
        input:focus, select:focus {
          border-color: var(--primary) !important;
        }
        
        .portal-overlay {
          padding: 24px;
        }
        
        .portal-panel {
          border-radius: 20px;
        }
        
        .portal-header {
          padding: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .portal-content {
          padding: 32px;
        }
        
        .portal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .portal-grid > div {
          display: flex;
          flex-direction: column;
        }
        
        .portal-actions {
          display: flex;
          gap: 8px;
        }
        
        .tournament-item-view {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        
        .tournament-info {
          flex: 1;
          min-width: 0;
        }
        
        .tournament-meta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        @media (max-width: 768px) {
          .portal-overlay {
            padding: 16px;
          }
          
          .portal-panel {
            border-radius: 16px;
          }
          
          .portal-header {
            padding: 20px;
          }
          
          .portal-content {
            padding: 20px;
          }
          
          .portal-grid {
            grid-template-columns: 1fr;
          }
          
          .dashboard-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .dashboard-header h3 {
            font-size: 1.1rem;
          }
          
          .dashboard-header button {
            width: 100%;
            justify-content: center;
          }
          
          .tournament-item-view {
            flex-direction: column;
            align-items: stretch;
          }
          
          .portal-actions {
            width: 100%;
            justify-content: flex-end;
          }
          
          .tournament-meta {
            gap: 8px;
          }
        }
        
        @media (max-width: 480px) {
          .portal-overlay {
            padding: 8px;
          }
          
          .portal-header {
            padding: 16px;
          }
          
          .portal-content {
            padding: 16px;
          }
          
          .portal-header h2 {
            font-size: 1.2rem !important;
          }
          
          .header-buttons {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </motion.div>
  );
};

const inputStyle: React.CSSProperties = {
  padding: "12px 16px",
  background: "var(--bg-color)",
  border: "1px solid var(--panel-border)",
  borderRadius: "10px",
  color: "var(--text-main)",
  fontSize: "0.9rem",
  outline: "none",
  width: "100%",
};

export default ManagerPortal;
