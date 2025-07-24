# Dockerfile para Railway - Versão Simplificada
FROM node:18-alpine

WORKDIR /app

# Copiar todo o diretório backend de uma vez
COPY backend/ ./backend/

# Ir para o diretório do api-gateway
WORKDIR /app/backend/api-gateway

# Instalar dependências
RUN npm install

# Expor porta
EXPOSE $PORT

# Verificar estrutura (debug)
RUN ls -la && ls -la src/ && ls -la ../common/

# Iniciar aplicação
CMD ["npm", "start"]
