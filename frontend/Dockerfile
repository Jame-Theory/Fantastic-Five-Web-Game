FROM node:23-alpine AS builder

WORKDIR /app
COPY . .

RUN npm install && npm run build

FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html