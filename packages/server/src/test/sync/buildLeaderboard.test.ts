import { describe, expect, it } from "vitest";
import {
  AccountMeta,
  buildLeaderboardRows,
  maskAccountNumber,
} from "../../services/sync/buildLeaderboard";
import { FetchCompetitionDataResult } from "../../services/brokers/types";

describe("maskAccountNumber", () => {
  it("keeps only the last 4 characters visible", () => {
    expect(maskAccountNumber("12345678")).toBe("****5678");
  });

  it("handles short numbers without going negative", () => {
    expect(maskAccountNumber("12")).toBe("12");
    expect(maskAccountNumber("")).toBe("");
  });
});

describe("buildLeaderboardRows", () => {
  const meta = new Map<string, AccountMeta>([
    [
      "TC-1",
      {
        accountNumber: "TC-1",
        participantId: "p1",
        tradingAccountId: "ta1",
        displayName: "John",
      },
    ],
  ]);

  it("derives starting/ending equity from sorted snapshots", () => {
    const result: FetchCompetitionDataResult = {
      accounts: [{ accountNumber: "TC-1", userId: "u1" }],
      snapshots: [
        {
          accountNumber: "TC-1",
          capturedAt: "2026-06-30T23:59:59.000Z",
          balance: 6250,
          equity: 6250,
          currency: "USD",
          source: "broker",
        },
        {
          accountNumber: "TC-1",
          capturedAt: "2026-01-01T00:00:00.000Z",
          balance: 5000,
          equity: 5000,
          currency: "USD",
          source: "broker",
        },
      ],
      trades: [],
      brokerMetrics: [],
    };

    const rows = buildLeaderboardRows(result, false, meta);

    expect(rows).toHaveLength(1);
    expect(rows[0].startingEquity).toBe(5000);
    expect(rows[0].endingEquity).toBe(6250);
    expect(rows[0].fallbackMetrics).toBeNull();
  });

  it("ignores broker metrics when the connector does not support them", () => {
    const result: FetchCompetitionDataResult = {
      accounts: [{ accountNumber: "TC-1", userId: "u1" }],
      snapshots: [],
      trades: [],
      brokerMetrics: [
        { accountNumber: "TC-1", roi: 10, pnl: 100, winRate: 50, tradeCount: 4 },
      ],
    };

    expect(buildLeaderboardRows(result, false, meta)[0].fallbackMetrics).toBeNull();
    expect(
      buildLeaderboardRows(result, true, meta)[0].fallbackMetrics
    ).toEqual({ roi: 10, pnl: 100, winRate: 50, tradeCount: 4 });
  });

  it("only counts closed trades in closedTradePnls", () => {
    const result: FetchCompetitionDataResult = {
      accounts: [{ accountNumber: "TC-1", userId: "u1" }],
      snapshots: [],
      trades: [
        {
          accountNumber: "TC-1",
          tradeId: "t1",
          openedAt: "2026-02-01T00:00:00.000Z",
          closedAt: "2026-02-02T00:00:00.000Z",
          symbol: "EURUSD",
          side: "buy",
          volume: 1,
          openPrice: 1,
          fees: 0,
          swap: 0,
          netPnl: 120,
          currency: "USD",
          source: "broker",
        },
        {
          accountNumber: "TC-1",
          tradeId: "t2",
          openedAt: "2026-02-03T00:00:00.000Z",
          symbol: "EURUSD",
          side: "sell",
          volume: 1,
          openPrice: 1,
          fees: 0,
          swap: 0,
          netPnl: -50,
          currency: "USD",
          source: "broker",
        },
      ],
      brokerMetrics: [],
    };

    expect(buildLeaderboardRows(result, false, meta)[0].closedTradePnls).toEqual([
      120,
    ]);
  });

  it("skips accounts with no metadata", () => {
    const result: FetchCompetitionDataResult = {
      accounts: [{ accountNumber: "UNKNOWN", userId: "u9" }],
      snapshots: [],
      trades: [],
      brokerMetrics: [],
    };

    expect(buildLeaderboardRows(result, false, meta)).toHaveLength(0);
  });
});
