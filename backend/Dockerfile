# CoinBitClub Market Bot - Backend Only
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache dumb-init curl

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY api-gateway/package*.json ./api-gateway/

# Install dependencies
RUN npm install --production

# Copy all files
COPY . .

# Install api-gateway dependencies
WORKDIR /app/api-gateway
RUN npm install --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Set working directory to api-gateway
WORKDIR /app/api-gateway

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application using npm start (which calls server.cjs)
CMD ["npm", "start"]