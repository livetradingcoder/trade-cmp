# Deploy to Railway (full stack: frontend + backend)

One container serves everything ([Dockerfile](Dockerfile)):

- **nginx** on `$PORT` serves the built React app and proxies `/api/*` → backend.
- **Express backend** on `127.0.0.1:3001` (same-origin, so the frontend needs no
  separate API URL).
- **Sync scheduler** runs in the backend process (gated by `SYNC_ENABLED`).

This is what makes Railway viable where Vercel was not: a long-running process
with a **static egress IP** — the IP you give the broker to whitelist, and the
same IP you whitelist in MongoDB Atlas.

---

## Prerequisite

Static egress IP requires a **paid Railway plan** (Hobby or Pro). The free trial
gives dynamic egress, which cannot be whitelisted.

---

## Steps

### 1. Create the service from GitHub

Railway → **New Project** → **Deploy from GitHub repo** →
`livetradingcoder/trade-cmp`, branch **`new`**.

Railway auto-detects [railway.toml](railway.toml) → builds the Dockerfile.
Health check is `/api/health`.

### 2. Avoid the first-deploy crash loop (important)

The backend calls `process.exit(1)` if it cannot reach Mongo in production
(see [packages/server/src/config/database.ts](packages/server/src/config/database.ts)).
If Atlas is not reachable, the container dies → Railway retries forever. This is
almost certainly what broke previous Railway attempts.

Before the first deploy, in **MongoDB Atlas → Network Access**, temporarily add
`0.0.0.0/0` (Atlas still requires DB user + password, so this is acceptable
short-term). Tighten it to the egress IP in step 4.

### 3. Set environment variables

Railway → service → **Variables**. Copy values from your local `.env`.

| Variable | Value / source | Notes |
|----------|----------------|-------|
| `DATABASE_URL` | your Atlas connection string | from `.env` |
| `ENCRYPTION_KEY` | from `.env` | |
| `JWT_SECRET` | set a strong value | else falls back to an insecure default |
| `ADMIN_USERNAME` | from `.env` | |
| `ADMIN_PASSWORD` | from `.env` | |
| `NODE_ENV` | `production` | |
| `FP_MARKETS_BASE_URL` | `https://ibbeta.fptrading.com` | |
| `FP_MARKETS_TOKEN` | broker token | from `.env` |
| `FP_MARKETS_SECRET` | broker secret | from `.env` |
| `FP_MARKETS_REBATE_ACCOUNTS` | your rebate number(s), comma-separated | **required** before live sync |
| `SYNC_ENABLED` | `true` | turn on only after the broker whitelists the IP |
| `SYNC_INTERVAL_MINUTES` | `60` | optional, default 60 |

Do **not** set `PORT` (Railway injects it) or `BACKEND_PORT` (Dockerfile sets 3001).
Cloudinary / email vars are optional (image upload, password-reset email).

Leave `SYNC_ENABLED` **off** until step 5 so we don't hammer the broker with
failing calls before they whitelist us.

### 4. Enable the static egress IP

Railway → service → **Settings → Networking → Static Outbound IP** (enable).
Copy the IP. Then:

- **MongoDB Atlas → Network Access**: replace `0.0.0.0/0` with this IP.
- **Send this IP to the broker** (FP Markets, via Poli/Stefania) to whitelist.

### 5. Go live

Once the broker confirms the IP is whitelisted:

- Set `SYNC_ENABLED=true` and redeploy.
- Verify: `https://<railway-domain>/api/health` → `{"status":"ok"}`.
- Open `/admin`, log in, trigger a manual sync:
  `POST /api/admin/sync/:tournamentId` (admin JWT) and check the leaderboard.

### 6. Custom domains (optional — moving off Vercel)

Railway → **Settings → Domains**, add `app.livetradingleague.com` and/or
`api.livetradingleague.com`, then repoint DNS. The single container serves both
the app and the API on one domain, so you can also just use one.

---

## How the broker sync flows

`POST /api/admin/sync/:tournamentId` or the scheduler →
`syncTournament` → `fpMarketsConnector.fetchCompetitionData` (HMAC-signed call
to FP Markets) → upsert `AccountSnapshot` / `Trade` → `calculateLeaderboard` →
`LeaderboardCache` → `SyncRun` recorded. The admin leaderboard reads from
`LeaderboardCache`.
