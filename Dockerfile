# Dockerfile Simples para Railway
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache dumb-init

# Definir diretório de trabalho
WORKDIR /app

# Copiar tudo
COPY . .

# Instalar dependências
RUN npm ci --only=production || npm install --production

# Expor porta
EXPOSE 3000

# Comando de inicialização
CMD ["dumb-init", "node", "test-user-api-server.cjs"]
