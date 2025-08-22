# MarketBot - Sistema de Trading Automático
# Deploy para Railway - Produção

FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE $PORT

# Comando de inicialização - executa diretamente o servidor
CMD ["node", "servidor-marketbot-real.js"]
