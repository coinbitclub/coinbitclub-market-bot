# Dockerfile
FROM node:18-alpine

# tiny init to forward signals properly
RUN apk add --no-cache tini

WORKDIR /app

# Só dependências de produção
COPY package*.json ./
RUN npm ci --omit=dev

# Código
COPY . .

# Variáveis de ambiente já declaradas no Railway
ENV NODE_ENV=production

# Porta que o app vai escutar (Railway injeta via env PORT)
EXPOSE 8080

# Usa tini para ser PID 1 e repassar SIGTERM para o Node
ENTRYPOINT ["/sbin/tini", "--"]

# Comando final
CMD ["node", "-r", "dotenv/config", "src/index.js"]
