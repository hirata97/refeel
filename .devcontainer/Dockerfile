# GoalCategorizationDiary Development Container
FROM node:20-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    vim \
    bash \
    postgresql-client \
    python3 \
    python3-pip \
    ca-certificates \
    gnupg \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

# Install Docker CLI
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends docker-ce-cli docker-compose-plugin \
    && rm -rf /var/lib/apt/lists/*

# Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update \
    && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# Install Supabase CLI
RUN curl -sL https://github.com/supabase/cli/releases/download/v2.58.5/supabase_linux_amd64.tar.gz | tar xz -C /tmp \
    && mv /tmp/supabase /usr/local/bin/ \
    && rm -rf /tmp/supabase*

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Install uv (Python package manager for Serena) - rootで一時インストール後、vscodeユーザー用にも設定
RUN curl -LsSf https://astral.sh/uv/install.sh | sh \
    && cp -r /root/.local /tmp/.local-backup

# 既存のnodeユーザーにsudo権限を付与（Claude Code用）
RUN apt-get update \
    && apt-get install -y sudo \
    && echo node ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /home/node/.local /home/node/.claude /home/node/.serena \
    && cp -r /tmp/.local-backup/* /home/node/.local/ \
    && chown -R node:node /home/node

ENV PATH="/home/node/.local/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for development)
RUN npm ci --silent && \
    npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs coverage dist

# docker-entrypoint.shへのシンボリックリンク作成（VS Code Dev Container対応）
# VS Codeがフルパスなしでdocker-entrypoint.shを呼び出すため
RUN ln -sf /usr/local/bin/docker-entrypoint.sh /usr/bin/docker-entrypoint.sh

# Expose ports
EXPOSE 5173 3000 8080

# コンテナを実行状態に保つ（VS Code Dev Container用）
CMD ["sleep", "infinity"]
