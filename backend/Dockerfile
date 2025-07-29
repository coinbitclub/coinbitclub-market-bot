# CoinBitClub Market Bot V3 - Dockerfile Ultra Simples - FORCE REBUILD 29/07/2025 16:06
FROM node:18-alpine

WORKDIR /app

# Copiar tudo
COPY . .

# Renomear package para o correto
RUN mv package-clean.json package.json

# Instalar dependências
RUN npm install --production

# Expor porta
EXPOSE 3000

# Comando de inicialização - NOVO SISTEMA V3
CMD ["node", "servidor-integrado-completo.js"]
