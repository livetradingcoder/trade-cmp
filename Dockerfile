# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace configuration
COPY package.json package-lock.json turbo.json ./

# Copy all packages
COPY packages ./packages

# Install dependencies (skip postinstall to avoid db:generate during build)
RUN npm ci --ignore-scripts

# Generate Prisma Client before building (no DATABASE_URL needed for generation)
# This must happen before TypeScript compilation since PrismaClient is imported
WORKDIR /app/packages/server
RUN npx prisma generate
WORKDIR /app

# Build both frontend and backend
RUN npm run build --workspaces --if-present

# Production stage - Single container with both backend and frontend
FROM node:20-alpine

# Install nginx, tsx, gettext (for envsubst), and OpenSSL 1.1 compatibility for Prisma
RUN apk add --no-cache nginx openssl gettext && npm install -g tsx

# Create nginx directories
RUN mkdir -p /run/nginx /var/log/nginx

# Copy built frontend
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html

# Copy built backend (already compiled in builder stage)
COPY --from=builder /app/packages/server/dist ./packages/server/dist

# Copy backend source (needed for seed script at runtime)
COPY --from=builder /app/packages/server/src ./packages/server/src

# Copy backend files needed for runtime
COPY --from=builder /app/packages/server/package.json ./packages/server/
COPY --from=builder /app/packages/server/prisma ./packages/server/prisma

# Copy workspace node_modules (contains all dependencies and generated Prisma Client)
COPY --from=builder /app/node_modules ./packages/server/node_modules

# Copy nginx config template (will be processed at runtime with Railway's PORT)
COPY nginx.conf /etc/nginx/http.d/default.conf.template

# Default port (Railway will override with PORT env var at runtime)
ENV PORT=80

# Expose port 80 (Railway will map this)
EXPOSE 80

# Create startup script with error handling
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "Starting application..."' >> /start.sh && \
    echo 'echo "Using PORT: ${PORT:-80}"' >> /start.sh && \
    echo 'cd packages/server' >> /start.sh && \
    echo 'echo "Running prisma generate..."' >> /start.sh && \
    echo 'npx prisma generate' >> /start.sh && \
    echo 'echo "Starting backend server on port 3001..."' >> /start.sh && \
    echo 'node dist/index.js &' >> /start.sh && \
    echo '# Run migrations and seed in background to not block startup' >> /start.sh && \
    echo '(' >> /start.sh && \
    echo '  echo "Running prisma db push..."' >> /start.sh && \
    echo '  npx prisma db push --accept-data-loss' >> /start.sh && \
    echo '  echo "Running seed script..."' >> /start.sh && \
    echo '  npx tsx src/seed.ts' >> /start.sh && \
    echo ') &' >> /start.sh && \
    echo 'echo "Configuring nginx with PORT=${PORT:-80}..."' >> /start.sh && \
    echo 'export PORT=${PORT:-80}' >> /start.sh && \
    echo 'envsubst '"'"'${PORT}'"'"' < /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf' >> /start.sh && \
    echo 'echo "Starting nginx on port ${PORT:-80}..."' >> /start.sh && \
    echo 'nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]
