import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

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
 * Scale benchmark for the high-trade account that caused the ~90s sync.
 *
 * Wall-clock here is meaningless — the in-memory server has a sub-millisecond
 * round trip while the real cluster sits in Singapore, ~170ms from the app in
 * Amsterdam. What actually drives the cost is the NUMBER of round trips, so
 * that is what this counts, via the driver's own command monitoring. Multiply
 * the count by the real RTT to get the real time.
 */

const ACCOUNT = "81049662";
const TRADE_COUNT = 454;

let mongod: MongoMemoryServer;
let tournamentId: string;

/** Commands issued per collection, counted straight off the driver. */
const commandsByCollection = new Map<string, number>();

function resetCounts(): void {
  commandsByCollection.clear();
}

function countFor(collection: string): number {
  return commandsByCollection.get(collection) ?? 0;
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri("ltl_scale_test"), {
    monitorCommands: true,
  });

  mongoose.connection.getClient().on("commandStarted", (event: any) => {
    // Only the data-plane commands; ignore handshakes and heartbeats.
    if (!["insert", "update", "find", "aggregate", "delete"].includes(event.commandName)) {
      return;
    }
    const collection = event.command[event.commandName];
    if (typeof collection !== "string") return;
    const key = `${collection}.${event.commandName}`;
    commandsByCollection.set(key, (commandsByCollection.get(key) ?? 0) + 1);
  });

  const tournament = await Tournament.create({
    title: "Scale test",
    cover: "cover.png",
    registrationLink: "https://example.test/register",
    status: "active",
    start_date: new Date("2026-04-01T00:00:00.000Z"),
    end_date: new Date("2026-06-30T23:59:59.000Z"),
  });
  tournamentId = String(tournament._id);

  const integration = await BrokerIntegration.create({
    type: "fixture",
    name: "Fixture (scale test)",
    enabled: true,
    supports_raw_trades: true,
    supports_snapshots: true,
    supports_broker_metrics: true,
  });

  const user = await User.create({
    email: "scale-test@example.test",
    fp_account_number: ACCOUNT,
    display_name: "Scale Tester",
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

  // One account, 454 closed trades — the shape that took ~90s in production.
  const trades = Array.from({ length: TRADE_COUNT }, (_, i) => ({
    accountNumber: ACCOUNT,
    tradeId: `scale-${i}`,
    openedAt: "2026-04-05T09:00:00.000Z",
    closedAt: "2026-04-05T12:00:00.000Z",
    symbol: "EURUSD",
    side: "buy" as const,
    volume: 1,
    openPrice: 1.08,
    closePrice: 1.09,
    fees: 0,
    swap: 0,
    netPnl: i % 2 === 0 ? 10 : -5,
    currency: "USD",
    source: "fixture" as const,
  }));

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
        balance: 11135,
        equity: 11135,
        currency: "USD",
        source: "fixture",
      },
    ],
    trades,
    brokerMetrics: [],
  });
}, 180_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

describe(`sync at ${TRADE_COUNT} trades`, () => {
  it("issues a bounded number of round trips regardless of trade count", async () => {
    // Warm the connection and populate history so the steady-state sync (the
    // one that runs every 60s) is what gets measured.
    await syncTournament(tournamentId);

    resetCounts();
    const startedAt = Date.now();
    const result = await syncTournament(tournamentId);
    const elapsedMs = Date.now() - startedAt;

    expect(result.status).toBe("success");
    expect(result.tradesWritten).toBe(TRADE_COUNT);
    expect(await Trade.countDocuments({})).toBe(TRADE_COUNT);

    const tradeWrites = countFor("trades.update");
    const snapshotWrites = countFor("accountsnapshots.update");
    const snapshotReads =
      countFor("accountsnapshots.find") + countFor("accountsnapshots.aggregate");
    const total = [...commandsByCollection.values()].reduce((a, b) => a + b, 0);

    const RTT_MS = 170; // measured Amsterdam -> Singapore
    console.log(
      [
        "",
        `  trades synced           ${TRADE_COUNT}`,
        `  trades.update commands  ${tradeWrites}`,
        `  snapshot write commands ${snapshotWrites}`,
        `  snapshot read commands  ${snapshotReads}`,
        `  TOTAL round trips       ${total}`,
        `  local wall clock        ${elapsedMs}ms (in-memory, ~0 RTT)`,
        `  projected @ ${RTT_MS}ms RTT  ${((total * RTT_MS) / 1000).toFixed(1)}s`,
        "",
      ].join("\n")
    );

    // The point of the batching: writes must not scale with trade count.
    // Per-document upserts would put this at 454.
    expect(tradeWrites).toBeLessThanOrEqual(2);
    expect(snapshotWrites).toBeLessThanOrEqual(2);
    // And the history read must not walk every snapshot ever written.
    expect(snapshotReads).toBeLessThanOrEqual(2);
    // Whole sync, every collection combined, stays far below one-per-trade.
    expect(total).toBeLessThan(50);
  }, 180_000);
});
