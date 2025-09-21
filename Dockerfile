# Production container to serve built assets
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build:client:prod && npm run postbuild

FROM node:20-alpine AS runner
WORKDIR /app
RUN npm i -g http-server@14.1.1
COPY --from=builder /app/public ./public
EXPOSE 8080
CMD ["http-server", "public", "-p", "8080", "-c", "604800", "--cors", "--gzip", "--brotli"]

