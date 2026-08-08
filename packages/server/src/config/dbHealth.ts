import mongoose from "mongoose";

const PING_TIMEOUT_MS = 5000;

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
 * Exit the process when the database has been unreachable for a sustained
 * period, so the platform restarts us with a fresh driver topology.
 *
 * This is the only automatic recovery available here: Railway's healthcheck
 * runs at deploy time to gate the traffic switch, not continuously against a
 * running container — so an app that wedges mid-flight stays wedged. What does
 * fire is `restartPolicyType = "ON_FAILURE"` in railway.toml, and that needs a
 * non-zero exit. A restart re-runs server discovery from scratch, which is
 * what an operator would do by hand.
 *
 * Deliberately slow to pull the trigger: a brief blip should ride out on the
 * driver's own retries, and restarting into a genuinely down Atlas would just
 * be a crash loop. Only a sustained outage is worth a restart.
 *
 * `probe` exists so tests can drive the failure sequence directly; production
 * callers use the default.
 *
 * Returns a stop function.
 */
export function startDbWatchdog(
  probe: () => Promise<boolean> = pingDatabase
): () => void {
  if (process.env.DB_WATCHDOG_ENABLED === "false") {
    console.log("⏸  DB watchdog disabled (DB_WATCHDOG_ENABLED=false)");
    return () => {};
  }

  const intervalMs =
    Number(process.env.DB_WATCHDOG_INTERVAL_SECONDS || 60) * 1000;
  const threshold = Number(process.env.DB_WATCHDOG_FAILURES || 5);

  let consecutiveFailures = 0;
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
        console.error(
          "💥 Database unreachable for too long — exiting so the platform " +
            "restarts this container with a fresh connection topology"
        );
        process.exit(1);
      }
    } finally {
      checking = false;
    }
  };

  console.log(
    `🩺 DB watchdog enabled — checking every ${intervalMs / 1000}s, ` +
      `restarting after ${threshold} consecutive failures`
  );
  const timer = setInterval(check, intervalMs);
  return () => clearInterval(timer);
}
