#!/bin/bash

# PR作成後にリンクされたIssueを自動クローズするスクリプト
# Usage: ./scripts/close-linked-issues.sh "PR本文"

set -e

PR_BODY="$1"

if [ -z "$PR_BODY" ]; then
    echo "使用方法: $0 \"PR本文\""
    exit 1
fi

echo "🔍 PR本文からIssue番号を検索中..."

# Closes, Fixes, ResolvesキーワードからIssue番号を抽出
ISSUE_NUMBERS=$(echo "$PR_BODY" | grep -iE "(closes?|fixes?|resolves?) #[0-9]+" | grep -oE "#[0-9]+" | sed 's/#//' | sort -u)

if [ -z "$ISSUE_NUMBERS" ]; then
    echo "📝 クローズ対象のIssueが見つかりませんでした"
    exit 0
fi

echo "📋 発見されたIssue番号: $(echo $ISSUE_NUMBERS | tr '\n' ' ')"

# 各Issueをクローズ
for ISSUE_NUMBER in $ISSUE_NUMBERS; do
    echo "🔒 Issue #$ISSUE_NUMBER をクローズ中..."
    
    if gh issue close "$ISSUE_NUMBER" --comment "✅ Issue自動クローズ実行

**実装完了:**
- PRでの実装により解決されました
- ブランチ: $(git branch --show-current)
- コミット: $(git rev-parse --short HEAD)

🤖 Auto-closed by create-pr script"; then
        echo "✅ Issue #$ISSUE_NUMBER を正常にクローズしました"
    else
        echo "❌ Issue #$ISSUE_NUMBER のクローズに失敗しました"
    fi
done

echo "🎉 Issue自動クローズ処理が完了しました"