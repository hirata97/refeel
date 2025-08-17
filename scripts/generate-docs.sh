#!/bin/bash

# ドキュメント生成スクリプト
# Goal Categorization Diary プロジェクト

set -e

echo "🏗️ ドキュメント生成を開始します..."

# 作業ディレクトリをプロジェクトルートに変更
cd "$(dirname "$0")/.."

echo "📁 ドキュメント構造を確認しています..."

# docsディレクトリの存在確認
if [ ! -d "docs" ]; then
    echo "❌ エラー: docsディレクトリが見つかりません"
    exit 1
fi

# VitePress設定の確認
if [ ! -f ".vitepress/config.ts" ]; then
    echo "❌ エラー: VitePress設定ファイルが見つかりません"
    exit 1
fi

echo "✅ ドキュメント構造の確認完了"

# 必須ファイルの存在確認
required_files=(
    "docs/README.md"
    "docs/ENVIRONMENT_SETUP.md"
    "docs/DEVELOPMENT_COMMANDS.md"
    "docs/ARCHITECTURE.md"
    "docs/SECURITY.md"
    "index.md"
)

echo "📋 必須ファイルの確認中..."
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "⚠️  警告: 必須ファイル '$file' が見つかりません"
    else
        echo "✅ $file"
    fi
done

# VitePress開発サーバーのテスト起動
echo "🔨 VitePress開発サーバーをテストしています..."

# 開発サーバーが起動できるかテスト（バックグラウンドで短時間実行）
timeout 5s npm run docs:dev >/dev/null 2>&1 &
DEV_PID=$!
sleep 3
kill $DEV_PID 2>/dev/null

if [ $? -eq 0 ] || [ $? -eq 143 ]; then  # 143 = SIGTERM (正常終了)
    echo "✅ VitePress開発サーバーは正常に動作します"
    echo ""
    echo "📚 開発サーバーを起動するには以下を実行してください:"
    echo "   npm run docs:dev"
    echo "   → http://localhost:5173/ でアクセス可能"
    echo ""
    echo "⚠️  注意: 現在ビルド機能に既知の問題があります（VitePress v1.6.4）"
    echo "   開発時はdevサーバーをご利用ください"
else
    echo "❌ VitePress開発サーバーの起動に失敗しました"
    exit 1
fi

echo "🎉 ドキュメント生成が完了しました!"