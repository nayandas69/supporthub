# Production-ready Dockerfile for SupportHub Discord Bot
# Optimized multi-stage build with Supabase integration
# Compatible with Railway, Render, VPS, and Docker deployments

# Stage 1: Dependencies builder
FROM node:20-alpine AS builder

# Install production dependencies only
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies with clean cache for smaller image
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Production runtime
FROM node:20-alpine

# Metadata labels for container management
LABEL maintainer="nayandas69"
LABEL description="Professional Discord Support Ticket Bot with Supabase Database"
LABEL version="1.0.0"

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application source code
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs src ./src

# Set production environment
ENV NODE_ENV=production

# Switch to non-root user for security
USER nodejs

# Expose health check port
EXPOSE 3000

# Health check endpoint for monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the Discord bot
CMD ["node", "src/index.js"]
