# GoalCategorizationDiary Development Container
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    vim \
    bash \
    postgresql-client

# Set working directory
WORKDIR /app

# Create non-root user for development
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for development)
RUN npm ci --silent && \
    npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs coverage dist

# Set ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose ports
EXPOSE 5173 3000 8080

# Default command
CMD ["npm", "run", "dev"]