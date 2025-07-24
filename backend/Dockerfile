# Railway Optimized Dockerfile for CoinBitClub Market Bot
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    bash \
    curl \
    dumb-init \
    postgresql-client

# Set working directory
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./
COPY api-gateway/package*.json ./api-gateway/

# Install dependencies
RUN npm install --production --silent

# Copy application code
COPY common/ ./common/
COPY migrations/ ./migrations/
COPY seeds/ ./seeds/
COPY knexfile.js ./
COPY api-gateway/ ./api-gateway/
COPY start-railway.sh ./

# Make script executable
RUN chmod +x start-railway.sh

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs

# Change ownership
RUN chown -R nodeuser:nodejs /usr/src/app
USER nodeuser

# Expose port
EXPOSE 8080

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["./start-railway.sh"]
