#!/bin/bash

# 連続Issue自動実装スクリプト
# 全てのオープンIssueを順次自動実装します

set -e

echo "🔄 連続Issue自動実装を開始します..."

# オープンIssueの一覧を取得
OPEN_ISSUES=$(gh issue list --state open --json number --jq '.[].number' 2>/dev/null || echo "")

if [ -z "$OPEN_ISSUES" ]; then
    echo "✅ 実装すべきオープンIssueはありません"
    exit 0
fi

# Issue数をカウント
ISSUE_COUNT=$(echo "$OPEN_ISSUES" | wc -l)
echo "📊 実装対象Issue数: $ISSUE_COUNT"

CURRENT_INDEX=1
SUCCESS_COUNT=0
FAILED_COUNT=0

# 各Issueを順次処理
for ISSUE_NUMBER in $OPEN_ISSUES; do
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔄 Progress: [$CURRENT_INDEX/$ISSUE_COUNT] Issue #$ISSUE_NUMBER"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 個別Issue実装を実行
    if ./scripts/auto-issue.sh "$ISSUE_NUMBER"; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        echo "✅ Issue #$ISSUE_NUMBER の実装が完了しました"
        
        # 成功後の待機時間（GitHub API制限対策）
        echo "⏳ 次のIssue処理まで30秒待機..."
        sleep 30
    else
        FAILED_COUNT=$((FAILED_COUNT + 1))
        echo "❌ Issue #$ISSUE_NUMBER の実装に失敗しました"
        
        # 失敗時はログに記録して継続
        echo "$(date): Issue #$ISSUE_NUMBER 実装失敗" >> auto-cycle-errors.log
        
        # 失敗後の待機時間
        echo "⏳ エラー後の待機時間: 10秒..."
        sleep 10
    fi
    
    CURRENT_INDEX=$((CURRENT_INDEX + 1))
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 連続実装が完了しました！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 実行結果:"
echo "   ✅ 成功: $SUCCESS_COUNT Issues"
echo "   ❌ 失敗: $FAILED_COUNT Issues"
echo "   📈 成功率: $(( SUCCESS_COUNT * 100 / ISSUE_COUNT ))%"

if [ $FAILED_COUNT -gt 0 ]; then
    echo ""
    echo "⚠️  失敗したIssueのログ: auto-cycle-errors.log"
    echo "   手動での確認と修正を推奨します"
fi

echo ""
echo "✨ 全ての自動実装処理が完了しました"