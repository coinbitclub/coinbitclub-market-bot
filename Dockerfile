# Dockerfile (na raiz do projeto)

FROM node:20-alpine

# Diretório de trabalho
WORKDIR /app

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=8080

# Copia package.json e package-lock.json e instala só as deps de produção
COPY package*.json ./
RUN npm ci --omit=dev

# Copia o código-fonte e a pasta de docs (Swagger)
COPY src/ ./src/
COPY docs/ ./docs/

# Healthcheck para Railway / Kubernetes ou qualquer orquestrador
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
  CMD wget -qO- http://localhost:$PORT/health || exit 1

# Exponha a porta configurada
EXPOSE $PORT

# Comando padrão (usa dotenv/config para carregar .env automaticamente)
CMD ["node", "-r", "dotenv/config", "src/index.js"]
