# Milestones

## v1.0 — FP Markets Integration & Deploy (shipped, pre-GSD)

Built and deployed before GSD tracking began. Delivered:

- FP Markets (`fpmarkets`) broker connector — HMAC-signed Account Performance API
- Sync orchestration (`syncTournament`, scheduler) → snapshots → leaderboard cache
- Admin endpoints: `POST /api/admin/sync/:id`, `GET /api/admin/fp-test`, leaderboard
- Single-container Railway deploy, static egress IP, Cloudflare domain
- Resilient MongoDB connection (no crash-loop)

Last phase number: 0 (no GSD phases tracked). New milestone starts at Phase 1.

## v1.1 — Live Integration Testing (shipped 2026-07-06)

Goal: prove the FP Markets integration works end to end against live broker data
now that our IP is whitelisted, and resolve the rebate/IB-mapping unknowns.

Status: **Complete.** FP fixed the broker-side account-mapping gap; `fp-test`
now returns 10 accounts under IB 477779 with real balance/trade data (was 1).
Both phases (Broker Coordination, Live Verification) closed — verified via
conversational UAT 2026-07-06.

Bonus work delivered in the same session (found via ad-hoc audit against
`.docs/` requirements, not originally scoped in this roadmap):
- Fixed unauthenticated `smtp_pass` leak in `GET /api/settings`
- Fixed public `/leaderboard` page requiring admin auth (401 for real visitors)
- Fixed leaderboard response shape mismatch (would've crashed on real data)
- Replaced random referral-code-verified mock with deterministic check
- Added CSV export (participants + leaderboard) and sync-run history view
- Auto-provision trading account on participant approval (removed manual
  E2E-panel step from the real onboarding flow)
- Delivered an 8-flow tester/UAT guide (PDF) covering user + admin paths

All changes committed and pushed to `main` (commits `440c774`, `36b2a2d`).

### Final Verification (2026-07-06) — ALL PASS

| # | Item | Evidence | Result |
|---|------|----------|--------|
| 1 | Phase 1 — Broker Coordination | fp-test returns 10 accounts under IB 477779 (was 1) | PASS |
| 2 | Phase 2 — Live Verification | fp-test HTTP 200, non-empty, Raul's account has real balance ($1276.22) + last_trade_at | PASS |
| 3 | `smtp_pass` leak fix | Live curl: bulk `/api/settings` now returns `••••••••`, no auth added (public keys still exposed as intended) | PASS |
| 4 | Public leaderboard auth fix | Live curl + browser: `/api/leaderboard/:id` returns 200 with no token; public `/leaderboard` page rendered real rows, zero console errors | PASS |
| 5 | Leaderboard shape fix | Ran a real sync, both public page and admin Leaderboard tab rendered `display_name`/`account_masked`/`trade_count` correctly, no crash | PASS |
| 6 | Referral determinism fix | Applied as existing-user 5x — `referral_code_verified` was `false` every time (was random); new-user path gave `true` | PASS |
| 7 | CSV export (participants + leaderboard) | Clicked both Export CSV buttons live, no console errors, escaping logic verified (commas/quotes handled) | PASS |
| 8 | Sync history view | Clicked "Sync now" live in E2E panel, new row appeared instantly with correct counts/status | PASS |
| 9 | Auto-provision on approve | Approved a test participant, trading account + `fpmarkets` integration auto-created with correct account number, no E2E-panel step needed | PASS |
| 10 | Tester UAT guide | 8-flow PDF delivered covering user apply, referral/decline, competition mgmt, settings/SMTP, password recovery, FP diagnostics, edge cases, regression spot-check | PASS |

All test data created during verification (fake participants, trading accounts, leaderboard cache entries) was cleaned from the shared production database after each check — confirmed via re-query that affected tournaments returned to their pre-test state.

**Milestone v1.1: verified complete end to end.**
