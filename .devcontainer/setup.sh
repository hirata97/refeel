#!/bin/bash

# VSCode Dev Container Setup Script
set -e

echo "🚀 Starting GoalCategorizationDiary development environment setup..."

# 環境変数の設定
export NODE_ENV=development

# 権限確認
echo "📋 Checking permissions..."
whoami
pwd
ls -la

# Node.js & npm バージョン確認
echo "📦 Node.js environment:"
node --version
npm --version

# 依存関係のインストール
echo "📥 Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm ci --silent
else
    echo "node_modules already exists, skipping npm install"
fi

# TypeScript設定の確認
echo "🔧 Verifying TypeScript configuration..."
if [ -f "tsconfig.json" ]; then
    npx tsc --noEmit --skipLibCheck || echo "⚠️ TypeScript check found issues (non-critical)"
fi

# ESLint設定の確認
echo "🧹 Verifying ESLint configuration..."
if [ -f "eslint.config.js" ]; then
    npm run lint --silent || echo "⚠️ ESLint found issues (will be fixed on save)"
fi

# Playwrightブラウザのインストール (optional)
echo "🎭 Installing Playwright browsers (background)..."
npx playwright install --with-deps > /dev/null 2>&1 &

# Git設定の確認
echo "🔐 Setting up Git configuration..."
if [ ! -f ~/.gitconfig ]; then
    git config --global user.name "Dev Container User"
    git config --global user.email "dev@container.local"
    git config --global init.defaultBranch main
fi

# 作業ディレクトリの準備
echo "📁 Preparing workspace directories..."
mkdir -p {logs,coverage,dist,tmp}

# 環境ファイルの確認
echo "⚙️ Checking environment configuration..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "📋 Created .env from .env.example"
    else
        echo "⚠️ No .env file found. Please create one for Supabase configuration."
    fi
fi

# VSCode設定の適用
echo "🎨 Applying VSCode workspace settings..."
mkdir -p .vscode
cat > .vscode/settings.json << 'EOF'
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.eslint.fixAll": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "vue.codeActions.enabled": true,
  "files.associations": {
    "*.vue": "vue"
  }
}
EOF

# タスク定義
cat > .vscode/tasks.json << 'EOF'
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "dev",
      "type": "npm",
      "script": "dev",
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "echo": true,
        "reveal": "always",
        "panel": "new"
      },
      "problemMatcher": ["$tsc", "$eslint-stylish"]
    },
    {
      "label": "build",
      "type": "npm",
      "script": "build",
      "group": "build"
    },
    {
      "label": "test",
      "type": "npm",
      "script": "test:unit",
      "group": "test"
    },
    {
      "label": "lint",
      "type": "npm",
      "script": "lint",
      "group": "build"
    }
  ]
}
EOF

echo "✅ Setup complete!"
echo ""
echo "🎯 Available commands:"
echo "  npm run dev      - Start development server"
echo "  npm run build    - Build for production"  
echo "  npm run test:unit - Run unit tests"
echo "  npm run lint     - Run ESLint"
echo ""
echo "🌐 Ports:"
echo "  5173 - Vite dev server"
echo "  3000 - Preview server"
echo "  54322 - PostgreSQL database"
echo "  3001 - Supabase Studio"
echo ""
echo "🚀 Ready for development!"