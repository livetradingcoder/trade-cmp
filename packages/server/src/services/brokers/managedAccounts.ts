import BrokerIntegration from "../../models/BrokerIntegration";
import {
  effectiveBrokerConfig,
  getBrokerConnector,
  isIntegrationConnected,
} from "./index";
import { BrokerAccountBalance, BrokerConnector } from "./types";
import { BrokerConfig } from "./config";

/**
 * Broker-agnostic access to "which accounts do we manage, and what do they
 * hold" — the two questions the participants route and the sync ask.
 *
 * These used to import FP's helpers directly, which pinned both call sites to
 * one broker. They now dispatch over every enabled integration and merge the
 * answers, so a second broker starts contributing the moment its connector
 * implements the optional capability.
 *
 * Failure semantics match the single-broker behaviour they replace: callers
 * rely on a throw to mean "broker unreachable, keep the stored value" rather
 * than "this account is not managed", so a total failure still throws. A
 * partial failure returns what did answer — one broker being down must not
 * blank out another's accounts.
 */

interface EnabledBroker {
  connector: BrokerConnector;
  config: BrokerConfig;
}

/**
 * Every enabled integration paired with its own credentials.
 *
 * Keyed by connector type AND credentials: two integrations sharing a
 * connector but pointing at different accounts are both real, and must each be
 * queried. Only an exact duplicate is collapsed.
 */
async function enabledBrokers(): Promise<EnabledBroker[]> {
  const integrations = await BrokerIntegration.find({ enabled: true }).select(
    "type name config"
  );

  const brokers: EnabledBroker[] = [];
  const seen = new Set<string>();
  for (const integration of integrations) {
    // No credentials yet: nothing to ask, and asking would borrow FP's keys.
    if (!isIntegrationConnected(integration)) continue;
    const type = String(integration.type);
    const config = effectiveBrokerConfig(integration);
    const key = `${type}|${JSON.stringify(config)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      brokers.push({ connector: getBrokerConnector(type), config });
    } catch {
      // An integration row naming a connector this build doesn't ship.
      // Skip it rather than breaking every other broker.
    }
  }
  return brokers;
}

/**
 * Run one optional capability across every enabled broker.
 * Throws only when nothing answered and at least one broker errored.
 */
async function collect<T>(
  pick: (
    connector: BrokerConnector
  ) => ((config?: BrokerConfig) => Promise<T>) | undefined,
  merge: (into: T, from: T) => void,
  empty: () => T
): Promise<T> {
  const brokers = await enabledBrokers();
  const result = empty();
  let answered = 0;
  let firstError: unknown = null;

  for (const { connector, config } of brokers) {
    const capability = pick(connector);
    if (!capability) continue; // broker can't report this — not an error
    try {
      merge(result, await capability.call(connector, config));
      answered++;
    } catch (error) {
      if (firstError === null) firstError = error;
    }
  }

  if (answered === 0 && firstError !== null) throw firstError;
  return result;
}

/** Account numbers mapped under our IB/rebate across all enabled brokers. */
export function listManagedAccounts(): Promise<Set<string>> {
  return collect<Set<string>>(
    (c) => c.listManagedAccounts,
    (into, from) => from.forEach((value) => into.add(value)),
    () => new Set<string>()
  );
}

/** Live balance per managed account across all enabled brokers. */
export function getManagedAccountBalances(): Promise<
  Map<string, BrokerAccountBalance>
> {
  return collect<Map<string, BrokerAccountBalance>>(
    (c) => c.getAccountBalances,
    (into, from) => from.forEach((value, key) => into.set(key, value)),
    () => new Map<string, BrokerAccountBalance>()
  );
}
