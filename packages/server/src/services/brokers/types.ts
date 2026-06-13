export interface ConnectorAccountInput {
  accountNumber: string;
  userId: string;
}

export interface FetchCompetitionDataInput {
  tournamentId: string;
  accounts: ConnectorAccountInput[];
  // Optional reporting window (ISO date or datetime). Connectors that query a
  // broker for a date range (e.g. fpmarkets) use these; fixture/simulation
  // ignore them. When omitted the connector falls back to its own default.
  startDate?: string;
  endDate?: string;
}

export interface NormalizedSnapshotInput {
  accountNumber: string;
  capturedAt: string;
  balance: number;
  equity: number;
  currency: string;
  source: "fixture" | "simulation" | "broker";
}

export interface NormalizedTradeInput {
  accountNumber: string;
  tradeId: string;
  openedAt: string;
  closedAt?: string;
  symbol: string;
  side: "buy" | "sell";
  volume: number;
  openPrice: number;
  closePrice?: number;
  fees: number;
  swap: number;
  netPnl: number;
  currency: string;
  source: "fixture" | "simulation" | "broker";
}

export interface BrokerMetricInput {
  accountNumber: string;
  roi: number;
  pnl: number;
  winRate: number;
  tradeCount: number;
}

export interface FetchCompetitionDataResult {
  accounts: ConnectorAccountInput[];
  snapshots: NormalizedSnapshotInput[];
  trades: NormalizedTradeInput[];
  brokerMetrics: BrokerMetricInput[];
}

export interface BrokerConnector {
  type: string;
  supportsRawTrades: boolean;
  supportsSnapshots: boolean;
  supportsBrokerMetrics: boolean;
  fetchCompetitionData(
    input: FetchCompetitionDataInput
  ): Promise<FetchCompetitionDataResult>;
}
