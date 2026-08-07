import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import jwt from "jsonwebtoken";
import { afterAll, beforeAll, afterEach, describe, expect, it, vi } from "vitest";
import TradingAccount from "../../models/TradingAccount";

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
