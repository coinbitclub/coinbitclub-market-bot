# backend/api-gateway/Dockerfile

FROM node:18-alpine

# 1) Defina o diretório de trabalho
WORKDIR /usr/src/app

# 2) Copie o package.json e o package-lock.json
COPY package.json package-lock.json ./

# 3) Instale só as dependências de produção (usa o lockfile)
RUN npm ci --omit=dev

# 4) Copie o restante do código
COPY . .

# 5) Exponha a porta e defina o comando de start
EXPOSE 8080
CMD ["node", "src/index.js"]
