# Deployment Guide

## Backend Deployment

Choose one of the following options:

### Option 1: Deploy to Railway (Recommended)

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

### Option 2: Deploy to Vercel

1. **Go to [Vercel.com](https://vercel.com)** and sign up/login
2. **Click "New Project"**
3. **Import your `livetradingcoder/trade-cmp` repository**
4. **Configure build settings**:
   - **Root Directory**: `packages/server`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Vercel Database Setup

1. **Add Vercel Postgres**: In your project settings → Storage → Create Database → Postgres
2. **Environment Variables** (in Vercel project settings):
   ```
   DATABASE_URL=your_postgres_connection_string_from_vercel
   ```
3. **Run database commands** in Vercel functions terminal:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

### Vercel API Structure

For Vercel deployment, create API routes in `packages/server/api/` directory:

```
packages/server/api/
├── health.ts
├── admin/
│   └── login.ts
├── tournaments/
│   ├── index.ts
│   └── [id].ts
```

Example `packages/server/api/tournaments/index.ts`:
```typescript
import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const tournaments = await prisma.tournament.findMany()
    res.status(200).json(tournaments)
  } else if (req.method === 'POST') {
    const tournament = await prisma.tournament.create({ data: req.body })
    res.status(201).json(tournament)
  }
}
```

## Frontend Deployment

### Update Frontend to Use Backend

1. **Get your backend URL** from either:
   - Railway: `https://your-app-name.up.railway.app`
   - Vercel: `https://your-project.vercel.app`

2. **In Vercel frontend project settings**, add environment variable:
   - **Name**: `VITE_API_URL`
   - **Value**: Your backend URL (Railway or Vercel)

3. **Redeploy the frontend** on Vercel

### CORS Configuration

- **Railway**: CORS is already configured in the Express server
- **Vercel**: Add to your `vercel.json` in the server package:
  ```json
  {
    "headers": [
      {
        "source": "/api/(.*)",
        "headers": [
          { "key": "Access-Control-Allow-Origin", "value": "*" },
          { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE" },
          { "key": "Access-Control-Allow-Headers", "value": "Content-Type" }
        ]
      }
    ]
  }
  ```

## Platform Comparison

| Feature | Railway | Vercel |
|---------|---------|--------|
| **Database** | Built-in PostgreSQL | Built-in PostgreSQL |
| **Pricing** | Free tier available | Free tier available |
| **Cold Starts** | No (persistent server) | Yes (serverless) |
| **File Uploads** | Good support | Limited |
| **Ease of Setup** | Very easy | Moderate |

**Recommendation**: Use Railway for backend if you need persistent connections. Use Vercel if you want everything in one platform.

## Testing

After both are deployed:

1. **Check health endpoint**: `https://your-backend-url/api/health`
2. **Test tournaments API**: `https://your-backend-url/api/tournaments`
3. **Login to admin panel** and create a tournament
4. **Verify it appears** in the frontend tournament list

## Troubleshooting

### Database Connection Issues
- Check your `DATABASE_URL` environment variable
- Run `npx prisma db push` in your deployment platform's terminal
- Verify database credentials are correct

### CORS Errors
- Railway: Already configured
- Vercel: Add CORS headers to `vercel.json`

### API Not Working
- Check deployment logs
- Verify environment variables are set
- Test endpoints directly in browser/Postman

### Frontend Not Loading Data
- Check `VITE_API_URL` environment variable in Vercel
- Verify backend URL is accessible
- Check browser console for network errors
