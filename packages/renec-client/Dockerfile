# RENEC Harvest Worker Dockerfile
# Uses Playwright for browser-based scraping of CONOCER data

FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package files for dependency resolution
COPY packages/renec-client/package.json ./packages/renec-client/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @avala/renec-client

# Copy source code
COPY packages/renec-client ./packages/renec-client/

# Build the package
RUN cd packages/renec-client && pnpm build

# Create data directory
RUN mkdir -p /app/data/renec

# Set environment
ENV NODE_ENV=production
ENV HARVEST_OUTPUT_DIR=/app/data/renec
ENV HARVEST_HEADLESS=true

# Run the CLI
CMD ["node", "packages/renec-client/dist/cli.js"]
