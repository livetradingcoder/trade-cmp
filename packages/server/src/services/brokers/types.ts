export interface ConnectorAccountInput {
  accountNumber: string;
  userId: string;
}

import { BrokerConfig } from "./config";

export type { BrokerConfig };

export interface FetchCompetitionDataInput {
  tournamentId: string;
  accounts: ConnectorAccountInput[];
  // Optional reporting window (ISO date or datetime). Connectors that query a
  // broker for a date range (e.g. fpmarkets) use these; fixture/simulation
  // ignore them. When omitted the connector falls back to its own default.
  startDate?: string;
  endDate?: string;
  /** Credentials for the integration this call belongs to. */
  config?: BrokerConfig;
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

/** A balance a broker can report for an account it manages. */
export interface BrokerAccountBalance {
  balance: number;
  currency: string;
}

export interface BrokerConnector {
  type: string;
  supportsRawTrades: boolean;
  supportsSnapshots: boolean;
  supportsBrokerMetrics: boolean;
  fetchCompetitionData(
    input: FetchCompetitionDataInput
  ): Promise<FetchCompetitionDataResult>;

  /**
   * Account numbers currently mapped under this broker's IB/rebate.
   *
   * Used to verify for real that a participant is registered under our
   * referral code. Optional: a broker that cannot report its managed accounts
   * simply skips referral verification rather than failing it.
   */
  listManagedAccounts?(config?: BrokerConfig): Promise<Set<string>>;

  /**
   * Live balance per managed account.
   *
   * Lets an admin see how funded a PENDING applicant is — they have no trading
   * account yet, so no stored snapshot exists. Optional for the same reason.
   */
  getAccountBalances?(
    config?: BrokerConfig
  ): Promise<Map<string, BrokerAccountBalance>>;
}
