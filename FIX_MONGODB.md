# Fix MongoDB Atlas Connection

## The Problem
Your MongoDB Atlas IP address is not whitelisted. This is a security feature.

## Quick Fix (Choose One)

### Option 1: Whitelist Your IP in MongoDB Atlas (2 minutes)

1. Go to https://cloud.mongodb.com
2. Login to your account
3. Click on your cluster → **Network Access** (left sidebar)
4. Click **"+ ADD IP ADDRESS"**
5. Click **"ADD CURRENT IP ADDRESS"** (recommended for development)
   - Or click **"ALLOW ACCESS FROM ANYWHERE"** and enter `0.0.0.0/0` (less secure but works everywhere)
6. Click **"Confirm"**
7. Wait 1-2 minutes for the change to apply
8. Restart your server

### Option 2: Use Local MongoDB (5 minutes)

**Install MongoDB:**
```bash
# macOS
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify it's running
mongosh
```

**Update your `.env` file:**
```env
# Change from Atlas to local
MONGODB_URI=mongodb://localhost:27017/trade_arena
```

**Restart your server**

## Step-by-Step Instructions

### If Using MongoDB Atlas:

1. **Login to MongoDB Atlas**
   - Go to: https://cloud.mongodb.com
   - Login with your credentials

2. **Navigate to Network Access**
   - In the left sidebar, click **"Network Access"** under "Security"
   - You'll see a list of IP addresses (probably empty)

3. **Add Your IP Address**
   - Click the green **"+ ADD IP ADDRESS"** button
   - A dialog will appear with two options:
     
     **Option A - Add Current IP (Recommended):**
     - Click **"ADD CURRENT IP ADDRESS"**
     - Your current IP will auto-populate
     - Add a comment like "Development Machine"
     - Click **"Confirm"**
     
     **Option B - Allow from Anywhere (Less Secure):**
     - Click **"ALLOW ACCESS FROM ANYWHERE"**
     - This adds `0.0.0.0/0` which allows any IP
     - Good for testing, but less secure
     - Click **"Confirm"**

4. **Wait for Changes to Apply**
   - It takes 1-2 minutes for MongoDB Atlas to apply the changes
   - You'll see a status indicator

5. **Restart Your Server**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then start again:
   cd packages/server
   npm run dev
   ```

### If Using Local MongoDB:

1. **Install MongoDB Community Edition**
   ```bash
   # macOS with Homebrew
   brew tap mongodb/brew
   brew install mongodb-community
   
   # Start MongoDB as a service
   brew services start mongodb-community
   
   # Verify it's running
   brew services list | grep mongodb
   ```

2. **Test Connection**
   ```bash
   # Connect to MongoDB shell
   mongosh
   
   # You should see:
   # Current Mongosh Log ID: xxxxx
   # Connecting to: mongodb://127.0.0.1:27017
   # Using MongoDB: 7.x.x
   
   # Type 'exit' to quit
   exit
   ```

3. **Update Environment File**
   ```bash
   # Edit .env file
   nano .env
   
   # Change MONGODB_URI to:
   MONGODB_URI=mongodb://localhost:27017/trade_arena
   
   # Save and exit (Ctrl+X, then Y, then Enter)
   ```

4. **Seed the Database**
   ```bash
   cd packages/server
   npm run db:seed
   ```

5. **Restart Server**
   ```bash
   npm run dev
   ```

## Verify It's Working

After fixing, you should see:
```
✅ MongoDB connected successfully
   Database: trade_arena
   Host: localhost (or your Atlas cluster)
🚀 Server running on http://0.0.0.0:3001
```

## Test the Connection

```bash
# Test the health endpoint
curl http://localhost:3001/api/health

# Should return:
# {"status":"ok","database":"mongodb"}

# Test tournaments endpoint
curl http://localhost:3001/api/tournaments

# Should return array of tournaments
```

## Still Having Issues?

### Error: "IP address not whitelisted"
- **Solution**: Follow Option 1 above, make sure to wait 2 minutes after adding IP

### Error: "Authentication failed"
- **Solution**: Check your connection string has correct username/password
- Format: `mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/trade_arena`

### Error: "Connection timeout"
- **Solution 1**: Check your internet connection
- **Solution 2**: Try allowing access from anywhere (0.0.0.0/0)
- **Solution 3**: Switch to local MongoDB (Option 2)

### Error: "mongod not found" (Local MongoDB)
- **Solution**: Install MongoDB first:
  ```bash
  brew install mongodb-community
  brew services start mongodb-community
  ```

## Quick Commands

```bash
# Check if MongoDB is running (local)
brew services list | grep mongodb

# Start MongoDB (local)
brew services start mongodb-community

# Stop MongoDB (local)
brew services stop mongodb-community

# Connect to MongoDB shell (local)
mongosh

# Connect to MongoDB Atlas
mongosh "mongodb+srv://cluster.mongodb.net/" --username YOUR_USERNAME

# Seed database
cd packages/server && npm run db:seed

# Restart development server
cd packages/server && npm run dev
```

## Current Status

Based on your error, you have:
- ✅ MongoDB Atlas cluster created
- ✅ Connection string configured
- ❌ IP address not whitelisted (THIS IS THE ISSUE)

**Next Step**: Follow **Option 1** above to whitelist your IP address!
