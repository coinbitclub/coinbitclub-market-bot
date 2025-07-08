FROM node:20-slim

# instala tini
RUN apt-get update \
 && apt-get install -y --no-install-recommends tini \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# instala dependências em prod
COPY package*.json ./
RUN npm ci --omit=dev

# copia código e docs
COPY src   ./src
COPY docs  ./docs
COPY .env  ./.env

# usa tini como init e carrega dotenv
ENTRYPOINT ["tini","--"]
CMD ["node","-r","dotenv/config","src/index.js"]
