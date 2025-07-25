# Multi-service monorepo Dockerfile
FROM node:18-alpine AS base

# Install essential tools
RUN apk add --no-cache dumb-init curl bash

# Set workdir to backend
WORKDIR /app

# Copy all package.json files first (better caching)
COPY ./package*.json ./
COPY ./api-gateway/package*.json ./api-gateway/
COPY ./common/ ./common/

# Install dependencies
RUN npm install --only=production

# Install api-gateway specific dependencies
WORKDIR /app/api-gateway
RUN npm install --only=production

# Copy source code
COPY ./api-gateway/src/ ./src/

# Create user and set permissions
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["dumb-init", "node", "src/index.js"]
