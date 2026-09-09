import crypto from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fpMarketsConnector,
  signTimestamp,
} from "../../services/brokers/fpMarketsConnector";

const OLD_ENV = process.env;

function setEnv() {
  process.env = {
    ...OLD_ENV,
    FP_MARKETS_BASE_URL: "https://ibbeta.fptrading.com",
    FP_MARKETS_TOKEN: "test-token",
    FP_MARKETS_SECRET: "test-secret",
    FP_MARKETS_REBATE_ACCOUNTS: "00123, 00456",
  };
}

function mockFetch(impl: any) {
  // Wrap so every mocked Response also exposes text() (the activity client
  // reads the raw text), mirroring json() when the impl only stubs json.
  const wrapped = async (...args: any[]) => {
    const res = await impl(...args);
    if (res && typeof res.json === "function" && typeof res.text !== "function") {
      res.text = async () => JSON.stringify(await res.json());
    }
    return res;
  };
  const fetchMock = vi.fn(wrapped);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("fpMarkets connector", () => {
  beforeEach(() => {
    setEnv();
  });

  afterEach(() => {
    process.env = OLD_ENV;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("signs the timestamp with HMAC-SHA256 hex", () => {
    const expected = crypto
      .createHmac("sha256", "test-secret")
      .update("1700000000")
      .digest("hex");

    expect(signTimestamp("1700000000", "test-secret")).toBe(expected);
  });

  it("maps the performance response to broker balance snapshots", async () => {
    const fetchMock = mockFetch(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          resource: {
            start_date: "2026-01-01",
            end_date: "2026-06-30",
            accounts: [
              {
                account_number: "TC-78901",
                user_info: { first_name: "John", last_name_masked: "S***" },
                metrics: {
                  roi: 0,
                  starting_balance: 5000,
                  current_balance: 6250.75,
                },
                last_trade_at: "2026-05-20T08:45:00+00:00",
                status: "active",
              },
            ],
          },
        },
      }),
    }));

    const result = await fpMarketsConnector.fetchCompetitionData({
      tournamentId: "t1",
      accounts: [
        { accountNumber: "TC-78901", userId: "u1" },
        { accountNumber: "NOT-MAPPED", userId: "u2" },
      ],
      startDate: "2026-01-01",
      endDate: "2026-06-30",
    });

    // Only the account mapped under our rebate number is returned.
    expect(result.accounts).toHaveLength(1);
    expect(result.accounts[0].accountNumber).toBe("TC-78901");

    // Two snapshots: starting_balance then current_balance.
    expect(result.snapshots).toHaveLength(2);
    expect(result.snapshots[0]).toMatchObject({
      accountNumber: "TC-78901",
      balance: 5000,
      equity: 5000,
      source: "broker",
    });
    expect(result.snapshots[1]).toMatchObject({
      accountNumber: "TC-78901",
      balance: 6250.75,
      equity: 6250.75,
      source: "broker",
    });
    expect(new Date(result.snapshots[1].capturedAt).toISOString()).toBe(
      "2026-05-20T08:45:00.000Z"
    );

    // No raw trades / broker metrics from this API.
    expect(result.trades).toEqual([]);
    expect(result.brokerMetrics).toEqual([]);

    // Request shape: rebate numbers in body, signed auth headers.
    const [url, opts] = fetchMock.mock.calls[0] as [string, any];
    expect(url).toBe("https://ibbeta.fptrading.com/api/account/performance");
    expect(opts.method).toBe("POST");
    expect(opts.headers.token).toBe("test-token");
    expect(opts.headers.signature).toBe(
      signTimestamp(opts.headers.timestamp, "test-secret")
    );

    const body = JSON.parse(opts.body);
    expect(body.account_numbers).toEqual(["00123", "00456"]);
    expect(body.start_date).toBe("2026-01-01");
    expect(body.end_date).toBe("2026-06-30");
  });

  it("falls back to end_date when last_trade_at is null", async () => {
    mockFetch(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          resource: {
            accounts: [
              {
                account_number: "TC-1",
                metrics: { starting_balance: 0, current_balance: 0 },
                last_trade_at: null,
                status: "funding",
              },
            ],
          },
        },
      }),
    }));

    const result = await fpMarketsConnector.fetchCompetitionData({
      tournamentId: "t1",
      accounts: [{ accountNumber: "TC-1", userId: "u1" }],
      startDate: "2026-01-01",
      endDate: "2026-06-30",
    });

    // starting_balance of 0 is FP's reserved/unpopulated value — no starting
    // snapshot is emitted for it, only the current-balance one.
    expect(result.snapshots).toHaveLength(1);
    expect(result.snapshots[0].capturedAt).toBe("2026-06-30T23:59:59.000Z");
  });

  it("fetches closed trades from the trade-activity API per account", async () => {
    mockFetch(async (url: string) => {
      if (url.includes("/api/account/trade-activity")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              resource: {
                trades: [
                  {
                    transaction_id: "T1",
                    product: "Gold-Raw",
                    open_time: "2026-05-20T08:45:00+00:00",
                    close_time: "2026-05-20T08:45:00+00:00",
                    volume: 0.01,
                    profit: 0.79,
                    commission: 0,
                    swaps: 0,
                    net_pnl: 0.79,
                  },
                  {
                    transaction_id: "T2",
                    product: "FX-Raw",
                    close_time: "2026-05-21T10:00:00+00:00",
                    volume: 0.02,
                    net_pnl: -2.52,
                  },
                ],
                meta: { total: 2, per_page: 200, current_page: 1, last_page: 1 },
              },
            },
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            resource: {
              accounts: [
                {
                  account_number: "TC-1",
                  currency: "usd",
                  metrics: { roi: 0, starting_balance: 0, current_balance: 100 },
                  last_trade_at: "2026-05-21T10:00:00+00:00",
                  status: "active",
                },
              ],
            },
          },
        }),
      };
    });

    const result = await fpMarketsConnector.fetchCompetitionData({
      tournamentId: "t1",
      accounts: [{ accountNumber: "TC-1", userId: "u1" }],
      startDate: "2026-01-01",
      endDate: "2026-06-30",
    });

    expect(result.trades).toHaveLength(2);
    expect(result.trades[0]).toMatchObject({
      accountNumber: "TC-1",
      tradeId: "T1",
      closedAt: "2026-05-20T08:45:00+00:00",
      symbol: "Gold-Raw",
      netPnl: 0.79,
      currency: "USD", // uppercased from the performance response
      source: "broker",
    });
    expect(result.trades[1]).toMatchObject({ tradeId: "T2", netPnl: -2.52 });
  });

  it("throws the broker error message on a non-200 response", async () => {
    mockFetch(async () => ({
      ok: false,
      status: 403,
      json: async () => ({
        messages: {
          error: { others: ["Access denied: IP not whitelisted."] },
        },
      }),
    }));

    await expect(
      fpMarketsConnector.fetchCompetitionData({
        tournamentId: "t1",
        accounts: [{ accountNumber: "TC-1", userId: "u1" }],
      })
    ).rejects.toThrow("IP not whitelisted");
  });

  it("requires credentials in the environment", async () => {
    delete process.env.FP_MARKETS_TOKEN;

    await expect(
      fpMarketsConnector.fetchCompetitionData({
        tournamentId: "t1",
        accounts: [{ accountNumber: "TC-1", userId: "u1" }],
      })
    ).rejects.toThrow("FP_MARKETS_TOKEN");
  });
});

/**
 * FP changed trade-activity on 2026-09-03: a start_date/end_date span wider
 * than 3 days now returns 422, and their `net_pnl` was documented as profit
 * only — not net of commission and swaps, despite the name.
 */
describe("fpMarkets trade activity (post 2026-09-03)", () => {
  beforeEach(() => {
    setEnv();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = OLD_ENV;
  });

  const performancePayload = {
    data: {
      resource: {
        accounts: [
          {
            account_number: "81049662",
            currency: "usd",
            metrics: { roi: 0, starting_balance: 0, current_balance: 1000 },
            status: "active",
          },
        ],
      },
    },
  };

  function tradePayload(trades: any[], next: string | null) {
    return {
      data: {
        resource: {
          trades,
          next_since_timestamp: next,
          meta: { total: trades.length, per_page: 200, current_page: 1, last_page: 1 },
        },
      },
    };
  }

  /** Capture every activity request body the connector sends. */
  function runWith(tradeResponses: any[]) {
    const bodies: any[] = [];
    let call = 0;
    mockFetch(async (url: string, init: any) => {
      const body = JSON.parse(init.body);
      if (String(url).includes("/api/account/performance")) {
        return { ok: true, status: 200, json: async () => performancePayload };
      }
      bodies.push(body);
      const payload = tradeResponses[Math.min(call, tradeResponses.length - 1)];
      call++;
      return { ok: true, status: 200, json: async () => payload };
    });
    return bodies;
  }

  it("asks by cursor, never by a date range wider than FP allows", async () => {
    const bodies = runWith([tradePayload([], null)]);

    await fpMarketsConnector.fetchCompetitionData({
      tournamentId: "t1",
      accounts: [{ accountNumber: "81049662", userId: "u1" }],
      // A two-week competition: range mode would 422 on this.
      startDate: "2026-08-01T00:00:00.000Z",
      endDate: "2026-08-15T00:00:00.000Z",
    });

    expect(bodies.length).toBeGreaterThan(0);
    for (const body of bodies) {
      expect(body.since_timestamp).toBeTruthy();
      // Sending both modes is rejected by FP; sending a range is what broke.
      expect(body.start_date).toBeUndefined();
      expect(body.end_date).toBeUndefined();
    }
  });

  it("resumes from the account's stored cursor instead of the competition start", async () => {
    const bodies = runWith([tradePayload([], null)]);

    await fpMarketsConnector.fetchCompetitionData({
      tournamentId: "t1",
      accounts: [
        {
          accountNumber: "81049662",
          userId: "u1",
          cursor: "2026-08-10T00:00:00.000Z",
        },
      ],
      startDate: "2026-08-01T00:00:00.000Z",
      endDate: "2026-08-15T00:00:00.000Z",
    });

    expect(bodies[0].since_timestamp).toBe("2026-08-10T00:00:00.000Z");
  });

  it("walks forward until the broker stops advancing, and reports the resume point", async () => {
    // Each cursor call covers at most 3 days, so a backfill takes several.
    const bodies = runWith([
      tradePayload([], "2026-08-04T00:00:00.000Z"),
      tradePayload([], "2026-08-07T00:00:00.000Z"),
      tradePayload([], "2026-08-07T00:00:00.000Z"), // no advance -> stop
    ]);

    const result = await fpMarketsConnector.fetchCompetitionData({
      tournamentId: "t1",
      accounts: [{ accountNumber: "81049662", userId: "u1" }],
      startDate: "2026-08-01T00:00:00.000Z",
      endDate: "2026-08-15T00:00:00.000Z",
    });

    expect(bodies.length).toBe(3);
    expect(bodies[1].since_timestamp).toBe("2026-08-04T00:00:00.000Z");
    expect(result.cursors).toEqual([
      { accountNumber: "81049662", cursor: "2026-08-07T00:00:00.000Z" },
    ]);
  });

  it("nets commission and swaps out of P&L", async () => {
    runWith([
      tradePayload(
        [
          {
            transaction_id: 1,
            product: "FX-Raw",
            open_time: "2026-08-02T10:00:00+00:00",
            close_time: "2026-08-02T11:00:00+00:00",
            open_price: 1.1,
            close_price: 1.2,
            volume: 1,
            profit: 100,
            commission: 7,
            swaps: 3,
            // FP sends net_pnl === profit; the name is misleading.
            net_pnl: 100,
          },
        ],
        null
      ),
    ]);

    const result = await fpMarketsConnector.fetchCompetitionData({
      tournamentId: "t1",
      accounts: [{ accountNumber: "81049662", userId: "u1" }],
      startDate: "2026-08-01T00:00:00.000Z",
      endDate: "2026-08-15T00:00:00.000Z",
    });

    // 100 gross - 7 commission - 3 swaps. Taking net_pnl at face value would
    // overstate this trader by 10 on a single trade.
    expect(result.trades).toHaveLength(1);
    expect(result.trades[0].netPnl).toBeCloseTo(90, 6);
    expect(result.trades[0].fees).toBe(7);
    expect(result.trades[0].swap).toBe(3);
  });
});
