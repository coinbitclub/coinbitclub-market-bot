# CoinbitClub Market Bot - Railway Dockerfile
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências globais necessárias
RUN npm install -g pm2

# Copiar todos os arquivos do projeto
COPY . .

# Instalar dependências do frontend
WORKDIR /app/coinbitclub-frontend-premium
RUN npm install
RUN npm run build

# Instalar dependências do backend API Gateway
WORKDIR /app/backend/api-gateway
RUN npm install

# Voltar para raiz
WORKDIR /app

# Criar script de inicialização
RUN echo '#!/bin/sh\n\
echo "🚀 Iniciando CoinbitClub Market Bot..."\n\
cd /app/backend/api-gateway\n\
echo "📡 Iniciando API Gateway na porta $PORT"\n\
npm start' > start.sh && chmod +x start.sh

# Expor porta
EXPOSE $PORT

# Comando para iniciar
CMD ["./start.sh"]
COPY package*.json ./

# Instalar dependências do projeto raiz (se houver)
RUN npm install --omit=dev 2>/dev/null || echo "No root package.json found"

# === BACKEND API GATEWAY ===
# Copiar backend completo
COPY backend ./backend

# Instalar dependências do API Gateway
WORKDIR /app/backend/api-gateway
RUN npm install --omit=dev

# === FRONTEND ===
WORKDIR /app
COPY coinbitclub-frontend-premium ./coinbitclub-frontend-premium

# Instalar dependências do frontend
WORKDIR /app/coinbitclub-frontend-premium
RUN npm install --omit=dev
RUN npm run build

# === CONFIGURAÇÃO FINAL ===
WORKDIR /app

# Copiar scripts adicionais
COPY scripts ./scripts 2>/dev/null || echo "No scripts directory found"

# Expor portas
EXPOSE $PORT
EXPOSE 8081

# Script de inicialização
RUN echo '#!/bin/sh\n\
echo "🚀 Starting CoinbitClub Market Bot..."\n\
cd /app/backend/api-gateway\n\
echo "📡 Starting API Gateway on port ${PORT:-8081}..."\n\
npm start' > /app/start.sh && chmod +x /app/start.sh

# Comando principal
CMD ["/app/start.sh"]
