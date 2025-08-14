#!/bin/bash

# GitHub Issue取得・タスク変換スクリプト
# 使用方法: ./scripts/fetch-issue.sh [issue番号]

set -e

# 引数チェック
if [ $# -eq 0 ]; then
    echo "=== 現在のオープンIssue一覧 ==="
    gh issue list --state open --limit 10
    echo ""
    echo "使用方法: $0 [issue番号]"
    echo "例: $0 18"
    exit 0
fi

ISSUE_NUMBER="$1"

echo "Issue #$ISSUE_NUMBER を取得しています..."

# Issueの詳細を取得
ISSUE_DATA=$(gh issue view "$ISSUE_NUMBER" --json title,body,labels,assignees,state)

if [ $? -ne 0 ]; then
    echo "エラー: Issue #$ISSUE_NUMBER が見つかりません"
    exit 1
fi

# GitHub CLIで直接データを抽出（jq不要）
TITLE=$(gh issue view "$ISSUE_NUMBER" --json title --jq '.title')
BODY=$(gh issue view "$ISSUE_NUMBER" --json body --jq '.body // ""')
LABELS=$(gh issue view "$ISSUE_NUMBER" --json labels --jq '.labels[].name' | tr '\n' ',' | sed 's/,$//')
STATE=$(gh issue view "$ISSUE_NUMBER" --json state --jq '.state')

echo ""
echo "=== Issue #$ISSUE_NUMBER 詳細 ==="
echo "タイトル: $TITLE"
echo "状態: $STATE"
echo "ラベル: $LABELS"
echo ""
echo "内容:"
echo "$BODY" | head -10
if [ $(echo "$BODY" | wc -l) -gt 10 ]; then
    echo "... (省略)"
fi
echo ""

# タスクファイル生成
TASK_FILE="tasks/issue-${ISSUE_NUMBER}-tasks.md"
mkdir -p tasks

cat > "$TASK_FILE" << EOF
# Issue #${ISSUE_NUMBER}: ${TITLE}

## 概要
${BODY}

## ラベル
${LABELS}

## 実装タスク
- [ ] Issue内容の詳細確認
- [ ] 必要なファイルの特定
- [ ] 実装方針の決定
- [ ] コード実装
- [ ] テスト実行
- [ ] 動作確認

## 実行コマンド例
\`\`\`bash
# Issue作業開始
npm run start-issue ${ISSUE_NUMBER}

# 作業完了後PR作成  
npm run create-pr "fix: Issue #${ISSUE_NUMBER} ${TITLE}" "Issue #${ISSUE_NUMBER}の対応

Closes #${ISSUE_NUMBER}"
\`\`\`

## Claude Code用プロンプト
\`\`\`
Issue #${ISSUE_NUMBER}の対応をお願いします。

タイトル: ${TITLE}
ラベル: ${LABELS}

内容:
${BODY}
\`\`\`

---
Generated: $(date '+%Y-%m-%d %H:%M:%S')
Source: https://github.com/$(gh repo view --json owner,name --jq '.owner.login + "/" + .name')/issues/${ISSUE_NUMBER}
EOF

echo "✅ タスクファイルを生成しました: $TASK_FILE"
echo ""
echo "次のステップ:"
echo "1. ファイルの内容を確認: cat $TASK_FILE"
echo "2. Claude Codeで作業開始: Issue内容をコピーして実装依頼"
echo "3. 作業完了後: npm run create-pr \"fix: Issue #$ISSUE_NUMBER $TITLE\" \"Issue #${ISSUE_NUMBER}の対応\n\nCloses #${ISSUE_NUMBER}\""
echo ""

# Issue作業開始用ブランチ提案
BRANCH_NAME="issue/${ISSUE_NUMBER}-$(echo "$TITLE" | sed 's/[^a-zA-Z0-9]/-/g' | sed 's/--*/-/g' | tr '[:upper:]' '[:lower:]' | sed 's/^-\|-$//g' | cut -c1-50)"
echo "推奨ブランチ名: $BRANCH_NAME"
echo "ブランチ作成: git checkout -b $BRANCH_NAME"