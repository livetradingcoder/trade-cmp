import { fixtureConnector } from "./fixtureConnector";
import { simulationConnector } from "./simulationConnector";
import { BrokerConnector } from "./types";

const connectors: Record<string, BrokerConnector> = {
  fixture: fixtureConnector,
  simulation: simulationConnector,
};

export function getBrokerConnector(type: string): BrokerConnector {
  const connector = connectors[type];

  if (!connector) {
    throw new Error(`Unsupported broker connector: ${type}`);
  }

  return connector;
}
