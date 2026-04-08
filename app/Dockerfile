# AI-Showcase Application Dockerfile
# Multi-stage build for optimized production image
# Demonstrates best practices for containerization and security

# ============================================
# Stage 1: Build Stage
# ============================================
FROM node:18-alpine AS builder

LABEL maintainer="devops-team@example.com"
LABEL description="AI-Showcase CI/CD Application - Builder Stage"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# ============================================
# Stage 2: Runtime Stage
# ============================================
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /app/node_modules /app/node_modules

# Copy application code
COPY app.js .
COPY package*.json ./

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Set user to nodejs (non-root)
USER nodejs

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port for the application
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "app.js"]

# Metadata
ENV NODE_ENV=production
ENV PORT=3000
