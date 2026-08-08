import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { pingDatabase, startDbWatchdog } from "../../config/dbHealth";

/**
 * The watchdog is the only automatic recovery from a wedged driver topology:
 * Railway's healthcheck gates deploys, it does not police a running container,
 * so a non-zero exit plus restartPolicyType=ON_FAILURE is what restarts us.
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
  let stop: () => void = () => {};
  // Injected rather than pinging for real: under fake timers the ping's own
  // 5s timeout fires before any real round trip resolves, so a live probe
  // would report failure no matter what the database is doing.
  let healthy: boolean;
  const probe = () => Promise.resolve(healthy);

  beforeEach(() => {
    vi.useFakeTimers();
    healthy = true;
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

  it("exits only after the failure threshold is reached", async () => {
    healthy = false;
    stop = startDbWatchdog(probe);

    await vi.advanceTimersByTimeAsync(60_000);
    await vi.advanceTimersByTimeAsync(60_000);
    // Two failures is a blip — the driver's own retries should cover it.
    expect(exitSpy).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(60_000);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("resets the failure count when the database comes back", async () => {
    healthy = false;
    stop = startDbWatchdog(probe);

    await vi.advanceTimersByTimeAsync(60_000);
    await vi.advanceTimersByTimeAsync(60_000);

    // Recovered before the threshold.
    healthy = true;
    await vi.advanceTimersByTimeAsync(60_000);

    // A later blip must start counting from zero, not tip us over.
    healthy = false;
    await vi.advanceTimersByTimeAsync(60_000);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(exitSpy).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(60_000);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("never exits while the database answers", async () => {
    stop = startDbWatchdog(probe);

    await vi.advanceTimersByTimeAsync(60_000 * 10);

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("can be switched off", async () => {
    process.env.DB_WATCHDOG_ENABLED = "false";
    healthy = false;
    stop = startDbWatchdog(probe);

    await vi.advanceTimersByTimeAsync(60_000 * 10);

    expect(exitSpy).not.toHaveBeenCalled();
  });
});
