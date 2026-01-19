# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package.json pnpm-lock.yaml ./

# Setup pnpm and install dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    pnpm install --frozen-lockfile

# Copy source files
COPY tsconfig.json ./
COPY src ./src

# Build application
RUN pnpm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY package.json pnpm-lock.yaml ./

# Setup pnpm and install production dependencies only
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    pnpm install --prod --frozen-lockfile

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Start application
CMD ["pnpm", "start"]
