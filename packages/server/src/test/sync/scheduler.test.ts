import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Tournament from "../../models/Tournament";
import * as syncModule from "../../services/sync/syncTournament";
import { startSyncScheduler } from "../../services/sync/scheduler";

/**
 * The scheduler fires on a fixed interval, but a tick can outlast it (a wide
 * date window against a high-trade account). These pin the guard that stops
 * those runs from stacking on top of each other.
 */

const INTERVAL_MS = 60_000;

function stubActiveTournaments(): void {
  vi.spyOn(Tournament, "find").mockReturnValue({
    select: () => Promise.resolve([{ _id: "t1", title: "Poli" }]),
  } as any);
}

/** Let queued promise callbacks run without advancing the fake clock. */
async function flush(): Promise<void> {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

beforeEach(() => {
  vi.useFakeTimers();
  process.env.SYNC_ENABLED = "true";
  process.env.SYNC_INTERVAL_MINUTES = "1";
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  delete process.env.SYNC_ENABLED;
  delete process.env.SYNC_INTERVAL_MINUTES;
});

describe("sync scheduler", () => {
  it("skips a tick while the previous sync is still running", async () => {
    stubActiveTournaments();

    // A sync that never settles for the duration of the test — the exact case
    // that used to let runs pile up.
    let release: (value: any) => void = () => {};
    const pending = new Promise((resolve) => {
      release = resolve;
    });
    const syncSpy = vi
      .spyOn(syncModule, "syncTournament")
      .mockReturnValue(pending as any);

    startSyncScheduler();

    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    await flush();
    expect(syncSpy).toHaveBeenCalledTimes(1);

    // Three more intervals elapse while the first run is still in flight.
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 3);
    await flush();
    expect(syncSpy).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("Previous sync still running")
    );

    release({
      status: "success",
      accountsProcessed: 0,
      snapshotsWritten: 0,
      errors: [],
    });
    await flush();
  });

  it("resumes syncing once the in-flight run finishes", async () => {
    stubActiveTournaments();

    const syncSpy = vi
      .spyOn(syncModule, "syncTournament")
      .mockResolvedValue({
        syncRunId: "r1",
        status: "success",
        accountsProcessed: 1,
        snapshotsWritten: 1,
        tradesWritten: 0,
        leaderboardEntriesWritten: 1,
        errors: [],
      } as any);

    startSyncScheduler();

    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    await flush();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    await flush();

    // Each run settles well inside the interval, so nothing is skipped.
    expect(syncSpy).toHaveBeenCalledTimes(2);
    expect(console.warn).not.toHaveBeenCalledWith(
      expect.stringContaining("Previous sync still running")
    );
  });

  it("does nothing when SYNC_ENABLED is not true", async () => {
    process.env.SYNC_ENABLED = "false";
    stubActiveTournaments();
    const syncSpy = vi.spyOn(syncModule, "syncTournament");

    startSyncScheduler();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 3);
    await flush();

    expect(syncSpy).not.toHaveBeenCalled();
  });
});
