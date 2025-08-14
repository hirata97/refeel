#!/bin/bash

# Issue作業開始スクリプト
# 使用方法: ./scripts/start-issue.sh [issue番号]

set -e

if [ $# -eq 0 ]; then
    echo "使用方法: $0 [issue番号]"
    echo "例: $0 18"
    exit 1
fi

ISSUE_NUMBER="$1"

echo "Issue #$ISSUE_NUMBER の作業を開始します..."

# Issueの詳細を取得
TITLE=$(gh issue view "$ISSUE_NUMBER" --json title --jq '.title')
LABELS=$(gh issue view "$ISSUE_NUMBER" --json labels --jq '.labels[].name' | tr '\n' ',' | sed 's/,$//')

if [ $? -ne 0 ]; then
    echo "エラー: Issue #$ISSUE_NUMBER が見つかりません"
    exit 1
fi

# ブランチ名生成
BRANCH_NAME="issue/${ISSUE_NUMBER}-$(echo "$TITLE" | sed 's/[^a-zA-Z0-9]/-/g' | sed 's/--*/-/g' | tr '[:upper:]' '[:lower:]' | sed 's/^-\|-$//g' | cut -c1-30)"

echo "ブランチ名: $BRANCH_NAME"

# 現在のブランチを確認
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
    echo "developブランチに切り替えます..."
    git checkout develop
    git pull origin develop
fi

# 新しいブランチを作成
echo "新しいブランチを作成します: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME"

# タスクファイル生成（fetch-issueスクリプトを呼び出し）
./scripts/fetch-issue.sh "$ISSUE_NUMBER" > /dev/null

echo ""
echo "✅ Issue #$ISSUE_NUMBER の作業準備が完了しました！"
echo ""
echo "=== 次のステップ ==="
echo "1. タスク内容確認: cat tasks/issue-${ISSUE_NUMBER}-tasks.md"
echo "2. Claude Codeで実装作業"
echo "3. 作業完了後: npm run create-pr \"fix: Issue #$ISSUE_NUMBER $TITLE\" \"Issue #${ISSUE_NUMBER}の対応\""
echo ""

# Issue内容をClipboardにコピー（wsl-openがある場合）
if command -v clip.exe &> /dev/null; then
    BODY=$(gh issue view "$ISSUE_NUMBER" --json body --jq '.body // ""')
    echo "Issue #${ISSUE_NUMBER}の対応をお願いします。

タイトル: ${TITLE}
ラベル: ${LABELS}

内容:
${BODY}" | clip.exe
    echo "💡 Issue内容がクリップボードにコピーされました（Claude Codeに貼り付けてください）"
fi

# Assigneeに設定
gh issue edit "$ISSUE_NUMBER" --add-assignee @me
echo "Issue #$ISSUE_NUMBER にアサインしました"