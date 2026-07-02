#!/usr/bin/env node
/**
 * Live end-to-end test against the DEPLOYED app.
 *
 * Modes:
 *   --probe (default)  Read-only: health -> admin login -> FP Markets probe.
 *                      Safe to run any time; tells you whether broker data is
 *                      flowing yet.
 *   --full             Full pipeline against production: creates an
 *                      "[E2E]"-prefixed tournament, registers a test user with
 *                      the given --account, applies, approves, assigns the
 *                      trading account to the fpmarkets integration, runs a
 *                      sync, and prints the resulting leaderboard.
 *                      Add --cleanup to delete the test tournament afterwards
 *                      (user/participant records remain; decline them in the
 *                      admin UI if you want them gone).
 *
 * Config (env or flags):
 *   LTL_BASE_URL   (default https://trade-cmp-production.up.railway.app)
 *   ADMIN_USERNAME / ADMIN_PASSWORD  (or --user= / --pass=)
 *   --account=NUMBER    trading account number to test with (--full)
 *   --connector=TYPE    fpmarkets (default) or fixture — fixture lets you
 *                       validate the whole app flow before FP data exists
 *   --email=ADDR        test user email (default e2e+<timestamp>@livetradingleague.com)
 *
 * Examples:
 *   node scripts/live-e2e.mjs                       # daily probe
 *   node scripts/live-e2e.mjs --full --connector=fixture --cleanup
 *   node scripts/live-e2e.mjs --full --account=2058014   # the real thing
 */

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  })
);

const BASE = process.env.LTL_BASE_URL || "https://trade-cmp-production.up.railway.app";
const USER = args.user || process.env.ADMIN_USERNAME || "ltl-admin-1";
const PASS = args.pass || process.env.ADMIN_PASSWORD;
const CONNECTOR = args.connector || "fpmarkets";
const ACCOUNT = args.account;
const EMAIL = args.email || `e2e+${Date.now()}@livetradingleague.com`;

let token = null;
let failures = 0;

const ok = (label, extra = "") => console.log(`  ✅ ${label}${extra ? ` — ${extra}` : ""}`);
const warn = (label, extra = "") => console.log(`  ⚠️  ${label}${extra ? ` — ${extra}` : ""}`);
const fail = (label, extra = "") => {
  failures++;
  console.log(`  ❌ ${label}${extra ? ` — ${extra}` : ""}`);
};

async function api(method, path, body, expectOk = true) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON */
  }
  if (expectOk && !res.ok) {
    throw new Error(`${method} ${path} -> HTTP ${res.status}: ${JSON.stringify(json)?.slice(0, 300)}`);
  }
  return { status: res.status, body: json };
}

async function probe() {
  console.log(`\n▶ Probe against ${BASE}\n`);

  const health = await api("GET", "/api/health");
  health.body?.status === "ok" ? ok("health") : fail("health", JSON.stringify(health.body));

  if (!PASS) {
    warn("admin login skipped", "set ADMIN_PASSWORD (or --pass=...)");
    return null;
  }
  const login = await api("POST", "/api/admin/login", { username: USER, password: PASS });
  if (!login.body?.token) return fail("admin login", JSON.stringify(login.body));
  token = login.body.token;
  ok("admin login", USER);

  const fp = await api("GET", "/api/admin/fp-test", null, false);
  if (fp.status !== 200 || !fp.body?.success) {
    fail("FP Markets probe", fp.body?.message || `HTTP ${fp.status}`);
    return null;
  }
  const accounts = fp.body.accounts || [];
  ok("FP Markets probe", `${accounts.length} account(s) for rebate ${fp.body.requested_accounts?.join(",")}`);

  let usable = 0;
  for (const a of accounts) {
    const bal = a.metrics?.current_balance ?? 0;
    const hasTrades = !!a.last_trade_at;
    const good = bal > 0 || hasTrades;
    if (good) usable++;
    console.log(
      `     • ${a.account_number} (${a.user_info?.first_name ?? "?"}) balance=${a.metrics?.starting_balance}→${bal} last_trade=${a.last_trade_at ?? "none"} status=${a.status} ${good ? "USABLE ✓" : "no activity yet"}`
    );
  }
  if (accounts.length === 0) warn("no accounts mapped under the IB yet — chase the broker");
  else if (usable === 0) warn("accounts exist but none have balance/trade activity yet");
  else ok(`${usable} account(s) usable for a full E2E run`);

  return accounts;
}

async function full() {
  const accounts = await probe();
  if (!token) throw new Error("cannot run --full without admin login");

  let accountNumber = ACCOUNT;
  if (CONNECTOR === "fpmarkets") {
    if (!accountNumber) {
      const candidates = (accounts || []).filter(
        (a) => (a.metrics?.current_balance ?? 0) > 0 || a.last_trade_at
      );
      accountNumber = (candidates[0] || (accounts || [])[0])?.account_number;
    }
    if (!accountNumber) {
      fail("--full needs an account", "pass --account=NUMBER or wait for broker mapping");
      return;
    }
  } else {
    accountNumber = accountNumber || `E2E-${Date.now()}`;
  }

  console.log(`\n▶ Full pipeline (connector=${CONNECTOR}, account=${accountNumber})\n`);

  const t = await api("POST", "/api/tournaments", {
    title: `[E2E] Pipeline test ${new Date().toISOString().slice(0, 16)}`,
    registrationLink: "https://portal.fptrading.com/register?fpm-affiliate-agt=477779",
    status: "active",
    start_date: "2026-01-01T00:00:00.000Z",
    end_date: "2026-12-31T23:59:59.000Z",
  });
  const tournamentId = t.body.id;
  ok("tournament created", tournamentId);

  const integ = await api("POST", "/api/admin/broker-integrations", {
    type: CONNECTOR,
    name: `${CONNECTOR} (e2e)`,
  });
  const integrationId = integ.body.integration._id;
  ok("broker integration ensured", `${CONNECTOR} ${integrationId}`);

  await api("POST", "/api/users/register", {
    email: EMAIL,
    fp_account_number: accountNumber,
    is_new_user: true,
  }, false); // 400 if already registered — fine, apply reuses the user
  const apply = await api("POST", "/api/participants/apply", {
    tournament_id: tournamentId,
    email: EMAIL,
    fp_account_number: accountNumber,
    is_new_user: true,
  });
  const participantId = apply.body.participant.id;
  ok("user applied", `${EMAIL} participant=${participantId}`);

  await api("PUT", `/api/participants/${participantId}/approve`);
  ok("participant approved");

  const acct = await api("POST", "/api/admin/trading-accounts", {
    participant_id: participantId,
    broker_integration_id: integrationId,
    broker_account_number: accountNumber,
  });
  ok("trading account assigned", acct.body.account._id);

  const sync = await api("POST", `/api/admin/sync/${tournamentId}`);
  const s = sync.body;
  (s.status === "success" ? ok : fail)(
    "sync run",
    `status=${s.status} accounts=${s.accountsProcessed} snapshots=${s.snapshotsWritten} leaderboardRows=${s.leaderboardEntriesWritten}${s.errors?.length ? ` errors=${s.errors.join("; ")}` : ""}`
  );

  const board = await api("GET", `/api/leaderboard/${tournamentId}`);
  const rows = board.body.leaderboard || [];
  if (rows.length > 0) {
    ok(`leaderboard has ${rows.length} row(s)`);
    for (const r of rows) {
      console.log(
        `     #${r.rank} ${r.display_name} (${r.account_masked}) roi=${r.roi?.toFixed?.(2)}% pnl=${r.pnl} [${r.calculation_status}]`
      );
    }
  } else {
    warn("leaderboard empty", "no snapshot data — check sync errors above");
  }

  if (args.cleanup) {
    await api("DELETE", `/api/tournaments/${tournamentId}`);
    ok("cleanup", "test tournament deleted (user/participant remain — decline in admin UI if unwanted)");
  } else {
    console.log(`\n  Keep exploring in the admin UI, tournament id: ${tournamentId}`);
    console.log(`  (re-run sync any time: POST /api/admin/sync/${tournamentId})`);
  }
}

try {
  await (args.full ? full() : probe());
} catch (error) {
  fail("aborted", error.message);
}

console.log("");
if (failures > 0) {
  console.log(`✗ ${failures} failure(s)\n`);
  process.exit(1);
}
console.log("✓ all checks passed\n");
