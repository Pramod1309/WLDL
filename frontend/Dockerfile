# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Production stage - Serve with nginx
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/build /usr/share/nginx/html

# Try to copy nginx config; if not present, create a default
COPY deploy/nginx/nginx.conf /etc/nginx/conf.d/default.conf

RUN if [ ! -f /etc/nginx/conf.d/default.conf ]; then \
 echo 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf; \
fi

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
