FROM node:20-alpine
RUN apk add --no-cache tini
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY .env .env

CMD [\"tini\",\"--\",\"node\",\"-r\",\"dotenv/config\",\"src/index.js\"]
