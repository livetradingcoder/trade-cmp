export type InputRow = {
  participantId: string;
  accountNumber: string;
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
      const pnl = row.closedTradePnls.reduce((sum, value) => sum + value, 0);
      const wins = row.closedTradePnls.filter((value) => value > 0).length;
      const tradeCount = row.closedTradePnls.length;
      const winRate = tradeCount > 0 ? (wins / tradeCount) * 100 : 0;
      const roi =
        ((row.endingEquity - row.startingEquity) / row.startingEquity) * 100;

      return {
        participantId: row.participantId,
        accountNumber: row.accountNumber,
        rank: 0,
        roi,
        pnl,
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
