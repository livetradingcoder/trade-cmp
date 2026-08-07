export type InputRow = {
  participantId: string;
  accountNumber: string;
  currency?: string;
  startingEquity?: number | null;
  endingEquity?: number | null;
  closedTradePnls: number[];
  fallbackMetrics: null | {
    roi: number;
    pnl: number;
    winRate: number;
    tradeCount: number;
  };
};

type OutputRow = {
  participantId: string;
  accountNumber: string;
  rank: number;
  roi: number;
  pnl: number;
  currency: string;
  winRate: number;
  tradeCount: number;
  calculationSource: "computed_raw" | "broker_metrics";
  calculationStatus: "ranked" | "insufficient_data";
};

export function calculateLeaderboard(rows: InputRow[]): OutputRow[] {
  const computed = rows.map((row) => {
    if (
      row.startingEquity != null &&
      row.endingEquity != null &&
      row.startingEquity > 0
    ) {
      // When the connector exposes raw trades, P&L and ROI both come from the
      // sum of closed-trade net PnL — exact, and immune to mid-competition
      // deposits/withdrawals (which move balance but aren't trading profit).
      // Without trades, fall back to the equity change over the period.
      const tradePnl = row.closedTradePnls.reduce((sum, value) => sum + value, 0);
      const hasTrades = row.closedTradePnls.length > 0;
      const pnl = hasTrades ? tradePnl : row.endingEquity - row.startingEquity;
      // ROI baseline = starting capital for the period. With trades, derive it
      // from the current balance minus the window's trading P&L
      // (current = start + ΣpnL, ignoring deposits) — a stable baseline that
      // doesn't depend on FP's reserved starting_balance or a stale "first
      // observed" balance. Without trades, use the first observed equity.
      const baseline = hasTrades
        ? row.endingEquity - tradePnl
        : row.startingEquity;
      const roi = baseline > 0 ? (pnl / baseline) * 100 : 0;
      const wins = row.closedTradePnls.filter((value) => value > 0).length;
      const tradeCount = row.closedTradePnls.length;
      const winRate = tradeCount > 0 ? (wins / tradeCount) * 100 : 0;

      return {
        participantId: row.participantId,
        accountNumber: row.accountNumber,
        rank: 0,
        roi,
        pnl,
        currency: row.currency || "USD",
        winRate,
        tradeCount,
        calculationSource: "computed_raw" as const,
        calculationStatus: "ranked" as const,
      };
    }

    if (row.fallbackMetrics) {
      return {
        participantId: row.participantId,
        accountNumber: row.accountNumber,
        rank: 0,
        roi: row.fallbackMetrics.roi,
        pnl: row.fallbackMetrics.pnl,
        currency: row.currency || "USD",
        winRate: row.fallbackMetrics.winRate,
        tradeCount: row.fallbackMetrics.tradeCount,
        calculationSource: "broker_metrics" as const,
        calculationStatus: "ranked" as const,
      };
    }

    return {
      participantId: row.participantId,
      accountNumber: row.accountNumber,
      rank: 0,
      roi: 0,
      pnl: 0,
      currency: row.currency || "USD",
      winRate: 0,
      tradeCount: 0,
      calculationSource: "computed_raw" as const,
      calculationStatus: "insufficient_data" as const,
    };
  });

  const ranked = computed
    .filter((row) => row.calculationStatus === "ranked")
    .sort((a, b) => {
      if (b.roi !== a.roi) return b.roi - a.roi;
      if (b.pnl !== a.pnl) return b.pnl - a.pnl;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return a.accountNumber.localeCompare(b.accountNumber);
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const unranked = computed.filter(
    (row) => row.calculationStatus === "insufficient_data"
  );

  return [...ranked, ...unranked];
}
