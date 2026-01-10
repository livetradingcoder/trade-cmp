# Trade Arena - Championship Trading Platform

A full-stack trading championship platform built with React, TypeScript, Node.js, Express, and PostgreSQL.

## Features

- Tournament management system
- Admin dashboard for tournament creation
- Real-time leaderboard
- Responsive React frontend
- RESTful API backend with Prisma ORM
- Docker containerization for easy deployment

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Docker & Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)

### 1. Environment Setup

Copy the environment template and configure your database:

```bash
cp env-example.txt .env
# Edit .env with your database URL and other settings
```

### 2. Docker Deployment (Recommended)

Build and run all services:

```bash
# Build and start services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The application will be available at:
- Frontend: http://localhost
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

### 3. Local Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed initial data
npm run db:seed

# Start development servers
npm run dev
```

## Deployment Options

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions including:

- Railway (recommended)
- Vercel
- Render
- Manual Docker deployment

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/tournaments` - Get all tournaments
- `GET /api/tournaments/:id` - Get tournament by ID
- `POST /api/tournaments` - Create tournament
- `PUT /api/tournaments/:id` - Update tournament
- `DELETE /api/tournaments/:id` - Delete tournament
- `POST /api/admin/login` - Admin authentication

## Database Schema

The application uses Prisma with PostgreSQL. Key models:

- `Tournament` - Championship tournaments
- `Admin` - Administrative users

## Troubleshooting

### Database Connection Issues

1. Verify your `DATABASE_URL` in `.env`
2. Ensure the database is accessible
3. Run `npm run db:push` to sync schema

### Docker Issues

1. Ensure Docker daemon is running
2. Check container logs: `docker-compose logs`
3. Rebuild if needed: `docker-compose up --build --force-recreate`

### API Not Working

1. Check backend health: `curl http://localhost:3001/api/health`
2. Verify environment variables are loaded
3. Check browser network tab for CORS issues

## Project Structure

```
trade-cmp/
├── packages/
│   ├── server/          # Backend API
│   │   ├── src/
│   │   ├── prisma/      # Database schema & migrations
│   │   └── dist/        # Built backend
│   └── web/             # Frontend React app
│       ├── src/
│       └── dist/        # Built frontend
├── docker-compose.yml   # Multi-service Docker setup
├── Dockerfile          # Frontend container
├── Dockerfile.backend  # Backend container
└── nginx.conf          # Web server configuration
```
