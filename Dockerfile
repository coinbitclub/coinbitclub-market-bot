# Dockerfile (na raiz do projeto)

FROM node:20-alpine

# Defina diretório de trabalho
WORKDIR /app

# Copia package.json e package-lock.json e instala só as deps de produção
COPY package*.json ./
RUN npm ci --omit=dev

# Copia o código e a pasta de docs (Swagger)
COPY src   ./src
COPY docs  ./docs

# Expõe a porta (opcional, o Railway detecta automaticamente)
EXPOSE 8080

# Comando padrão
CMD ["node", "-r", "dotenv/config", "src/index.js"]
