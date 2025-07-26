# CoinBitClub Market Bot - Backend Only - Railway Optimized
FROM node:18-alpine

# Install system dependencies for Railway
RUN apk add --no-cache dumb-init curl

# Create app directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY api-gateway/package*.json ./api-gateway/

# Install api-gateway dependencies
WORKDIR /app/api-gateway
RUN npm ci --only=production --no-audit --no-fund

# Copy server file specifically
COPY api-gateway/server.cjs ./
COPY api-gateway/knexfile.js ./

# Copy other necessary files if they exist
COPY api-gateway/src ./src/ 2>/dev/null || true

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Set working directory to api-gateway
WORKDIR /app/api-gateway

# Expose Railway port
EXPOSE 3000

# Health check specifically for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application directly with node (not npm)
CMD ["node", "server.cjs"]