# CoinBitClub Market Bot - ROOT Dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy backend package.json files
COPY backend/package*.json ./

# Install root dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy common modules
COPY backend/common/ ./common/

# Copy api-gateway
COPY backend/api-gateway/ ./api-gateway/

# Set working directory to api-gateway
WORKDIR /app/api-gateway

# Install api-gateway dependencies  
RUN npm ci --only=production && npm cache clean --force

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Start application
CMD ["dumb-init", "node", "src/index.js"]
