# LiveTradingLeague - Championship Trading Platform

A full-stack trading championship platform built with React, TypeScript, Node.js, Express, and MongoDB. Participants register FP Markets trading accounts; the platform pulls performance data from the broker and ranks participants on tournament leaderboards.

**Docs site:** https://livetradingcoder.github.io/trade-cmp-docs/
**Live app:** https://trade-cmp-production.up.railway.app (custom domain provisioning: app.livetradingleague.com)

## Features

- Tournament management system
- Admin dashboard for tournament creation & participant management
- **FP Markets broker integration** — HMAC-signed live account performance sync
- Real-time leaderboard computed from broker balance snapshots
- Responsive React frontend
- RESTful API backend with Mongoose ODM
- Docker containerization, deployed on Railway with a static outbound IP

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Node.js 22, Express, TypeScript
- **Database**: MongoDB (Atlas) with Mongoose ODM
- **Deployment**: Docker single container (nginx + Express) on Railway, static egress IP, Cloudflare DNS

## Quick Start

### Prerequisites

- Node.js 20+ (22 recommended, matches production)
- MongoDB (local or MongoDB Atlas)
- Docker (optional, for containerized deployment)

### 1. Environment Setup

Copy the environment template and configure:

```bash
cp env-example.txt .env
```

Required for local dev: `DATABASE_URL`/`MONGODB_URI`, `JWT_SECRET`, `ENCRYPTION_KEY`.
Required for the FP Markets integration: `FP_MARKETS_BASE_URL`, `FP_MARKETS_TOKEN`,
`FP_MARKETS_SECRET`, `FP_MARKETS_REBATE_ACCOUNTS`. See
[Environment Variables](https://livetradingcoder.github.io/trade-cmp-docs/deployment/environment)
for the full reference.

### 2. Local Development

```bash
# Install dependencies (also generates db client)
npm install

# Seed initial data (creates admin user and sample tournaments)
npm run db:seed

# Start both frontend + backend
npm run dev
```

Access:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Admin login: `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env` (defaults: `ltl-admin-1` / `Adm!n2026`)

### 3. Tests

```bash
cd packages/server
npm test
```

Covers: broker connectors (`fixture`, `fpmarkets`), leaderboard calculation, sync
row-building, and trading data models.

### 4. Docker Deployment

```bash
docker build -t livetradingleague .
docker run -p 8080:80 --env-file .env livetradingleague
```

Access at http://localhost:8080

## Deployment

Production runs on **Railway** (single container, static egress IP required for
the broker whitelist — serverless hosts like Vercel don't support this). See
[DEPLOY-RAILWAY.md](./DEPLOY-RAILWAY.md) for the full setup, or the docs site's
[Railway Deployment](https://livetradingcoder.github.io/trade-cmp-docs/deployment/railway)
guide.

## FP Markets Integration — Current Status

**Live testing in progress.** Full design + endpoints:
[FP Markets Sync](https://livetradingcoder.github.io/trade-cmp-docs/guide/fp-markets-sync).

| Check | Status |
|-------|--------|
| Outbound IP whitelisted by broker | ✅ (static IPs: 162.220.232.250, .251, 152.55.176.240) |
| Auth (token + HMAC signature) | ✅ verified live |
| Rebate/IB `477779` accepted by API | ✅ |
| Accounts returned | ⚠️ **1 of 2 expected** — broker's own IB portal shows 2 approved clients under `477779`, API returns only 1. Reported to FP. |
| Account with real balance/trade activity | ⚠️ Not yet — the 1 returned account has $0 balance and no trades |

**To re-run the live check:**

```bash
TOK=$(curl -s -X POST https://trade-cmp-production.up.railway.app/api/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"<ADMIN_USERNAME>","password":"<ADMIN_PASSWORD>"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')

curl -s https://trade-cmp-production.up.railway.app/api/admin/fp-test \
  -H "Authorization: Bearer $TOK" | python3 -m json.tool
```

Once the broker confirms the 2nd account and adds real trade/balance data, the
next step is a **full sync** run (`POST /api/admin/sync/:tournamentId`) against a
real tournament + participant to validate the end-to-end pipeline: snapshots →
leaderboard cache → ranked ROI. That's tracked in `.planning/ROADMAP.md` (Phase 2
— Live Verification, milestone v1.1) and `.planning/STATE.md` has the running log
of every probe result.

## API Endpoints

Full reference: [API Overview](https://livetradingcoder.github.io/trade-cmp-docs/api/overview).

Key ones for broker testing:

- `GET /api/health` — health check
- `POST /api/admin/login` — admin auth
- `GET /api/admin/fp-test` — live signed probe to FP Markets (proves auth + IP whitelist)
- `POST /api/admin/sync/:tournamentId` — trigger a full broker sync
- `GET /api/leaderboard/:tournamentId` — read computed leaderboard

## Project Structure

```
trade-cmp/
├── .planning/                # GSD milestone tracking (current: v1.1 live testing)
├── packages/
│   ├── server/
│   │   └── src/
│   │       ├── services/brokers/   # fixture, simulation, fpmarkets connectors
│   │       ├── services/sync/      # syncTournament, scheduler, leaderboard build
│   │       ├── models/             # Mongoose models
│   │       └── test/               # vitest suite
│   └── web/                  # Frontend React app
├── Dockerfile                 # Production container (single, Railway target)
├── DEPLOY-RAILWAY.md          # Deploy runbook (static egress IP, Cloudflare domain)
└── docs -> ../trade-cmp-docs  # symlink to the docs site source
```

## Troubleshooting

### Database Connection Issues

The server **retries** the MongoDB connection instead of exiting, so it won't
crash-loop on deploy while the DB IP allow list is being set up. Check:

1. `DATABASE_URL`/`MONGODB_URI` is correct
2. MongoDB Atlas Network Access allows your IP (or the deploy's static egress IP)

### FP Markets Probe Fails

See the status table above for known-good/bad responses, or the docs site's
[Verifying the Integration](https://livetradingcoder.github.io/trade-cmp-docs/guide/fp-markets-sync#verifying-the-integration)
table (403 = IP not whitelisted, 404 = wrong rebate number, 401 = bad signature).

### Docker Issues

1. Ensure Docker daemon is running
2. Check environment variables are passed correctly
3. View logs: `docker logs <container-id>`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes, run `npm test` in `packages/server`
4. Submit a pull request

## License

MIT License.

## Support

- Docs site: https://livetradingcoder.github.io/trade-cmp-docs/
- Deploy runbook: [DEPLOY-RAILWAY.md](./DEPLOY-RAILWAY.md)
- Open an issue on GitHub
