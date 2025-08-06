# 🚀 COINBITCLUB MARKET BOT - DOCKERFILE PRODUCTION
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk update && apk add --no-cache dumb-init

# Criar diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependências do backend
COPY backend/package*.json ./

# Instalar dependências de produção
RUN npm ci --omit=dev --no-audit --no-fund

# Copiar código da aplicação do backend
COPY backend/ .

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001 && \
    chown -R backend:nodejs /app

# Definir usuário
USER backend

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http=require('http');const options={hostname:'localhost',port:process.env.PORT||3000,path:'/health',timeout:2000};const req=http.request(options,(res)=>{if(res.statusCode===200){process.exit(0)}else{process.exit(1)}});req.on('error',()=>process.exit(1));req.on('timeout',()=>process.exit(1));req.end();"

# Comando de inicialização
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "main.js"]
