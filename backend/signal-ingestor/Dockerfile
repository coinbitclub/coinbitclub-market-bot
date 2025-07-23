# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Bundle app source
COPY . .

# Make port 9001 available to the world outside this container
EXPOSE 9001

# Define the command to run your app
CMD [ "node", "src/index.js" ]
