# CoinBitClub Market Bot V3 - COMPLETE REBUILD - 29/07/2025 16:08
FROM node:18-alpine

# Install dependencies first for better caching
WORKDIR /app

# Debug: List files being copied
RUN echo "=== STARTING DOCKERFILE BUILD ===" 

# Copy package files first
COPY package-clean.json ./package.json
COPY package*.json ./

# Install dependencies
RUN npm install --production --verbose

# Copy ALL application files
COPY . .

# Debug: Verify our main file exists
RUN echo "=== CHECKING FILES ===" && \
    ls -la && \
    echo "=== LOOKING FOR MAIN FILE ===" && \
    ls -la servidor-integrado-completo.js || echo "FILE NOT FOUND!" && \
    echo "=== CONTENTS PREVIEW ===" && \
    head -20 servidor-integrado-completo.js || echo "CANNOT READ FILE!"

# Set up the environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Debug: Final verification before start
RUN echo "=== FINAL CHECK BEFORE START ===" && \
    echo "NODE VERSION:" && node --version && \
    echo "NPM VERSION:" && npm --version && \
    echo "MAIN FILE EXISTS:" && ls -la servidor-integrado-completo.js

# Start the new V3 system
CMD ["node", "servidor-integrado-completo.js"]
