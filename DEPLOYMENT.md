# Deployment Guide - MongoDB Version

## Prerequisites: MongoDB Setup

You need a MongoDB database. We recommend **MongoDB Atlas** (free tier available).

### Create MongoDB Atlas Database:

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up/login and create a free cluster
3. Create a database user with username and password
4. Add 0.0.0.0/0 to IP whitelist
5. Get your connection string like:
   mongodb+srv://username:password@cluster.mongodb.net/trade_arena

## Deployment Options

### Option 1: Railway (Recommended)

1. Go to railway.app and sign up
2. Click "New Project" > "Deploy from GitHub repo"
3. Connect your repository
4. Set environment variables:
   - MONGODB_URI=your_connection_string
   - DATABASE_URL=your_connection_string

Railway automatically builds and deploys everything!

### Option 2: Vercel

Deploy backend and frontend separately.

Backend env vars:
- MONGODB_URI=your_connection_string

Frontend env vars:
- VITE_API_URL=your_backend_url

### Option 3: Render

Similar to Vercel - deploy backend and frontend separately.

## Local Development

1. Copy env-example.txt to .env
2. Update MONGODB_URI in .env
3. npm install
4. cd packages/server && npm run db:seed
5. Start backend: cd packages/server && npm run dev
6. Start frontend: cd packages/web && npm run dev

Default admin login: admin/admin

## Testing

- Health check: /api/health
- Tournaments API: /api/tournaments
- Admin panel: Use admin/admin to login

