# CoinBitClub Market Bot V3 - ÚLTIMA TENTATIVA - 29/07/2025 16:25
FROM node:18-alpine

WORKDIR /app

# Limpar tudo primeiro
RUN rm -rf /app/* || true

# Copiar package
COPY package-clean.json ./package.json

# Instalar dependências
RUN npm install --production

# Copiar APENAS o arquivo final
COPY main.js ./

# Ambiente
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Executar arquivo final
CMD ["node", "main.js"]
