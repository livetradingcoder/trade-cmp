import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import BrokerIntegration from "../../models/BrokerIntegration";
import { fixtureConnector } from "../../services/brokers/fixtureConnector";
import { fpMarketsConnector } from "../../services/brokers/fpMarketsConnector";
import {
  listManagedAccounts,
  getManagedAccountBalances,
} from "../../services/brokers/managedAccounts";

/**
 * Dispatch semantics for the broker-agnostic capabilities.
 *
 * These matter the moment a second broker exists: one broker being unable to
 * report, or being down, must not silently blank out another's accounts —
 * callers treat an empty set as "not managed" and a throw as "unreachable".
 */

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri("ltl_brokers_test"));
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await BrokerIntegration.deleteMany({});
});

async function enable(type: string, name = type) {
  await BrokerIntegration.create({ type, name, enabled: true });
}

describe("listManagedAccounts", () => {
  it("skips a broker that cannot report its managed accounts", async () => {
    // fixture implements no capability; fpmarkets does.
    await enable("fixture");
    await enable("fpmarkets");
    vi.spyOn(fpMarketsConnector, "listManagedAccounts").mockResolvedValue(
      new Set(["111"])
    );

    expect([...(await listManagedAccounts())]).toEqual(["111"]);
  });

  it("merges accounts across brokers", async () => {
    await enable("fixture");
    await enable("fpmarkets");
    (fixtureConnector as any).listManagedAccounts = async () =>
      new Set(["aaa"]);
    vi.spyOn(fpMarketsConnector, "listManagedAccounts").mockResolvedValue(
      new Set(["bbb"])
    );

    try {
      expect([...(await listManagedAccounts())].sort()).toEqual(["aaa", "bbb"]);
    } finally {
      delete (fixtureConnector as any).listManagedAccounts;
    }
  });

  it("returns what answered when one broker is down", async () => {
    await enable("fixture");
    await enable("fpmarkets");
    (fixtureConnector as any).listManagedAccounts = async () =>
      new Set(["aaa"]);
    vi.spyOn(fpMarketsConnector, "listManagedAccounts").mockRejectedValue(
      new Error("FP unreachable")
    );

    try {
      // One broker failing must not wipe another's accounts — that would flag
      // their participants as unverified.
      expect([...(await listManagedAccounts())]).toEqual(["aaa"]);
    } finally {
      delete (fixtureConnector as any).listManagedAccounts;
    }
  });

  it("throws when nothing could answer", async () => {
    await enable("fpmarkets");
    vi.spyOn(fpMarketsConnector, "listManagedAccounts").mockRejectedValue(
      new Error("FP unreachable")
    );

    // Callers rely on a throw to mean "keep the stored value" rather than
    // "this account is not managed".
    await expect(listManagedAccounts()).rejects.toThrow("FP unreachable");
  });

  it("ignores disabled integrations", async () => {
    await BrokerIntegration.create({
      type: "fpmarkets",
      name: "fpmarkets",
      enabled: false,
    });
    const spy = vi.spyOn(fpMarketsConnector, "listManagedAccounts");

    expect([...(await listManagedAccounts())]).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("calls a shared connector once when two integrations use it", async () => {
    // Two integrations sharing one credential set: still one call.
    const shared = { token: "t", secret: "s", base_url: "https://x.test", rebate_accounts: "1" };
    await BrokerIntegration.create({ type: "fpmarkets", name: "fp-a", enabled: true, config: shared });
    await BrokerIntegration.create({ type: "fpmarkets", name: "fp-b", enabled: true, config: shared });
    const spy = vi
      .spyOn(fpMarketsConnector, "listManagedAccounts")
      .mockResolvedValue(new Set(["111"]));

    await listManagedAccounts();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("unconnected brokers", () => {
  it("never asks a broker that has no credentials of its own", async () => {
    // A new broker added by name only. Without this guard it would fall back
    // to FP's env keys and query FP on its behalf.
    await BrokerIntegration.create({ type: "fpmarkets", name: "VT Markets", enabled: true });
    const spy = vi.spyOn(fpMarketsConnector, "listManagedAccounts");

    expect([...(await listManagedAccounts())]).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("getManagedAccountBalances", () => {
  it("merges balances and skips brokers that cannot report them", async () => {
    await enable("fixture");
    await enable("fpmarkets");
    vi.spyOn(fpMarketsConnector, "getAccountBalances").mockResolvedValue(
      new Map([["111", { balance: 28.78, currency: "USD" }]])
    );

    const balances = await getManagedAccountBalances();
    expect(balances.get("111")).toEqual({ balance: 28.78, currency: "USD" });
    expect(balances.size).toBe(1);
  });

  it("throws when nothing could answer", async () => {
    await enable("fpmarkets");
    vi.spyOn(fpMarketsConnector, "getAccountBalances").mockRejectedValue(
      new Error("FP unreachable")
    );

    await expect(getManagedAccountBalances()).rejects.toThrow("FP unreachable");
  });
});
