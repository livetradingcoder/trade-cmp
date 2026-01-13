# Trade Arena - Championship Trading Platform

A full-stack trading championship platform built with React, TypeScript, Node.js, Express, and MongoDB.

## Features

- Tournament management system
- Admin dashboard for tournament creation
- Real-time leaderboard
- Responsive React frontend
- RESTful API backend with Mongoose ODM
- Docker containerization for easy deployment

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Deployment**: Docker & Cloud Platforms (Railway, Vercel, Render)

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB (local or MongoDB Atlas)
- Docker (optional, for containerized deployment)

### 1. Environment Setup

Copy the environment template and configure your database:

```bash
cp env-example.txt .env
# Edit .env with your MongoDB connection string
```

Example `.env`:

```
MONGODB_URI=mongodb://localhost:27017/trade_arena
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trade_arena
```

### 2. Local Development

```bash
# Install dependencies
npm install

# Seed initial data (creates admin user and sample tournaments)
cd packages/server
npm run db:seed

# Start backend (terminal 1)
cd packages/server
npm run dev

# Start frontend (terminal 2)
cd packages/web
npm run dev
```

Access:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Admin login: username `admin`, password `admin`

### 3. Docker Deployment

Build and run in Docker:

```bash
# Build the container
docker build -t trade-arena .

# Run with environment variables
docker run -p 80:80 -e MONGODB_URI="your_mongodb_uri" trade-arena
```

Access at http://localhost

## Deployment Options

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions including:

- **Railway** (recommended) - Easy deployment with automatic builds
- **Vercel** - Separate frontend/backend deployment
- **Render** - Docker-based deployment

All platforms require a MongoDB database (MongoDB Atlas recommended for free tier).

## API Endpoints

- `GET /api/health` - Health check (returns `{"status":"ok","database":"mongodb"}`)
- `GET /api/tournaments` - Get all tournaments
- `GET /api/tournaments/:id` - Get tournament by ID
- `POST /api/tournaments` - Create tournament (admin only)
- `PUT /api/tournaments/:id` - Update tournament (admin only)
- `DELETE /api/tournaments/:id` - Delete tournament (admin only)
- `POST /api/admin/login` - Admin authentication

## Database Schema

The application uses MongoDB with Mongoose. Key models:

### Tournament

- `title`: String
- `tier`: String (Weekly/Monthly)
- `prize`: String
- `fee`: String
- `participants`: Number
- `timeLabel`: String (Ends in/Starts in)
- `timeLeft`: String
- `cover`: String (image URL)
- `image`: String (optional)
- `registrationLink`: String

### Admin

- `username`: String (unique)
- `password`: String

## Admin Panel

1. Click "Verify Manager" button on the homepage
2. Login with default credentials:
   - Username: `admin`
   - Password: `admin`
3. Manage tournaments:
   - Create new tournaments
   - Edit existing tournaments
   - Delete tournaments
   - Update tournament details and images

## Migration from PostgreSQL

This project was migrated from PostgreSQL/Prisma to MongoDB/Mongoose. See [MONGODB_MIGRATION.md](./MONGODB_MIGRATION.md) for details.

## Troubleshooting

### Database Connection Issues

1. Verify your `MONGODB_URI` in `.env`
2. For MongoDB Atlas:
   - Check IP whitelist includes your IP or `0.0.0.0/0`
   - Verify database user has read/write permissions
3. For local MongoDB:
   - Ensure MongoDB is running: `mongod`

### Admin Can't Login

1. Run the seed script: `cd packages/server && npm run db:seed`
2. Default credentials: `admin` / `admin`
3. Check backend logs for errors

### Frontend Shows Fallback Data

- Backend is not accessible
- Check backend is running on port 3001
- Verify `VITE_API_URL` is set correctly

### Docker Issues

1. Ensure Docker daemon is running
2. Check environment variables are passed correctly
3. View logs: `docker logs <container-id>`

## Project Structure

```
trade-cmp/
├── packages/
│   ├── server/              # Backend API
│   │   ├── src/
│   │   │   ├── config/      # Database configuration
│   │   │   ├── models/      # Mongoose models
│   │   │   ├── index.ts     # Express server
│   │   │   └── seed.ts      # Database seeding
│   │   └── dist/            # Built backend
│   └── web/                 # Frontend React app
│       ├── src/
│       │   ├── components/
│       │   ├── context/
│       │   ├── pages/
│       │   └── types/
│       └── dist/            # Built frontend
├── Dockerfile               # Production container
├── docker-compose.yml       # Multi-service setup
├── nginx.conf              # Web server configuration
├── DEPLOYMENT.md           # Deployment guide
└── MONGODB_MIGRATION.md    # Migration documentation
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues and questions:

- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Check [MONGODB_MIGRATION.md](./MONGODB_MIGRATION.md) for database info
- Open an issue on GitHub
