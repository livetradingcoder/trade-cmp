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

/** Whether an integration can fetch live data right now. */
export function isIntegrationConnected(integration: {
  type?: unknown;
  name?: unknown;
  config?: unknown;
}): boolean {
  let connector: BrokerConnector;
  try {
    connector = getBrokerConnector(String(integration.type));
  } catch {
    return false;
  }
  if (!connector.requiresCredentials) return true;
  if (usesEnvCredentials(integration)) return true;
  const config = resolveBrokerConfig(integration.config as BrokerConfig);
  return Boolean(config.token && config.secret);
}
