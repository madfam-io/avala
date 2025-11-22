# ================================
# Phase 5: Production Web Dockerfile
# Multi-stage build for Next.js frontend
# ================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
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
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy database package
COPY packages/db ./packages/db

# Generate Prisma Client
WORKDIR /app/packages/db
RUN pnpm exec prisma generate

# Copy web source
WORKDIR /app
COPY apps/web ./apps/web

# Build Next.js app
WORKDIR /app/apps/web

# Set build-time environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN pnpm run build

# Stage 3: Production Runtime
FROM node:20-alpine AS production
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Install production dependencies only
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/

RUN pnpm install --frozen-lockfile --prod

# Copy database package and generate Prisma Client
COPY packages/db ./packages/db
WORKDIR /app/packages/db
RUN pnpm exec prisma generate

# Copy built Next.js application from builder
WORKDIR /app/apps/web
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/package.json ./
COPY --from=builder /app/apps/web/next.config.ts ./

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Next.js
CMD ["pnpm", "start"]
