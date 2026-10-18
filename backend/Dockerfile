# Multi-stage Dockerfile for PharmaStock NestJS Backend

# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies needed for compiling native packages
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --omit=dev

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Keamanan: Buat user non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
COPY --chown=nestjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

USER nestjs

EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main"]
