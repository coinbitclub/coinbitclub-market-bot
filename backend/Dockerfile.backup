# Multi-stage build for CoinBitClub Market Bot
FROM node:18-alpine AS base

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Copy root package.json and install root dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy common modules
COPY common/ ./common/

# Copy api-gateway
COPY api-gateway/ ./api-gateway/

# Install api-gateway dependencies
WORKDIR /app/api-gateway
RUN npm ci --only=production && npm cache clean --force

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Set final working directory
WORKDIR /app/api-gateway

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start command
CMD ["node", "src/index.js"]