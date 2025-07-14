# Dockerfile
FROM node:18-alpine

# Define o diretório de trabalho
WORKDIR /usr/src/app

# Copia package.json e package-lock.json e instala dependências
COPY package*.json ./
RUN npm ci

# Copia todo o restante do código (incluindo src/)
COPY . .

# Expõe a porta (caso use outra, ajuste aqui)
EXPOSE 8080
CMD ["npm", "start"]
