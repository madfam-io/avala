# ================================
# Phase 5: Production API Dockerfile
# Multi-stage build for NestJS backend
# ================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy database package
COPY packages/db ./packages/db

# Generate Prisma Client
WORKDIR /app/packages/db
RUN pnpm exec prisma generate

# Copy API source
WORKDIR /app
COPY apps/api ./apps/api

# Build API
WORKDIR /app/apps/api
RUN pnpm run build

# Stage 3: Production Runtime
FROM node:20-alpine AS production
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Install production dependencies only
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/

RUN pnpm install --frozen-lockfile --prod

# Copy database package and generate Prisma Client
COPY packages/db ./packages/db
WORKDIR /app/packages/db
RUN pnpm exec prisma generate

# Copy built application from builder
WORKDIR /app/apps/api
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/main.js"]
