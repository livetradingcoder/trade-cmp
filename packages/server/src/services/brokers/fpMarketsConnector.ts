import crypto from "crypto";
import {
  BrokerConnector,
  FetchCompetitionDataInput,
  FetchCompetitionDataResult,
  NormalizedSnapshotInput,
} from "./types";

/**
 * FP Markets ("fpmarkets") connector.
 *
 * Consumes the broker's Account Performance API:
 *   POST {base_url}/api/account/performance
 *
 * Auth headers per request:
 *   token      - API token (fp_access_tokens.token_str)
 *   timestamp  - current unix timestamp (seconds, as string)
 *   signature  - HMAC-SHA256(timestamp, secret) as lowercase hex
 *
 * The API is keyed by REBATE/IB account numbers and returns the trading
 * accounts mapped under them. We send our rebate account number(s), then match
 * the returned trading accounts back to the participant accounts we were asked
 * about.
 *
 * The API does not return raw trades, and its `roi` field is reserved (always
 * 0). We therefore emit two balance snapshots per account (starting_balance and
 * current_balance) and let calculateLeaderboard derive ROI from equity change.
 *
 * Credentials are read from the environment for the beta integration:
 *   FP_MARKETS_BASE_URL          (default https://ibbeta.fptrading.com)
 *   FP_MARKETS_TOKEN             (required)
 *   FP_MARKETS_SECRET            (required)
 *   FP_MARKETS_REBATE_ACCOUNTS   (required, comma-separated rebate numbers)
 */

const DEFAULT_BASE_URL = "https://ibbeta.fptrading.com";
const PERFORMANCE_PATH = "/api/account/performance";
const DEFAULT_LOOKBACK_DAYS = 180;
const DEFAULT_CURRENCY = "USD";

interface FpMarketsConfig {
  baseUrl: string;
  token: string;
  secret: string;
  rebateAccountNumbers: string[];
}

interface FpAccountResource {
  account_number: string;
  user_info?: { first_name?: string; last_name_masked?: string };
  metrics?: {
    roi?: number;
    starting_balance?: number;
    current_balance?: number;
  };
  last_trade_at?: string | null;
  status?: string;
}

/** HMAC-SHA256(timestamp, secret) as lowercase hex, per the API spec. */
export function signTimestamp(timestamp: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(timestamp).digest("hex");
}

function loadConfig(): FpMarketsConfig {
  const token = process.env.FP_MARKETS_TOKEN;
  const secret = process.env.FP_MARKETS_SECRET;

  if (!token || !secret) {
    throw new Error(
      "FP Markets connector requires FP_MARKETS_TOKEN and FP_MARKETS_SECRET"
    );
  }

  const rebateAccountNumbers = (process.env.FP_MARKETS_REBATE_ACCOUNTS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (rebateAccountNumbers.length === 0) {
    throw new Error(
      "FP Markets connector requires FP_MARKETS_REBATE_ACCOUNTS (comma-separated rebate account numbers)"
    );
  }

  return {
    baseUrl: (process.env.FP_MARKETS_BASE_URL || DEFAULT_BASE_URL).replace(
      /\/+$/,
      ""
    ),
    token,
    secret,
    rebateAccountNumbers,
  };
}

/** Reduce an ISO date/datetime to a YYYY-MM-DD string for the request body. */
function toDateOnly(value: string): string {
  return value.slice(0, 10);
}

function resolveRange(input: FetchCompetitionDataInput): {
  startDate: string;
  endDate: string;
} {
  if (input.startDate && input.endDate) {
    return {
      startDate: toDateOnly(input.startDate),
      endDate: toDateOnly(input.endDate),
    };
  }

  const end = new Date();
  const start = new Date(end.getTime() - DEFAULT_LOOKBACK_DAYS * 86400000);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

/** Pull the first human-readable message out of the API error envelope. */
function extractError(payload: unknown): string | null {
  const others = (payload as any)?.messages?.error?.others;
  if (Array.isArray(others) && others.length > 0) {
    const first = others[0];
    if (typeof first === "string") return first;
    return JSON.stringify(first);
  }
  return null;
}

async function callPerformanceApi(
  config: FpMarketsConfig,
  body: { account_numbers: string[]; start_date: string; end_date: string }
): Promise<FpAccountResource[]> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = signTimestamp(timestamp, config.secret);

  const response = await fetch(`${config.baseUrl}${PERFORMANCE_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token: config.token,
      timestamp,
      signature,
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      extractError(payload) || `FP Markets API error (HTTP ${response.status})`;
    throw new Error(message);
  }

  const accounts = (payload as any)?.data?.resource?.accounts;
  return Array.isArray(accounts) ? accounts : [];
}

export const fpMarketsConnector: BrokerConnector = {
  type: "fpmarkets",
  supportsRawTrades: false,
  supportsSnapshots: true,
  // roi from the API is reserved (always 0), so broker metrics are not usable
  // as a leaderboard fallback. ROI is computed from balance snapshots instead.
  supportsBrokerMetrics: false,
  async fetchCompetitionData(
    input: FetchCompetitionDataInput
  ): Promise<FetchCompetitionDataResult> {
    const config = loadConfig();
    const { startDate, endDate } = resolveRange(input);

    const resources = await callPerformanceApi(config, {
      account_numbers: config.rebateAccountNumbers,
      start_date: startDate,
      end_date: endDate,
    });

    const byAccountNumber = new Map<string, FpAccountResource>();
    for (const resource of resources) {
      if (resource && typeof resource.account_number === "string") {
        byAccountNumber.set(resource.account_number, resource);
      }
    }

    const matchedAccounts: FetchCompetitionDataResult["accounts"] = [];
    const snapshots: NormalizedSnapshotInput[] = [];

    const startCapturedAt = `${startDate}T00:00:00.000Z`;

    for (const account of input.accounts) {
      const resource = byAccountNumber.get(account.accountNumber);
      if (!resource) {
        // Account is not mapped under our rebate number(s) for this window.
        continue;
      }

      matchedAccounts.push(account);

      const starting = resource.metrics?.starting_balance ?? 0;
      const current = resource.metrics?.current_balance ?? 0;
      const endCapturedAt = resource.last_trade_at
        ? new Date(resource.last_trade_at).toISOString()
        : `${endDate}T23:59:59.000Z`;

      snapshots.push({
        accountNumber: account.accountNumber,
        capturedAt: startCapturedAt,
        balance: starting,
        equity: starting,
        currency: DEFAULT_CURRENCY,
        source: "broker",
      });
      snapshots.push({
        accountNumber: account.accountNumber,
        capturedAt: endCapturedAt,
        balance: current,
        equity: current,
        currency: DEFAULT_CURRENCY,
        source: "broker",
      });
    }

    return {
      accounts: matchedAccounts,
      snapshots,
      trades: [],
      brokerMetrics: [],
    };
  },
};
