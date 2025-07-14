FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 8080

# roda o script "start" do package.json
CMD ["npm", "start"]
