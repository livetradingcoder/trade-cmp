# LiveTradingLeague — Broker Integration Specification

**Audience:** a broker who wants their accounts to compete on LiveTradingLeague.
**Version:** 1.0 · **Contact:** LiveTradingLeague

Implement the three endpoints below exactly as described and your accounts work
on the platform with no code written on our side — we add your broker by
entering your base URL and credentials in our admin. Any deviation in auth,
paths, envelope shape, or field names requires custom work and will delay you.

This contract is what FP Markets already serves; it is the reference
implementation, so "matches FP Markets" is a sufficient answer to any question
this document leaves open.

---

## 1. Transport and authentication

- **HTTPS only.** All three endpoints are `POST` with `Content-Type: application/json`.
- **Every request carries three headers:**

| Header | Value |
|---|---|
| `token` | The API token we agree with you, sent verbatim |
| `timestamp` | Current Unix time in **seconds**, as a decimal string |
| `signature` | `HMAC-SHA256(message = timestamp, key = secret)`, **lowercase hex** |

The signature signs *the timestamp string only* — not the body, not the path.
The `secret` is a shared secret you issue us alongside the token; it is never
transmitted.

Reference (Node.js):

```js
const timestamp = String(Math.floor(Date.now() / 1000));
const signature = crypto.createHmac("sha256", secret)
                        .update(timestamp)
                        .digest("hex");
```

- **IP allowlisting** is fine. Tell us which IPs to register and we will supply
  our egress addresses. Expect them to change if we move hosting; give us a way
  to update them without a support ticket.
- **Rate limit:** tell us the exact limit. We poll every 60 seconds per active
  competition. FP's limit is 60 requests/minute application-wide, which is a
  workable floor.
- **Timeouts:** respond within 15 seconds or we abort the request.

### Errors

Non-2xx responses must carry a human-readable reason:

```json
{ "messages": { "error": { "others": ["Access denied: IP not whitelisted."] } } }
```

We surface that string to our operators verbatim. "Bad Request" with no body
costs us hours.

---

## 2. Account model

You issue us one or more **rebate account numbers** (IB/partner accounts). Every
trading account opened under our referral link must be mapped under one of them.

That mapping is what proves a competitor signed up through us. If an account is
not returned under our rebate number, we treat it as unverified and the trader
is flagged in our admin.

---

## 3. Endpoints

### 3.1 `POST /api/account/performance`

Balances for every trading account under our rebate account(s). Called about
once a minute per competition, and used both for the leaderboard and to show an
applicant's balance before we approve them.

**Request**

```json
{
  "account_numbers": ["477779"],
  "start_date": "2026-01-01",
  "end_date": "2026-06-30"
}
```

`account_numbers` are **rebate** numbers, not trader accounts. Dates are
`YYYY-MM-DD`.

**Response**

```json
{
  "data": {
    "resource": {
      "accounts": [
        {
          "account_number": "81049662",
          "currency": "usd",
          "user_info": { "first_name": "Raul", "last_name_masked": "T***" },
          "metrics": {
            "roi": 0,
            "starting_balance": 0,
            "current_balance": 1225.07
          },
          "last_trade_at": "2026-08-07T23:34:22+00:00",
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
| `metrics.current_balance` | **yes** | Account balance now, in `currency` |
| `currency` | yes | ISO 4217; case-insensitive, we uppercase it |
| `last_trade_at` | no | Must agree with Trade Activity — see §5 |
| `status` | no | Free text |
| `metrics.roi` | no | **We ignore it** and compute ROI ourselves |
| `metrics.starting_balance` | no | **We ignore it** — see §5 |

Return **all** accounts under the rebate number. Do not filter to accounts with
activity: an applicant with a funded but untraded account must still appear, or
we cannot verify them.

### 3.2 `POST /api/account/trade-activity`

**Closed trades** for one trading account. This is the source of the
leaderboard — P&L, trade count and win rate are computed from it.

**Request**

```json
{
  "rebate_account_number": "477779",
  "account_number": "81049662",
  "start_date": "2026-08-01T00:00:00.000Z",
  "end_date": "2026-08-31T23:59:59.000Z",
  "page": 1,
  "per_page": 200
}
```

One account per call. `per_page` maximum is 200.

**Response**

```json
{
  "data": {
    "resource": {
      "trades": [
        {
          "transaction_id": "123456789",
          "product": "EURUSD",
          "open_time": "2026-08-05T09:00:00+00:00",
          "open_price": 1.08,
          "close_time": "2026-08-05T12:00:00+00:00",
          "close_price": 1.09,
          "volume": 1.0,
          "profit": 100.0,
          "commission": -3.0,
          "swaps": 0.0,
          "net_pnl": 97.0
        }
      ],
      "meta": { "current_page": 1, "last_page": 3, "per_page": 200 }
    }
  }
}
```

| Field | Required | Notes |
|---|---|---|
| `transaction_id` | **yes** | Stable and unique per trade. We key on it — a changing id duplicates trades |
| `close_time` | **yes** | Closed trades only |
| `net_pnl` | **yes** | **Net of commission and swap.** See §5 |
| `product` | yes | Instrument symbol |
| `open_time`, `open_price`, `close_price`, `volume` | yes | Display only |
| `commission`, `swaps` | yes | Reported separately as well as inside `net_pnl` |
| `profit` | no | Gross, before costs |
| `meta.last_page` | **yes** | Required for pagination — see below |

**Pagination.** We start at `page: 1` and keep requesting until
`page >= meta.last_page` or a page comes back empty, to a hard ceiling of 50
pages (10,000 trades per account per window). `meta.last_page` must be accurate;
without it we cannot tell a last page from a truncated one.

**Only closed trades.** Do not include open positions. An unrealised position
returned as a trade corrupts the leaderboard.

### 3.3 `POST /api/account/cash-activity`

Deposits and withdrawals. Same request shape as trade-activity; the array is
`transactions` instead of `trades`.

**Optional today.** We do not consume it yet — our ROI is already
deposit-immune (§5). Implement it if you can; it lets us show funding changes.

---

## 4. How we use the data

So you can see which fields actually matter:

```
ROI      = Σ net_pnl ÷ (current_balance − Σ net_pnl)
P&L      = Σ net_pnl
trades   = count of closed trades in the window
win rate = trades with net_pnl > 0 ÷ trades
```

The ROI denominator reconstructs starting capital from the current balance and
the period's trading P&L, so a mid-competition deposit or withdrawal does not
move ROI. That is why we ignore `starting_balance` and compute rather than trust
a broker-reported ROI.

The public leaderboard shows **ROI %, trade count and win rate only**. Balances
and cash P&L are never published — they leak account size.

---

## 5. Answer these before you build

Ambiguity in these four cost us real debugging time with FP Markets. Please
confirm each in writing.

1. **Timestamp timezone.** FP's timestamps are labelled `+00:00` but are
   actually broker-server time, roughly UTC+3. If your times are not true UTC,
   say so explicitly and state the offset. Do not label local time as UTC.

2. **Is `net_pnl` net of commission and swap?** We take it literally. If yours
   is gross, our leaderboard overstates every trader.

3. **Propagation delay.** How long after a trade closes does it appear in
   Trade Activity, worst case? FP's is about 13 minutes, which is visible to
   competitors on a live board. State a maximum, and tell us whether a push or
   websocket feed exists.

4. **Do Performance and Trade Activity share a clock?** FP's
   `last_trade_at` has run two days behind what Trade Activity returns. If the
   two are fed by different systems, tell us, because we read balance from one
   and trades from the other in the same calculation.

Also useful: whether `transaction_id` is stable across restatements, and what
happens to a trade that is later corrected or cancelled.

---

## 6. Going live

1. Send us: base URL, token, secret, our rebate account number(s), rate limit,
   and the answers to §5.
2. Allowlist our egress IPs — we will send them.
3. We register your broker in our admin and run a read-only probe against
   Performance and Trade Activity for one test account.
4. We reconcile the numbers against your own reporting for that account before
   any competition opens on your platform.

Steps 3 and 4 are not optional. Every discrepancy we have found so far was
found here, not in testing.

---

## Appendix — for LiveTradingLeague operators

A conforming broker needs **no code**. Add it in the admin:

- **Type** — the protocol. Use `fpmarkets`; it names this contract, not the
  company, and is what every conforming broker speaks.
- **Name** — the broker's display name. Integrations are keyed by name, so two
  brokers on one protocol coexist. Do **not** reuse a name.
- **Config** — `base_url`, `token`, `secret`, `rebate_accounts`
  (comma-separated or an array). Secrets are encrypted at rest and redacted in
  API responses.

Then pick that broker when creating a competition. Participants approved into it
are provisioned against it, and the sync pulls from it.

A broker that deviates from this contract needs its own connector in
`packages/server/src/services/brokers/` — one file implementing
`BrokerConnector`, plus a line in the registry.
