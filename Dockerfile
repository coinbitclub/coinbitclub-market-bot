# Dockerfile (na raiz do projeto)
FROM node:20-alpine

# instala o tini para PID 1 e proper signal handling
RUN apk add --no-cache tini

WORKDIR /app

# copia só package.json e package-lock.json para acelerar cache
COPY package*.json ./

# instala dependências de produção
RUN npm ci --omit=dev

# copia o seu código-fonte
COPY src ./src

# expõe a porta (opcional, Railway detecta automaticamente)
# EXPOSE 8080

# inicia com dotenv/config para ler ENV vars configuradas no Railway
CMD ["tini", "--", "node", "-r", "dotenv/config", "src/index.js"]
