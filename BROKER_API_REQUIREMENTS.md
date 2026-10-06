# Broker Data API — Integration Requirements

**Audience:** a broker we would like to connect to our application.  
**Version:** 1.0 · October 2026

We operate an application that ranks traders by performance. Traders open accounts
with you through our introducing-broker (IB) link, and we read their balances and
closed trades through your API to keep a leaderboard up to date every minute. Our
access is **read-only**: we never place trades or move funds.

This document lists what we need from your API. Our integration is built to the
contract below, so if your API already meets it, connecting takes only credentials
and an IP allowlist, with no custom work on either side. Where it differs, tell us
before building anything: a deviation in authentication, paths, field names or the
semantics in §5 needs custom work on our side and will delay us both.

Please answer the numbered requirements in §7 and send back what §6 asks for.

## At a glance

| | |
|---|---|
| Endpoints | Three `POST` endpoints, JSON in and out: performance, trade-activity, cash-activity (optional) |
| Authentication | `token`, `timestamp` and `signature` headers; HMAC-SHA256 |
| Access | Read-only; credentials bound to our IB number(s) |
| Network | HTTPS; our source IP allowlisted |
| Our load | One performance call a minute, plus one trade-activity call per tracked trading account a minute (more while catching up) |
| Timeout | Respond within 15 seconds; we abort a slower trade-activity request |
| Freshness | A closed trade must be readable through the API as soon as it closes |

## 1. Transport and authentication

All three endpoints are `POST` over HTTPS with `Content-Type: application/json`.
Every request carries three headers:

| Header | Value |
|---|---|
| `token` | The API token you issue us, sent verbatim |
| `timestamp` | Current Unix time in **seconds**, as a decimal string |
| `signature` | `HMAC-SHA256(message = timestamp, key = secret)` as **lowercase hex** |

The signature covers the timestamp string only, not the body or the path. The
`secret` is shared once when you issue credentials and is never transmitted. We
recommend rejecting timestamps more than five minutes from your own clock; ours
is NTP-synchronised.

```js
const timestamp = String(Math.floor(Date.now() / 1000));
const signature = crypto.createHmac("sha256", secret)
                        .update(timestamp)
                        .digest("hex");
```

**Ownership.** A token is bound to the IB number(s) it was issued for. A request
for an IB number the token does not own must be refused with 403 and return no
data.

**IP allowlisting** is fine. We send you our egress IP before testing. It can
change if we move hosting, so give us a way to update it without a support ticket.

**Rate limit.** Tell us your exact limit and whether it is per token or per IB.
At 60 requests a minute per token, about 59 trading accounts can be tracked every
minute: one performance call plus one trade-activity call per account.

**Timeout.** Respond within 15 seconds. We abort a trade-activity request that
takes longer and try again on the next cycle, and performance should be just as
fast.

### Errors

Use standard status codes:

| Status | Meaning |
|---|---|
| 401 | Missing or invalid token, timestamp or signature |
| 403 | IP not allowlisted, or the token does not own the requested IB |
| 422 | Validation failure, such as a malformed date or a range that is too wide |
| 429 | Rate limit exceeded |

Every error body must carry a human-readable reason, in either of these shapes:

```json
{
  "messages": {
    "error": { "others": ["Access denied: this token does not own the requested IB account."] }
  }
}
```

```json
{ "messages": ["Access denied: this token does not own the requested IB account."] }
```

We show that string to our operators verbatim. A bare "Bad Request" or an HTML
error page costs hours.

## 2. Account model

You issue us one or more **IB account numbers** (the API calls them "rebate
account numbers"). Every trading account opened through our referral link must be
mapped under one of them.

That mapping is what proves a competitor signed up through us. If an account is
not returned under our IB number, we treat it as unverified and flag the trader
in our admin.

## 3. Endpoints

### 3.1 `POST /api/account/performance`

Balances for every trading account under our IB number(s). We call it about once
a minute, and it also shows an applicant's balance before we approve them.

**Request**

```json
{
  "account_numbers": ["123456"],
  "start_date": "2026-10-01",
  "end_date": "2026-12-31"
}
```

`account_numbers` are **IB** numbers, not trader accounts. Dates are `YYYY-MM-DD`.

**Response**

```json
{
  "data": {
    "resource": {
      "accounts": [
        {
          "account_number": "82000001",
          "currency": "usd",
          "user_info": { "first_name": "Alex", "last_name_masked": "S***" },
          "metrics": { "roi": 0, "starting_balance": 0, "current_balance": 1225.07 },
          "last_trade_at": "2026-10-05T14:20:11+00:00",
          "status": "active"
        }
      ]
    }
  }
}
```

| Field | Required | Notes |
|---|---|---|
| `account_number` | **yes** | Trading account number, as a string |
| `metrics.current_balance` | **yes** | Balance now, in `currency` |
| `currency` | yes | ISO 4217, case-insensitive |
| `last_trade_at` | no | Must agree with trade-activity |
| `status` | no | Free text |
| `user_info` | no | Display only; mask the surname as shown |
| `metrics.roi`, `metrics.starting_balance` | no | **Ignored.** We compute both ourselves (§4); zero is fine |

Return **all** accounts under the IB number, including funded accounts that have
never traded. An applicant with an untraded account must still appear, or we
cannot verify them.

### 3.2 `POST /api/account/trade-activity`

**Closed trades** for one trading account. The leaderboard is built from this:
P&L, trade count and win rate all come from it. One account per call.

**Request modes.** Send exactly one of the two per request:

| Mode | You receive | Our use |
|---|---|---|
| **Cursor** (required) | `since_timestamp` | Every sync |
| Range (optional) | `start_date` and `end_date` | Diagnostics only |

**Cursor request**

```json
{
  "rebate_account_number": "123456",
  "account_number": "82000001",
  "since_timestamp": "2026-10-01T00:00:00.000Z",
  "page": 1,
  "per_page": 200
}
```

**Response**

```json
{
  "data": {
    "resource": {
      "rebate_account_number": "123456",
      "account_number": "82000001",
      "since_timestamp": "2026-10-01T00:00:00+00:00",
      "capped_until": "2026-10-04T00:00:00+00:00",
      "next_since_timestamp": "2026-10-04T00:00:00+00:00",
      "trades": [
        {
          "transaction_id": "123456789",
          "product": "EURUSD",
          "open_time": "2026-10-02T09:00:00+00:00",
          "open_price": 1.08,
          "close_time": "2026-10-02T12:00:00+00:00",
          "close_price": 1.09,
          "volume": 1.0,
          "profit": 100.0,
          "commission": 3.5,
          "swaps": 0.25,
          "net_pnl": 100.0
        }
      ],
      "meta": { "current_page": 1, "last_page": 1, "per_page": 200, "total": 1 }
    }
  }
}
```

**How cursor mode works**

- `since_timestamp` is ISO 8601 in UTC. Accept both `…Z` and `…+00:00`, with or
  without milliseconds.
- Return the closed trades from `since_timestamp` forward for a window of
  **3 days**, or up to now if that is sooner. Read live trading data, not a
  periodically refreshed copy: that is what keeps the leaderboard current.
- `next_since_timestamp` is **required**. It is where the next call should resume,
  normally the end of the window you served. `capped_until` shows how far the
  window reached.
- We call in a loop, passing each `next_since_timestamp` back, until a response
  covers less than 3 days, which tells us we have reached the present. After that,
  each minute's call resumes from the last cursor and fetches only new trades.
  A window shorter than 3 days that stops short of now makes us stop early, so
  return full windows until you reach it.
- Our first call for an account starts at the competition's start date, so you
  must serve `since_timestamp` values weeks or months in the past. With 3-day
  windows, catching up on a long competition takes a few dozen calls, once.
- Windows may overlap at their edges. We de-duplicate on `transaction_id`.

**Range mode** (optional) takes `start_date` and `end_date`, as dates or ISO 8601
times, and returns the same response without the cursor fields. You may cap
the span, for example at 3 days, and return 422 beyond it.

| Field | Required | Notes |
|---|---|---|
| `transaction_id` | **yes** | Stable and unique per trade. We key on it; a changing id duplicates trades |
| `close_time` | **yes** | Closed trades only (§5) |
| `net_pnl` | **yes** | Profit or loss **before** commission and swaps (§5) |
| `commission` | **yes** | Charge for the trade; positive reduces the trader's result (§5) |
| `swaps` | **yes** | Swap charge; positive reduces the result, a credit is negative (§5) |
| `profit` | no | Same value as `net_pnl` |
| `product`, `open_time`, `open_price`, `close_price`, `volume` | yes | Display only |
| `meta.last_page` | **yes** | Required for pagination |

**Pagination.** `per_page` is at most 200. We start at `page: 1` and request the
next page until `page >= meta.last_page` or a page comes back empty, up to 50
pages (10,000 trades) per window. `meta.last_page` must be accurate: without it we
cannot tell a last page from a truncated one.

### 3.3 `POST /api/account/cash-activity`

Deposits and withdrawals for one trading account. Same request modes and
pagination as trade-activity; the array is `transactions` instead of `trades`.

| Field | Notes |
|---|---|
| `transaction_id` | Stable and unique |
| `type` | `deposit` or `withdrawal` |
| `currency` | ISO 4217 |
| `amount` | Signed: positive for a deposit, negative for a withdrawal |
| `date_time` | ISO 8601, UTC |
| `comment` | Free text |

**Optional today.** We do not consume it yet, because our ROI is already
deposit-immune (§4). Implement it if you can; it will let us show funding changes.

## 4. How we use the data

```
result   = net_pnl − commission − swaps         per closed trade
P&L      = Σ result
ROI      = Σ result ÷ (current_balance − Σ result)
trades   = count of closed trades in the competition window
win rate = trades with result > 0 ÷ trades
```

The ROI denominator reconstructs starting capital from the current balance and
the period's trading result, so a deposit or withdrawal in the middle of a
competition does not move ROI. That is why we ignore `starting_balance` and
compute ROI ourselves instead of trusting a broker-reported figure.

The public leaderboard shows **ROI %, trade count and win rate** only. Balances
and cash P&L are never published, because they reveal account size.

## 5. Semantics that matter

These are the points where integrations most often differ from ours. Each one
silently changes leaderboard results if it is wrong.

1. **Costs are separate from `net_pnl`.** `net_pnl` is the trade's profit or loss
   before commission and swaps, so it equals `profit` despite the name. We subtract
   `commission` and `swaps` ourselves. If you also deduct them inside `net_pnl`,
   traders are charged twice.
2. **Sign of costs.** `commission` and `swaps` are the amounts charged: positive
   when they cost the trader, negative when they credit the trader (a positive-carry
   swap). Example: `net_pnl` 100.00, `commission` 3.50 and `swaps` 0.25 give a
   result of 96.25.
3. **Closed trades only.** `close_time` is populated. An open position returned as
   a trade corrupts the leaderboard.
4. **Final and stable.** `transaction_id` never changes for a trade, and a closed
   trade never changes or disappears afterwards. We do not re-read windows behind
   our cursor.
5. **Freshness.** A trade must be readable through the API as soon as it closes.
   Because we do not re-read behind our cursor, a trade that appears late can be
   missed. This is why cursor mode must read live trading data.
6. **Time.** Every timestamp is true UTC with an explicit offset (`+00:00` or
   `Z`). Do not label broker-local or server-local time as UTC: we compare your
   times with real UTC, and a hidden offset puts trades in the wrong competition
   window.
7. **Money.** Every amount is in the account's own currency, given as `currency`
   on the performance endpoint. We do not convert.
8. **Complete lists.** Performance returns every account under the IB number,
   whatever its activity.

## 6. Going live

**We need from you**

- Your answers to the requirements in §7.
- Base URL, and whether it is a test or live environment.
- Token and secret for our IB account number(s), with the performance and
  trade-activity endpoints enabled.
- Your rate limit, and whether it is per token or per IB.
- A test trading account under our IB number with at least one closed trade.
- Allowlisting of our egress IP, which we will send you.
- A technical contact for questions.

**We do**

- Add your API to our application and run a read-only probe against performance
  and trade-activity for the test account.
- Reconcile our numbers against your own reporting for that account before any
  competition opens on your platform.

The last two steps are not optional. In our experience every discrepancy is found
there, not in testing.

## 7. Your response

Please answer **Met**, **Partial** or **Not met** against each numbered requirement,
with a note wherever it is Partial or Not met. **Must** is required for us to
connect, **Should** is strongly preferred, and **May** is optional.

| # | Requirement | Level | See |
|---|---|---|---|
| R1 | HMAC-SHA256 signature of the timestamp is verified; a bad one returns 401 | Must | §1 |
| R2 | The token is bound to our IB number(s); any other IB returns 403 and no data | Must | §1 |
| R3 | Any source-IP allowlist can be updated without a support ticket | Should | §1 |
| R4 | Rate limit is stated and covers our load (see At a glance) | Must | §1 |
| R5 | Performance returns every account under the IB, with balance and currency | Must | §3.1 |
| R6 | Trade-activity cursor mode with live data and 3-day windows | Must | §3.2 |
| R7 | Pagination: `per_page` up to 200 and an accurate `meta.last_page` | Must | §3.2 |
| R8 | Closed trades only, each with a stable, unique `transaction_id` | Must | §3.2, §5 |
| R9 | `net_pnl` is before costs; `commission` and `swaps` are signed charges | Must | §5 |
| R10 | Every timestamp is true UTC with an explicit offset | Must | §5 |
| R11 | A trade is readable through the API as soon as it closes | Must | §5 |
| R12 | Errors carry a readable message for 401, 403, 422 and 429 | Should | §1 |
| R13 | Responses arrive within 15 seconds | Should | §1 |
| R14 | A test trading account under our IB with at least one closed trade | Must | §6 |
| R15 | Cash-activity endpoint | May | §3.3 |

## 8. Check your implementation

Before you send us credentials you can check your own implementation with `curl`.
Replace the placeholder values.

```bash
BASE="https://api.your-broker.example"
TOKEN="YOUR_TOKEN"
SECRET="YOUR_SECRET"
TS=$(date +%s)
SIG=$(printf '%s' "$TS" | openssl dgst -sha256 -hmac "$SECRET" -hex | awk '{print $NF}')

# Balances for every account under an IB number
curl -s "$BASE/api/account/performance" \
  -H "Content-Type: application/json" \
  -H "token: $TOKEN" -H "timestamp: $TS" -H "signature: $SIG" \
  -d '{
    "account_numbers": ["123456"],
    "start_date": "2026-10-01",
    "end_date": "2026-12-31"
  }'

# Closed trades for one account, in cursor mode
curl -s "$BASE/api/account/trade-activity" \
  -H "Content-Type: application/json" \
  -H "token: $TOKEN" -H "timestamp: $TS" -H "signature: $SIG" \
  -d '{
    "rebate_account_number": "123456",
    "account_number": "82000001",
    "since_timestamp": "2026-10-01T00:00:00.000Z",
    "page": 1,
    "per_page": 200
  }'
```

Both calls should return `200` with the shapes in §3. Then ask for an IB number
your token does not own: it should return `403` with a readable message.
