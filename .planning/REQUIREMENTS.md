# Requirements: LiveTradingLeague

**Defined:** 2026-06-15
**Core Value:** Participants' real trading performance, ranked on a live leaderboard.
**Milestone:** v1.1 — Live Integration Testing (unblock live data + report to broker)

## Discovery (already verified)

A live `fp-test` probe from our whitelisted IP returned **HTTP 200** for rebate
`477779` with an **empty** accounts array. This confirms IP whitelist, auth, HMAC
signature, and rebate acceptance all work — the only gap is that no trading
accounts are mapped under our IB yet.

**Update (later same day):** re-running the probe after broker action returned
**1 account** (was 0) — `2058014`, "Paul", status `active`, but with 0 balances
and no trades. FP's own IB portal shows **2** approved clients under rebate
`477779` (Paul Adrian Scripcariu + Raul Tuhut) — the second is missing from the
Account Performance API response. Confirmed broker-side gap, not a config issue
on our end.

## v1.1 Requirements

### Broker Coordination

- [ ] **BROKER-01**: Send FP team the verified test results (200 OK; IP + auth + rebate `477779` accepted; 0 accounts) and request account mapping
- [ ] **BROKER-02**: Confirm with FP the correct rebate-account value and whether the `ibbeta` test env returns data only for accounts under our IB
- [ ] **BROKER-03**: Obtain test trading account(s) mapped under IB `477779` (e.g. move `82200517`), or a rebate number that already has accounts

### Live Verification

- [ ] **VERIFY-01**: `GET /api/admin/fp-test` returns ≥1 account with performance data for our IB once the broker completes mapping

## Future Requirements

Deferred — actionable once live data flows (next milestone).

### Pipeline Validation

- **PIPE-01**: Full sync writes `AccountSnapshot` from live broker data
- **PIPE-02**: Leaderboard computes ROI/ranking from live snapshots
- **PIPE-03**: Admin can trigger sync and view the resulting leaderboard
- **PIPE-04**: Validate edge cases vs real data (status mapping, masking, null `last_trade_at`, currency)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Dry-run pipeline with fixture/simulation data | User deferred; validate with real data instead |
| Public (non-admin) leaderboard endpoint | Admin-gated for now |
| Multi-currency normalization | Single currency until broker confirms otherwise |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BROKER-01 | Phase 1 — Broker Coordination | Pending |
| BROKER-02 | Phase 1 — Broker Coordination | Pending |
| BROKER-03 | Phase 1 — Broker Coordination | Pending |
| VERIFY-01 | Phase 2 — Live Verification | Pending |

**Coverage:**
- v1.1 requirements: 4 total
- Mapped to phases: 4
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-15*
*Last updated: 2026-07-02 — reconstructed after local Code folder was wiped (repo re-cloned)*
