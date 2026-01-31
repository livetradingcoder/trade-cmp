# LiveTradingLeague - Architecture Overview

## Project Type
Full-stack monorepo using **Turborepo** for managing multiple packages.

## Repository Structure

```
trade-cmp/
├── packages/
│   ├── server/          # Node.js/Express backend API
│   └── web/             # React/Vite frontend application
├── docker-compose.yml   # Multi-service orchestration
├── Dockerfile           # Production container image
├── turbo.json           # Turborepo build configuration
└── package.json         # Monorepo root configuration
```

## Technology Stack

### Backend (packages/server)
| Technology | Purpose |
|------------|---------|
| Node.js + TypeScript | Runtime & language |
| Express.js 4.18 | HTTP server framework |
| MongoDB + Mongoose 8.0 | Database & ODM |
| JWT (jsonwebtoken) | Authentication tokens |
| bcryptjs | Password hashing |
| Multer | File upload handling |
| Cloudinary | Image hosting/CDN |
| Nodemailer | Email service |

### Frontend (packages/web)
| Technology | Purpose |
|------------|---------|
| React 19 + TypeScript | UI library |
| Vite 7.2 | Build tool & dev server |
| React Router DOM 7.12 | Client-side routing |
| Framer Motion | Animations |
| Lucide React | Icon library |

## Data Flow

```
[React Component]
       ↓
[useTournaments() Hook]
       ↓
[TournamentContext (State)]
       ↓
[fetch() to API_URL/api/*]
       ↓
[Express Server Routes]
       ↓
[Mongoose Models]
       ↓
[MongoDB Database]
```

## Authentication Flow

1. Admin logs in via ManagerPortal component
2. POST to `/api/admin/login` with credentials
3. Server returns JWT token (7-day validity)
4. Token stored in localStorage
5. Frontend includes token in `Authorization: Bearer <token>` header
6. Server verifies token with `verifyToken` middleware

## Image Upload Flow

1. Admin selects image in tournament form
2. ImageUpload component sends multipart/form-data
3. Multer middleware receives file in memory
4. Server uploads to Cloudinary via streaming
5. Cloudinary returns secure URL
6. URL stored in tournament document

## Deployment Architecture

### Single Container Approach
- Both frontend (nginx) and backend (Node.js) run in same container
- nginx acts as reverse proxy and static file server
- Backend listens on port 3001 internally
- nginx proxies `/api/*` to backend

### Supported Platforms
- Railway (recommended)
- Vercel (separate frontend/backend)
- Render (Docker-based)
- Docker Compose (local)
