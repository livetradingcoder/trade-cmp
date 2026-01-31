# Quick Start Guide - LiveTradingLeague

## MongoDB Setup (Required!)

The application needs MongoDB to run. Choose one option:

### Option 1: Install MongoDB Locally (Recommended for Development)

**macOS:**
```bash
# Install MongoDB
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify it's running
brew services list | grep mongodb
```

**Ubuntu/Debian:**
```bash
# Install MongoDB
sudo apt-get install -y mongodb

# Start MongoDB
sudo systemctl start mongodb

# Enable on boot
sudo systemctl enable mongodb
```

**Windows:**
- Download MongoDB from: https://www.mongodb.com/try/download/community
- Install and run MongoDB Compass or MongoDB as a service

### Option 2: Use MongoDB Atlas (Cloud - Free Tier)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a free cluster (M0)
4. Create a database user
5. Add `0.0.0.0/0` to IP whitelist (for development)
6. Get your connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/trade_arena
   ```
7. Add to `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trade_arena
   ```

## Setup Steps

### 1. Clone and Install
```bash
cd /Users/abujobayer/Projects/trade-cmp
npm install
```

### 2. Configure Environment
```bash
# Copy example environment file
cp env-example.txt .env

# Edit .env and set your MongoDB connection
nano .env  # or use your preferred editor
```

**Minimum required in .env:**
```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/trade_arena

# Or MongoDB Atlas
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/trade_arena

# JWT Secret (change this!)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Cloudinary (optional - for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Seed Database
```bash
cd packages/server
npm run db:seed
```

This creates:
- Admin user: `admin` / `admin123`
- Email: `admin@LiveTradingLeague.com`
- 3 sample tournaments

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd packages/server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd packages/web
npm run dev
```

### 5. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Admin Portal**: Click "Verify Manager" and login with `admin` / `admin123`

## Troubleshooting

### Error: "MongoDB connection timeout"

**Problem:** MongoDB is not running or not accessible.

**Solutions:**

1. **Check if MongoDB is running:**
   ```bash
   # macOS
   brew services list | grep mongodb
   
   # Linux
   sudo systemctl status mongodb
   ```

2. **Start MongoDB:**
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongodb
   ```

3. **Check connection string in .env:**
   - Local: `mongodb://localhost:27017/trade_arena`
   - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/trade_arena`

4. **Test connection:**
   ```bash
   mongosh "mongodb://localhost:27017/trade_arena"
   # or for Atlas:
   mongosh "your_atlas_connection_string"
   ```

### Error: "Cannot find module"

**Solution:**
```bash
npm install
```

### Error: "Port 3001 already in use"

**Solution:**
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9

# Or change the port in .env
PORT=3002
```

### Admin Can't Login

**Problem:** Database not seeded or credentials wrong.

**Solution:**
```bash
cd packages/server
npm run db:seed

# Default credentials:
# Username: admin
# Password: admin123
# Email: admin@LiveTradingLeague.com
```

### Images Won't Upload

**Problem:** Cloudinary not configured.

**Solution:**
1. Create free Cloudinary account: https://cloudinary.com
2. Get your credentials from dashboard
3. Add to `.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- Railway deployment
- Vercel deployment
- MongoDB Atlas setup
- Environment variables
- Security best practices

## Features

✅ **Secure Admin Authentication**
- JWT token-based authentication
- Password hashing with bcrypt
- Password reset via email
- Session management

✅ **Image Upload**
- Cloudinary integration
- Image optimization
- Drag & drop support
- URL fallback

✅ **Tournament Management**
- Create, edit, delete tournaments
- Real-time UI updates
- MongoDB storage
- Responsive design

✅ **MongoDB Integration**
- Mongoose ODM
- Schema validation
- Automatic timestamps
- Error handling

## Need Help?

- **Setup Issues**: Check this file
- **Database Issues**: See [MONGODB_MIGRATION.md](./MONGODB_MIGRATION.md)
- **Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Testing**: See [TESTING_RESULTS.md](./TESTING_RESULTS.md)
- **Admin Portal**: See [ADMIN_PORTAL_GUIDE.md](./ADMIN_PORTAL_GUIDE.md)
