import { describe, expect, it } from "vitest";
import { calculateLeaderboard } from "../../services/leaderboard/calculateLeaderboard";

describe("calculateLeaderboard", () => {
  it("ranks rows by ROI and breaks ties by P&L then win rate", () => {
    const rows = calculateLeaderboard([
      {
        participantId: "p1",
        accountNumber: "10001",
        startingEquity: 10000,
        endingEquity: 11200,
        closedTradePnls: [100, 100],
        fallbackMetrics: null,
      },
      {
        participantId: "p2",
        accountNumber: "10002",
        startingEquity: 10000,
        endingEquity: 11200,
        closedTradePnls: [50, 50, 50],
        fallbackMetrics: null,
      },
    ]);

    expect(rows[0].participantId).toBe("p1");
    expect(rows[0].rank).toBe(1);
    expect(rows[1].rank).toBe(2);
  });

  it("derives P&L from the equity change when the connector returns no raw trades (FP Markets)", () => {
    const rows = calculateLeaderboard([
      {
        participantId: "p1",
        accountNumber: "81049662",
        startingEquity: 1276.22,
        endingEquity: 1217.22,
        closedTradePnls: [],
        fallbackMetrics: null,
      },
    ]);

    expect(rows[0].calculationStatus).toBe("ranked");
    expect(rows[0].pnl).toBeCloseTo(-59, 2); // 1217.22 - 1276.22
    expect(rows[0].tradeCount).toBe(0); // FP sends no trades — count stays 0
    expect(rows[0].winRate).toBe(0);
    expect(rows[0].roi).toBeCloseTo(-4.623, 2);
  });

  it("derives the ROI baseline from current balance minus trade P&L, not a stale first balance", () => {
    // Account ended at 1.15 after losing 9484 in-window. Baseline must be
    // reconstructed as 1.15 - (-9484) = 9485.15, NOT the stale 1.15 (which
    // would give an absurd -824,706% ROI).
    const rows = calculateLeaderboard([
      {
        participantId: "p1",
        accountNumber: "82200517",
        currency: "USD",
        startingEquity: 1.15,
        endingEquity: 1.15,
        closedTradePnls: [-4742, -4742],
        fallbackMetrics: null,
      },
    ]);

    expect(rows[0].pnl).toBe(-9484);
    expect(rows[0].roi).toBeCloseTo(-99.988, 2); // -9484 / 9485.15
  });
});
