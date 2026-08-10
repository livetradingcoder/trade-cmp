# LiveTradingLeague × FP — Session Handoff

Snapshot for resuming in a fresh session. Repo: `github.com/livetradingcoder/trade-cmp`
(monorepo: `packages/server` Express+Mongo, `packages/web` React/Vite). Local:
`/Users/klev/Code/Ltl/trade-cmp`. Date of handoff: 2026-08-10.

---

## TL;DR — where things stand

The FP Markets leaderboard integration **works end-to-end on beta** (`ibbeta.fptrading.com`):
join → approve (auto-provisions trading account) → referral-verified → 1-min sync pulls
FP balances + trades → ranked leaderboard with **real ROI, P&L, trade count, win rate,
currency**. Verified live on the public + admin boards. Server tests: **47 passing**.

`main` HEAD = **`4af3b14`**. Railway auto-deploys `main`; it's the live app.

**The only gate to production is FP's prod environment** (below). Nothing on our side blocks.

---

## Infra / architecture (important — was a source of confusion)

- **Railway** = the real app. Service `trade-cmp` (id `d18231d7-df91-4584-bd24-729257c16579`),
  project `trade-cmp-ltl` (`e2572d33-fc56-4789-84b1-d51b9eb0b8f5`), env `production`
  (`a44711d7-e77f-45a5-9a26-b7d79137dc75`). One container serves **frontend + API + the
  1-min sync scheduler**. Region **ams1 (Amsterdam)**.
  Domain: `app.livetradingleague.com`. ⚠️ `trade-cmp-production.up.railway.app` is **dead**
  (404 `railway-hikari`) — the generated service domain was detached, so there is no
  origin-bypass URL any more. `www.livetradingleague.com` is registered as a Railway custom
  domain but is **shadowed by the Cloudflare redirect below**, so Railway never sees a www
  request; either drop the CF rule for www or remove the Railway domain.
- **Database** = MongoDB Atlas, cluster **`ltl`**, project hash **`wyemjtv`**, on AWS
  **`ap-southeast-1` (Singapore)** — a different continent from the app, so every query costs
  ~170ms. Upgraded M0 → **M2** on 2026-08-08 (512MB → 2GB; check the Backup tab). Db name is
  **`test`** *deliberately* — see "DB named `test`" below.
- **Vercel** = ⚠️ **nothing deployed**. The `trade-cmp` + `trade-cmp-server` projects no longer
  exist; team `ltl-proj` holds only unrelated projects. Only leftover: the
  `livetradingleague.com` domain is still registered on the Vercel team with no project
  attached. `www.livetradingleague.com` + apex `livetradingleague.com`
  **302-redirect to `app.*`** (Cloudflare Redirect Rule).
- **Cloudflare** (zone `livetradingleague.com`, id `eeac52e91125329cc73b1d3c5c15de58`) fronts everything.
- **Git push**: repo-local `gh` credential helper is set so pushes go as `livetradingcoder`
  (the default `ptf-dev` account lacks write). If pushes 403, that helper got lost — re-add:
  `git -C repo config --local credential.helper '!f() { test "$1" = get && { echo username=livetradingcoder; echo "password=$(gh auth token --user livetradingcoder)"; }; }; f'`

## Access (user-supplied, their own beta infra)

- Admin: `app.livetradingleague.com/admin` → `ltl-admin-1` / `Adm!n2026`
  (API: `POST /api/admin/login`).
- Active tournament as of 2026-08-10: **`6a79365c27340ee05499f2cd`** ("Poli Sunday"). Ids
  rotate often — **always** re-read the current one via `GET /api/tournaments` (status
  "active") rather than trusting this line; querying a stale id returns a frozen
  `fetched_at` that looks exactly like a broken sync.
- FP rebate/IB: **477779**. FP base (beta): `https://ibbeta.fptrading.com`.
- Test accounts under rebate: `81049662` (Raul/Poli, the main one being traded),
  `82200517` (Paul, ****0517). `GET /api/admin/fp-test` returns 11 accounts under 477779.

---

## FP APIs (all live on beta)

1. `POST /api/account/performance` — per-rebate; returns accounts[] with balances,
   `currency` (e.g. "usd"), `last_trade_at`, `status`. `roi` + `starting_balance` are
   reserved (always **0**) — do NOT rely on them.
2. `POST /api/account/trade-activity` — **per single trading account** (`rebate_account_number`
   + `account_number` + `start_date`/`end_date` ISO + `page`/`per_page` max 200). Returns
   closed trades: `transaction_id, product, open_time, open_price, close_time, close_price,
   volume, profit, commission, swaps, net_pnl`. MT5 → open==close time/price (duration 0).
3. `POST /api/account/cash-activity` — same shape; deposits/withdrawals. **Reachable, empty
   for our accounts, NOT consumed yet.**

Auth (all): headers `token`, `timestamp` (unix s), `signature` = HMAC-SHA256(timestamp, secret),
lowercase hex. Requesting IP must be whitelisted. Rate limit: **60/min app-wide** (`throttle:60,1`).
Env: `FP_MARKETS_TOKEN/SECRET/BASE_URL/REBATE_ACCOUNTS` (Railway dashboard vars, not the .env file).

Admin probes we added: `GET /api/admin/fp-test?start_date&end_date` (performance) and
`GET /api/admin/fp-activity-test?account=<n>&start_date&end_date` (trade+cash, raw diagnostic).

---

## How the leaderboard is computed (key logic)

- `fpMarketsConnector.fetchCompetitionData` (`packages/server/src/services/brokers/fpMarketsConnector.ts`):
  calls performance for balances + currency, then **per matched account** paginates
  trade-activity → `NormalizedTradeInput[]`. `supportsRawTrades: true`.
- `calculateLeaderboard.ts`: with trades → **P&L = Σ net_pnl**, trade_count, win_rate from trades,
  and **ROI = Σ net_pnl ÷ baseline** where **baseline = `current_balance − Σ net_pnl`**
  (reconstructs starting capital; deposit-immune; no dependency on FP's `starting_balance`).
  Without trades → falls back to equity delta. This fixed a −824,706% ROI blow-up from using a
  stale "first observed balance" as denominator.
- `syncTournament.ts`: runs every 60s (scheduler, `SYNC_ENABLED=true`), writes `LeaderboardCache`
  (15-min TTL but refreshed each run), and **self-heals referral verification** each sync.
- **Public board hides the $ P&L** (leaks account size / not comparable across sizes) — ranks by
  ROI %, shows trades + win rate. **Admin board keeps the $.** (`LeaderboardPage.tsx` public,
  `LeaderboardManagement.tsx` admin.)
- Referral verification is a **real check**: `referral_code_verified` = "is this fp_account_number
  in the current rebate-account list?" (was a self-declared `is_new_user` placeholder + wasn't even
  returned by the API → badge showed on everyone). Reconciled on the admin participants read + each sync.

---

## What this session shipped (commits, newest first)

**2026-08-08 → 08-10 (ops + sync):**

- `4af3b14` watchdog rebuilds the DB connection instead of exiting (fixes the ~10h outage)
- `26ccad0` 454-trade round-trip benchmark: 467 → 13 round trips, A/B'd against `aeba116`
- `fc95832` this doc corrected against live infra
- `34bcb18` real health check + `/api/ready` + DB watchdog + `SyncRun` 30-day TTL
- `3717bc8` sync: `bulkWrite` batching, overlap guard, bounded snapshot-history read

**2026-08-07 (leaderboard):**

- `aeba116` stable ROI baseline (current_balance − Σpnl) + hide $ on public board
- `d7fccc3` render P&L in account currency (USD $ / EUR € / GBP £), threaded end-to-end
- `242cf25` compute trade count / win rate / P&L / ROI from FP trade-activity (supportsRawTrades on)
- `4935fbd` probe passes activity dates through (date-format test)
- `6caa4c3` align pipeline integration tests (auto-provision + public-leaderboard contract)
- `691bd41` referral verification against the FP rebate list (2 bugs: field not returned + self-declared)
- `8224d14` timeout + raw diagnostics on the activity probe
- `2fd88d4` trade-activity + cash-activity clients + `/api/admin/fp-activity-test`
- `704af33` show "—" for trades/win-rate when broker reports no trades
- `04e09b7` P&L from equity change when broker sends no trades
- `8cdbb06` Vercel build: `npm install --include=dev` (tsc/vite missing)
- `fecf95b` remove dead `postinstall db:generate` that broke Vercel builds

---

## Open items / next steps

1. **FP production move** (the real gate). Send FP the message in the section below. We need:
   prod base URL, prod token/secret, IP whitelist on prod (`162.220.232.250`,
   `162.220.232.251`, `152.55.176.240`), rebate+accounts mapped on prod, confirm all beta
   fixes are on prod, prod rate limits. Cutover on our side = swap `FP_MARKETS_BASE_URL` +
   token/secret in Railway env, then re-verify. **We do NOT need `starting_balance` from FP.**
2. **FP data lag (~13 min measured).** A trade with `close_time 23:33:14` took ~13 min to appear
   in Trade Activity (absent through 20:45:52 UTC, present by 20:46:51 UTC; FP clock ≈ UTC+3).
   Also FP's **Performance `last_trade_at` lags Trade Activity** (showed Aug-5 while Trade Activity
   had Aug-7). Both raised with FP — waiting on cadence/SLA + whether a websocket/push feed exists.
   Our side is real-time to within the 1-min sync; the lag is 100% FP's.
3. ~~**Sync scaling**~~ **DONE** (`3717bc8`, 2026-08-08). The ~90s sync was per-document
   `await`s: one sequential Amsterdam→Singapore round trip *per trade* (454 trades × ~170ms
   ≈ 77s), re-writing the full closed-trade history every 60s. Now `bulkWrite` (one request
   per collection), an overlap guard so slow ticks can't stack, and the snapshot-history read
   bounded to the two endpoints `buildLeaderboardRows` actually uses. Still open if it ever
   gets slow again: poll trades on a slower cadence than balances, or fetch only trades newer
   than the last sync.
4. **cash-activity** not consumed. Trade-based P&L is already deposit-immune, so not required for
   correctness; wire it later if you want deposit/withdrawal display or a stricter baseline.
5. ~~**Vercel** projects are redundant~~ **DONE** — already deleted. Only the orphaned
   `livetradingleague.com` domain entry remains on the Vercel team; reclaim when convenient.
6. **www-canonical** (optional): today www/apex 302→app.*. To make www the served site you'd add
   www as a Railway custom domain and point its CNAME there (see `/Users/klev/RAILWAY_DNS_HANDOFF.md`).

---

## FP messages to send (ready)

**Prod move** + **lag** are the two live asks. Latest combined message:

> Hi FP Team — testing report from our side. Bottom line: the integration works end-to-end on
> beta 🎉 (trades, ROI, P&L, trade count, win rate, currency all flowing). Two things:
>
> 1. **Trade-propagation lag (~13 min, measured).** Trader `81049662` closed a trade
> (`close_time 2026-08-07T23:33:14`). Trade Activity returned latest `close_time 23:20:15`
> through 20:45:52 UTC (trade absent), then `23:34:22` by 20:46:51 UTC (present). Cross-referencing
> your server clock (~UTC+3) that's a ~13-minute delay. For a live leaderboard we need this tighter —
> guaranteed max lag? Can the API return fresh data every request, or is a websocket/push feed available?
>
> 2. **Performance and Trade Activity are out of sync** (same account/moment `81049662`):
> Trade Activity latest `close_time 2026-08-07T23:34:22`; Performance `last_trade_at 2026-08-05T08:01:59`
> (2 days behind), `current_balance 1234.12`. We use Performance's `current_balance` for the ROI
> baseline, so when it trails, ROI is briefly off. Please align the two (or confirm same cadence).
>
> For **production** we'll need: prod API base URL, prod token+secret, whitelist our egress IPs
> (`162.220.232.250`, `162.220.232.251`, `152.55.176.240`), rebate+accounts mapped on prod, confirm
> all beta fixes are on prod, and prod rate limits. (No need for `starting_balance` — we derive it.)
> Thanks! 🙏

---

## DB named `test` — deliberate, don't "fix" it casually

Production data lives in a MongoDB database literally named **`test`**. It got that name
because the connection string has no database path and the server doesn't pin one
(`config/database.ts`), so Mongo used its default. **Decision (2026-08-08): leave it until the
FP beta→prod cutover**, then rename during that same downtime — pointing the URI at `/ltl`
would silently create a *new empty* database, so a rename means dump-and-restore, and the FP
move is already a cutover.

Until then: treat `test` as production, never as scratch. **Any Atlas database-user role must
grant privileges on `test` specifically** — a role scoped to a plausible name like `ltl` grants
access to nothing and takes the whole app down.

## Outage 2026-08-08 19:47–20:06 UTC (read this before touching Atlas)

Upgrading the Atlas cluster M0 → M2 swapped the replica set under a long-running process. The
Node driver kept a stale topology (`server setVersion: 434` vs cached `622`,
`commonWireVersion: 0`) and **never re-converged** — every query failed for 19 minutes. Symptoms
were misleading: first `cannot find user account after reload`, then
`user is not allowed to do action [find] on [test.participants]`, which reads exactly like a
misconfigured role but wasn't. Fixed by restarting the service. No data lost.

Two things came out of it (`34bcb18`):

- `/api/health` used to return a hardcoded `{"status":"ok","database":"mongodb"}` and read
  healthy throughout. It now really pings Mongo. It still always returns 200 (so a boot ahead
  of the Atlas IP allowlist doesn't fail the deploy gate) — **point uptime monitoring at the
  new `/api/ready`, which 503s** when the DB can't serve.
- A **DB watchdog** (`config/dbHealth.ts`) drops and rebuilds the MongoClient after 5
  consecutive failed probes (~5 min), so the driver rediscovers the replica set. This is the
  only automatic recovery available: Railway's healthcheck gates the traffic switch on a *new
  deployment* and does **not** police a running container. Kill switch:
  `DB_WATCHDOG_ENABLED=false` (tune with `DB_WATCHDOG_INTERVAL_SECONDS`, `DB_WATCHDOG_FAILURES`).

  ⚠️ **It must never call `process.exit`.** The first version did, leaning on
  `restartPolicyType = "ON_FAILURE"`. That works for a wedged driver but is catastrophic when
  the DB is merely unreachable: exit → restart → exit, until Railway's retry budget runs out
  and the app stays dead. That caused the **second outage below**. Five tests fail if anyone
  reintroduces the exit.

## Outage 2026-08-10 03:23–13:08 UTC (~10h — caused by the watchdog above)

A DB connection blip at ~03:22 tripped the watchdog, which exited the process; Railway
restarted it into the same failure until it gave up, and the app sat at **502 for ~10 hours**.
The database itself had recovered long before — a fresh process at 13:08 connected in under a
second. Fixed in `4af3b14` by rebuilding the connection in-process instead of exiting, so a
sustained DB outage now degrades to a retry loop with the server still serving.

Two traps this exposed, both still worth knowing:

- **The admin login screen reports any failed response as "Invalid username or password."** A
  502 renders identically to a wrong password, which is how this outage was first reported.
  Check `/api/health` before believing the login form. (Not yet fixed.)
- **Tournament ids rotate.** Debugging used a stale id and a fresh-but-unchanging
  `fetched_at` briefly looked like a broken sync. Always re-read the active id from
  `GET /api/tournaments`.

`SyncRun` also gained a 30-day TTL — it was accumulating 1,440 docs/day forever.

## Gotchas

- **FP timestamps** are labeled `+00:00` but look like **broker-server time (~UTC+3)**, not real UTC.
  Don't naively compare to real UTC — they run ~3h ahead.
- **MT5 "Balance" in the trader's History screenshots** = net of the *filtered deals shown*
  (note `Deposit 0.00`), NOT the account balance. Don't read it as a balance discrepancy.
- **FP has two separate systems** (performance vs activity) that disagree; and each has fixed bugs
  on beta that must be re-confirmed on prod.
- The leaderboard **won't auto-refresh** in the browser (no websocket) — reload to see the latest cache.
- **Don't trust this doc over a live query.** Railway and Atlas both have MCP servers / CLIs;
  check them. The Cloudflare + Vercel MCP servers in this setup authenticate to an unrelated
  org (`PFT_PFR_Team`) and can't see these resources — the local `vercel` CLI (logged in as
  `ltltltl-1233`, team `ltl-proj`) can. Cloudflare needs `wrangler login` or a scoped token.
- Server clock / today's date in this env is 2026-08-08.

## Verify quickly (no auth needed for leaderboard)

```bash
B=https://app.livetradingleague.com
TID=$(curl -s "$B/api/tournaments" | python3 -c 'import sys,json;d=json.load(sys.stdin);ts=d if isinstance(d,list) else d.get("tournaments") or [];print(next((t.get("_id") or t.get("id")) for t in ts if t.get("status")=="active"))')
curl -s "$B/api/leaderboard/$TID" | python3 -m json.tool
curl -s "$B/api/health"   # {"status":"ok","driver":"mongodb","database":"connected"}
curl -s -o /dev/null -w '%{http_code}\n' "$B/api/ready"   # 200 healthy, 503 = DB can't serve
# admin-only probes need a Bearer token from POST /api/admin/login (ltl-admin-1 / Adm!n2026)
```
