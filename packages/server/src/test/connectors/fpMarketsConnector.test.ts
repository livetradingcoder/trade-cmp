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
  const fetchMock = vi.fn(impl);
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

    expect(result.snapshots).toHaveLength(2);
    expect(result.snapshots[1].capturedAt).toBe("2026-06-30T23:59:59.000Z");
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
