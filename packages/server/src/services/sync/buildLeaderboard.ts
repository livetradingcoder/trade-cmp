import { FetchCompetitionDataResult } from "../brokers/types";
import { InputRow } from "../leaderboard/calculateLeaderboard";

/**
 * Pure helpers for turning a connector result into leaderboard input rows.
 * Kept free of any DB access so they can be unit tested in isolation.
 */

/** Mask a broker account number, leaving only the last 4 characters visible. */
export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber) return "";
  const visible = accountNumber.slice(-4);
  const masked = "*".repeat(Math.max(0, accountNumber.length - visible.length));
  return `${masked}${visible}`;
}

export interface AccountMeta {
  accountNumber: string;
  participantId: string;
  tradingAccountId: string;
  displayName: string;
}

/**
 * Build calculateLeaderboard input rows from an in-memory connector result.
 *
 * - startingEquity/endingEquity are taken from the earliest/latest snapshot.
 * - closedTradePnls only counts trades that have closed.
 * - fallbackMetrics is only used when the connector advertises broker metrics
 *   (fpmarkets does not — its roi is reserved/always 0).
 */
export function buildLeaderboardRows(
  result: FetchCompetitionDataResult,
  supportsBrokerMetrics: boolean,
  metaByAccount: Map<string, AccountMeta>
): InputRow[] {
  const snapshotsByAccount = new Map<
    string,
    { capturedAt: string; equity: number }[]
  >();
  for (const snapshot of result.snapshots) {
    const list = snapshotsByAccount.get(snapshot.accountNumber) ?? [];
    list.push({ capturedAt: snapshot.capturedAt, equity: snapshot.equity });
    snapshotsByAccount.set(snapshot.accountNumber, list);
  }

  const tradePnlsByAccount = new Map<string, number[]>();
  for (const trade of result.trades) {
    if (!trade.closedAt) continue;
    const list = tradePnlsByAccount.get(trade.accountNumber) ?? [];
    list.push(trade.netPnl);
    tradePnlsByAccount.set(trade.accountNumber, list);
  }

  const metricByAccount = new Map(
    result.brokerMetrics.map((metric) => [metric.accountNumber, metric])
  );

  const rows: InputRow[] = [];

  for (const account of result.accounts) {
    const meta = metaByAccount.get(account.accountNumber);
    if (!meta) continue;

    const snapshots = (snapshotsByAccount.get(account.accountNumber) ?? [])
      .slice()
      .sort(
        (a, b) =>
          new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()
      );

    const startingEquity = snapshots.length ? snapshots[0].equity : null;
    const endingEquity = snapshots.length
      ? snapshots[snapshots.length - 1].equity
      : null;

    const metric = supportsBrokerMetrics
      ? metricByAccount.get(account.accountNumber)
      : undefined;

    rows.push({
      participantId: meta.participantId,
      accountNumber: account.accountNumber,
      startingEquity,
      endingEquity,
      closedTradePnls: tradePnlsByAccount.get(account.accountNumber) ?? [],
      fallbackMetrics: metric
        ? {
            roi: metric.roi,
            pnl: metric.pnl,
            winRate: metric.winRate,
            tradeCount: metric.tradeCount,
          }
        : null,
    });
  }

  return rows;
}
