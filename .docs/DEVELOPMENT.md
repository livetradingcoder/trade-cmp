# LiveTradingLeague - Development Guide

## Prerequisites
- Node.js (v18+)
- npm
- MongoDB (local or Atlas)

## Setup

### 1. Clone & Install
```bash
git clone <repo-url>
cd trade-cmp
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/trade_arena

# Auth
JWT_SECRET=your-secret-key

# Cloudinary (optional for image uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (optional for password reset)
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
FRONTEND_URL=http://localhost:5173

# Admin defaults
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 3. Seed Database
```bash
npm run db:seed
```

### 4. Start Development
```bash
npm run dev
```

This starts:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all packages in dev mode |
| `npm run build` | Build frontend & backend |
| `npm run start` | Start both services |
| `npm run start:web` | Preview built frontend |
| `npm run start:server` | Run built backend |
| `npm run db:seed` | Seed initial data |
| `npm run lint` | Run ESLint |

## Project Structure

```
trade-cmp/
├── packages/
│   ├── server/
│   │   ├── src/
│   │   │   ├── index.ts        # Main entry
│   │   │   ├── config/         # DB & Cloudinary config
│   │   │   ├── middleware/     # Auth & upload middleware
│   │   │   ├── models/         # Mongoose models
│   │   │   └── utils/          # Email utilities
│   │   └── package.json
│   └── web/
│       ├── src/
│       │   ├── main.tsx        # React entry
│       │   ├── App.tsx         # Router setup
│       │   ├── components/     # UI components
│       │   ├── pages/          # Page components
│       │   ├── context/        # State management
│       │   ├── types/          # TypeScript types
│       │   └── constants/      # Static data
│       └── package.json
├── .docs/                      # Documentation
├── docker-compose.yml
├── Dockerfile
├── turbo.json
└── package.json
```

## Development Tips

### Hot Reload
- Frontend: Vite HMR (instant updates)
- Backend: tsx watch mode (auto-restart)

### API Testing
Use the health endpoint to verify backend:
```bash
curl http://localhost:3001/api/health
```

### Admin Access
Default credentials (from seed):
- Username: `ltl-admin-1` (or your ADMIN_USERNAME)
- Password: `Adm!n2026` (or your ADMIN_PASSWORD)

### Fallback Mode
If backend is unavailable, frontend uses:
- Hardcoded tournaments from constants
- Fallback admin: `admin` / `admin123`

## Building for Production

```bash
npm run build
```

Outputs:
- `packages/web/dist/` - Static frontend files
- `packages/server/dist/` - Compiled backend

## Docker

### Build
```bash
docker build -t trade-arena .
```

### Run
```bash
docker run -p 80:80 \
  -e MONGODB_URI=<your-mongodb-uri> \
  -e JWT_SECRET=<your-secret> \
  trade-arena
```

### Docker Compose (local)
```bash
docker-compose up
```
