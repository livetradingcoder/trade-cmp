# Deployment Guide

## Backend Deployment

Choose one of the following options:

| Feature | Railway | Vercel | Render |
|---------|---------|--------|--------|
| **Database** | Built-in PostgreSQL | Built-in PostgreSQL | Built-in PostgreSQL |
| **Pricing** | Free tier available | Free tier available | Free tier available |
| **Cold Starts** | No (persistent server) | Yes (serverless) | No (persistent server) |
| **File Uploads** | Good support | Limited | Good support |
| **Ease of Setup** | Very easy | Moderate | Easy |
| **One-Command Deploy** | ✅ `npm start` | ✅ `npm run deploy:vercel` | ⚠️ Manual setup required |

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

**For Railway**: The `npm start` command automatically runs all setup:

```bash
npm start
```

This runs:

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push database schema
- `npm run db:seed` - Seed initial data
- `npm run start:server` - Start the server

**For Vercel**: Database setup is done separately during deployment

### 4. Get Backend URL

Once deployed, copy the Railway URL (e.g., `https://trade-arena-production.up.railway.app`)

### Option 2: Deploy Backend to Vercel

**Important**: Deploy the backend as a **separate Vercel project** from your frontend.

#### One-Command Vercel Deployment:

**Easiest way - use the automated script:**

```bash
# Install Vercel CLI and login first
npm install -g vercel
vercel login

# Deploy everything with one command
npm run deploy:vercel
```

This will:

1. ✅ Deploy backend API to `trade-arena-api` project
2. ✅ Deploy frontend to `trade-arena-web` project
3. ✅ Set up proper project names and configurations

#### Manual Deployment (Alternative):

1. **Deploy Backend:**

   ```bash
   npm run deploy:backend
   ```

2. **Deploy Frontend:**
   ```bash
   npm run deploy:frontend
   ```

#### Vercel Database Setup

1. **Add Vercel Postgres**: In backend project settings → Storage → Create Database → Postgres
2. **Environment Variables** (in backend project):
   ```
   DATABASE_URL=your_postgres_connection_string_from_vercel
   PORT=3001
   ```
3. **Database Migration**: After deployment, run in Vercel terminal:
   ```bash
   npm run db:push
   npm run db:seed
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
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const tournaments = await prisma.tournament.findMany();
    res.status(200).json(tournaments);
  } else if (req.method === "POST") {
    const tournament = await prisma.tournament.create({ data: req.body });
    res.status(201).json(tournament);
  }
}
```

## Frontend Deployment

### Deploy Frontend to Vercel

**Use the automated deployment:**

```bash
npm run deploy:vercel
```

This automatically deploys both frontend and backend with proper configuration.

### Manual Frontend Deployment (Alternative):

1. **Deploy with script:**

   ```bash
   npm run deploy:frontend
   ```

2. **Or manually create project:**
   - Import `livetradingcoder/trade-cmp` repository
   - Root Directory: `packages/web`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Connect Frontend to Backend

**Automated:** The deployment script handles environment variables automatically.

**Manual:** In Vercel frontend project settings, add:

- **Name**: `VITE_API_URL`
- **Value**: Your backend URL (e.g., `https://trade-arena-api.vercel.app`)

2. **In Vercel frontend project settings**, add environment variable:

   - **Name**: `VITE_API_URL`
   - **Value**: Your backend URL

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

| Feature           | Railway                | Vercel              |
| ----------------- | ---------------------- | ------------------- |
| **Database**      | Built-in PostgreSQL    | Built-in PostgreSQL |
| **Pricing**       | Free tier available    | Free tier available |
| **Cold Starts**   | No (persistent server) | Yes (serverless)    |
| **File Uploads**  | Good support           | Limited             |
| **Ease of Setup** | Very easy              | Moderate            |

**Recommendation**: Use Railway for backend if you need persistent connections. Use Vercel if you want everything in one platform.

### Option 3: Deploy to Render (Alternative)

Render provides web services, static sites, and PostgreSQL databases with a free tier.

#### One-Command Render Deployment Prep:

```bash
npm run deploy:render
```

This shows you the steps needed for Render deployment.

#### Manual Render Deployment Steps:

1. **Create Render Account**: Go to [render.com](https://render.com) and sign up

2. **Create PostgreSQL Database**:
   - Click "New" → "PostgreSQL"
   - Name: `trade-arena-db`
   - Copy the connection string for later

3. **Deploy Backend API**:
   - Click "New" → "Web Service"
   - Connect your `livetradingcoder/trade-cmp` repo
   - **Settings**:
     - **Name**: `trade-arena-api`
     - **Root Directory**: `packages/server`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     DATABASE_URL=your_postgres_connection_string
     NODE_ENV=production
     ```

4. **Deploy Frontend**:
   - Click "New" → "Static Site"
   - Connect your `livetradingcoder/trade-cmp` repo
   - **Settings**:
     - **Name**: `trade-arena-web`
     - **Root Directory**: `packages/web`
     - **Build Command**: `npm install && npm run build`
     - **Publish Directory**: `dist`
   - **Environment Variables**:
     ```
     VITE_API_URL=https://your-backend-service.onrender.com
     ```

5. **Database Setup**:
   After backend is deployed, go to the web service shell and run:
   ```bash
   npm run db:push
   npm run db:seed
   ```

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
