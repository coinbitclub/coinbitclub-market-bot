# CoinBitClub Market Bot V3 - Dockerfile Ultra Simples
FROM node:18-alpine

WORKDIR /app

# Copiar tudo
COPY . .

# Renomear package
RUN mv package-clean.json package.json

# Instalar dependências
RUN npm install --production

# Expor porta
EXPOSE 3000

# Comando de inicialização
CMD ["node", "servidor-integrado-completo.js"]
