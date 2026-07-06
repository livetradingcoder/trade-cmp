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
