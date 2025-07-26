# Multi-stage Docker build for NPX package distribution
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache libc6-compat git

# Set working directory
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Development stage
FROM base AS development

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Development command
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS build

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# Install production dependencies
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile --production; \
  elif [ -f package-lock.json ]; then npm ci --production; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --production; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Copy built application from build stage
COPY --from=build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=build --chown=nextjs:nodejs /app/public ./public

# Copy scripts and configuration
COPY --from=build --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=build --chown=nextjs:nodejs /app/shared ./shared

# Copy necessary files for NPX package
COPY --from=build --chown=nextjs:nodejs /app/README.md ./
COPY --from=build --chown=nextjs:nodejs /app/CLAUDE.md ./
COPY --from=build --chown=nextjs:nodejs /app/package.json ./

# Create directories for workflow
RUN mkdir -p .linear-cache shared/deployment-plans workspaces
RUN chown -R nextjs:nodejs .linear-cache shared workspaces

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Switch to non-root user
USER nextjs

# Start the application
CMD ["npm", "start"]

# NPX Package stage - for distribution
FROM node:18-alpine AS npx-package

# Install global packages needed for NPX
RUN npm install -g npm@latest

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY README.md ./
COPY CLAUDE.md ./

# Copy scripts and shared resources
COPY scripts ./scripts
COPY shared ./shared

# Copy workflow templates
COPY workspaces ./workspaces

# Make scripts executable
RUN chmod +x scripts/*.sh

# Install dependencies
RUN npm install

# Create NPX entry point
RUN npm link

# Default command for NPX usage
CMD ["node", "scripts/intelligent-agent-generator.js"]