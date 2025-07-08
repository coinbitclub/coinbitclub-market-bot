FROM node:20-alpine
RUN apk add --no-cache tini
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend ./
CMD ["tini","--","node","-r","dotenv/config","src/index.js"]
