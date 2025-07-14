FROM node:18

# define o diretório de trabalho
WORKDIR /usr/src/app

# copia package.json e instala dependências
COPY package*.json ./
RUN npm ci --only=production

# copia todo o resto do código
COPY . .

# expõe a porta que você usa (confira se bate com process.env.PORT)
EXPOSE 8080

# ajusta o comando de start para o entrypoint correto
CMD ["node", "backend/api-gateway/index.js"]
