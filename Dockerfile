FROM node:18-alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

# Expõe a porta que o Express está ouvindo
EXPOSE 8080

# Comando de inicialização
CMD ["npm", "start"]
