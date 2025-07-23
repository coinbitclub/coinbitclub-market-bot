# Dockerfile para Railway - CoinbitClub Market Bot Backend
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Criar diretório de trabalho
WORKDIR /app

# Copiar package.json do backend raiz
COPY backend/package*.json ./

# Instalar dependências do workspace raiz
RUN npm install --production

# Copiar todo o código do backend
COPY backend/ ./

# Instalar dependências dos microserviços
WORKDIR /app/api-gateway
RUN npm install --production

WORKDIR /app/admin-panel  
RUN npm install --production

# Voltar ao diretório raiz
WORKDIR /app

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Definir permissões
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expor portas
EXPOSE 8081

# Comando de inicialização
CMD ["sh", "-c", "cd api-gateway && npm start"]
