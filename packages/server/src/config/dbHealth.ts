import mongoose from "mongoose";

import connectDB from "./database";

const PING_TIMEOUT_MS = 5000;

/**
 * Drop the current MongoClient and connect again, so the driver rediscovers
 * the replica set instead of reusing a topology it can no longer reconcile.
 * connectDB() owns the retry loop, so a failure here is not fatal.
 */
async function rebuildConnection(): Promise<void> {
  try {
    await mongoose.disconnect();
  } catch {
    // Already down, or the socket is unusable — either way, reconnect next.
  }
  await connectDB();
}

/**
 * Does the database actually answer?
 *
 * `mongoose.connection.readyState` alone is not enough: after an Atlas tier
 * migration the driver can hold a connected-looking topology whose cached
 * election state no longer matches the cluster, and every real query fails
 * with `commonWireVersion: 0`. Only a round trip proves the connection works.
 */
export async function pingDatabase(): Promise<boolean> {
  try {
    const db = mongoose.connection.db;
    if (mongoose.connection.readyState !== 1 || !db) return false;

    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error("ping timed out")),
        PING_TIMEOUT_MS
      );
    });

    try {
      await Promise.race([db.admin().ping(), timeout]);
      return true;
    } finally {
      if (timer) clearTimeout(timer);
    }
  } catch {
    return false;
  }
}

/**
 * Rebuild the connection when the database has been unreachable for a
 * sustained period.
 *
 * The problem this solves: an Atlas tier migration can leave the driver
 * holding a topology whose cached election state no longer matches the
 * cluster, and every query then fails with `commonWireVersion: 0` while the
 * driver never re-converges. A fresh client fixes it; nothing else does.
 *
 * It deliberately does NOT exit the process. An earlier version did, relying
 * on `restartPolicyType = "ON_FAILURE"` to restart us, and that was a bad
 * trade: exiting cannot tell a wedged driver apart from a database that is
 * simply unreachable for a while, and in the latter case the container exits,
 * restarts, exits again, and once the platform's retry budget is gone the app
 * stays dead until a human intervenes. On 2026-08-10 that turned a
 * database blip into a ~10-hour outage — far worse than the wedge it was
 * written to prevent. Dropping and rebuilding the client in-process gets the
 * same fresh topology, costs only the in-flight queries, and degrades to a
 * harmless retry loop when the database is genuinely down: the server keeps
 * serving, exactly as it did before any of this existed.
 *
 * `probe` and `reconnect` are injectable so tests can drive the sequence;
 * production callers use the defaults.
 *
 * Returns a stop function.
 */
export function startDbWatchdog(
  probe: () => Promise<boolean> = pingDatabase,
  reconnect: () => Promise<void> = rebuildConnection
): () => void {
  if (process.env.DB_WATCHDOG_ENABLED === "false") {
    console.log("⏸  DB watchdog disabled (DB_WATCHDOG_ENABLED=false)");
    return () => {};
  }

  const intervalMs =
    Number(process.env.DB_WATCHDOG_INTERVAL_SECONDS || 60) * 1000;
  const threshold = Number(process.env.DB_WATCHDOG_FAILURES || 5);

  let consecutiveFailures = 0;
  let rebuilds = 0;
  let checking = false;

  const check = async () => {
    if (checking) return;
    checking = true;
    try {
      if (await probe()) {
        if (consecutiveFailures > 0) {
          console.log(
            `✅ Database reachable again after ${consecutiveFailures} failed check(s)`
          );
        }
        consecutiveFailures = 0;
        return;
      }

      consecutiveFailures++;
      console.error(
        `❌ Database unreachable (${consecutiveFailures}/${threshold} checks)`
      );

      if (consecutiveFailures >= threshold) {
        rebuilds++;
        console.error(
          `♻️  Rebuilding the MongoDB connection (attempt ${rebuilds}) — ` +
            "dropping the client so server discovery starts from scratch"
        );
        // Start the count again so the next rebuild is another full threshold
        // away: if the database is genuinely down this settles into a slow
        // retry rather than thrashing the connection every tick.
        consecutiveFailures = 0;
        try {
          await reconnect();
        } catch (error) {
          console.error(
            "   rebuild failed:",
            error instanceof Error ? error.message : error
          );
        }
      }
    } finally {
      checking = false;
    }
  };

  console.log(
    `🩺 DB watchdog enabled — checking every ${intervalMs / 1000}s, ` +
      `rebuilding the connection after ${threshold} consecutive failures`
  );
  const timer = setInterval(check, intervalMs);
  return () => clearInterval(timer);
}
