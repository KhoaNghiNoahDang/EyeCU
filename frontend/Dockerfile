# Stage 1: Build React/Vite app thành static files
FROM node:20-alpine AS builder

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

RUN npm run build

# Stage 2: Serve static files bằng nginx nhỏ gọn
FROM nginx:1.27-alpine

# Xóa config mặc định của nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config đã cấu hình SPA routing + WebSocket proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static files từ stage build
COPY --from=builder /app/.output/public /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
