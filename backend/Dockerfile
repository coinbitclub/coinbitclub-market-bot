# CoinBitClub Market Bot V3 - FORÇA SISTEMA NOVO - 29/07/2025 16:16
FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package-clean.json ./package.json

# Install dependencies
RUN npm install --production

# Copy our V3 system
COPY servidor-integrado-completo.js ./
COPY sistema-orquestrador-completo.js ./
COPY dashboard-live-data.js ./
COPY controlador-sistema-web.js ./

# Copy all other files
COPY . .

# Remove any old multiservice files to prevent conflicts
RUN rm -f server-multiservice-*.cjs || true
RUN rm -f package-multiservice.json || true

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Force our V3 system to run
CMD ["node", "servidor-integrado-completo.js"]
