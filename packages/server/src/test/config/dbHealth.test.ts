import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { pingDatabase, startDbWatchdog } from "../../config/dbHealth";

/**
 * The watchdog recovers a wedged driver topology by rebuilding the client in
 * process. It must never exit: an earlier version did, and when the database
 * was merely unreachable rather than wedged, the container exited, restarted,
 * exited again, and stayed dead once the platform's retry budget ran out —
 * a ~10-hour outage on 2026-08-10. The exit assertions below are the
 * regression guard for that.
 */

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri("ltl_health_test"));
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

describe("pingDatabase", () => {
  it("is true against a live connection", async () => {
    expect(await pingDatabase()).toBe(true);
  });

  it("is false when the ping itself throws", async () => {
    vi.spyOn(mongoose.connection.db!, "admin").mockImplementation(
      () => ({ ping: () => Promise.reject(new Error("no primary")) }) as any
    );

    expect(await pingDatabase()).toBe(false);
    vi.restoreAllMocks();
  });

  it("is false when the connection is not ready", async () => {
    const state = vi
      .spyOn(mongoose.connection, "readyState", "get")
      .mockReturnValue(0 as any);

    expect(await pingDatabase()).toBe(false);
    state.mockRestore();
  });
});

describe("startDbWatchdog", () => {
  let exitSpy: any;
  let reconnect: any;
  let stop: () => void = () => {};
  // Injected rather than pinging for real: under fake timers the ping's own
  // 5s timeout fires before any real round trip resolves, so a live probe
  // would report failure no matter what the database is doing.
  let healthy: boolean;
  const probe = () => Promise.resolve(healthy);

  beforeEach(() => {
    vi.useFakeTimers();
    healthy = true;
    reconnect = vi.fn().mockResolvedValue(undefined);
    process.env.DB_WATCHDOG_INTERVAL_SECONDS = "60";
    process.env.DB_WATCHDOG_FAILURES = "3";
    exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    stop();
    stop = () => {};
    vi.restoreAllMocks();
    vi.useRealTimers();
    delete process.env.DB_WATCHDOG_INTERVAL_SECONDS;
    delete process.env.DB_WATCHDOG_FAILURES;
    delete process.env.DB_WATCHDOG_ENABLED;
  });

  it("rebuilds the connection only after the failure threshold is reached", async () => {
    healthy = false;
    stop = startDbWatchdog(probe, reconnect);

    await vi.advanceTimersByTimeAsync(60_000);
    await vi.advanceTimersByTimeAsync(60_000);
    // Two failures is a blip — the driver's own retries should cover it.
    expect(reconnect).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(60_000);
    expect(reconnect).toHaveBeenCalledTimes(1);
  });

  it("never exits the process, however long the database is down", async () => {
    healthy = false;
    stop = startDbWatchdog(probe, reconnect);

    await vi.advanceTimersByTimeAsync(60_000 * 30);

    // The whole point: a sustained outage must degrade to a retry loop, not
    // kill the container and burn the platform's restart budget.
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("spaces rebuilds a full threshold apart during a long outage", async () => {
    healthy = false;
    stop = startDbWatchdog(probe, reconnect);

    await vi.advanceTimersByTimeAsync(60_000 * 3);
    expect(reconnect).toHaveBeenCalledTimes(1);

    // Not every subsequent tick — the counter restarts after each rebuild.
    await vi.advanceTimersByTimeAsync(60_000 * 2);
    expect(reconnect).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(60_000);
    expect(reconnect).toHaveBeenCalledTimes(2);
  });

  it("keeps running when a rebuild throws", async () => {
    healthy = false;
    reconnect = vi.fn().mockRejectedValue(new Error("still unreachable"));
    stop = startDbWatchdog(probe, reconnect);

    await vi.advanceTimersByTimeAsync(60_000 * 3);
    expect(reconnect).toHaveBeenCalledTimes(1);

    // A failed rebuild must not stop the watchdog or take the process down.
    await vi.advanceTimersByTimeAsync(60_000 * 3);
    expect(reconnect).toHaveBeenCalledTimes(2);
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("resets the failure count when the database comes back", async () => {
    healthy = false;
    stop = startDbWatchdog(probe, reconnect);

    await vi.advanceTimersByTimeAsync(60_000);
    await vi.advanceTimersByTimeAsync(60_000);

    // Recovered before the threshold.
    healthy = true;
    await vi.advanceTimersByTimeAsync(60_000);

    // A later blip must start counting from zero, not tip us over.
    healthy = false;
    await vi.advanceTimersByTimeAsync(60_000);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(reconnect).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(60_000);
    expect(reconnect).toHaveBeenCalledTimes(1);
  });

  it("never touches the connection while the database answers", async () => {
    stop = startDbWatchdog(probe, reconnect);

    await vi.advanceTimersByTimeAsync(60_000 * 10);

    expect(reconnect).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("can be switched off", async () => {
    process.env.DB_WATCHDOG_ENABLED = "false";
    healthy = false;
    stop = startDbWatchdog(probe, reconnect);

    await vi.advanceTimersByTimeAsync(60_000 * 10);

    expect(reconnect).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
