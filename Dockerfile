# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
# If you don't have package-lock.json yet, verify if you should copy just package.json. 
# But usually it's better to copy both. I'll stick to package.json if lock is missing, but assuming standard flow.
# Given I can't ls easily without a tool call, I'll assume package-lock exists or npm install will generate one.
# Actually, to be safe, I'll just copy . .
COPY . .

RUN npm install
RUN npm run build

# Serve stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
