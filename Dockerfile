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

# Production stage - Serve frontend with nginx
FROM nginx:alpine

# Copy built frontend from packages/web/dist
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
