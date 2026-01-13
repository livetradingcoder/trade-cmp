# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace configuration
COPY package.json package-lock.json ./

# Copy turbo.json if it exists
COPY turbo.json* ./

# Copy all packages
COPY packages ./packages

# Install dependencies
RUN npm ci --ignore-scripts

# Build both frontend and backend
RUN npm run build --workspaces --if-present

# Production stage - Single container with both backend and frontend
FROM node:20-alpine

# Install nginx and gettext (for envsubst)
RUN apk add --no-cache nginx gettext

# Create nginx directories
RUN mkdir -p /run/nginx /var/log/nginx

WORKDIR /app

# Copy built frontend
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html

# Copy built backend (compiled JS)
COPY --from=builder /app/packages/server/dist ./server/dist

# Copy backend package.json
COPY --from=builder /app/packages/server/package.json ./server/

# Copy node_modules for backend dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy nginx config template
COPY nginx.conf /etc/nginx/http.d/default.conf.template

# Default port (Railway will override with PORT env var)
ENV PORT=80
ENV NODE_ENV=production

# Create startup script
RUN cat > /start.sh << 'EOF'
#!/bin/sh
set -e

echo "🚀 Starting Trade Arena Application..."
echo "================================================"

# Configure nginx with Railway PORT
PORT=${PORT:-80}
echo "📌 Configuring nginx on port $PORT..."
envsubst '${PORT}' < /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf

# Change to server directory
cd /app/server

# Start backend server in background (seed is done in the app startup)
echo "🔧 Starting backend server on port 3001..."
NODE_ENV=production node dist/index.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Check if backend is running
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend server started successfully"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start nginx (foreground - keeps container running)
echo "🌐 Starting nginx on port $PORT..."
echo "================================================"
echo "✅ Application is ready!"
echo "   Frontend: http://localhost:$PORT"
echo "   API: http://localhost:$PORT/api"
echo "================================================"

nginx -g "daemon off;"
EOF

RUN chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]
