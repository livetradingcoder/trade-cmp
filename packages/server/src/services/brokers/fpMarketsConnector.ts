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

export function loadFpMarketsConfig(): FpMarketsConfig {
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

function defaultRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date(end.getTime() - DEFAULT_LOOKBACK_DAYS * 86400000);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
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
  return defaultRange();
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

export interface FpMarketsProbeResult {
  baseUrl: string;
  requestedAccounts: string[];
  startDate: string;
  endDate: string;
  accountsReturned: FpAccountResource[];
}

/**
 * Make one live, signed call to the Account Performance API using the
 * configured rebate account number(s). Returns whatever accounts the broker
 * sends back (no participant matching) — a direct proof that auth, request
 * signing, and IP whitelisting are all working. Throws with the broker's error
 * message otherwise (e.g. "Access denied: IP not whitelisted.").
 */
export async function probeFpMarkets(range?: {
  startDate?: string;
  endDate?: string;
}): Promise<FpMarketsProbeResult> {
  const config = loadFpMarketsConfig();
  const { startDate, endDate } =
    range?.startDate && range?.endDate
      ? { startDate: toDateOnly(range.startDate), endDate: toDateOnly(range.endDate) }
      : defaultRange();

  const accountsReturned = await callPerformanceApi(config, {
    account_numbers: config.rebateAccountNumbers,
    start_date: startDate,
    end_date: endDate,
  });

  return {
    baseUrl: config.baseUrl,
    requestedAccounts: config.rebateAccountNumbers,
    startDate,
    endDate,
    accountsReturned,
  };
}

let rebateAccountsCache: { at: number; accounts: Set<string> } | null = null;
const REBATE_CACHE_MS = 60_000;

/**
 * The set of trading account numbers currently mapped under our rebate/IB, per
 * FP's Account Performance API. Cached for 60s. Used to verify (for real) that a
 * participant's FP account is registered under our referral code — replacing the
 * old self-declared is_new_user placeholder. Throws if FP is unreachable so
 * callers can fall back to the stored value rather than wiping verification.
 */
export async function getRebateAccountNumbers(): Promise<Set<string>> {
  if (
    rebateAccountsCache &&
    Date.now() - rebateAccountsCache.at < REBATE_CACHE_MS
  ) {
    return rebateAccountsCache.accounts;
  }
  const result = await probeFpMarkets();
  const accounts = new Set(
    result.accountsReturned
      .map((a) => (a.account_number == null ? "" : String(a.account_number)))
      .filter(Boolean)
  );
  rebateAccountsCache = { at: Date.now(), accounts };
  return accounts;
}

// --- Trade / Cash Activity APIs (per single trading account, paginated) ---

const TRADE_ACTIVITY_PATH = "/api/account/trade-activity";
const CASH_ACTIVITY_PATH = "/api/account/cash-activity";
const ACTIVITY_PER_PAGE = 200; // API max
const ACTIVITY_MAX_PAGES = 50; // safety cap (50 * 200 = 10k records/account)
const ACTIVITY_TIMEOUT_MS = 15000; // never let a hung FP call stall the request

export interface FpTrade {
  transaction_id?: string;
  product?: string;
  open_time?: string;
  open_price?: number;
  close_time?: string;
  close_price?: number;
  volume?: number;
  profit?: number;
  commission?: number;
  swaps?: number;
  net_pnl?: number;
}

export interface FpCashTransaction {
  transaction_id?: string;
  type?: string; // deposit | withdrawal | balance adjustment | ...
  amount?: number;
  amount_in_usd?: number;
  currency?: string;
  date_time?: string;
  comment?: string;
}

/** These endpoints use a flat error envelope: { messages: string[], httpStatusCode }. */
function extractActivityError(payload: unknown): string | null {
  const messages = (payload as any)?.messages;
  if (Array.isArray(messages) && messages.length > 0) {
    return typeof messages[0] === "string" ? messages[0] : JSON.stringify(messages[0]);
  }
  return extractError(payload);
}

interface ActivityParams {
  rebateAccountNumber: string;
  accountNumber: string;
  startDate: string;
  endDate: string;
}

/** One signed POST to an activity endpoint (page-scoped), with a hard timeout. */
async function activityRequest(
  config: FpMarketsConfig,
  path: string,
  params: ActivityParams & { page: number }
): Promise<{ status: number; ok: boolean; payload: any; rawText: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ACTIVITY_TIMEOUT_MS);
  try {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = signTimestamp(timestamp, config.secret);
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: config.token,
        timestamp,
        signature,
      },
      body: JSON.stringify({
        rebate_account_number: params.rebateAccountNumber,
        account_number: params.accountNumber,
        start_date: params.startDate,
        end_date: params.endDate,
        page: params.page,
        per_page: ACTIVITY_PER_PAGE,
      }),
      signal: controller.signal,
    });
    const rawText = await response.text();
    let payload: any = null;
    try {
      payload = rawText ? JSON.parse(rawText) : null;
    } catch {
      payload = null;
    }
    return { status: response.status, ok: response.ok, payload, rawText };
  } catch (error: any) {
    const msg =
      error?.name === "AbortError"
        ? `timeout after ${ACTIVITY_TIMEOUT_MS}ms (endpoint not responding)`
        : error?.message || "network error";
    return { status: 0, ok: false, payload: { messages: [msg] }, rawText: msg };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * POST a paginated activity endpoint and concatenate `field` records across all
 * pages (following meta.last_page). Same auth as the performance API.
 */
async function fetchActivityPaged<T>(
  config: FpMarketsConfig,
  path: string,
  field: "trades" | "transactions",
  params: ActivityParams
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;

  for (let guard = 0; guard < ACTIVITY_MAX_PAGES; guard++) {
    const { status, ok, payload } = await activityRequest(config, path, {
      ...params,
      page,
    });
    if (!ok) {
      throw new Error(
        `FP Markets ${path} HTTP ${status}: ${
          extractActivityError(payload) || "request failed"
        }`
      );
    }

    const resource = (payload as any)?.data?.resource;
    const records = Array.isArray(resource?.[field]) ? resource[field] : [];
    all.push(...(records as T[]));

    const lastPage =
      typeof resource?.meta?.last_page === "number" ? resource.meta.last_page : page;
    if (page >= lastPage || records.length === 0) break;
    page += 1;
  }

  return all;
}

export function fetchTradeActivity(
  config: FpMarketsConfig,
  params: ActivityParams
): Promise<FpTrade[]> {
  return fetchActivityPaged<FpTrade>(config, TRADE_ACTIVITY_PATH, "trades", params);
}

export function fetchCashActivity(
  config: FpMarketsConfig,
  params: ActivityParams
): Promise<FpCashTransaction[]> {
  return fetchActivityPaged<FpCashTransaction>(
    config,
    CASH_ACTIVITY_PATH,
    "transactions",
    params
  );
}

export interface ActivityProbeSide {
  status: number;
  ok: boolean;
  count: number;
  sample: any;
  raw: string;
}

export interface FpActivityProbeResult {
  baseUrl: string;
  rebateAccountNumber: string;
  accountNumber: string;
  startDate: string;
  endDate: string;
  trade: ActivityProbeSide;
  cash: ActivityProbeSide;
}

/**
 * Raw diagnostic: one page-1 signed call to each activity endpoint for a single
 * trading account (first configured rebate number). Returns the HTTP status +
 * a body snippet so we can confirm the endpoints are live and see the real
 * response shape without a hung request stalling anything.
 */
export async function probeFpActivity(input: {
  accountNumber: string;
  startDate?: string;
  endDate?: string;
}): Promise<FpActivityProbeResult> {
  const config = loadFpMarketsConfig();
  const { startDate, endDate } =
    input.startDate && input.endDate
      ? {
          startDate: toDateOnly(input.startDate),
          endDate: toDateOnly(input.endDate),
        }
      : defaultRange();

  const rebateAccountNumber = config.rebateAccountNumbers[0];
  const base = {
    rebateAccountNumber,
    accountNumber: input.accountNumber,
    startDate,
    endDate,
    page: 1,
  };

  const [t, c] = await Promise.all([
    activityRequest(config, TRADE_ACTIVITY_PATH, base),
    activityRequest(config, CASH_ACTIVITY_PATH, base),
  ]);

  const summarize = (
    r: { status: number; ok: boolean; payload: any; rawText: string },
    field: "trades" | "transactions"
  ): ActivityProbeSide => {
    const arr = r.payload?.data?.resource?.[field];
    return {
      status: r.status,
      ok: r.ok,
      count: Array.isArray(arr) ? arr.length : 0,
      sample: Array.isArray(arr) && arr.length ? arr[0] : null,
      raw: (r.rawText || "").slice(0, 600),
    };
  };

  return {
    baseUrl: config.baseUrl,
    rebateAccountNumber,
    accountNumber: input.accountNumber,
    startDate,
    endDate,
    trade: summarize(t, "trades"),
    cash: summarize(c, "transactions"),
  };
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
    const config = loadFpMarketsConfig();
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

      // FP's starting_balance is reserved and comes back 0 in practice — a
      // zero starting snapshot would poison the ROI baseline downstream, so
      // only emit it when the broker actually populates it.
      if (starting > 0) {
        snapshots.push({
          accountNumber: account.accountNumber,
          capturedAt: startCapturedAt,
          balance: starting,
          equity: starting,
          currency: DEFAULT_CURRENCY,
          source: "broker",
        });
      }
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
