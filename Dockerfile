# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace configuration
COPY package.json package-lock.json ./

# Copy all packages
COPY packages ./packages

# Install dependencies
RUN npm install

# Build both frontend and backend
RUN npm run build

# Production stage - Single container with both backend and frontend
FROM node:20-alpine

# Install nginx, tsx, and OpenSSL 1.1 compatibility for Prisma
RUN apk add --no-cache nginx openssl1.1-compat && npm install -g tsx

# Create nginx directories
RUN mkdir -p /run/nginx /var/log/nginx

# Copy built frontend
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html

# Copy backend source and rebuild (to include latest changes)
COPY --from=builder /app/packages/server/src ./packages/server/src
COPY --from=builder /app/packages/server/package.json ./packages/server/
COPY --from=builder /app/packages/server/tsconfig.json ./packages/server/
COPY --from=builder /app/packages/server/prisma ./packages/server/prisma

# Copy workspace node_modules (contains all dependencies for monorepo)
COPY --from=builder /app/node_modules ./packages/server/node_modules

# Rebuild backend with latest source changes
RUN cd packages/server && npm run build

# Copy environment file
COPY .env packages/server/.env

# Copy and configure nginx
COPY nginx.conf /etc/nginx/http.d/default.conf.template
RUN envsubst '${PORT}' < /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf

# Set default port, Railway will override with PORT env var
ENV PORT=80

# Expose port 80 (Railway will map this)
EXPOSE 80

# Create startup script with error handling
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "Starting application..."' >> /start.sh && \
    echo 'cd packages/server' >> /start.sh && \
    echo 'echo "Running prisma generate..."' >> /start.sh && \
    echo 'npx prisma generate || echo "Prisma generate failed, continuing..."' >> /start.sh && \
    echo 'echo "Running prisma db push..."' >> /start.sh && \
    echo 'npx prisma db push --accept-data-loss || echo "Prisma db push failed, continuing..."' >> /start.sh && \
    echo 'echo "Running seed script..."' >> /start.sh && \
    echo 'npx tsx src/seed.ts || echo "Seeding failed, continuing..."' >> /start.sh && \
    echo 'echo "Starting backend server on port 3001..."' >> /start.sh && \
    echo 'node dist/index.js &' >> /start.sh && \
    echo 'sleep 2' >> /start.sh && \
    echo 'echo "Starting nginx..."' >> /start.sh && \
    echo 'nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]
