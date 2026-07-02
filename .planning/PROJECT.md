# LiveTradingLeague (trade-cmp)

## What This Is

A trading-competition platform. Participants register FP Markets trading accounts;
the platform pulls their account performance from the broker, computes ROI, and
ranks them on tournament leaderboards. Admins manage tournaments, participants,
and broker syncs.

## Core Value

Participants' real trading performance — pulled from the broker and ranked on a
live, trustworthy leaderboard.

## Requirements

### Validated

<!-- Shipped in v1.0 (FP Markets integration + deploy) -->

- ✓ FP Markets connector — HMAC-signed Account Performance API client — v1.0
- ✓ Sync orchestration — accounts → snapshots/trades → leaderboard cache → sync run — v1.0
- ✓ Admin endpoints — trigger sync, live FP probe (`fp-test`), read leaderboard — v1.0
- ✓ Single-container deploy on Railway with static egress IP (broker whitelist) — v1.0
- ✓ Cloudflare custom domain; resilient (retrying) MongoDB connection — v1.0

### Active

<!-- Current milestone: v1.1 — verify the live integration end to end -->

- [ ] Live FP Markets call returns real account performance from our whitelisted IP
- [ ] Resolve rebate/IB mapping (which `account_numbers` value returns our accounts)
- [ ] Full sync writes snapshots + computes a correct leaderboard from live data
- [ ] Confirm the test-env (`ibbeta`) covers the accounts we need, or escalate to broker

### Out of Scope

- Real-time trade streaming — broker provides balances only, not raw trades
- Multi-currency normalization — single currency assumed until broker confirms
- Public (non-admin) leaderboard endpoint — admin-gated for now

## Context

- Broker: FP Markets. Test base URL `https://ibbeta.fptrading.com`. Auth = token +
  timestamp + HMAC-SHA256(timestamp, secret).
- Our static egress IPs (broker-whitelisted as of 15 Jun 2026): 162.220.232.250,
  162.220.232.251, 152.55.176.240.
- Our IB affiliate/agent number (referral): `477779`.
- Test trading account from product owner (Poli): `82200517` (has trades; robot was connected).
- FP's own IB portal (fptrading.com/ib/accounts/clients, rebate 477779) shows 2
  approved clients: Paul Adrian Scripcariu (2025-03-17, account 2058014) and
  Raul Tuhut (2025-03-26). Our Account Performance API only returns Paul's account —
  Raul's is missing from the API despite being Approved on FP's own client list.
  This is a broker-side API gap, confirmed by screenshot evidence.
- Paul's returned account (2058014) has starting_balance/current_balance = 0 and
  last_trade_at = null — no usable balance/trade activity for leaderboard testing yet.
- Deploy + token details live in gitignored `.env`; see auto-memory `deploy-resume`.

## Constraints

- **Dependency**: FP Markets API — its test env must contain queryable data for our IB.
- **Security**: Outbound to broker must use the whitelisted static IPs (IPv4 only).
- **Tech stack**: Node 22 / Express / MongoDB (Mongoose); React/Vite frontend; Railway.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Compute ROI ourselves from balances | Broker `roi` is reserved/always 0 | — Pending live verify |
| Static egress via Railway egress gateway | Hobby default egress rotates | ✓ Good (IPs whitelisted) |
| Gate scheduler behind `SYNC_ENABLED` | Avoid hammering broker pre-whitelist | ✓ Good |

---
*Last updated: 2026-07-02 — reconstructed after local Code folder was wiped (repo re-cloned)*
