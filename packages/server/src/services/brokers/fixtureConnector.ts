import { BrokerConnector } from "./types";

export const fixtureConnector: BrokerConnector = {
  type: "fixture",
  supportsRawTrades: true,
  supportsSnapshots: true,
  supportsBrokerMetrics: true,
  async fetchCompetitionData({ accounts }) {
    return {
      accounts,
      snapshots: accounts.flatMap((account, index) => [
        {
          accountNumber: account.accountNumber,
          capturedAt: "2026-04-01T00:00:00.000Z",
          balance: 10000,
          equity: 10000,
          currency: "USD",
          source: "fixture",
        },
        {
          accountNumber: account.accountNumber,
          capturedAt: "2026-04-20T00:00:00.000Z",
          balance: 10000 + (index + 1) * 750,
          equity: 10000 + (index + 1) * 750,
          currency: "USD",
          source: "fixture",
        },
      ]),
      trades: accounts.map((account, index) => ({
        accountNumber: account.accountNumber,
        tradeId: `fixture-${account.accountNumber}-1`,
        openedAt: "2026-04-05T09:00:00.000Z",
        closedAt: "2026-04-05T12:00:00.000Z",
        symbol: "EURUSD",
        side: "buy" as const,
        volume: 1,
        openPrice: 1.08,
        closePrice: 1.09,
        fees: 3,
        swap: 0,
        netPnl: 100 + index * 25,
        currency: "USD",
        source: "fixture",
      })),
      brokerMetrics: accounts.map((account, index) => ({
        accountNumber: account.accountNumber,
        roi: 7.5 + index,
        pnl: 750 + index * 100,
        winRate: 60 + index * 2,
        tradeCount: 1,
      })),
    };
  },
};
