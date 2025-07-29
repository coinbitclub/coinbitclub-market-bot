# CoinBitClub Market Bot V3 - FORCE NEW SYSTEM - 29/07/2025 16:22
FROM node:18-alpine

WORKDIR /app

# Remove ANY old files first
RUN rm -rf * || true

# Copy our package file
COPY package-clean.json ./package.json

# Install dependencies
RUN npm install --production

# Copy ONLY our V3 system files
COPY app.js ./
COPY sistema-orquestrador-completo.js ./
COPY dashboard-live-data.js ./
COPY controlador-sistema-web.js ./

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start our V3 system ONLY
CMD ["node", "app.js"]
