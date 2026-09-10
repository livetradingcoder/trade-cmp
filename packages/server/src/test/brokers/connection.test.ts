import { afterEach, describe, expect, it } from "vitest";

import {
  brokerEnvKey,
  brokerEnvStatus,
  brokerEnvVars,
  effectiveBrokerConfig,
  isIntegrationConnected,
} from "../../services/brokers";

/**
 * Brokers are configured by a developer through env vars named after the
 * broker, so secrets never pass through the admin UI or the database.
 */

const touched: string[] = [];
function setEnv(name: string, value: string) {
  process.env[name] = value;
  touched.push(name);
}
afterEach(() => {
  for (const name of touched.splice(0)) delete process.env[name];
});

const vt = { type: "fpmarkets", name: "VT Markets" };

describe("broker env configuration", () => {
  it("derives the env var names from the broker's name", () => {
    expect(brokerEnvKey("VT Markets")).toBe("VT_MARKETS");
    expect(brokerEnvKey("  fp-trading.co ")).toBe("FP_TRADING_CO");
    expect(brokerEnvVars(vt)).toEqual([
      "BROKER_VT_MARKETS_BASE_URL",
      "BROKER_VT_MARKETS_TOKEN",
      "BROKER_VT_MARKETS_SECRET",
      "BROKER_VT_MARKETS_REBATE_ACCOUNTS",
    ]);
  });

  it("keeps the original FP integration on FP_MARKETS_*", () => {
    expect(brokerEnvVars({ type: "fpmarkets", name: "fpmarkets" })).toEqual([
      "FP_MARKETS_BASE_URL",
      "FP_MARKETS_TOKEN",
      "FP_MARKETS_SECRET",
      "FP_MARKETS_REBATE_ACCOUNTS",
    ]);
  });

  it("connects a broker once all four of its env vars are set", () => {
    expect(isIntegrationConnected(vt)).toBe(false);
    setEnv("BROKER_VT_MARKETS_BASE_URL", "https://api.vt.example");
    setEnv("BROKER_VT_MARKETS_TOKEN", "vt-token");
    setEnv("BROKER_VT_MARKETS_SECRET", "vt-secret");
    setEnv("BROKER_VT_MARKETS_REBATE_ACCOUNTS", "9001");
    expect(isIntegrationConnected(vt)).toBe(true);
    expect(effectiveBrokerConfig(vt)).toMatchObject({
      base_url: "https://api.vt.example",
      token: "vt-token",
      rebate_accounts: "9001",
    });
  });

  it("does not call a broker with only keys connected", () => {
    // Keys alone would be sent to FP's host against FP's rebate accounts,
    // because the connector fills missing fields from FP's env.
    setEnv("BROKER_VT_MARKETS_TOKEN", "vt-token");
    setEnv("BROKER_VT_MARKETS_SECRET", "vt-secret");
    expect(isIntegrationConnected(vt)).toBe(false);
  });

  it("lets env vars override config stored on the record", () => {
    setEnv("BROKER_VT_MARKETS_TOKEN", "from-env");
    const config = effectiveBrokerConfig({ ...vt, config: { token: "from-db", base_url: "x" } });
    expect(config.token).toBe("from-env");
    expect(config.base_url).toBe("x");
  });

  it("reports which env vars are set without revealing them", () => {
    setEnv("BROKER_VT_MARKETS_TOKEN", "super-secret-value");
    const status = brokerEnvStatus(vt);
    expect(status.BROKER_VT_MARKETS_TOKEN).toBe(true);
    expect(status.BROKER_VT_MARKETS_SECRET).toBe(false);
    expect(JSON.stringify(status)).not.toContain("super-secret-value");
  });

  it("checks the original FP integration against FP_MARKETS_*", () => {
    const fp = { type: "fpmarkets", name: "fpmarkets" };
    const names = ["FP_MARKETS_TOKEN", "FP_MARKETS_SECRET", "FP_MARKETS_REBATE_ACCOUNTS"];
    const saved = names.map((name) => process.env[name]);
    try {
      process.env.FP_MARKETS_TOKEN = "t";
      process.env.FP_MARKETS_SECRET = "s";
      process.env.FP_MARKETS_REBATE_ACCOUNTS = "477779";
      expect(isIntegrationConnected(fp)).toBe(true);

      delete process.env.FP_MARKETS_SECRET;
      expect(isIntegrationConnected(fp)).toBe(false);
      // Stored config fills the gap, exactly as it does in the connector.
      expect(isIntegrationConnected({ ...fp, config: { secret: "s" } })).toBe(true);
    } finally {
      names.forEach((name, i) => {
        if (saved[i] === undefined) delete process.env[name];
        else process.env[name] = saved[i];
      });
    }
  });
});
