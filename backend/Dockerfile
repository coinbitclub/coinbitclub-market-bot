FROM node:18-alpine

# Install dependencies
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install root dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy common modules
COPY common/ ./common/

# Copy api-gateway
COPY api-gateway/ ./api-gateway/

# Set working directory to api-gateway
WORKDIR /app/api-gateway

# Install api-gateway dependencies
RUN npm ci --only=production && npm cache clean --force

# Create user and set ownership
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Start command
CMD ["dumb-init", "node", "src/index.js"]
