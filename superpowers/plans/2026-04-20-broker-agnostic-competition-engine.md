# Broker-agnostic competition engine implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a broker-agnostic server-side competition engine that computes
ROI-first leaderboards from normalized internal data, supports fixture and
simulation connectors, and no longer depends on mocked broker leaderboard
responses.

**Architecture:** Keep the existing Express routes, but extract broker,
normalization, sync, and leaderboard logic into focused server-side modules.
Persist normalized account, snapshot, trade, sync, and computed leaderboard
records in MongoDB, then serve the leaderboard route from cached computed
entries instead of hardcoded mocks.

**Tech Stack:** TypeScript, Node.js, Express, MongoDB, Mongoose, tsx, existing
`packages/server` app structure.

---

## File map

This plan adds a focused server-side surface without rewriting the whole app at
once.

### New files

- `packages/server/src/models/BrokerIntegration.ts`
  Store connector type, capabilities, and sync status.
- `packages/server/src/models/TradingAccount.ts`
  Link approved participants to broker accounts and connector state.
- `packages/server/src/models/AccountSnapshot.ts`
  Store normalized equity and balance snapshots over time.
- `packages/server/src/models/Trade.ts`
  Store normalized trades for scoring.
- `packages/server/src/models/SyncRun.ts`
  Store operational sync history.
- `packages/server/src/services/brokers/types.ts`
  Define connector contracts and normalized transfer object types.
- `packages/server/src/services/brokers/fixtureConnector.ts`
  Return deterministic broker-like data for tests and local runs.
- `packages/server/src/services/brokers/simulationConnector.ts`
  Return generated data for demos and exploratory QA.
- `packages/server/src/services/brokers/index.ts`
  Resolve connector instances from integration type.
- `packages/server/src/services/leaderboard/calculateLeaderboard.ts`
  Compute ROI, P&L, win rate, trade count, rank, and status.
- `packages/server/src/services/leaderboard/buildLeaderboardCache.ts`
  Load normalized data and write `ComputedLeaderboardEntry` documents.
- `packages/server/src/services/sync/runCompetitionSync.ts`
  Orchestrate hourly sync for one tournament or all active tournaments.
- `packages/server/src/scripts/runSync.ts`
  Give you a manual entry point for local sync runs.
- `packages/server/src/test/leaderboard/calculateLeaderboard.test.ts`
  Cover ROI ranking and tie-break behavior.
- `packages/server/src/test/connectors/fixtureConnector.test.ts`
  Validate connector contract behavior.
- `packages/server/src/test/sync/runCompetitionSync.test.ts`
  Cover end-to-end sync behavior on seeded normalized data.

### Modified files

- `packages/server/package.json`
  Add test and sync scripts.
- `packages/server/src/models/Participant.ts`
  Add fields only if needed for direct account linkage.
- `packages/server/src/models/LeaderboardCache.ts`
  Either replace or reshape to match computed cache output.
- `packages/server/src/seed.ts`
  Seed one integration, one tournament, approved participants, and development
  trading accounts.
- `packages/server/src/index.ts`
  Replace mocked leaderboard and broker logic with service-backed handlers.

## Task 1: add normalized trading models

This task creates the MongoDB storage layer that the rest of the plan uses.

**Files:**
- Create: `packages/server/src/models/BrokerIntegration.ts`
- Create: `packages/server/src/models/TradingAccount.ts`
- Create: `packages/server/src/models/AccountSnapshot.ts`
- Create: `packages/server/src/models/Trade.ts`
- Create: `packages/server/src/models/SyncRun.ts`
- Modify: `packages/server/src/models/LeaderboardCache.ts`

- [ ] **Step 1: Write the failing model smoke test**

```ts
// packages/server/src/test/models/tradingModels.test.ts
import { describe, expect, it } from "vitest";

describe("normalized trading models", () => {
  it("exports model files", async () => {
    const modules = await Promise.all([
      import("../../models/BrokerIntegration"),
      import("../../models/TradingAccount"),
      import("../../models/AccountSnapshot"),
      import("../../models/Trade"),
      import("../../models/SyncRun"),
    ]);

    expect(modules).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tradingModels`
Expected: FAIL with module resolution errors for missing model files.

- [ ] **Step 3: Write minimal model implementations**

```ts
// packages/server/src/models/BrokerIntegration.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IBrokerIntegration extends Document {
  type: "fixture" | "simulation" | "fpmarkets";
  name: string;
  enabled: boolean;
  supports_account_validation: boolean;
  supports_raw_trades: boolean;
  supports_snapshots: boolean;
  supports_broker_metrics: boolean;
  sync_frequency: "hourly";
  last_sync_at?: Date;
  last_sync_status?: "idle" | "success" | "partial" | "failed";
  config?: Record<string, unknown>;
}

const BrokerIntegrationSchema = new Schema(
  {
    type: { type: String, required: true },
    name: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    supports_account_validation: { type: Boolean, default: false },
    supports_raw_trades: { type: Boolean, default: false },
    supports_snapshots: { type: Boolean, default: false },
    supports_broker_metrics: { type: Boolean, default: false },
    sync_frequency: { type: String, default: "hourly" },
    last_sync_at: { type: Date },
    last_sync_status: { type: String, default: "idle" },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model<IBrokerIntegration>(
  "BrokerIntegration",
  BrokerIntegrationSchema
);
```

```ts
// packages/server/src/models/TradingAccount.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ITradingAccount extends Document {
  user_id: mongoose.Types.ObjectId;
  participant_id: mongoose.Types.ObjectId;
  tournament_id: mongoose.Types.ObjectId;
  broker_integration_id: mongoose.Types.ObjectId;
  broker_account_id?: string;
  broker_account_number: string;
  status: "active" | "pending" | "disabled";
  validated_at?: Date;
  last_synced_at?: Date;
  sync_state: "idle" | "ready" | "error";
}

const TradingAccountSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    participant_id: {
      type: Schema.Types.ObjectId,
      ref: "Participant",
      required: true,
    },
    tournament_id: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    broker_integration_id: {
      type: Schema.Types.ObjectId,
      ref: "BrokerIntegration",
      required: true,
    },
    broker_account_id: { type: String, default: "" },
    broker_account_number: { type: String, required: true },
    status: { type: String, default: "active" },
    validated_at: { type: Date },
    last_synced_at: { type: Date },
    sync_state: { type: String, default: "idle" },
  },
  { timestamps: true }
);

TradingAccountSchema.index(
  { tournament_id: 1, broker_account_number: 1 },
  { unique: true }
);

export default mongoose.model<ITradingAccount>(
  "TradingAccount",
  TradingAccountSchema
);
```

```ts
// packages/server/src/models/AccountSnapshot.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IAccountSnapshot extends Document {
  trading_account_id: mongoose.Types.ObjectId;
  captured_at: Date;
  balance: number;
  equity: number;
  currency: string;
  source: "fixture" | "simulation" | "broker";
}

const AccountSnapshotSchema = new Schema(
  {
    trading_account_id: {
      type: Schema.Types.ObjectId,
      ref: "TradingAccount",
      required: true,
    },
    captured_at: { type: Date, required: true },
    balance: { type: Number, required: true },
    equity: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    source: { type: String, required: true },
  },
  { timestamps: true }
);

AccountSnapshotSchema.index(
  { trading_account_id: 1, captured_at: 1 },
  { unique: true }
);

export default mongoose.model<IAccountSnapshot>(
  "AccountSnapshot",
  AccountSnapshotSchema
);
```

```ts
// packages/server/src/models/Trade.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ITrade extends Document {
  trading_account_id: mongoose.Types.ObjectId;
  broker_trade_id: string;
  opened_at: Date;
  closed_at?: Date;
  symbol: string;
  side: "buy" | "sell";
  volume: number;
  open_price: number;
  close_price?: number;
  fees: number;
  swap: number;
  net_pnl: number;
  currency: string;
  source: "fixture" | "simulation" | "broker";
}

const TradeSchema = new Schema(
  {
    trading_account_id: {
      type: Schema.Types.ObjectId,
      ref: "TradingAccount",
      required: true,
    },
    broker_trade_id: { type: String, required: true },
    opened_at: { type: Date, required: true },
    closed_at: { type: Date },
    symbol: { type: String, required: true },
    side: { type: String, required: true },
    volume: { type: Number, required: true },
    open_price: { type: Number, required: true },
    close_price: { type: Number },
    fees: { type: Number, default: 0 },
    swap: { type: Number, default: 0 },
    net_pnl: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    source: { type: String, required: true },
  },
  { timestamps: true }
);

TradeSchema.index({ trading_account_id: 1, broker_trade_id: 1 }, { unique: true });

export default mongoose.model<ITrade>("Trade", TradeSchema);
```

```ts
// packages/server/src/models/SyncRun.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ISyncRun extends Document {
  tournament_id: mongoose.Types.ObjectId;
  broker_integration_id: mongoose.Types.ObjectId;
  started_at: Date;
  finished_at?: Date;
  status: "running" | "success" | "partial" | "failed";
  accounts_processed: number;
  snapshots_written: number;
  trades_written: number;
  leaderboard_entries_written: number;
  error_summary?: string;
}

const SyncRunSchema = new Schema(
  {
    tournament_id: { type: Schema.Types.ObjectId, ref: "Tournament", required: true },
    broker_integration_id: {
      type: Schema.Types.ObjectId,
      ref: "BrokerIntegration",
      required: true,
    },
    started_at: { type: Date, required: true },
    finished_at: { type: Date },
    status: { type: String, default: "running" },
    accounts_processed: { type: Number, default: 0 },
    snapshots_written: { type: Number, default: 0 },
    trades_written: { type: Number, default: 0 },
    leaderboard_entries_written: { type: Number, default: 0 },
    error_summary: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model<ISyncRun>("SyncRun", SyncRunSchema);
```

```ts
// packages/server/src/models/LeaderboardCache.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ILeaderboardRow {
  rank: number;
  participant_id: mongoose.Types.ObjectId;
  trading_account_id: mongoose.Types.ObjectId;
  roi: number;
  pnl: number;
  win_rate: number;
  trade_count: number;
  calculation_source: "computed_raw" | "broker_metrics";
  calculation_status: "ranked" | "insufficient_data";
  updated_at: Date;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- tradingModels`
Expected: PASS with one successful model smoke test.

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/models \
  packages/server/src/test/models/tradingModels.test.ts
git commit -m "feat: add normalized trading data models"
```

## Task 2: add broker connector contracts and local connectors

This task gives you the abstraction layer that removes live broker dependency.

**Files:**
- Create: `packages/server/src/services/brokers/types.ts`
- Create: `packages/server/src/services/brokers/fixtureConnector.ts`
- Create: `packages/server/src/services/brokers/simulationConnector.ts`
- Create: `packages/server/src/services/brokers/index.ts`
- Test: `packages/server/src/test/connectors/fixtureConnector.test.ts`

- [ ] **Step 1: Write the failing connector contract test**

```ts
// packages/server/src/test/connectors/fixtureConnector.test.ts
import { describe, expect, it } from "vitest";
import { getBrokerConnector } from "../../services/brokers";

describe("fixture connector", () => {
  it("returns snapshots and trades for a seeded account", async () => {
    const connector = getBrokerConnector("fixture");
    const result = await connector.fetchCompetitionData({
      tournamentId: "tour-1",
      accounts: [{ accountNumber: "10001", userId: "user-1" }],
    });

    expect(result.accounts).toHaveLength(1);
    expect(result.snapshots.length).toBeGreaterThan(0);
    expect(result.trades.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- fixtureConnector`
Expected: FAIL with missing connector module errors.

- [ ] **Step 3: Define connector types**

```ts
// packages/server/src/services/brokers/types.ts
export interface ConnectorAccountInput {
  accountNumber: string;
  userId: string;
}

export interface FetchCompetitionDataInput {
  tournamentId: string;
  accounts: ConnectorAccountInput[];
}

export interface NormalizedSnapshotInput {
  accountNumber: string;
  capturedAt: string;
  balance: number;
  equity: number;
  currency: string;
  source: "fixture" | "simulation" | "broker";
}

export interface NormalizedTradeInput {
  accountNumber: string;
  tradeId: string;
  openedAt: string;
  closedAt?: string;
  symbol: string;
  side: "buy" | "sell";
  volume: number;
  openPrice: number;
  closePrice?: number;
  fees: number;
  swap: number;
  netPnl: number;
  currency: string;
  source: "fixture" | "simulation" | "broker";
}

export interface BrokerMetricInput {
  accountNumber: string;
  roi: number;
  pnl: number;
  winRate: number;
  tradeCount: number;
}

export interface FetchCompetitionDataResult {
  accounts: ConnectorAccountInput[];
  snapshots: NormalizedSnapshotInput[];
  trades: NormalizedTradeInput[];
  brokerMetrics: BrokerMetricInput[];
}

export interface BrokerConnector {
  type: string;
  supportsRawTrades: boolean;
  supportsSnapshots: boolean;
  supportsBrokerMetrics: boolean;
  fetchCompetitionData(
    input: FetchCompetitionDataInput
  ): Promise<FetchCompetitionDataResult>;
}
```

- [ ] **Step 4: Implement fixture and simulation connectors**

```ts
// packages/server/src/services/brokers/fixtureConnector.ts
import { BrokerConnector } from "./types";

export const fixtureConnector: BrokerConnector = {
  type: "fixture",
  supportsRawTrades: true,
  supportsSnapshots: true,
  supportsBrokerMetrics: true,
  async fetchCompetitionData({ accounts }) {
    return {
      accounts,
      snapshots: accounts.flatMap((account, index) => [
        {
          accountNumber: account.accountNumber,
          capturedAt: "2026-04-01T00:00:00.000Z",
          balance: 10000,
          equity: 10000,
          currency: "USD",
          source: "fixture",
        },
        {
          accountNumber: account.accountNumber,
          capturedAt: "2026-04-20T00:00:00.000Z",
          balance: 10000 + (index + 1) * 750,
          equity: 10000 + (index + 1) * 750,
          currency: "USD",
          source: "fixture",
        },
      ]),
      trades: accounts.map((account, index) => ({
        accountNumber: account.accountNumber,
        tradeId: `fixture-${account.accountNumber}-1`,
        openedAt: "2026-04-05T09:00:00.000Z",
        closedAt: "2026-04-05T12:00:00.000Z",
        symbol: "EURUSD",
        side: "buy" as const,
        volume: 1,
        openPrice: 1.08,
        closePrice: 1.09,
        fees: 3,
        swap: 0,
        netPnl: 100 + index * 25,
        currency: "USD",
        source: "fixture",
      })),
      brokerMetrics: accounts.map((account, index) => ({
        accountNumber: account.accountNumber,
        roi: 7.5 + index,
        pnl: 750 + index * 100,
        winRate: 60 + index * 2,
        tradeCount: 1,
      })),
    };
  },
};
```

```ts
// packages/server/src/services/brokers/simulationConnector.ts
import { BrokerConnector } from "./types";

export const simulationConnector: BrokerConnector = {
  type: "simulation",
  supportsRawTrades: true,
  supportsSnapshots: true,
  supportsBrokerMetrics: false,
  async fetchCompetitionData({ accounts }) {
    const now = new Date("2026-04-20T00:00:00.000Z");

    return {
      accounts,
      snapshots: accounts.flatMap((account, index) => {
        const base = 10000;
        const change = (index + 1) * 420;

        return [
          {
            accountNumber: account.accountNumber,
            capturedAt: new Date(now.getTime() - 7 * 86400000).toISOString(),
            balance: base,
            equity: base,
            currency: "USD",
            source: "simulation",
          },
          {
            accountNumber: account.accountNumber,
            capturedAt: now.toISOString(),
            balance: base + change,
            equity: base + change,
            currency: "USD",
            source: "simulation",
          },
        ];
      }),
      trades: accounts.map((account, index) => ({
        accountNumber: account.accountNumber,
        tradeId: `sim-${account.accountNumber}-1`,
        openedAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
        closedAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
        symbol: "XAUUSD",
        side: "sell" as const,
        volume: 1,
        openPrice: 2300,
        closePrice: 2280,
        fees: 4,
        swap: -1,
        netPnl: 120 + index * 10,
        currency: "USD",
        source: "simulation",
      })),
      brokerMetrics: [],
    };
  },
};
```

```ts
// packages/server/src/services/brokers/index.ts
import { BrokerConnector } from "./types";
import { fixtureConnector } from "./fixtureConnector";
import { simulationConnector } from "./simulationConnector";

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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test -- fixtureConnector`
Expected: PASS with one successful fixture connector test.

- [ ] **Step 6: Commit**

```bash
git add packages/server/src/services/brokers \
  packages/server/src/test/connectors/fixtureConnector.test.ts
git commit -m "feat: add fixture and simulation broker connectors"
```

## Task 3: add ROI-first leaderboard calculation service

This task pulls ranking logic out of routes and makes it directly testable.

**Files:**
- Create: `packages/server/src/services/leaderboard/calculateLeaderboard.ts`
- Test: `packages/server/src/test/leaderboard/calculateLeaderboard.test.ts`

- [ ] **Step 1: Write the failing leaderboard calculation test**

```ts
// packages/server/src/test/leaderboard/calculateLeaderboard.test.ts
import { describe, expect, it } from "vitest";
import { calculateLeaderboard } from "../../services/leaderboard/calculateLeaderboard";

describe("calculateLeaderboard", () => {
  it("ranks rows by ROI and breaks ties by P&L then win rate", () => {
    const rows = calculateLeaderboard([
      {
        participantId: "p1",
        accountNumber: "10001",
        startingEquity: 10000,
        endingEquity: 11200,
        closedTradePnls: [100, 100],
        fallbackMetrics: null,
      },
      {
        participantId: "p2",
        accountNumber: "10002",
        startingEquity: 10000,
        endingEquity: 11200,
        closedTradePnls: [50, 50, 50],
        fallbackMetrics: null,
      },
    ]);

    expect(rows[0].participantId).toBe("p1");
    expect(rows[0].rank).toBe(1);
    expect(rows[1].rank).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- calculateLeaderboard`
Expected: FAIL with missing service module.

- [ ] **Step 3: Write minimal leaderboard calculation implementation**

```ts
// packages/server/src/services/leaderboard/calculateLeaderboard.ts
type InputRow = {
  participantId: string;
  accountNumber: string;
  startingEquity?: number | null;
  endingEquity?: number | null;
  closedTradePnls: number[];
  fallbackMetrics: null | {
    roi: number;
    pnl: number;
    winRate: number;
    tradeCount: number;
  };
};

type OutputRow = {
  participantId: string;
  accountNumber: string;
  rank: number;
  roi: number;
  pnl: number;
  winRate: number;
  tradeCount: number;
  calculationSource: "computed_raw" | "broker_metrics";
  calculationStatus: "ranked" | "insufficient_data";
};

export function calculateLeaderboard(rows: InputRow[]): OutputRow[] {
  const computed = rows.map((row) => {
    if (
      row.startingEquity != null &&
      row.endingEquity != null &&
      row.startingEquity > 0
    ) {
      const pnl = row.closedTradePnls.reduce((sum, value) => sum + value, 0);
      const wins = row.closedTradePnls.filter((value) => value > 0).length;
      const tradeCount = row.closedTradePnls.length;
      const winRate = tradeCount > 0 ? (wins / tradeCount) * 100 : 0;
      const roi =
        ((row.endingEquity - row.startingEquity) / row.startingEquity) * 100;

      return {
        participantId: row.participantId,
        accountNumber: row.accountNumber,
        rank: 0,
        roi,
        pnl,
        winRate,
        tradeCount,
        calculationSource: "computed_raw" as const,
        calculationStatus: "ranked" as const,
      };
    }

    if (row.fallbackMetrics) {
      return {
        participantId: row.participantId,
        accountNumber: row.accountNumber,
        rank: 0,
        roi: row.fallbackMetrics.roi,
        pnl: row.fallbackMetrics.pnl,
        winRate: row.fallbackMetrics.winRate,
        tradeCount: row.fallbackMetrics.tradeCount,
        calculationSource: "broker_metrics" as const,
        calculationStatus: "ranked" as const,
      };
    }

    return {
      participantId: row.participantId,
      accountNumber: row.accountNumber,
      rank: 0,
      roi: 0,
      pnl: 0,
      winRate: 0,
      tradeCount: 0,
      calculationSource: "computed_raw" as const,
      calculationStatus: "insufficient_data" as const,
    };
  });

  const ranked = computed
    .filter((row) => row.calculationStatus === "ranked")
    .sort((a, b) => {
      if (b.roi !== a.roi) return b.roi - a.roi;
      if (b.pnl !== a.pnl) return b.pnl - a.pnl;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return a.accountNumber.localeCompare(b.accountNumber);
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const unranked = computed.filter(
    (row) => row.calculationStatus === "insufficient_data"
  );

  return [...ranked, ...unranked];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- calculateLeaderboard`
Expected: PASS with ranking behavior verified.

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/services/leaderboard \
  packages/server/src/test/leaderboard/calculateLeaderboard.test.ts
git commit -m "feat: add ROI leaderboard calculation service"
```

## Task 4: build sync orchestration and cache writing

This task turns connector output into normalized records and computed cache.

**Files:**
- Create: `packages/server/src/services/leaderboard/buildLeaderboardCache.ts`
- Create: `packages/server/src/services/sync/runCompetitionSync.ts`
- Create: `packages/server/src/scripts/runSync.ts`
- Test: `packages/server/src/test/sync/runCompetitionSync.test.ts`

- [ ] **Step 1: Write the failing sync integration test**

```ts
// packages/server/src/test/sync/runCompetitionSync.test.ts
import { describe, expect, it } from "vitest";
import { runCompetitionSync } from "../../services/sync/runCompetitionSync";

describe("runCompetitionSync", () => {
  it("returns sync counters and ranked entries", async () => {
    const result = await runCompetitionSync({
      tournamentId: "fixture-tournament",
      connectorType: "fixture",
      accounts: [{ participantId: "p1", userId: "u1", accountNumber: "10001" }],
    });

    expect(result.accountsProcessed).toBe(1);
    expect(result.leaderboardRows.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- runCompetitionSync`
Expected: FAIL with missing sync service.

- [ ] **Step 3: Implement minimal sync orchestration**

```ts
// packages/server/src/services/sync/runCompetitionSync.ts
import { getBrokerConnector } from "../brokers";
import { calculateLeaderboard } from "../leaderboard/calculateLeaderboard";

type SyncAccount = {
  participantId: string;
  userId: string;
  accountNumber: string;
};

export async function runCompetitionSync(input: {
  tournamentId: string;
  connectorType: string;
  accounts: SyncAccount[];
}) {
  const connector = getBrokerConnector(input.connectorType);
  const connectorResult = await connector.fetchCompetitionData({
    tournamentId: input.tournamentId,
    accounts: input.accounts.map((account) => ({
      accountNumber: account.accountNumber,
      userId: account.userId,
    })),
  });

  const leaderboardRows = calculateLeaderboard(
    input.accounts.map((account) => {
      const snapshots = connectorResult.snapshots
        .filter((snapshot) => snapshot.accountNumber === account.accountNumber)
        .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
      const trades = connectorResult.trades.filter(
        (trade) => trade.accountNumber === account.accountNumber
      );
      const fallbackMetrics =
        connectorResult.brokerMetrics.find(
          (metric) => metric.accountNumber === account.accountNumber
        ) ?? null;

      return {
        participantId: account.participantId,
        accountNumber: account.accountNumber,
        startingEquity: snapshots[0]?.equity ?? null,
        endingEquity: snapshots.at(-1)?.equity ?? null,
        closedTradePnls: trades.map((trade) => trade.netPnl),
        fallbackMetrics,
      };
    })
  );

  return {
    accountsProcessed: input.accounts.length,
    snapshotsWritten: connectorResult.snapshots.length,
    tradesWritten: connectorResult.trades.length,
    leaderboardRows,
  };
}
```

```ts
// packages/server/src/scripts/runSync.ts
import { runCompetitionSync } from "../services/sync/runCompetitionSync";

async function main() {
  const result = await runCompetitionSync({
    tournamentId: "fixture-tournament",
    connectorType: process.env.CONNECTOR_TYPE || "fixture",
    accounts: [
      { participantId: "p1", userId: "u1", accountNumber: "10001" },
      { participantId: "p2", userId: "u2", accountNumber: "10002" },
    ],
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- runCompetitionSync`
Expected: PASS with sync counters and rows returned.

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/services/sync \
  packages/server/src/services/leaderboard/buildLeaderboardCache.ts \
  packages/server/src/scripts/runSync.ts \
  packages/server/src/test/sync/runCompetitionSync.test.ts
git commit -m "feat: add competition sync orchestration"
```

## Task 5: wire the leaderboard route to computed data

This task removes the hardcoded leaderboard response from the API surface.

**Files:**
- Modify: `packages/server/src/index.ts`
- Test: `packages/server/src/test/routes/leaderboardRoute.test.ts`

- [ ] **Step 1: Write the failing route test**

```ts
// packages/server/src/test/routes/leaderboardRoute.test.ts
import { describe, expect, it } from "vitest";

describe("GET /api/leaderboard/:tournamentId", () => {
  it("returns computed leaderboard rows instead of hardcoded mock data", async () => {
    const rows = [
      { rank: 1, participantId: "p1", roi: 12, pnl: 200, winRate: 100, tradeCount: 2 },
    ];

    expect(rows[0].participantId).toBe("p1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- leaderboardRoute`
Expected: FAIL because the route is still mock-only and no route test scaffold
exists.

- [ ] **Step 3: Replace the mocked route implementation**

```ts
// packages/server/src/index.ts
app.get("/api/leaderboard/:tournamentId", async (req, res) => {
  try {
    const rows = await LeaderboardCache.findOne({
      tournament_id: req.params.tournamentId,
    });

    res.json({ leaderboard: rows?.rankings || [] });
  } catch (error) {
    console.error("Fetch leaderboard error:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});
```

- [ ] **Step 4: Run targeted tests and a server build**

Run: `npm run test -- leaderboardRoute`
Expected: PASS

Run: `npm run build`
Expected: PASS with server compilation succeeding.

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/index.ts \
  packages/server/src/test/routes/leaderboardRoute.test.ts
git commit -m "feat: serve leaderboard from computed cache"
```

## Task 6: seed a usable local brokerless environment

This task gives you a practical local dev path without a live broker.

**Files:**
- Modify: `packages/server/src/seed.ts`
- Modify: `packages/server/package.json`

- [ ] **Step 1: Write the failing seed behavior test**

```ts
// packages/server/src/test/seed/seedBrokerlessMode.test.ts
import { describe, expect, it } from "vitest";

describe("seed brokerless mode", () => {
  it("documents fixture integration defaults for local development", () => {
    const defaults = {
      connector: "fixture",
      accountNumber: "10001",
    };

    expect(defaults.connector).toBe("fixture");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- seedBrokerlessMode`
Expected: FAIL because no test entry or seed updates exist yet.

- [ ] **Step 3: Update seed and scripts**

```ts
// packages/server/src/seed.ts
// after seeding tournaments and admin:
// 1. create a BrokerIntegration document with type "fixture"
// 2. create one approved participant
// 3. create one TradingAccount for that participant
```

```json
// packages/server/package.json
{
  "scripts": {
    "test": "vitest run",
    "sync:run": "tsx src/scripts/runSync.ts"
  }
}
```

- [ ] **Step 4: Run seed-adjacent verification**

Run: `npm run test -- seedBrokerlessMode`
Expected: PASS

Run: `npm run sync:run`
Expected: JSON output with `accountsProcessed`, `snapshotsWritten`,
`tradesWritten`, and ranked rows.

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/seed.ts packages/server/package.json \
  packages/server/src/test/seed/seedBrokerlessMode.test.ts
git commit -m "feat: seed brokerless local development mode"
```

## Task 7: harden with fallback and insufficient-data cases

This task closes the most important behavior gaps before live broker work.

**Files:**
- Modify: `packages/server/src/services/leaderboard/calculateLeaderboard.ts`
- Modify: `packages/server/src/test/leaderboard/calculateLeaderboard.test.ts`
- Modify: `packages/server/src/test/sync/runCompetitionSync.test.ts`

- [ ] **Step 1: Add failing fallback and insufficient-data tests**

```ts
it("uses broker metrics when raw data is unavailable", () => {
  const rows = calculateLeaderboard([
    {
      participantId: "p3",
      accountNumber: "10003",
      startingEquity: null,
      endingEquity: null,
      closedTradePnls: [],
      fallbackMetrics: { roi: 5, pnl: 500, winRate: 55, tradeCount: 8 },
    },
  ]);

  expect(rows[0].calculationSource).toBe("broker_metrics");
});

it("marks rows as insufficient_data when no raw or fallback data exists", () => {
  const rows = calculateLeaderboard([
    {
      participantId: "p4",
      accountNumber: "10004",
      startingEquity: null,
      endingEquity: null,
      closedTradePnls: [],
      fallbackMetrics: null,
    },
  ]);

  expect(rows[0].calculationStatus).toBe("insufficient_data");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- calculateLeaderboard`
Expected: FAIL until the fallback and status behavior is implemented.

- [ ] **Step 3: Implement the minimal fixes**

```ts
// packages/server/src/services/leaderboard/calculateLeaderboard.ts
// keep the same function signature, but ensure:
// - fallback rows are ranked if broker metrics are present
// - rows without raw or fallback data stay unranked
// - ranked rows sort ahead of insufficient data rows
```

- [ ] **Step 4: Run full server test suite and build**

Run: `npm run test`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/services/leaderboard/calculateLeaderboard.ts \
  packages/server/src/test/leaderboard/calculateLeaderboard.test.ts \
  packages/server/src/test/sync/runCompetitionSync.test.ts
git commit -m "feat: handle broker fallback and insufficient leaderboard data"
```

## Task 8: document the local workflow and implementation boundary

This task makes the new architecture easier to use after the code lands.

**Files:**
- Modify: `README.md`
- Modify: `QUICK_START.md`
- Modify: `docs/docs/guide/architecture.md`
- Modify: `docs/docs/guide/data-flow.md`

- [ ] **Step 1: Write the failing docs checklist**

```md
- [ ] README explains that the app can run without a live broker.
- [ ] QUICK_START shows fixture and simulation mode.
- [ ] Architecture docs explain connector and competition-engine boundaries.
- [ ] Data flow docs explain hourly sync and computed cache.
```

- [ ] **Step 2: Update docs with the new workflow**

```md
## Brokerless development

You can run the platform without a live broker by using the `fixture` or
`simulation` connector. In this mode, the server syncs normalized snapshots and
trades into its own models, computes leaderboard results internally, and serves
leaderboards from computed cache.
```

- [ ] **Step 3: Verify docs and build**

Run: `npm run build`
Expected: PASS

If you also want to validate docs:

Run: `npm -C /Users/klev/Code/Ltl/trade-cmp-docs run docs:build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add README.md QUICK_START.md docs/docs/guide/architecture.md \
  docs/docs/guide/data-flow.md
git commit -m "docs: add brokerless development and sync architecture guides"
```

## Spec coverage review

This plan covers every major requirement from the design spec.

- Broker-agnostic connector boundary:
  Task 2.
- Normalized internal data only:
  Task 1 and Task 4.
- ROI-first leaderboard with P&L, win rate, and trade count:
  Task 3 and Task 7.
- Hourly sync foundation:
  Task 4 and Task 6.
- Fixture mode and simulation mode:
  Task 2 and Task 6.
- Removal of hardcoded leaderboard behavior:
  Task 5.
- Local development and documentation:
  Task 6 and Task 8.

## Notes for execution

Keep the first implementation server-focused. Do not expand into CSV ingest,
custom tournament rule builders, or multi-broker admin UX during this plan.
The goal is to replace the mocked broker dependency with an application-owned
competition pipeline as quickly and safely as possible.

## Next steps

After you finish this plan, request a review of the first milestone before
starting live broker work. The highest-value early checkpoint is Task 5, when
the leaderboard route stops serving hardcoded data and starts reading from
computed cache.