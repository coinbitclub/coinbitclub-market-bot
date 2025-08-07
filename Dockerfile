#  COINBITCLUB - ANTI-CACHE DOCKERFILE v5.2.0
FROM node:18-alpine

# ANTI-CACHE LAYER
ARG CACHEBUST=1
RUN echo "CACHE_BUST=$CACHEBUST" > /tmp/cachebust

# Sistema
RUN apk update && apk add --no-cache dumb-init

WORKDIR /app

# Dependencies com força
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# Código com timestamp
COPY . .
RUN echo "BUILD_TIME=$(date)" > /app/build.info

# User
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001 && \
    chown -R backend:nodejs /app

USER backend
EXPOSE 3000

# Health check agressivo  
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=2 \
    CMD node -e "const http=require(
'
http
'
);const req=http.request({hostname:
'
localhost
'
,port:process.env.PORT||3000,path:
'
/health
'
,timeout:2000},(res)=>{process.exit(res.statusCode===200?0:1)});req.on(
'
error
'
,()=>process.exit(1));req.on(
'
timeout
'
,()=>process.exit(1));req.end();"

# Start com força
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "main.js"]
