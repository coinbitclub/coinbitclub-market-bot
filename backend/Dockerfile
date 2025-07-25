# CoinBitClub Market Bot - Backend Only
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache dumb-init curl

# Create app directory
WORKDIR /app

# Copy backend package files first
COPY package*.json ./

# Install backend dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy all backend files
COPY . .

# Install api-gateway specific dependencies
WORKDIR /app/api-gateway
RUN npm ci --only=production && npm cache clean --force

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Set working directory back to api-gateway
WORKDIR /app/api-gateway

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["dumb-init", "node", "server.cjs"]