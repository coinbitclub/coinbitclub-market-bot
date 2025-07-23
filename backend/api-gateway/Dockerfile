# backend/api-gateway/Dockerfile

FROM node:18-alpine

# 1) Defina o diretório de trabalho
WORKDIR /usr/src/app

# 2) Copie o package.json e o package-lock.json do api-gateway
COPY ./api-gateway/package*.json ./

# 3) Instale as dependências (sem usar lockfile que pode estar inconsistente)
RUN npm install --production

# 4) Copie os arquivos common primeiro
COPY ./common ./common

# 5) Copie o código do api-gateway
COPY ./api-gateway ./api-gateway

# 6) Mude para o diretório do api-gateway
WORKDIR /usr/src/app/api-gateway

# 5) Exponha a porta e defina o comando de start
EXPOSE 8080
CMD ["node", "src/index.js"]
