import { describe, expect, it } from "vitest";
import { getBrokerConnector } from "../../services/brokers";

describe("fixture connector", () => {
  it("returns snapshots and trades for a seeded account", async () => {
    const connector = getBrokerConnector("fixture");
    const result = await connector.fetchCompetitionData({
      tournamentId: "tour-1",
      accounts: [{ accountNumber: "10001", userId: "user-1" }],
    });

    expect(result.accounts).toHaveLength(1);
    expect(result.snapshots.length).toBeGreaterThan(0);
    expect(result.trades.length).toBeGreaterThan(0);
  });
});
