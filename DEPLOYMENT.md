# Deployment Guide

## Backend Deployment

Choose one of the following options:

| Feature            | Railway                     | Vercel                      | Render                      |
| ------------------ | --------------------------- | --------------------------- | --------------------------- |
| **Database**       | Built-in PostgreSQL         | Built-in PostgreSQL         | Built-in PostgreSQL         |
| **Pricing**        | Free tier available         | Free tier available         | Free tier available         |
| **Cold Starts**    | No (persistent server)      | Yes (serverless)            | No (persistent server)      |
| **File Uploads**   | Good support                | Limited                     | Good support                |
| **Ease of Setup**  | Very easy                   | Moderate                    | Easy                        |
| **Full App Start** | ✅ Both services auto-start | ✅ Both services auto-start | ✅ Both services auto-start |

### Option 1: Deploy to Railway (Recommended)

#### Quick Setup:

1. Go to [Railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your `livetradingcoder/trade-cmp` repository
4. Railway will automatically detect the `railway.toml` configuration
5. Select "Add Database" → PostgreSQL

#### Configuration Files Created:

The project now includes Railway-specific configuration:

- `railway.toml` - Railway deployment configuration
- `.railwayignore` - Files to exclude from deployment

#### Environment Variables:

Railway automatically sets these environment variables:

- `DATABASE_URL` - Automatically provided when you add PostgreSQL database (no manual setup needed!)
- `PORT` - Automatically set by Railway at runtime (nginx will use this dynamically)
- `NODE_ENV` - Can be set to "production" in Railway dashboard (optional)

**Note**: The frontend uses relative URLs (`/api/*`) which automatically work with Railway since nginx proxies all `/api/*` requests to the backend. No `VITE_API_URL` configuration needed!

**No manual environment variable setup required!** 🎉

#### Database Setup & Startup:

**🎯 Everything happens automatically during build and start!**

Railway's deployment process:

1. ✅ Builds the Docker container using the provided Dockerfile
2. ✅ Generates Prisma client
3. ✅ Pushes database schema
4. ✅ Seeds initial tournament data
5. ✅ Starts both frontend (nginx) & backend (Node.js) servers

#### Deployment URL:

Once deployed, your Railway URL will be something like:
`https://trade-arena-production.up.railway.app`

The frontend will be served from the root URL, and API endpoints will be available at `/api/*`.

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
3. **Database Setup**: Happens automatically during first build/start!
   - No manual commands needed ✅

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

3. **Deploy Backend API** (Web Service):

   - Click "New" → "Web Service"
   - Connect your `livetradingcoder/trade-cmp` repo
   - **Settings**:
     - **Name**: `trade-arena-api`
     - **Root Directory**: `packages/server`
     - **Runtime**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     DATABASE_URL=your_postgres_connection_string
     NODE_ENV=production
     PORT=10000
     ```

4. **Deploy Frontend** (Static Site):

   - Click **"New" → "Static Site"**
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

5. **Database Setup**: Happens automatically when backend starts!
   - No manual commands needed ✅

#### Alternative: Docker Deployment (Single Container)

If you prefer deploying everything in one container:

1. **Deploy as Web Service** with Docker:
   - **Service Type**: Web Service
   - **Build Type**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - Uses the included `Dockerfile` to build and serve only the frontend
   - **Note**: Backend must be deployed separately for full functionality

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
