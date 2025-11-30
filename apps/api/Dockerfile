# Production Dockerfile for Avala API (NestJS)
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Build stage - install deps and build everything
FROM base AS builder

# Copy all package files first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/renec-client/package.json ./packages/renec-client/
COPY packages/client/package.json ./packages/client/
COPY packages/assessment-engine/package.json ./packages/assessment-engine/
COPY packages/document-engine/package.json ./packages/document-engine/

# Install all dependencies with flat node_modules for production
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Copy all source code
COPY . .

# Generate Prisma client using pnpm exec
WORKDIR /app
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" pnpm --filter @avala/db exec prisma generate

# Build packages and API
WORKDIR /app
RUN pnpm --filter @avala/db build || true
RUN pnpm --filter @avala/renec-client build || true
RUN pnpm --filter @avala/client build || true
RUN pnpm --filter api build

# Production image
FROM base AS runner
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

WORKDIR /app

# Copy built application and all dependencies
# NestJS needs node_modules at runtime, copy from builder
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages/db ./packages/db

USER nestjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/v1/health || exit 1

CMD ["node", "dist/main.js"]
