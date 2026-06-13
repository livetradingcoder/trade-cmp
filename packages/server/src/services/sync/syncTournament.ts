import Tournament from "../../models/Tournament";
import TradingAccount, { ITradingAccount } from "../../models/TradingAccount";
import AccountSnapshot from "../../models/AccountSnapshot";
import Trade from "../../models/Trade";
import SyncRun from "../../models/SyncRun";
import LeaderboardCache from "../../models/LeaderboardCache";
import BrokerIntegration from "../../models/BrokerIntegration";
import { getBrokerConnector } from "../brokers";
import { FetchCompetitionDataResult } from "../brokers/types";
import { calculateLeaderboard, InputRow } from "../leaderboard/calculateLeaderboard";
import {
  AccountMeta,
  buildLeaderboardRows,
  maskAccountNumber,
} from "./buildLeaderboard";

const CACHE_TTL_MINUTES = 15;

export interface SyncTournamentResult {
  syncRunId: string | null;
  status: "success" | "partial" | "failed";
  accountsProcessed: number;
  snapshotsWritten: number;
  tradesWritten: number;
  leaderboardEntriesWritten: number;
  errors: string[];
}

/**
 * Sync one tournament: pull broker performance data for every eligible
 * (approved, active) trading account, persist snapshots/trades, recompute the
 * leaderboard, and write the LeaderboardCache. Records a SyncRun for audit.
 */
export async function syncTournament(
  tournamentId: string
): Promise<SyncTournamentResult> {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    throw new Error(`Tournament ${tournamentId} not found`);
  }

  // Eligible accounts = active trading accounts whose participant is approved.
  const accounts = await TradingAccount.find({
    tournament_id: tournamentId,
    status: "active",
  })
    .populate({ path: "participant_id", select: "status" })
    .populate({ path: "user_id", select: "display_name fp_account_number" });

  const eligible = accounts.filter((account) => {
    const participant = account.participant_id as any;
    return participant && participant.status === "approved";
  });

  // Group eligible accounts by their broker integration.
  const groups = new Map<string, ITradingAccount[]>();
  for (const account of eligible) {
    const key = String(account.broker_integration_id);
    const list = groups.get(key) ?? [];
    list.push(account);
    groups.set(key, list);
  }

  if (groups.size === 0) {
    // Nothing to sync — leave any existing cache untouched.
    return {
      syncRunId: null,
      status: "success",
      accountsProcessed: 0,
      snapshotsWritten: 0,
      tradesWritten: 0,
      leaderboardEntriesWritten: 0,
      errors: [],
    };
  }

  const integrationIds = [...groups.keys()];
  const startDate = tournament.start_date?.toISOString();
  const endDate = tournament.end_date?.toISOString();
  const now = new Date();

  const syncRun = await SyncRun.create({
    tournament_id: tournament._id,
    broker_integration_id: integrationIds[0],
    started_at: now,
    status: "running",
  });

  const metaByAccount = new Map<string, AccountMeta>();
  const leaderboardRows: InputRow[] = [];
  const errors: string[] = [];

  let accountsProcessed = 0;
  let snapshotsWritten = 0;
  let tradesWritten = 0;
  let succeededGroups = 0;
  let failedGroups = 0;

  for (const integrationId of integrationIds) {
    const group = groups.get(integrationId)!;

    try {
      const integration = await BrokerIntegration.findById(integrationId);
      if (!integration || !integration.enabled) {
        throw new Error(
          `Broker integration ${integrationId} is missing or disabled`
        );
      }

      const connector = getBrokerConnector(integration.type);

      const result: FetchCompetitionDataResult =
        await connector.fetchCompetitionData({
          tournamentId,
          accounts: group.map((account) => ({
            accountNumber: account.broker_account_number,
            userId: String((account.user_id as any)?._id ?? account.user_id),
          })),
          startDate,
          endDate,
        });

      const accountByNumber = new Map(
        group.map((account) => [account.broker_account_number, account])
      );

      // Persist snapshots (idempotent on trading_account_id + captured_at).
      for (const snapshot of result.snapshots) {
        const account = accountByNumber.get(snapshot.accountNumber);
        if (!account) continue;
        await AccountSnapshot.updateOne(
          {
            trading_account_id: account._id,
            captured_at: new Date(snapshot.capturedAt),
          },
          {
            $set: {
              balance: snapshot.balance,
              equity: snapshot.equity,
              currency: snapshot.currency,
              source: snapshot.source,
            },
          },
          { upsert: true }
        );
        snapshotsWritten++;
      }

      // Persist trades (idempotent on trading_account_id + broker_trade_id).
      for (const trade of result.trades) {
        const account = accountByNumber.get(trade.accountNumber);
        if (!account) continue;
        await Trade.updateOne(
          { trading_account_id: account._id, broker_trade_id: trade.tradeId },
          {
            $set: {
              opened_at: new Date(trade.openedAt),
              closed_at: trade.closedAt ? new Date(trade.closedAt) : undefined,
              symbol: trade.symbol,
              side: trade.side,
              volume: trade.volume,
              open_price: trade.openPrice,
              close_price: trade.closePrice,
              fees: trade.fees,
              swap: trade.swap,
              net_pnl: trade.netPnl,
              currency: trade.currency,
              source: trade.source,
            },
          },
          { upsert: true }
        );
        tradesWritten++;
      }

      // Build leaderboard metadata + rows for this group.
      const groupMeta = new Map<string, AccountMeta>();
      for (const account of group) {
        const user = account.user_id as any;
        const meta: AccountMeta = {
          accountNumber: account.broker_account_number,
          participantId: String(
            (account.participant_id as any)?._id ?? account.participant_id
          ),
          tradingAccountId: String(account._id),
          displayName:
            (user && user.display_name) ||
            `Trader ${maskAccountNumber(account.broker_account_number)}`,
        };
        groupMeta.set(account.broker_account_number, meta);
        metaByAccount.set(account.broker_account_number, meta);
      }

      leaderboardRows.push(
        ...buildLeaderboardRows(
          result,
          connector.supportsBrokerMetrics,
          groupMeta
        )
      );

      accountsProcessed += result.accounts.length;
      succeededGroups++;

      // Mark this group's accounts as freshly synced.
      await TradingAccount.updateMany(
        { _id: { $in: group.map((account) => account._id) } },
        { $set: { last_synced_at: now, sync_state: "ready" } }
      );
    } catch (error: any) {
      failedGroups++;
      const message = error?.message || "Unknown sync error";
      errors.push(`integration ${integrationId}: ${message}`);
      await TradingAccount.updateMany(
        { _id: { $in: group.map((account) => account._id) } },
        { $set: { sync_state: "error" } }
      );
    }
  }

  // Recompute leaderboard and write the cache.
  const ranked = calculateLeaderboard(leaderboardRows);
  const rankings = ranked
    .map((row) => {
      const meta = metaByAccount.get(row.accountNumber);
      if (!meta) return null;
      return {
        rank: row.rank,
        participant_id: meta.participantId,
        trading_account_id: meta.tradingAccountId,
        display_name: meta.displayName,
        account_masked: maskAccountNumber(row.accountNumber),
        roi: row.roi,
        pnl: row.pnl,
        win_rate: row.winRate,
        trade_count: row.tradeCount,
        calculation_source: row.calculationSource,
        calculation_status: row.calculationStatus,
        updated_at: now,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  if (rankings.length > 0) {
    await LeaderboardCache.updateOne(
      { tournament_id: tournament._id },
      {
        $set: {
          rankings,
          fetched_at: now,
          expires_at: new Date(now.getTime() + CACHE_TTL_MINUTES * 60000),
        },
      },
      { upsert: true }
    );
  }

  const status: SyncTournamentResult["status"] =
    failedGroups === 0
      ? "success"
      : succeededGroups === 0
        ? "failed"
        : "partial";

  await SyncRun.updateOne(
    { _id: syncRun._id },
    {
      $set: {
        finished_at: new Date(),
        status,
        accounts_processed: accountsProcessed,
        snapshots_written: snapshotsWritten,
        trades_written: tradesWritten,
        leaderboard_entries_written: rankings.length,
        error_summary: errors.join("; "),
      },
    }
  );

  return {
    syncRunId: String(syncRun._id),
    status,
    accountsProcessed,
    snapshotsWritten,
    tradesWritten,
    leaderboardEntriesWritten: rankings.length,
    errors,
  };
}
