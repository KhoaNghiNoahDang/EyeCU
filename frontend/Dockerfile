# EyeCU — Multi-stage Docker build
# Stage 1: Build the Vite/TanStack Start static assets
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* bun.lock* ./
RUN npm install --no-audit --no-fund --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Serve the built assets via Nginx
FROM nginx:1.27-alpine AS runner
RUN rm -rf /usr/share/nginx/html/*
# TanStack Start (Cloudflare target) emits to .output/public
COPY --from=build /app/.output/public /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
