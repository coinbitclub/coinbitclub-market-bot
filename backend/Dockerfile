# CoinBitClub Market Bot V3 - Sistema Integrado
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package-clean.json ./package.json

# Install dependencies
RUN npm ci --only=production --no-audit --no-fund

# Copy the integrated system files
COPY servidor-integrado-completo.js ./
COPY sistema-orquestrador-completo.js ./
COPY controlador-sistema-web.js ./
COPY dashboard-live-data.js ./

# Add nodejs user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to nodejs user
USER nodejs

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "servidor-integrado-completo.js"]
