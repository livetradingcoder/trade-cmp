# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-02)

**Core value:** Participants' real trading performance, pulled from the broker and ranked on a live, trustworthy leaderboard.
**Current focus:** v1.1 complete — milestone shipped, awaiting next milestone scope

## Current Position

Phase: 2 of 2 (Live Verification) — both phases closed
Plan: Verified directly via live re-check, no formal plan needed
Status: **Milestone v1.1 complete.** FP fixed the account-mapping gap; fp-test
now returns 10 real accounts under IB 477779 with usable balance/trade data.
Last activity: 2026-07-06 — Re-verified fp-test live (10 accounts, was 1),
closed both phases, then did a full ad-hoc audit + fix pass (see below) and a
tester UAT guide. All pushed to main.

Progress: [██████████] 100%

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

- Confirm whether Railway prod has `SYNC_ENABLED=true` set — scheduler is off by default, meaning leaderboard only refreshes on manual "Sync now" until this is checked
- Consider building a non-"test-only" production ops surface for sync (E2E panel is explicitly test-only, though approve-time auto-provisioning now covers the common case)
- Optional: CSV export / sync-history UI landed this session — no further action needed unless gaps found in the tester UAT pass

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

**All resolved.** History (kept for context):
- Phase 1 → Phase 2 was externally gated on FP mapping accounts under IB 477779. FP's own portal showed 2 approved clients while the API returned only 1 (Paul, `2058014`, all-zero balance) — reported to FP as a broker-side API gap.
- 2026-07-06: FP confirmed the fix via WhatsApp ("this issue has now been fixed"). Re-verified live: `fp-test` now returns **10 accounts** under 477779, including Raul Tuhut (`81049662`, balance $1276.22, real `last_trade_at`) and 8 others. No remaining blocker.

Newly discovered this session (found via ad-hoc audit against `.docs/` requirements, all fixed and pushed):
- `GET /api/settings` leaked `smtp_pass` unauthenticated — fixed (masked, matches sibling route).
- Public `/leaderboard` page required admin auth (401 for real visitors, silently swallowed) — fixed (route no longer requires verifyToken).
- `LeaderboardPage.tsx` / `LeaderboardManagement.tsx` used a stale response shape (`entry.user.*`) that would've crashed once real data reached the page — fixed to match the real cache shape (`display_name`/`account_masked`/`trade_count`).
- `/api/broker/validate` mock returned `Math.random() > 0.5` for `referral_code_used`, randomly flagging real applications — replaced with deterministic logic (new users assumed verified, existing users always flagged for manual review).
- Unconfirmed: whether Railway's `SYNC_ENABLED` env var is `true` — affects whether the leaderboard auto-refreshes or only updates on manual sync.

## Session Continuity

Last session: 2026-07-06
Stopped at: v1.1 milestone verified complete (conversational UAT, 2/2 passed), planning docs updated, bonus fixes shipped and pushed to main (`440c774`, `36b2a2d`). Tester UAT guide (8 flows, PDF) delivered.
Resume file: None — ready for next milestone scope, or ask user what's next.
