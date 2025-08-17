#!/bin/bash

# Claude Code自動PR作成スクリプト
# 使用方法: ./scripts/create-pr.sh "PR title" "PR description"

set -e

# 引数チェック
if [ $# -lt 1 ]; then
    echo "使用方法: $0 \"PR title\" [\"PR description\"]"
    echo "例: $0 \"feat: ユーザー認証機能を追加\" \"ログイン・ログアウト機能を実装しました\""
    exit 1
fi

PR_TITLE="$1"
PR_DESCRIPTION="${2:-}"

# 現在のブランチ名を取得
CURRENT_BRANCH=$(git branch --show-current)

# mainブランチにいる場合は警告
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo "警告: mainブランチにいます。フィーチャーブランチから実行することを推奨します。"
    read -p "続行しますか？ (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "現在のブランチ: $CURRENT_BRANCH"

# 変更があるかチェック
if git diff-index --quiet HEAD --; then
    echo "コミットする変更がありません。"
    
    # すでにリモートブランチが存在するかチェック
    if git ls-remote --exit-code --heads origin "$CURRENT_BRANCH" >/dev/null 2>&1; then
        echo "リモートブランチが存在します。PRを作成します..."
    else
        echo "変更もリモートブランチもありません。終了します。"
        exit 0
    fi
else
    echo "変更を検出しました。コミットしてプッシュします..."
    
    # 変更をステージング
    git add .
    
    # コミット
    git commit -m "$PR_TITLE

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    
    echo "コミット完了: $PR_TITLE"
fi

# リモートにプッシュ
echo "リモートにプッシュしています..."
git push origin "$CURRENT_BRANCH"

# PR作成
echo "プルリクエストを作成しています..."

# Issue番号を検出（ブランチ名、PR_TITLE、PR_DESCRIPTIONから）
ISSUE_NUMBER=""

# 1. ブランチ名からIssue番号を検出（例: issue/16-auth, feature/issue-16）
if [[ "$CURRENT_BRANCH" =~ issue[/-]([0-9]+) ]]; then
    ISSUE_NUMBER="${BASH_REMATCH[1]}"
# 2. PR_TITLEからIssue番号を検出（例: "feat: Issue #16"）
elif [[ "$PR_TITLE" =~ Issue[[:space:]]*#([0-9]+) ]]; then
    ISSUE_NUMBER="${BASH_REMATCH[1]}"
# 3. PR_DESCRIPTIONからIssue番号を検出
elif [[ "$PR_DESCRIPTION" =~ Issue[[:space:]]*#([0-9]+) ]]; then
    ISSUE_NUMBER="${BASH_REMATCH[1]}"
fi

# Closesセクションを作成
CLOSES_SECTION=""
if [ -n "$ISSUE_NUMBER" ]; then
    CLOSES_SECTION="

Closes #$ISSUE_NUMBER"
    echo "📋 Issue #$ISSUE_NUMBER を自動クローズ設定に追加しました"
fi

# PR本文を作成
PR_BODY="## 概要
${PR_DESCRIPTION:-$PR_TITLE}

## 変更内容
$(git log main.."$CURRENT_BRANCH" --oneline --pretty=format:"- %s" | head -10)

## テスト実行
- [ ] npm run type-check
- [ ] npm run lint
- [ ] npm run test:unit
- [ ] 動作確認

🤖 Generated with [Claude Code](https://claude.ai/code)$CLOSES_SECTION"

# PRを作成（mainブランチに向けて）
gh pr create \
    --title "$PR_TITLE" \
    --body "$PR_BODY" \
    --base main \
    --head "$CURRENT_BRANCH"

echo "✅ プルリクエストが作成されました！"

# 作成されたPRのURLを表示
PR_URL=$(gh pr view --json url --jq .url)
echo "PR URL: $PR_URL"

# Issue自動クローズ処理（mainブランチ向けPRの場合）
if [ -n "$ISSUE_NUMBER" ]; then
    echo ""
    echo "🔒 Issue #$ISSUE_NUMBER の自動クローズを実行中..."
    
    if ./scripts/close-linked-issues.sh "$PR_BODY"; then
        echo "✅ Issue自動クローズが完了しました"
    else
        echo "⚠️  Issue自動クローズでエラーが発生しました（手動でクローズしてください）"
    fi
fi