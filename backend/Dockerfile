FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY main.js ./
EXPOSE 3000
CMD ["node", "main.js"]
