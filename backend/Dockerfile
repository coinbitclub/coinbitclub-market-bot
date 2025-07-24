# Railway Dockerfile for CoinBitClub Market Bot
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache bash curl

# Set working directory
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./
COPY api-gateway/package*.json ./api-gateway/

# Install dependencies
RUN npm install --production

# Copy application source code
COPY common/ ./common/
COPY migrations/ ./migrations/
COPY seeds/ ./seeds/
COPY knexfile.js ./
COPY api-gateway/ ./api-gateway/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs

# Change ownership of the app directory
RUN chown -R nodeuser:nodejs /usr/src/app
USER nodeuser

# Expose the port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Set environment variable for production
ENV NODE_ENV=production

# Start the application
CMD ["node", "api-gateway/src/index.js"]
