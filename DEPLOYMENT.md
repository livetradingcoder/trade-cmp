# Deployment Guide

## Backend Deployment

### 1. Deploy to Railway

1. Go to [Railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your `livetradingcoder/trade-cmp` repository
4. Select "Add Database" → PostgreSQL

### 2. Environment Variables

Set these environment variables in Railway:

```
DATABASE_URL=postgresql://postgres:password@containers-us-west-1.railway.app:xxxx/railway
PORT=3001
```

Railway will provide the actual DATABASE_URL in the database settings.

### 3. Database Setup

After deployment, run these commands in Railway's terminal:

```bash
npm run db:push
npm run db:seed
```

### 4. Get Backend URL

Once deployed, copy the Railway URL (e.g., `https://trade-arena-production.up.railway.app`)

## Frontend Deployment

### Update Frontend to Use Backend

1. In your deployed frontend (Vercel), add environment variable:
   - `VITE_API_URL=https://your-railway-url.up.railway.app`

2. Redeploy the frontend on Vercel

## Testing

After both are deployed:
1. Check if tournaments load from database
2. Try creating a new tournament in admin panel
3. Verify it appears in the frontend