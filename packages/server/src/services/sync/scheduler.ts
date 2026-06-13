import Tournament from "../../models/Tournament";
import { syncTournament } from "./syncTournament";

/**
 * Periodically sync every active tournament.
 *
 * Disabled by default. Enable with SYNC_ENABLED=true once the broker has
 * whitelisted our outbound IP — otherwise scheduled calls just generate failed
 * requests against their API. Interval defaults to 60 minutes.
 */
export function startSyncScheduler(): void {
  if (process.env.SYNC_ENABLED !== "true") {
    console.log(
      "⏸  Sync scheduler disabled (set SYNC_ENABLED=true to enable)"
    );
    return;
  }

  const minutes = Number(process.env.SYNC_INTERVAL_MINUTES || 60);
  const intervalMs = Math.max(1, minutes) * 60_000;

  const tick = async () => {
    try {
      const tournaments = await Tournament.find({ status: "active" }).select(
        "_id title"
      );
      for (const tournament of tournaments) {
        try {
          const result = await syncTournament(String(tournament._id));
          console.log(
            `🔄 Synced "${tournament.title}": ${result.status} ` +
              `(${result.accountsProcessed} accounts, ${result.snapshotsWritten} snapshots)`
          );
          if (result.errors.length > 0) {
            console.warn(`   sync errors: ${result.errors.join("; ")}`);
          }
        } catch (error) {
          console.error(`Sync failed for "${tournament.title}":`, error);
        }
      }
    } catch (error) {
      console.error("Sync scheduler tick error:", error);
    }
  };

  console.log(`⏰ Sync scheduler enabled — every ${minutes} minute(s)`);
  setInterval(tick, intervalMs);
}
