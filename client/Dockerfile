# client/Dockerfile
FROM node:16

WORKDIR /usr/src/app

# Copy only package files, install deps
COPY package*.json ./
RUN npm install

# Copy the rest of your React app
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
