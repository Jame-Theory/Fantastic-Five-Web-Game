# FROM node:23-alpine AS builder
# WORKDIR /app
# COPY . .
# RUN npm install && npm run build

# FROM alpine
# COPY --from=builder /app/dist /dist

# Build Stage
# Build Stage
FROM node:23-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# Serve Stage
FROM nginx:alpine

# Clean default nginx html
RUN rm -rf /usr/share/nginx/html/*

# Copy built React app into Nginx html folder
COPY --from=builder /app/dist /usr/share/nginx/html