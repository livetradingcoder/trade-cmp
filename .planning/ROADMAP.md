# Roadmap: LiveTradingLeague — v1.1 (Live Integration Testing)

## Overview

A live discovery probe already proved the FP Markets integration works end to
end (HTTP 200, IP + auth + HMAC signature + rebate `477779` all accepted) but
returned 0 accounts because none were mapped under our IB. This milestone is
broker coordination to get real, usable data mapped, followed by a live
verification pass once that mapping is complete. It is not a code-build
milestone — the integration itself is already built and deployed (v1.0).

## Phases

- [ ] **Phase 1: Broker Coordination** - Get FP Markets to map accounts under our IB and confirm API parameters
- [ ] **Phase 2: Live Verification** - Confirm `fp-test` returns real, usable account performance data

## Phase Details

### Phase 1: Broker Coordination
**Goal**: FP Markets has everything needed to map accounts under IB 477779, and we have confirmed the correct API parameters
**Depends on**: Nothing (first phase)
**Requirements**: BROKER-01, BROKER-02, BROKER-03
**Success Criteria** (what must be TRUE):
  1. FP Markets support has received our test results (200 OK, 0 accounts) and a clear mapping request
  2. Written confirmation of the correct rebate/account-number parameter to use
  3. Written confirmation of whether `ibbeta` covers our IB or whether we need a different environment
  4. At least one account is mapped under IB 477779 (or FP provides a rebate that already has accounts) — **externally gated on broker action**
**Plans**: TBD

Plans:
- [ ] 01-01: TBD (not yet planned — run `/gsd:plan-phase 1`)

**Progress note (2026-07-02):** Partially satisfied outside formal plan execution —
direct WhatsApp coordination with the broker got 1 of 2 expected accounts mapped
(`2058014`, "Paul"). FP's own IB portal confirms 2 approved clients under
`477779` (Paul Adrian Scripcariu, Raul Tuhut) but the Account Performance API
still returns only 1 — a broker-side API gap now being reported back to FP.
Criterion 4 partially met; criteria 1-3 (written broker confirmation) still open.

### Phase 2: Live Verification
**Goal**: `GET /api/admin/fp-test` returns real account performance data usable for leaderboard testing
**Depends on**: Phase 1 (blocked until broker mapping + real balance/trade data available)
**Requirements**: VERIFY-01
**Success Criteria** (what must be TRUE):
  1. `fp-test` returns HTTP 200 with a non-empty accounts array
  2. Each returned account has performance data fields populated with non-zero values (balance and/or trade activity)
  3. The response uses the correct parameter confirmed in Phase 1
**Plans**: TBD

Plans:
- [ ] 02-01: TBD (not yet planned)

## External Dependency Note

Phase 1 criterion 4 and all of Phase 2 are gated on FP Markets taking action
(mapping accounts, adding trade/balance activity). If the broker delays, the
milestone is blocked externally, not internally.

---
*Roadmap created: 2026-06-15 by gsd-roadmapper*
*Reconstructed: 2026-07-02 after local Code folder was wiped (original file was committed locally but never pushed before the wipe; rebuilt from the roadmapper's return summary preserved in session context)*
