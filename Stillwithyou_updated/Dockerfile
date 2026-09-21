# Frontend Multi-Stage Dockerfile

# Stage 1: Build React/Vite application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source code
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Serve with Nginx Alpine
FROM nginx:alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Accept backend URL as build argument (e.g. https://swu-backend.onrender.com)
ARG BACKEND_URL=http://backend:5000
ENV BACKEND_URL=${BACKEND_URL}

# Copy custom Nginx configuration template
COPY nginx.conf /etc/nginx/conf.d/nginx.conf.template

# Copy build output from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Substitute env vars into nginx config at container start, then run nginx
CMD sh -c "envsubst '\$BACKEND_URL' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
