# Stage 1: Build React/Vite app thành static files
FROM node:22-alpine AS builder

WORKDIR /app

# Cài dependencies (dùng npm vì đã có package-lock.json)
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# Copy source và build
COPY . .

# Truyền API URL vào lúc build (dùng host.docker.internal để từ browser truy cập backend)
ARG VITE_API_URL=http://localhost:8000/api
ARG VITE_WS_URL=ws://localhost:8000
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV NITRO_PRESET=node-server

RUN npm run build

# Stage 2: Run Nitro server
FROM node:22-alpine

WORKDIR /app

# Copy output từ stage build
COPY --from=builder /app/.output /app/.output

EXPOSE 8080
ENV PORT=8080
ENV HOST=0.0.0.0
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=8080

CMD ["node", ".output/server/index.mjs"]
