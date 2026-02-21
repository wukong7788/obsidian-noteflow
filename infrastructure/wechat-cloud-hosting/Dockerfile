# Use Node.js official image
FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Cloud Hosting uses port 80 by default (recommended)
EXPOSE 80

CMD [ "npm", "start" ]
