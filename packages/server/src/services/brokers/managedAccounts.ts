import BrokerIntegration from "../../models/BrokerIntegration";
import { getBrokerConnector } from "./index";
import { BrokerAccountBalance, BrokerConnector } from "./types";

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

async function enabledConnectors(): Promise<BrokerConnector[]> {
  const integrations = await BrokerIntegration.find({ enabled: true }).select(
    "type"
  );

  const connectors: BrokerConnector[] = [];
  const seen = new Set<string>();
  for (const integration of integrations) {
    const type = String(integration.type);
    if (seen.has(type)) continue; // several integrations can share a connector
    seen.add(type);
    try {
      connectors.push(getBrokerConnector(type));
    } catch {
      // An integration row naming a connector this build doesn't ship.
      // Skip it rather than breaking every other broker.
    }
  }
  return connectors;
}

/**
 * Run one optional capability across every enabled broker.
 * Throws only when nothing answered and at least one broker errored.
 */
async function collect<T>(
  pick: (connector: BrokerConnector) => (() => Promise<T>) | undefined,
  merge: (into: T, from: T) => void,
  empty: () => T
): Promise<T> {
  const connectors = await enabledConnectors();
  const result = empty();
  let answered = 0;
  let firstError: unknown = null;

  for (const connector of connectors) {
    const capability = pick(connector);
    if (!capability) continue; // broker can't report this — not an error
    try {
      merge(result, await capability.call(connector));
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
