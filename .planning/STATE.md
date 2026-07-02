# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-02)

**Core value:** Participants' real trading performance, pulled from the broker and ranked on a live, trustworthy leaderboard.
**Current focus:** Phase 1 — Broker Coordination

## Current Position

Phase: 1 of 2 (Broker Coordination)
Plan: 0 of TBD in current phase
Status: In progress — partial account mapping confirmed, broker-side gap identified
Last activity: 2026-07-02 — Local Code folder wiped and re-cloned; .planning reconstructed; confirmed fp-test still returns only 1 of 2 expected accounts

Progress: [███░░░░░░░] 30%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: —

*Updated after each plan completion*

## Accumulated Context

### Environment & Credentials

- FP Markets test env: https://ibbeta.fptrading.com (token + HMAC auth)
- Static egress IPs (whitelisted 15 Jun 2026): 162.220.232.250/251, 152.55.176.240
- IB agent/referral number: 477779 | test account (Poli): 82200517
- Deployed: https://trade-cmp-production.up.railway.app (+ app.livetradingleague.com)
- Tokens/deploy IDs in gitignored .env — see auto-memory `deploy-resume`

### Decisions

- Pre-GSD: Compute ROI ourselves from balances (broker `roi` is always 0) — pending live verify
- Pre-GSD: Static egress via Railway egress gateway — confirmed good, IPs whitelisted
- v1.1 start: Skip dry-run/fixture pipeline; validate only with real broker data

### Pending Todos

- Send FP team the 2-vs-1 account discrepancy report (evidence: their own IB portal screenshot) and request they investigate why Raul Tuhut's account isn't returned by the Account Performance API
- Ask FP for an account with real balance/trade activity — Paul's (2058014) is all zeros, unusable for leaderboard testing
- When FP data flows: run `npm run test:live:full` (full pipeline on production with the real account) — everything else is automated now

### Test Automation (added 2026-07-02)

- Integration suite: `packages/server/src/test/integration/pipeline.test.ts` — 10 tests,
  in-memory Mongo + supertest against the real Express app. Full flow: register →
  apply → approve → assign trading account → sync → ranked leaderboard. Covers
  fixture connector, fpmarkets with live-shaped mocked responses (signed request
  asserted, ROI from balances), broker-rejection handling, idempotent re-sync, auth guards.
- New admin endpoints (the previously missing glue): POST/GET `/api/admin/broker-integrations`,
  POST `/api/admin/trading-accounts`, GET `/api/admin/trading-accounts/:tournamentId`.
- Live E2E: `scripts/live-e2e.mjs` — `npm run test:live` (read-only probe) and
  `npm run test:live:full` (real pipeline on prod; `--connector=fixture` to test
  app flow before FP data exists; `--cleanup` deletes the test tournament).
- Total: 24 tests green (14 unit + 10 integration).

### Blockers/Concerns

- Phase 1 → Phase 2 is externally gated: FP Markets must map accounts under IB 477779 before VERIFY-01 is testable. Broker response time is unknown.
- Unknown: whether `ibbeta` returns data for accounts under our IB, or whether production env is needed. Must confirm with FP in Phase 1.
- 2026-06-15 (later): fp-test now returns 1 account (2058014, "Paul", status active) — up from 0. User expects 2 accounts under IB 477779; only 1 present so far (confirmed not a date-range issue — tried 2020-2026 window, same result). Returned account has starting_balance/current_balance = 0 and last_trade_at = null — no trade activity yet either.
- 2026-06-15 (later still): user confirmed via FP's own IB portal (fptrading.com/ib/accounts/clients, rebate 477779) that there ARE 2 approved clients — Paul Adrian Scripcariu (2025-03-17) and Raul Tuhut (2025-03-26). Our Account Performance API still returns only Paul's account (re-verified). This is now clearly a broker-side API gap (their own client list disagrees with what their performance API returns), not a config issue on our side. Also still need an account with real balance/trade activity for leaderboard testing — Paul's shows all zeros.
- 2026-07-02: Re-verified after local environment rebuild — still only 1 account returned. No change from broker side yet.

## Session Continuity

Last session: 2026-07-02
Stopped at: .planning reconstructed after local wipe; ready to draft/send broker follow-up message re: 2-account discrepancy
Resume file: None
