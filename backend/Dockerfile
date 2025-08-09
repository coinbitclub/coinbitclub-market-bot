# DOCKERFILE OTIMIZADO PARA COINBITCLUB TRADING
# Base image with Node.js 18 LTS
FROM node:18-alpine

# Instalar dependências do sistema + curl para Ngrok
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    bash \
    && ln -sf python3 /usr/bin/python

# Instalar Ngrok
RUN curl -s https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz | tar xzf - -C /usr/local/bin

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências primeiro (cache Docker)
COPY package*.json ./

# Limpar cache npm e instalar dependências
RUN npm cache clean --force && \
    npm ci --omit=dev --no-audit --no-fund

# Copiar código da aplicação
COPY . .

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Alterar proprietário dos arquivos
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expor porta
EXPOSE 3000

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"

# Comando de inicialização - SIMPLIFICADO
CMD ["node", "app.js"]