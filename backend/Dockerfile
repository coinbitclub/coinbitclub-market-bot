# Use Node.js 18 Alpine para uma imagem mais leve
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração do projeto principal
COPY package*.json ./

# Instalar dependências do projeto principal
RUN npm install

# Copiar todo o código fonte
COPY . .

# Navegar para o api-gateway e instalar suas dependências
WORKDIR /app/api-gateway

# Copiar package.json do api-gateway se não foi copiado
COPY api-gateway/package*.json ./

# Instalar dependências do api-gateway
RUN npm install --production

# Expor a porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
