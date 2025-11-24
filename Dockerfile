# GoalCategorizationDiary Development Container
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    vim \
    bash \
    postgresql-client \
    docker-cli \
    docker-cli-compose \
    python3 \
    py3-pip

# Install GitHub CLI (not available in Alpine repos, install from release)
RUN curl -sL https://github.com/cli/cli/releases/download/v2.62.0/gh_2.62.0_linux_amd64.tar.gz | tar xz -C /tmp \
    && mv /tmp/gh_2.62.0_linux_amd64/bin/gh /usr/local/bin/ \
    && rm -rf /tmp/gh_2.62.0_linux_amd64

# Install Supabase CLI (match host version)
RUN curl -sL https://github.com/supabase/cli/releases/download/v2.58.5/supabase_linux_amd64.tar.gz | tar xz -C /tmp \
    && mv /tmp/supabase /usr/local/bin/ \
    && rm -rf /tmp/supabase*

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Install uv (Python package manager for Serena)
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

# Set working directory
WORKDIR /app

# Create non-root user for development
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs && \
    addgroup nextjs docker 2>/dev/null || true

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for development)
RUN npm ci --silent && \
    npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs coverage dist /root/.claude /root/.serena

# Set ownership
RUN chown -R nextjs:nodejs /app

# Expose ports
EXPOSE 5173 3000 8080

# Default command
CMD ["npm", "run", "dev"]
