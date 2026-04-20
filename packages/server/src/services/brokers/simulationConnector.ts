import { BrokerConnector } from "./types";

export const simulationConnector: BrokerConnector = {
  type: "simulation",
  supportsRawTrades: true,
  supportsSnapshots: true,
  supportsBrokerMetrics: false,
  async fetchCompetitionData({ accounts }) {
    const now = new Date("2026-04-20T00:00:00.000Z");

    return {
      accounts,
      snapshots: accounts.flatMap((account, index) => {
        const base = 10000;
        const change = (index + 1) * 420;

        return [
          {
            accountNumber: account.accountNumber,
            capturedAt: new Date(now.getTime() - 7 * 86400000).toISOString(),
            balance: base,
            equity: base,
            currency: "USD",
            source: "simulation",
          },
          {
            accountNumber: account.accountNumber,
            capturedAt: now.toISOString(),
            balance: base + change,
            equity: base + change,
            currency: "USD",
            source: "simulation",
          },
        ];
      }),
      trades: accounts.map((account, index) => ({
        accountNumber: account.accountNumber,
        tradeId: `sim-${account.accountNumber}-1`,
        openedAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
        closedAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
        symbol: "XAUUSD",
        side: "sell" as const,
        volume: 1,
        openPrice: 2300,
        closePrice: 2280,
        fees: 4,
        swap: -1,
        netPnl: 120 + index * 10,
        currency: "USD",
        source: "simulation",
      })),
      brokerMetrics: [],
    };
  },
};
