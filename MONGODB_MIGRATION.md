# MongoDB Migration Guide

This project has been successfully migrated from PostgreSQL/Prisma to MongoDB/Mongoose.

## What Changed

### Backend Changes

1. **Database Layer**: Replaced Prisma ORM with Mongoose ODM
2. **Models**: Created Mongoose schemas for `Tournament` and `Admin`
3. **Connection**: New MongoDB connection handler in `src/config/database.ts`
4. **API Responses**: Backend now transforms MongoDB's `_id` to `id` for frontend compatibility

### File Structure

```
packages/server/src/
├── config/
│   └── database.ts          # MongoDB connection configuration
├── models/
│   ├── Tournament.ts        # Tournament Mongoose model
│   └── Admin.ts             # Admin Mongoose model
├── index.ts                 # Express server with Mongoose queries
└── seed.ts                  # Database seeding script
```

### Removed Files

- `packages/server/prisma/` - Entire Prisma directory removed
- Prisma dependencies removed from package.json

## Setup Instructions

### 1. Install Dependencies

```bash
cd /Users/abujobayer/Projects/trade-cmp
npm install
```

### 2. Configure MongoDB

Create a `.env` file in the project root:

```bash
cp env-example.txt .env
```

Edit `.env` and set your MongoDB connection string:

```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/trade_arena

# OR MongoDB Atlas (cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trade_arena?retryWrites=true&w=majority
```

### 3. Seed the Database

```bash
cd packages/server
npm run db:seed
```

This will:

- Clear existing data
- Create default admin user (username: `admin`, password: `admin`)
- Create 3 sample tournaments

### 4. Start Development

Start backend:

```bash
cd packages/server
npm run dev
```

Start frontend (in another terminal):

```bash
cd packages/web
npm run dev
```

Access:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

## API Endpoints

All endpoints remain the same:

- `GET /api/health` - Health check
- `POST /api/admin/login` - Admin login
- `GET /api/tournaments` - Get all tournaments
- `GET /api/tournaments/:id` - Get single tournament
- `POST /api/tournaments` - Create tournament (admin only)
- `PUT /api/tournaments/:id` - Update tournament (admin only)
- `DELETE /api/tournaments/:id` - Delete tournament (admin only)

## Frontend Changes

- Updated `Tournament` interface to accept `string | number` for `id` field
- Updated `TournamentContext` to handle MongoDB string IDs
- No UI changes required - everything works seamlessly

## Deployment

### MongoDB Atlas Setup (Required)

1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Create database user
4. Add `0.0.0.0/0` to IP whitelist
5. Get connection string

### Railway Deployment

1. Go to railway.app
2. Create new project from GitHub repo
3. Set environment variable:
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string
   ```
4. Deploy automatically happens!

### Vercel Deployment

Backend:

```bash
cd packages/server
vercel
```

Set environment variables in Vercel dashboard:

- `MONGODB_URI`

Frontend:

```bash
cd packages/web
vercel
```

Set environment variable:

- `VITE_API_URL=your_backend_url`

## Testing

1. **Health Check**: Visit `/api/health` - should return `{"status":"ok","database":"mongodb"}`
2. **View Tournaments**: Open frontend and check tournaments load
3. **Admin Login**: Click "Verify Manager" and login with `admin`/`admin`
4. **CRUD Operations**: Create, edit, and delete tournaments in admin panel

## Troubleshooting

### Connection Issues

**Error**: "MongoDB connection error"

- Check your `MONGODB_URI` is correct
- Verify MongoDB Atlas IP whitelist includes your IP
- Ensure database user has correct permissions

### Admin Can't Login

- Make sure you ran the seed script
- Default credentials: username `admin`, password `admin`
- Check backend logs for errors

### Frontend Shows Fallback Data

- This means backend is not accessible
- Check backend is running on port 3001
- Verify `VITE_API_URL` in frontend .env

### Seed Script Fails

- This is usually fine if data already exists
- Clear database manually if you want fresh data:
  ```javascript
  // In MongoDB shell or Atlas
  use trade_arena
  db.tournaments.deleteMany({})
  db.admins.deleteMany({})
  ```

## Data Model

### Tournament Schema

```javascript
{
  title: String,
  tier: String,           // "Weekly" or "Monthly"
  prize: String,
  fee: String,
  participants: Number,
  timeLabel: String,      // "Ends in" or "Starts in"
  timeLeft: String,
  cover: String,          // Image URL
  image: String,          // Optional additional image
  registrationLink: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Admin Schema

```javascript
{
  username: String,       // unique
  password: String,       // plaintext (change in production!)
  createdAt: Date
}
```

## Security Notes

⚠️ **Important**: The current admin authentication is basic and not production-ready:

1. Passwords are stored in plaintext
2. No JWT or session tokens
3. No rate limiting

For production, implement:

- Password hashing (bcrypt)
- JWT authentication
- Rate limiting
- HTTPS only
- Environment-based secrets

## Benefits of MongoDB

✅ **Flexible Schema**: Easy to add new fields without migrations
✅ **Scalability**: Horizontal scaling with sharding
✅ **Cloud-Ready**: MongoDB Atlas free tier available
✅ **JSON Native**: Perfect for Node.js applications
✅ **No Migrations**: Schema changes don't require migration files

## Need Help?

Check:

1. Server logs for detailed error messages
2. MongoDB Atlas metrics and logs
3. Browser console for frontend errors
4. DEPLOYMENT.md for deployment-specific issues
