import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import jwt from "jsonwebtoken";
import { afterAll, beforeAll, afterEach, describe, expect, it, vi } from "vitest";
import TradingAccount from "../../models/TradingAccount";
import LeaderboardCache from "../../models/LeaderboardCache";
import AccountSnapshot from "../../models/AccountSnapshot";
import Trade from "../../models/Trade";

/**
 * Full-pipeline integration test against the real Express app and an in-memory
 * MongoDB:
 *
 *   register user -> apply to tournament -> admin approves -> broker
 *   integration + trading account assigned -> sync -> leaderboard.
 *
 * Runs the pipeline twice: once with the deterministic `fixture` connector and
 * once with the `fpmarkets` connector against a mocked FP Markets API — the
 * same code path that will run when real broker data flows.
 */

const JWT_SECRET = "integration-test-secret";

let mongod: MongoMemoryServer;
let app: any;
let adminToken: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();

  // Must be set BEFORE importing the app: connectDB and the auth middleware
  // read these at module load.
  process.env.MONGODB_URI = mongod.getUri("ltl_test");
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.VERCEL = "1"; // block app.listen() and the sync scheduler
  process.env.SYNC_ENABLED = "false";
  process.env.FP_MARKETS_BASE_URL = "https://ibbeta.fptrading.com";
  process.env.FP_MARKETS_TOKEN = "test-token";
  process.env.FP_MARKETS_SECRET = "test-secret";
  process.env.FP_MARKETS_REBATE_ACCOUNTS = "477779";

  app = (await import("../../index")).default;

  // connectDB() fires on import; wait until mongoose is actually connected.
  for (let i = 0; i < 100 && mongoose.connection.readyState !== 1; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  expect(mongoose.connection.readyState).toBe(1);

  // Mint an admin JWT directly (same shape verifyToken expects). adminId must
  // be a valid ObjectId because approve stores it in reviewed_by.
  adminToken = jwt.sign(
    { adminId: new mongoose.Types.ObjectId().toString(), username: "it-admin" },
    JWT_SECRET
  );
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const auth = () => ({ Authorization: `Bearer ${adminToken}` });

async function createTournament(title: string): Promise<string> {
  const res = await request(app)
    .post("/api/tournaments")
    .set(auth())
    .send({
      title,
      registrationLink: "https://portal.fptrading.com/register?fpm-affiliate-agt=477779",
      status: "active",
      start_date: "2026-01-01T00:00:00.000Z",
      end_date: "2026-06-30T23:59:59.000Z",
    });
  expect(res.status).toBe(200);
  expect(res.body.id).toBeTruthy();
  return res.body.id;
}

/** register -> apply -> approve -> assign trading account; returns participant id */
async function onboardParticipant(
  tournamentId: string,
  email: string,
  accountNumber: string,
  integrationId: string
): Promise<string> {
  const reg = await request(app)
    .post("/api/users/register")
    .send({ email, fp_account_number: accountNumber, is_new_user: true });
  expect(reg.status).toBe(200);

  const apply = await request(app)
    .post("/api/participants/apply")
    .send({
      tournament_id: tournamentId,
      email,
      fp_account_number: accountNumber,
      is_new_user: true,
    });
  expect(apply.status).toBe(200);
  const participantId = apply.body.participant.id;

  const approve = await request(app)
    .put(`/api/participants/${participantId}/approve`)
    .set(auth());
  expect(approve.status).toBe(200);
  expect(approve.body.participant.status).toBe("approved");

  // Approval auto-provisions a trading account under the fpmarkets integration.
  // Drop it so the explicit onboard below can assign the connector this test
  // actually exercises (fixture or fpmarkets).
  await TradingAccount.deleteMany({
    tournament_id: tournamentId,
    broker_account_number: accountNumber,
  });

  const account = await request(app)
    .post("/api/admin/trading-accounts")
    .set(auth())
    .send({ participant_id: participantId, broker_integration_id: integrationId });
  expect(account.status).toBe(200);
  expect(account.body.account.broker_account_number).toBe(accountNumber);

  return participantId;
}

describe("health & auth guards", () => {
  it("serves the health check", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    // Liveness stays 200 regardless, but the database field must report the
    // real state — it was hardcoded to "mongodb" and read healthy through a
    // 19-minute outage.
    expect(res.body.database).toBe("connected");
  });

  it("reports readiness once the database answers", async () => {
    const res = await request(app).get("/api/ready");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: "ready",
      database: "connected",
    });
  });

  it("rejects broker-sync admin endpoints without a token", async () => {
    for (const call of [
      request(app).post("/api/admin/broker-integrations").send({ type: "fixture" }),
      request(app).post("/api/admin/trading-accounts").send({}),
      request(app).post("/api/admin/sync/000000000000000000000000"),
    ]) {
      const res = await call;
      expect(res.status).toBe(401);
    }
  });

  it("serves the public leaderboard without a token", async () => {
    // The leaderboard is intentionally public (sanitized: masked accounts, no
    // balances), so it must NOT require admin auth.
    const res = await request(app).get(
      "/api/leaderboard/000000000000000000000000"
    );
    expect(res.status).toBe(200);
    expect(res.body.leaderboard).toEqual([]);
  });

  it("withholds the $ P&L from anonymous leaderboard callers", async () => {
    const tournamentId = await createTournament("PnL visibility");
    await LeaderboardCache.create({
      tournament_id: tournamentId,
      rankings: [
        {
          rank: 1,
          participant_id: new mongoose.Types.ObjectId(),
          trading_account_id: new mongoose.Types.ObjectId(),
          display_name: "Trader ****9662",
          account_masked: "****9662",
          roi: 1.25,
          pnl: 1234.56,
          currency: "USD",
          win_rate: 50,
          trade_count: 4,
          calculation_source: "computed_raw",
          calculation_status: "ranked",
          updated_at: new Date(),
        },
      ],
      fetched_at: new Date(),
      expires_at: new Date(Date.now() + 15 * 60_000),
    });

    // Anonymous: ROI and trade stats yes, money no. Hiding the column in the
    // UI is not hiding it — the figure must not be in the payload at all.
    const anon = await request(app).get(`/api/leaderboard/${tournamentId}`);
    expect(anon.status).toBe(200);
    expect(anon.body.leaderboard[0].roi).toBeCloseTo(1.25, 6);
    expect(anon.body.leaderboard[0].trade_count).toBe(4);
    expect(anon.body.leaderboard[0]).not.toHaveProperty("pnl");
    expect(anon.body.leaderboard[0]).not.toHaveProperty("currency");
    expect(JSON.stringify(anon.body)).not.toContain("1234.56");

    // Admin reads the same endpoint and still needs the money column.
    const admin = await request(app)
      .get(`/api/leaderboard/${tournamentId}`)
      .set(auth());
    expect(admin.body.leaderboard[0].pnl).toBeCloseTo(1234.56, 6);
    expect(admin.body.leaderboard[0].currency).toBe("USD");
  });

  it("ignores a bogus token rather than trusting it", async () => {
    const tournamentId = await createTournament("PnL bogus token");
    await LeaderboardCache.create({
      tournament_id: tournamentId,
      rankings: [
        {
          rank: 1,
          participant_id: new mongoose.Types.ObjectId(),
          trading_account_id: new mongoose.Types.ObjectId(),
          display_name: "Trader ****0517",
          account_masked: "****0517",
          roi: 0.5,
          pnl: 999.99,
          currency: "USD",
          win_rate: 0,
          trade_count: 0,
          calculation_source: "computed_raw",
          calculation_status: "ranked",
          updated_at: new Date(),
        },
      ],
      fetched_at: new Date(),
      expires_at: new Date(Date.now() + 15 * 60_000),
    });

    const res = await request(app)
      .get(`/api/leaderboard/${tournamentId}`)
      .set({ Authorization: "Bearer not-a-real-token" });
    expect(res.status).toBe(200);
    expect(res.body.leaderboard[0]).not.toHaveProperty("pnl");
  });
});

describe("full pipeline with fixture connector", () => {
  let tournamentId: string;
  let integrationId: string;

  it("ensures a fixture broker integration (idempotently)", async () => {
    const first = await request(app)
      .post("/api/admin/broker-integrations")
      .set(auth())
      .send({ type: "fixture", name: "Fixture (test)" });
    expect(first.status).toBe(200);
    integrationId = first.body.integration._id;

    const second = await request(app)
      .post("/api/admin/broker-integrations")
      .set(auth())
      .send({ type: "fixture" });
    expect(second.status).toBe(200);
    expect(second.body.integration._id).toBe(integrationId);

    expect(first.body.integration.supports_snapshots).toBe(true);
  });

  it("rejects unsupported connector types", async () => {
    const res = await request(app)
      .post("/api/admin/broker-integrations")
      .set(auth())
      .send({ type: "nonsense" });
    expect(res.status).toBe(400);
  });

  it("onboards two participants end to end", async () => {
    tournamentId = await createTournament("Integration Cup (fixture)");
    await onboardParticipant(tournamentId, "trader1@test.dev", "10001", integrationId);
    await onboardParticipant(tournamentId, "trader2@test.dev", "10002", integrationId);

    const list = await request(app)
      .get(`/api/admin/trading-accounts/${tournamentId}`)
      .set(auth());
    expect(list.status).toBe(200);
    expect(list.body.accounts).toHaveLength(2);
  });

  it("refuses a trading account for a pending participant", async () => {
    const apply = await request(app)
      .post("/api/participants/apply")
      .send({
        tournament_id: tournamentId,
        email: "pending@test.dev",
        fp_account_number: "10003",
        is_new_user: true,
      });
    const res = await request(app)
      .post("/api/admin/trading-accounts")
      .set(auth())
      .send({
        participant_id: apply.body.participant.id,
        broker_integration_id: integrationId,
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/approved/i);
  });

  it("syncs and produces a ranked leaderboard", async () => {
    const sync = await request(app)
      .post(`/api/admin/sync/${tournamentId}`)
      .set(auth());
    expect(sync.status).toBe(200);
    expect(sync.body.status).toBe("success");
    expect(sync.body.accountsProcessed).toBe(2);
    expect(sync.body.snapshotsWritten).toBeGreaterThan(0);
    expect(sync.body.leaderboardEntriesWritten).toBe(2);

    const board = await request(app)
      .get(`/api/leaderboard/${tournamentId}`)
      .set(auth());
    expect(board.status).toBe(200);
    expect(board.body.leaderboard).toHaveLength(2);
    expect(board.body.stale).toBe(false);

    const [first, second] = board.body.leaderboard;
    expect(first.rank).toBe(1);
    expect(second.rank).toBe(2);
    expect(first.roi).toBeGreaterThan(second.roi); // fixture gives distinct ROIs
    expect(first.account_masked).toMatch(/^\*+\d{4}$/);

    // Accounts flip to ready after a successful sync.
    const list = await request(app)
      .get(`/api/admin/trading-accounts/${tournamentId}`)
      .set(auth());
    for (const account of list.body.accounts) {
      expect(account.sync_state).toBe("ready");
    }
  });

  it("reports each participant's latest balance to admins only", async () => {
    // Admins need to see how funded an account is when reviewing it. The
    // figure comes from the snapshots the sync already writes, so it only
    // exists once a sync has run — the test above.
    const res = await request(app)
      .get(`/api/participants/${tournamentId}`)
      .set(auth());
    expect(res.status).toBe(200);

    const approved = res.body.participants.filter(
      (p: any) => p.status === "approved"
    );
    expect(approved.length).toBeGreaterThan(0);
    for (const participant of approved) {
      expect(participant.account_balance).not.toBeNull();
      expect(participant.account_balance.balance).toBeGreaterThan(0);
      expect(participant.account_balance.currency).toBe("USD");
      expect(participant.account_balance.captured_at).toBeTruthy();

      // Starting balance is the earliest snapshot, current is the latest. The
      // fixture connector rises over the window, so these must not collapse
      // onto the same value — that would mean one endpoint is being read twice.
      expect(participant.account_balance.starting_balance).toBeGreaterThan(0);
      expect(participant.account_balance.first_seen_at).toBeTruthy();
      expect(
        new Date(participant.account_balance.first_seen_at).getTime()
      ).toBeLessThan(
        new Date(participant.account_balance.captured_at).getTime()
      );
      expect(participant.account_balance.balance).toBeGreaterThan(
        participant.account_balance.starting_balance
      );
    }

    // Same figures must never reach the public board.
    const publicBoard = await request(app).get(
      `/api/leaderboard/${tournamentId}`
    );
    const serialized = JSON.stringify(publicBoard.body);
    for (const participant of approved) {
      expect(serialized).not.toContain(
        String(participant.account_balance.balance)
      );
    }
  });

  it("requires a token for the participants list", async () => {
    const res = await request(app).get(`/api/participants/${tournamentId}`);
    expect(res.status).toBe(401);
  });

  it("competes a returning entrant on the account they entered, not their first one", async () => {
    // The reported bug: a trader who already had an account on file entered a
    // different one for a later tournament and was silently competed on the
    // original. Their user record keeps the first number as an identity
    // anchor; the tournament must use what they actually typed.
    const email = "returning.entrant@example.test";
    const firstAccount = "70000001";
    const secondAccount = "70000002";

    const firstTournament = await createTournament("Returning entrant #1");
    await request(app)
      .post("/api/participants/apply")
      .send({
        tournament_id: firstTournament,
        email,
        fp_account_number: firstAccount,
        is_new_user: true,
      })
      .expect(200);

    const secondTournament = await createTournament("Returning entrant #2");
    const apply = await request(app)
      .post("/api/participants/apply")
      .send({
        tournament_id: secondTournament,
        email,
        fp_account_number: secondAccount,
        is_new_user: false,
      });
    expect(apply.status).toBe(200);
    const participantId = apply.body.participant.id;

    await request(app)
      .put(`/api/participants/${participantId}/approve`)
      .set(auth())
      .expect(200);

    const provisioned = await TradingAccount.findOne({
      tournament_id: secondTournament,
    });
    expect(provisioned).toBeTruthy();
    expect(provisioned!.broker_account_number).toBe(secondAccount);
    expect(provisioned!.broker_account_number).not.toBe(firstAccount);

    // The user record still anchors on the original account, but the entry
    // must report the competing one — the admin UI renders this field, and
    // showing the user's number would display an account we are not tracking.
    const listed = await request(app)
      .get(`/api/participants/${secondTournament}`)
      .set(auth());
    expect(listed.body.participants[0].user.fp_account_number).toBe(
      firstAccount
    );
    expect(listed.body.participants[0].fp_account_number).toBe(secondAccount);
  });

  it("lets an admin correct a participant's account and clears the old history", async () => {
    const email = "wrong.account@example.test";
    const wrongAccount = "70000010";
    const rightAccount = "70000011";

    const tid = await createTournament("Account correction");
    const apply = await request(app)
      .post("/api/participants/apply")
      .send({
        tournament_id: tid,
        email,
        fp_account_number: wrongAccount,
        is_new_user: true,
      })
      .expect(200);
    const participantId = apply.body.participant.id;

    await request(app)
      .put(`/api/participants/${participantId}/approve`)
      .set(auth())
      .expect(200);

    const account = await TradingAccount.findOne({ tournament_id: tid });
    expect(account!.broker_account_number).toBe(wrongAccount);

    // History belonging to the wrong account.
    await AccountSnapshot.create({
      trading_account_id: account!._id,
      captured_at: new Date("2026-04-01T00:00:00.000Z"),
      balance: 500,
      equity: 500,
      currency: "USD",
      source: "broker",
    });
    await Trade.create({
      trading_account_id: account!._id,
      broker_trade_id: "old-trade-1",
      opened_at: new Date("2026-04-01T09:00:00.000Z"),
      closed_at: new Date("2026-04-01T10:00:00.000Z"),
      symbol: "EURUSD",
      side: "buy",
      volume: 1,
      open_price: 1.08,
      close_price: 1.09,
      net_pnl: 42,
      currency: "USD",
      source: "broker",
    });

    const fix = await request(app)
      .put(`/api/participants/${participantId}/trading-account`)
      .set(auth())
      .send({ fp_account_number: rightAccount });
    expect(fix.status).toBe(200);
    expect(fix.body.previous_account).toBe(wrongAccount);
    expect(fix.body.snapshots_cleared).toBe(1);
    expect(fix.body.trades_cleared).toBe(1);

    const moved = await TradingAccount.findById(account!._id);
    expect(moved!.broker_account_number).toBe(rightAccount);

    // The old account's history must not survive — it would poison the
    // starting balance and the ROI baseline derived from it.
    expect(
      await AccountSnapshot.countDocuments({ trading_account_id: account!._id })
    ).toBe(0);
    expect(
      await Trade.countDocuments({ trading_account_id: account!._id })
    ).toBe(0);
  });

  it("shows a pending applicant's live balance before approval", async () => {
    // The whole point of the balance column is deciding whether to approve
    // someone. A pending applicant has no trading account and therefore no
    // snapshot, so without a live fallback the number is blank at exactly the
    // moment it is needed.
    const account = "70000042";
    const tid = await createTournament("Pending balance");
    const apply = await request(app)
      .post("/api/participants/apply")
      .send({
        tournament_id: tid,
        email: "pending.applicant@example.test",
        fp_account_number: account,
        is_new_user: true,
      });
    expect(apply.status).toBe(200);

    const fpResponse = {
      data: {
        resource: {
          accounts: [
            {
              account_number: account,
              currency: "usd",
              metrics: { roi: 0, starting_balance: 0, current_balance: 28.78 },
              status: "active",
            },
          ],
        },
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => fpResponse,
        text: async () => JSON.stringify(fpResponse),
      }))
    );

    const res = await request(app)
      .get(`/api/participants/${tid}`)
      .set(auth());
    expect(res.status).toBe(200);

    const pending = res.body.participants.find(
      (p: any) => p.fp_account_number === account
    );
    expect(pending).toBeTruthy();
    expect(pending.status).toBe("pending");
    expect(pending.account_balance).not.toBeNull();
    expect(pending.account_balance.balance).toBeCloseTo(28.78, 6);
    expect(pending.account_balance.currency).toBe("USD");
    // Flagged as live so the UI does not present it as synced history.
    expect(pending.account_balance.source).toBe("broker_live");
  });

  it("refuses an account correction without a token", async () => {
    const res = await request(app)
      .put("/api/participants/000000000000000000000000/trading-account")
      .send({ fp_account_number: "70000099" });
    expect(res.status).toBe(401);
  });

  it("re-sync is idempotent (no duplicate snapshots)", async () => {
    const again = await request(app)
      .post(`/api/admin/sync/${tournamentId}`)
      .set(auth());
    expect(again.status).toBe(200);
    expect(again.body.status).toBe("success");

    const board = await request(app)
      .get(`/api/leaderboard/${tournamentId}`)
      .set(auth());
    expect(board.body.leaderboard).toHaveLength(2);
  });
});

describe("full pipeline with fpmarkets connector (mocked broker API)", () => {
  it("maps a live-shaped FP response through sync to the leaderboard", async () => {
    const integrationRes = await request(app)
      .post("/api/admin/broker-integrations")
      .set(auth())
      .send({ type: "fpmarkets", name: "FP Markets" });
    expect(integrationRes.status).toBe(200);
    const integrationId = integrationRes.body.integration._id;

    const tournamentId = await createTournament("Integration Cup (fpmarkets)");
    await onboardParticipant(tournamentId, "fp-trader@test.dev", "2058014", integrationId);

    // Mock the broker exactly as the live Account Performance API responds.
    // Same response for performance + trade-activity calls; no `trades` key, so
    // the account has no raw trades and ROI falls back to the balance change.
    const fpResponse = {
      data: {
        resource: {
          accounts: [
            {
              account_number: "2058014",
              user_info: { first_name: "Paul", last_name_masked: "S***" },
              metrics: { roi: 0, starting_balance: 5000, current_balance: 6250.75 },
              last_trade_at: "2026-05-20T08:45:00+00:00",
              status: "active",
            },
          ],
        },
      },
    };
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => fpResponse,
      text: async () => JSON.stringify(fpResponse),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const sync = await request(app)
      .post(`/api/admin/sync/${tournamentId}`)
      .set(auth());
    expect(sync.status).toBe(200);
    expect(sync.body.status).toBe("success");
    expect(sync.body.accountsProcessed).toBe(1);

    // The FP call was signed and sent our rebate account number.
    const [url, opts] = fetchMock.mock.calls[0] as unknown as [string, any];
    expect(url).toBe("https://ibbeta.fptrading.com/api/account/performance");
    expect(opts.headers.token).toBe("test-token");
    expect(opts.headers.signature).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.parse(opts.body).account_numbers).toEqual(["477779"]);

    const board = await request(app)
      .get(`/api/leaderboard/${tournamentId}`)
      .set(auth());
    expect(board.status).toBe(200);
    expect(board.body.leaderboard).toHaveLength(1);

    const row = board.body.leaderboard[0];
    expect(row.rank).toBe(1);
    // ROI computed by us from balances: (6250.75 - 5000) / 5000 = 25.015%
    expect(row.roi).toBeCloseTo(25.015, 3);
    expect(row.calculation_source).toBe("computed_raw");
    expect(row.calculation_status).toBe("ranked");
  });

  it("marks accounts errored when the broker rejects us, without crashing", async () => {
    const integrationRes = await request(app)
      .post("/api/admin/broker-integrations")
      .set(auth())
      .send({ type: "fpmarkets" });
    const integrationId = integrationRes.body.integration._id;

    const tournamentId = await createTournament("Integration Cup (fp reject)");
    await onboardParticipant(tournamentId, "fp-reject@test.dev", "9999999", integrationId);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 403,
        json: async () => ({
          messages: { error: { others: ["Access denied: IP not whitelisted."] } },
        }),
      }))
    );

    const sync = await request(app)
      .post(`/api/admin/sync/${tournamentId}`)
      .set(auth());
    expect(sync.status).toBe(200); // sync reports, doesn't crash
    expect(sync.body.status).toBe("failed");
    expect(sync.body.errors.join(" ")).toMatch(/not whitelisted/i);

    const list = await request(app)
      .get(`/api/admin/trading-accounts/${tournamentId}`)
      .set(auth());
    expect(list.body.accounts[0].sync_state).toBe("error");
  });
});
