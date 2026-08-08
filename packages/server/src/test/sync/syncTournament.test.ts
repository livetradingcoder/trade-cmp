import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import Tournament from "../../models/Tournament";
import User from "../../models/User";
import Participant from "../../models/Participant";
import BrokerIntegration from "../../models/BrokerIntegration";
import TradingAccount from "../../models/TradingAccount";
import AccountSnapshot from "../../models/AccountSnapshot";
import Trade from "../../models/Trade";
import LeaderboardCache from "../../models/LeaderboardCache";
import { fixtureConnector } from "../../services/brokers/fixtureConnector";
import { syncTournament } from "../../services/sync/syncTournament";

/**
 * syncTournament against a real (in-memory) MongoDB.
 *
 * Covers the batched writes and the snapshot-endpoint aggregation: the sync
 * persists snapshots/trades with bulkWrite and asks the server for only the
 * earliest/latest snapshot per account, so these assertions pin the behaviour
 * that used to come from per-document upserts and a full-history read.
 */

const ACCOUNT = "81049662";

let mongod: MongoMemoryServer;
let tournamentId: string;
let integrationId: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri("ltl_sync_test"));

  const tournament = await Tournament.create({
    title: "Sync test",
    cover: "cover.png",
    registrationLink: "https://example.test/register",
    status: "active",
    start_date: new Date("2026-04-01T00:00:00.000Z"),
    end_date: new Date("2026-06-30T23:59:59.000Z"),
  });
  tournamentId = String(tournament._id);

  const integration = await BrokerIntegration.create({
    type: "fixture",
    name: "Fixture (sync test)",
    enabled: true,
    supports_raw_trades: true,
    supports_snapshots: true,
    supports_broker_metrics: true,
  });
  integrationId = String(integration._id);

  const user = await User.create({
    email: "sync-test@example.test",
    fp_account_number: ACCOUNT,
    display_name: "Sync Tester",
  });

  const participant = await Participant.create({
    tournament_id: tournament._id,
    user_id: user._id,
    status: "approved",
  });

  await TradingAccount.create({
    user_id: user._id,
    participant_id: participant._id,
    tournament_id: tournament._id,
    broker_integration_id: integration._id,
    broker_account_number: ACCOUNT,
    status: "active",
  });
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await AccountSnapshot.deleteMany({});
  await Trade.deleteMany({});
  await LeaderboardCache.deleteMany({});
});

describe("syncTournament", () => {
  it("persists snapshots and trades and writes the leaderboard cache", async () => {
    const result = await syncTournament(tournamentId);

    expect(result.status).toBe("success");
    expect(result.accountsProcessed).toBe(1);
    // The fixture connector emits two snapshots and one trade per account.
    expect(result.snapshotsWritten).toBe(2);
    expect(result.tradesWritten).toBe(1);

    expect(await AccountSnapshot.countDocuments({})).toBe(2);
    expect(await Trade.countDocuments({})).toBe(1);

    const cache = await LeaderboardCache.findOne({
      tournament_id: tournamentId,
    });
    expect(cache).toBeTruthy();
    expect(cache!.rankings).toHaveLength(1);
    expect(cache!.rankings[0].trade_count).toBe(1);
    // pnl 100 against a baseline of (10750 ending equity - 100 pnl).
    expect(cache!.rankings[0].pnl).toBeCloseTo(100, 6);
    expect(cache!.rankings[0].roi).toBeCloseTo((100 / 10650) * 100, 6);
  });

  it("does not duplicate rows when the same window is synced twice", async () => {
    await syncTournament(tournamentId);
    await syncTournament(tournamentId);

    // Upserts key on (trading_account_id, captured_at) and
    // (trading_account_id, broker_trade_id) — re-syncing the same window must
    // update in place rather than append.
    expect(await AccountSnapshot.countDocuments({})).toBe(2);
    expect(await Trade.countDocuments({})).toBe(1);
    expect(await LeaderboardCache.countDocuments({})).toBe(1);
  });

  it("uses the earliest and latest snapshot, not ones in between", async () => {
    // No trades, so ROI comes from the equity delta between the first and last
    // snapshot — the path where both endpoints matter.
    vi.spyOn(fixtureConnector, "fetchCompetitionData").mockResolvedValue({
      accounts: [{ accountNumber: ACCOUNT, userId: "u1" }],
      snapshots: [
        {
          accountNumber: ACCOUNT,
          capturedAt: "2026-04-01T00:00:00.000Z",
          balance: 10000,
          equity: 10000,
          currency: "USD",
          source: "fixture",
        },
        {
          accountNumber: ACCOUNT,
          capturedAt: "2026-04-20T00:00:00.000Z",
          balance: 11000,
          equity: 11000,
          currency: "USD",
          source: "fixture",
        },
      ],
      trades: [],
      brokerMetrics: [],
    });

    const account = await TradingAccount.findOne({
      broker_account_number: ACCOUNT,
    });
    // A mid-window snapshot with absurd equity: if it ever leaks in as an
    // endpoint the ROI below blows up instead of landing on 10%.
    await AccountSnapshot.create({
      trading_account_id: account!._id,
      captured_at: new Date("2026-04-10T00:00:00.000Z"),
      balance: 999_999,
      equity: 999_999,
      currency: "USD",
      source: "fixture",
    });

    await syncTournament(tournamentId);

    const cache = await LeaderboardCache.findOne({
      tournament_id: tournamentId,
    });
    expect(cache!.rankings).toHaveLength(1);
    expect(cache!.rankings[0].trade_count).toBe(0);
    expect(cache!.rankings[0].pnl).toBeCloseTo(1000, 6);
    expect(cache!.rankings[0].roi).toBeCloseTo(10, 6);
  });

  it("picks up an earlier snapshot persisted by a previous sync", async () => {
    vi.spyOn(fixtureConnector, "fetchCompetitionData").mockResolvedValue({
      accounts: [{ accountNumber: ACCOUNT, userId: "u1" }],
      snapshots: [
        {
          accountNumber: ACCOUNT,
          capturedAt: "2026-04-20T00:00:00.000Z",
          balance: 11000,
          equity: 11000,
          currency: "USD",
          source: "fixture",
        },
      ],
      trades: [],
      brokerMetrics: [],
    });

    const account = await TradingAccount.findOne({
      broker_account_number: ACCOUNT,
    });
    // Written by an earlier sync, outside this result set — the baseline must
    // still come from it, which is why the history is read back from the DB.
    await AccountSnapshot.create({
      trading_account_id: account!._id,
      captured_at: new Date("2026-04-01T00:00:00.000Z"),
      balance: 8000,
      equity: 8000,
      currency: "USD",
      source: "fixture",
    });

    await syncTournament(tournamentId);

    const cache = await LeaderboardCache.findOne({
      tournament_id: tournamentId,
    });
    expect(cache!.rankings[0].pnl).toBeCloseTo(3000, 6);
    expect(cache!.rankings[0].roi).toBeCloseTo((3000 / 8000) * 100, 6);
  });
});
