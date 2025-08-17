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

# VitePressビルドの実行
echo "🔨 VitePressサイトをビルドしています..."
npm run docs:build

if [ $? -eq 0 ]; then
    echo "✅ ドキュメントビルド完了"
    echo "📦 出力ディレクトリ: .vitepress/dist"
    echo ""
    echo "🌐 プレビューを開始するには以下を実行してください:"
    echo "   npm run docs:preview"
    echo ""
    echo "📚 開発サーバーを起動するには以下を実行してください:"
    echo "   npm run docs:dev"
else
    echo "❌ ドキュメントビルドに失敗しました"
    exit 1
fi

echo "🎉 ドキュメント生成が完了しました!"