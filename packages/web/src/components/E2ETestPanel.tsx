import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Link2, RefreshCw, Play, AlertTriangle, Trophy, History } from "lucide-react";
import "../styles/E2ETestPanel.css";

/**
 * E2E TEST ONLY panel.
 *
 * Assigns approved participants' trading accounts to a broker integration and
 * triggers a sync — the manual version of scripts/live-e2e.mjs, used to verify
 * the broker → snapshots → leaderboard pipeline while the FP Markets
 * integration is being live-tested. Not intended as a production ops surface.
 */

interface Tournament {
  id: string | number;
  title: string;
  status?: string;
}

interface ParticipantRow {
  id: string;
  status: string;
  user: { email: string; fp_account_number: string; display_name?: string } | null;
}

interface IntegrationRow {
  _id: string;
  type: string;
  name: string;
  enabled: boolean;
}

interface AccountRow {
  _id: string;
  broker_account_number: string;
  sync_state: string;
  status: string;
  user_id: { email?: string } | null;
  broker_integration_id: { type?: string } | null;
}

interface SyncSummary {
  status: string;
  accountsProcessed: number;
  snapshotsWritten: number;
  leaderboardEntriesWritten: number;
  errors: string[];
}

interface LeaderboardRow {
  rank: number;
  display_name: string;
  account_masked: string;
  roi: number;
  pnl: number;
  win_rate: number;
  trade_count: number;
  calculation_status: string;
}

interface SyncRunRow {
  _id: string;
  started_at: string;
  finished_at?: string;
  status: string;
  accounts_processed: number;
  snapshots_written: number;
  trades_written: number;
  leaderboard_entries_written: number;
  error_summary?: string;
}

const E2ETestPanel = ({ tournaments }: { tournaments: Tournament[] }) => {
  const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:3001");

  const [tournamentId, setTournamentId] = useState<string>("");
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [selectedIntegration, setSelectedIntegration] = useState("");
  const [accountOverride, setAccountOverride] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [syncResult, setSyncResult] = useState<SyncSummary | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [boardFetchedAt, setBoardFetchedAt] = useState<string | null>(null);
  const [syncRuns, setSyncRuns] = useState<SyncRunRow[]>([]);

  const authHeaders = useCallback(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
    }),
    []
  );

  useEffect(() => {
    if (tournaments.length > 0 && !tournamentId) {
      setTournamentId(String(tournaments[0].id));
    }
  }, [tournaments, tournamentId]);

  const loadIntegrations = useCallback(async () => {
    const res = await fetch(`${API_URL}/api/admin/broker-integrations`, { headers: authHeaders() });
    const data = await res.json();
    if (data.success) {
      setIntegrations(data.integrations);
      if (!selectedIntegration && data.integrations.length > 0) {
        setSelectedIntegration(data.integrations[0]._id);
      }
    }
  }, [API_URL, authHeaders, selectedIntegration]);

  const loadTournamentData = useCallback(async () => {
    if (!tournamentId) return;
    const [pRes, aRes, bRes, sRes] = await Promise.all([
      fetch(`${API_URL}/api/participants/${tournamentId}`, { headers: authHeaders() }),
      fetch(`${API_URL}/api/admin/trading-accounts/${tournamentId}`, { headers: authHeaders() }),
      fetch(`${API_URL}/api/leaderboard/${tournamentId}`, { headers: authHeaders() }),
      fetch(`${API_URL}/api/admin/sync-runs/${tournamentId}`, { headers: authHeaders() }),
    ]);
    const pData = await pRes.json();
    const aData = await aRes.json();
    const bData = await bRes.json();
    const sData = await sRes.json();
    if (pData.success) {
      const approved = (pData.participants as ParticipantRow[]).filter((p) => p.status === "approved");
      setParticipants(approved);
      if (approved.length > 0) setSelectedParticipant((prev) => prev || approved[0].id);
    }
    if (aData.success) setAccounts(aData.accounts);
    setLeaderboard(bData.leaderboard || []);
    setBoardFetchedAt(bData.fetched_at || null);
    if (sData.success) setSyncRuns(sData.runs);
  }, [API_URL, authHeaders, tournamentId]);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  useEffect(() => {
    setParticipants([]);
    setAccounts([]);
    setSelectedParticipant("");
    setSyncResult(null);
    setLeaderboard([]);
    setBoardFetchedAt(null);
    setSyncRuns([]);
    loadTournamentData();
  }, [tournamentId, loadTournamentData]);

  const ensureIntegration = async (type: "fixture" | "fpmarkets") => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/broker-integrations`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ type, name: `${type} (e2e)` }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setMessage({ kind: "ok", text: `${type} integration ready` });
      await loadIntegrations();
    } catch (error: any) {
      setMessage({ kind: "err", text: error.message || "Failed to ensure integration" });
    } finally {
      setBusy(false);
    }
  };

  const assignAccount = async () => {
    if (!selectedParticipant || !selectedIntegration) {
      setMessage({ kind: "err", text: "Pick an approved participant and an integration first" });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/trading-accounts`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          participant_id: selectedParticipant,
          broker_integration_id: selectedIntegration,
          ...(accountOverride ? { broker_account_number: accountOverride } : {}),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setMessage({ kind: "ok", text: `Trading account ${data.account.broker_account_number} assigned` });
      setAccountOverride("");
      await loadTournamentData();
    } catch (error: any) {
      setMessage({ kind: "err", text: error.message || "Failed to assign trading account" });
    } finally {
      setBusy(false);
    }
  };

  const runSync = async () => {
    setBusy(true);
    setMessage(null);
    setSyncResult(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/sync/${tournamentId}`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSyncResult(data);
      await loadTournamentData();
    } catch (error: any) {
      setMessage({ kind: "err", text: error.message || "Sync failed" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='e2e-panel'>
      <div className='e2e-warning'>
        <AlertTriangle size={18} />
        <div>
          <strong>E2E TEST ONLY</strong> — this panel exists to verify the broker → sync →
          leaderboard pipeline during FP Markets live testing. Assignments made here feed the
          real sync. Automated equivalent: <code>npm run test:live:full</code>
        </div>
      </div>

      <div className='e2e-grid'>
        <div className='e2e-card'>
          <h3>
            <Link2 size={16} /> 1 · Broker integration
          </h3>
          <div className='e2e-row'>
            <button className='e2e-btn' disabled={busy} onClick={() => ensureIntegration("fixture")}>
              Ensure fixture (fake data)
            </button>
            <button className='e2e-btn' disabled={busy} onClick={() => ensureIntegration("fpmarkets")}>
              Ensure fpmarkets (live)
            </button>
          </div>
          {integrations.length > 0 && (
            <select value={selectedIntegration} onChange={(e) => setSelectedIntegration(e.target.value)}>
              {integrations.map((integration) => (
                <option key={integration._id} value={integration._id}>
                  {integration.type} — {integration.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className='e2e-card'>
          <h3>
            <FlaskConical size={16} /> 2 · Assign trading account
          </h3>
          <select value={tournamentId} onChange={(e) => setTournamentId(e.target.value)}>
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={String(tournament.id)}>
                {tournament.title}
              </option>
            ))}
          </select>
          <select
            value={selectedParticipant}
            onChange={(e) => setSelectedParticipant(e.target.value)}
            disabled={participants.length === 0}
          >
            {participants.length === 0 ? (
              <option value=''>No approved participants in this competition</option>
            ) : (
              participants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.user?.email} ({participant.user?.fp_account_number})
                </option>
              ))
            )}
          </select>
          <input
            placeholder='Account number override (optional)'
            value={accountOverride}
            onChange={(e) => setAccountOverride(e.target.value)}
          />
          <button className='e2e-btn primary' disabled={busy || !selectedParticipant} onClick={assignAccount}>
            Assign to sync
          </button>
        </div>

        <div className='e2e-card'>
          <h3>
            <Play size={16} /> 3 · Run sync
          </h3>
          <p className='e2e-hint'>
            Pulls broker data for every assigned account and recomputes the leaderboard.
          </p>
          <button className='e2e-btn primary' disabled={busy || accounts.length === 0} onClick={runSync}>
            <RefreshCw size={14} className={busy ? "spin" : ""} /> Sync now
          </button>
          {syncResult && (
            <div className={`e2e-sync-result ${syncResult.status}`}>
              <div>
                status: <strong>{syncResult.status}</strong> · accounts {syncResult.accountsProcessed} ·
                snapshots {syncResult.snapshotsWritten} · leaderboard rows{" "}
                {syncResult.leaderboardEntriesWritten}
              </div>
              {syncResult.errors?.length > 0 && (
                <div className='e2e-sync-errors'>{syncResult.errors.join("; ")}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {message && <div className={`e2e-message ${message.kind}`}>{message.text}</div>}

      <div className='e2e-card e2e-accounts'>
        <h3>Assigned trading accounts ({accounts.length})</h3>
        {accounts.length === 0 ? (
          <p className='e2e-hint'>None yet — approve a participant, then assign above.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>User</th>
                <th>Connector</th>
                <th>Sync state</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <motion.tr key={account._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td>{account.broker_account_number}</td>
                  <td>{account.user_id?.email || "—"}</td>
                  <td>{account.broker_integration_id?.type || "—"}</td>
                  <td>
                    <span className={`e2e-state ${account.sync_state}`}>{account.sync_state}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className='e2e-card e2e-accounts'>
        <h3>
          <Trophy size={16} /> 4 · Resulting leaderboard ({leaderboard.length})
          {boardFetchedAt && (
            <span className='e2e-board-meta'>
              computed {new Date(boardFetchedAt).toLocaleTimeString()}
            </span>
          )}
        </h3>
        {leaderboard.length === 0 ? (
          <p className='e2e-hint'>Empty — run a sync above and rankings appear here.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Trader</th>
                <th>Account</th>
                <th>ROI</th>
                <th>PnL</th>
                <th>Win rate</th>
                <th>Trades</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row) => (
                <motion.tr key={`${row.rank}-${row.account_masked}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td className='e2e-rank'>{row.rank || "—"}</td>
                  <td>{row.display_name}</td>
                  <td>{row.account_masked}</td>
                  <td className={row.roi >= 0 ? "e2e-pos" : "e2e-neg"}>{row.roi?.toFixed(2)}%</td>
                  <td className={row.pnl >= 0 ? "e2e-pos" : "e2e-neg"}>{row.pnl?.toFixed(2)}</td>
                  <td>{row.win_rate?.toFixed(1)}%</td>
                  <td>{row.trade_count}</td>
                  <td>
                    <span className={`e2e-state ${row.calculation_status === "ranked" ? "ready" : ""}`}>
                      {row.calculation_status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className='e2e-card e2e-accounts'>
        <h3>
          <History size={16} /> 5 · Sync history ({syncRuns.length})
        </h3>
        {syncRuns.length === 0 ? (
          <p className='e2e-hint'>No syncs recorded yet for this tournament.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Started</th>
                <th>Status</th>
                <th>Accounts</th>
                <th>Snapshots</th>
                <th>Trades</th>
                <th>Leaderboard rows</th>
                <th>Errors</th>
              </tr>
            </thead>
            <tbody>
              {syncRuns.map((run) => (
                <motion.tr key={run._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td>{new Date(run.started_at).toLocaleString()}</td>
                  <td>
                    <span className={`e2e-state ${run.status === "success" ? "ready" : run.status === "error" ? "error" : ""}`}>
                      {run.status}
                    </span>
                  </td>
                  <td>{run.accounts_processed}</td>
                  <td>{run.snapshots_written}</td>
                  <td>{run.trades_written}</td>
                  <td>{run.leaderboard_entries_written}</td>
                  <td className='e2e-sync-errors'>{run.error_summary || "—"}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default E2ETestPanel;
