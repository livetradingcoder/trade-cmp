import { fixtureConnector } from "./fixtureConnector";
import { simulationConnector } from "./simulationConnector";
import { fpMarketsConnector } from "./fpMarketsConnector";
import { BrokerConnector } from "./types";
import { BrokerConfig, resolveBrokerConfig } from "./config";

const connectors: Record<string, BrokerConnector> = {
  fixture: fixtureConnector,
  simulation: simulationConnector,
  fpmarkets: fpMarketsConnector,
};

export function getBrokerConnector(type: string): BrokerConnector {
  const connector = connectors[type];

  if (!connector) {
    throw new Error(`Unsupported broker connector: ${type}`);
  }

  return connector;
}

/**
 * The original FP integration predates per-integration credentials and is
 * configured through the FP_MARKETS_* env vars. It is the ONLY integration
 * allowed to fall back to them. Any other broker without its own credentials
 * is simply not connected yet — letting it fall back would query FP, with
 * FP's keys, on another broker's behalf.
 */
export function usesEnvCredentials(integration: {
  type?: unknown;
  name?: unknown;
}): boolean {
  return integration.type === "fpmarkets" && integration.name === "fpmarkets";
}

type IntegrationLike = { type?: unknown; name?: unknown; config?: unknown };

/**
 * "VT Markets" -> "VT_MARKETS": the stem of the env vars a developer sets to
 * connect a broker. Secrets live in the host's environment (Railway), next to
 * FP_MARKETS_*, so they never pass through the admin UI or the database.
 */
export function brokerEnvKey(name: string): string {
  return String(name)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Everything a protocol broker needs; a partial set is not "connected". */
const ENV_FIELDS = [
  ["BASE_URL", "base_url"],
  ["TOKEN", "token"],
  ["SECRET", "secret"],
  ["REBATE_ACCOUNTS", "rebate_accounts"],
] as const;

const FP_ENV_VARS = [
  "FP_MARKETS_BASE_URL",
  "FP_MARKETS_TOKEN",
  "FP_MARKETS_SECRET",
  "FP_MARKETS_REBATE_ACCOUNTS",
];

/** The env var names that configure this broker. Names only, never values. */
export function brokerEnvVars(integration: IntegrationLike): string[] {
  if (usesEnvCredentials(integration)) return [...FP_ENV_VARS];
  const key = brokerEnvKey(String(integration.name ?? ""));
  return ENV_FIELDS.map(([suffix]) => `BROKER_${key}_${suffix}`);
}

/** Which of those env vars are set — presence only, for the Settings page. */
export function brokerEnvStatus(integration: IntegrationLike): Record<string, boolean> {
  const status: Record<string, boolean> = {};
  for (const name of brokerEnvVars(integration)) {
    const value = process.env[name];
    status[name] = Boolean(value && value.trim());
  }
  return status;
}

/**
 * The credentials an integration actually connects with: its own env vars,
 * layered over any config stored on the record. The original FP integration
 * keeps reading FP_MARKETS_* inside its connector.
 */
export function effectiveBrokerConfig(integration: IntegrationLike): BrokerConfig {
  const stored = resolveBrokerConfig(integration.config as BrokerConfig);
  if (usesEnvCredentials(integration)) return stored;
  const key = brokerEnvKey(String(integration.name ?? ""));
  const fromEnv: BrokerConfig = {};
  for (const [suffix, field] of ENV_FIELDS) {
    const value = process.env[`BROKER_${key}_${suffix}`];
    if (value && value.trim()) fromEnv[field] = value.trim();
  }
  return { ...stored, ...fromEnv };
}

const hasValue = (value: unknown) =>
  Array.isArray(value) ? value.length > 0 : Boolean(value && String(value).trim());

/**
 * Whether an integration can fetch live data right now.
 *
 * A protocol broker needs ALL of base URL, token, secret and rebate accounts.
 * Token and secret alone are not enough: the connector fills any missing field
 * from FP's env, so a broker with only keys would send its credentials to FP's
 * host against FP's rebate accounts.
 */
export function isIntegrationConnected(integration: IntegrationLike): boolean {
  let connector: BrokerConnector;
  try {
    connector = getBrokerConnector(String(integration.type));
  } catch {
    return false;
  }
  if (!connector.requiresCredentials) return true;
  if (usesEnvCredentials(integration)) {
    // Mirrors loadFpMarketsConfig: each field from stored config, else
    // FP_MARKETS_*. Its base URL has a built-in default, so it isn't required.
    const stored = resolveBrokerConfig(integration.config as BrokerConfig);
    return (["token", "secret", "rebate_accounts"] as const).every(
      (field) =>
        hasValue(stored[field]) || hasValue(process.env[`FP_MARKETS_${field.toUpperCase()}`])
    );
  }
  const config = effectiveBrokerConfig(integration);
  return ENV_FIELDS.every(([, field]) => hasValue(config[field]));
}
