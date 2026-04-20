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
});
