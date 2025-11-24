#!/bin/bash
# Dev Container起動時の自動セットアップスクリプト

set -e

echo "🔄 Checking Supabase status..."

if supabase status > /dev/null 2>&1; then
  echo "✅ Supabase already running"
else
  echo "🚀 Starting Supabase..."
  supabase start
  echo "✅ Supabase started"
fi

echo ""
echo "🎉 Dev Container is ready!"
echo "   Run 'npm run dev' to start development server"
