# Dockerfile for Railway - CoinBitClub Market Bot
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json do api-gateway especificamente
COPY api-gateway/package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY common/ ./common/
COPY migrations/ ./migrations/
COPY seeds/ ./seeds/
COPY knexfile.js ./
COPY api-gateway/src/ ./src/

# Set environment
ENV NODE_ENV=production

# Expose port (Railway uses $PORT)
EXPOSE 3000

# Start the application
CMD ["node", "src/index.js"]
