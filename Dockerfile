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

# Install nginx and tsx
RUN apk add --no-cache nginx && npm install -g tsx

# Create nginx directories
RUN mkdir -p /run/nginx /var/log/nginx

# Copy built frontend
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html

# Copy backend built files and source
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/server/src ./packages/server/src
COPY --from=builder /app/packages/server/package.json ./packages/server/
COPY --from=builder /app/packages/server/node_modules ./packages/server/node_modules
COPY --from=builder /app/packages/server/prisma ./packages/server/prisma

# Copy environment file
COPY .env ./packages/server/.env

# Copy nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Create startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'cd /packages/server' >> /start.sh && \
    echo 'npx prisma generate' >> /start.sh && \
    echo 'npx prisma db push --accept-data-loss' >> /start.sh && \
    echo 'npx tsx src/seed.ts' >> /start.sh && \
    echo 'node dist/index.js &' >> /start.sh && \
    echo 'nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]
