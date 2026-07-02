# Milestones

## v1.0 — FP Markets Integration & Deploy (shipped, pre-GSD)

Built and deployed before GSD tracking began. Delivered:

- FP Markets (`fpmarkets`) broker connector — HMAC-signed Account Performance API
- Sync orchestration (`syncTournament`, scheduler) → snapshots → leaderboard cache
- Admin endpoints: `POST /api/admin/sync/:id`, `GET /api/admin/fp-test`, leaderboard
- Single-container Railway deploy, static egress IP, Cloudflare domain
- Resilient MongoDB connection (no crash-loop)

Last phase number: 0 (no GSD phases tracked). New milestone starts at Phase 1.

## v1.1 — Live Integration Testing (current)

Goal: prove the FP Markets integration works end to end against live broker data
now that our IP is whitelisted, and resolve the rebate/IB-mapping unknowns.

Status: Phase 1 in progress (Broker Coordination). Live probe confirmed 1 of 2
expected accounts mapped under IB 477779; broker-side gap identified (FP's own
client list shows 2 approved clients, API returns only 1).
