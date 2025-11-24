#!/bin/bash
# Dev Container起動時の自動セットアップスクリプト

set -e

echo "🔧 Fixing permissions..."
sudo chown -R node:node /home/node/.claude /home/node/.serena 2>/dev/null || true

echo "🔄 Checking Supabase status..."

if supabase status > /dev/null 2>&1; then
  echo "✅ Supabase already running"
else
  echo "🚀 Starting Supabase..."
  supabase start
  echo "✅ Supabase started"
fi

echo ""
echo "🔄 Setting up Serena MCP server for Claude Code..."

# Serena MCPサーバーが未登録の場合のみ追加
if ! claude mcp list 2>/dev/null | grep -q "serena"; then
  echo "📦 Adding Serena MCP server..."
  claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project "$(pwd)" || true
  echo "✅ Serena MCP server added"
else
  echo "✅ Serena MCP server already configured"
fi

echo ""
echo "🎉 Dev Container is ready!"
echo ""
echo "Available commands:"
echo "   npm run dev     - Start development server"
echo "   claude          - Start Claude Code CLI"
echo "   supabase status - Check Supabase status"
