#!/bin/bash

# Issue管理監査スクリプト
# 定期的な実装状況確認とIssue整理を自動化

set -e

echo "🔍 Issue管理監査を開始します..."

# 色付きログ関数
log_info() { echo -e "\033[36m[INFO]\033[0m $1"; }
log_warn() { echo -e "\033[33m[WARN]\033[0m $1"; }
log_error() { echo -e "\033[31m[ERROR]\033[0m $1"; }
log_success() { echo -e "\033[32m[SUCCESS]\033[0m $1"; }

# 1. オープンIssue一覧の取得
log_info "オープンIssue一覧を取得中..."
OPEN_ISSUES=$(gh issue list --state open --json number,title,labels,updatedAt --limit 50)

# 2. 長期間更新されていないIssueの検出（30日以上）
log_info "長期間更新されていないIssueを確認中..."
CUTOFF_DATE=$(date -d '30 days ago' +%Y-%m-%d)
echo "$OPEN_ISSUES" | jq -r --arg cutoff "$CUTOFF_DATE" '
  map(select(.updatedAt < ($cutoff + "T00:00:00Z"))) | 
  .[] | "Issue #\(.number): \(.title) (Last updated: \(.updatedAt[:10]))"
' > /tmp/stale_issues.txt

if [ -s /tmp/stale_issues.txt ]; then
  log_warn "長期間更新されていないIssue:"
  cat /tmp/stale_issues.txt
  echo ""
fi

# 3. 優先度別Issue数の集計
log_info "優先度別Issue数を集計中..."
echo "$OPEN_ISSUES" | jq -r '
  group_by(.labels[] | select(.name | startswith("priority:")) | .name) | 
  map({priority: (.[0].labels[] | select(.name | startswith("priority:")).name), count: length}) |
  .[] | "\(.priority): \(.count)件"
'

# 4. 実装確認が必要なファイルパターンの検出
log_info "実装済み機能の確認中..."

# タグ機能の確認
if [ -f "src/components/TagManager.vue" ] && [ -f "src/stores/tagGoal.ts" ]; then
  log_success "✅ タグ機能: 実装済み"
  TAG_IMPLEMENTED=true
else
  log_warn "⚠️ タグ機能: 実装状況を確認が必要"
  TAG_IMPLEMENTED=false
fi

# セキュリティ機能の確認
SECURITY_FILES=(
  "src/utils/security-monitoring.ts"
  "src/utils/encryption.ts"
  "src/components/security/TwoFactorSetup.vue"
  "src/utils/sanitization.ts"
)

SECURITY_COUNT=0
for file in "${SECURITY_FILES[@]}"; do
  if [ -f "$file" ]; then
    ((SECURITY_COUNT++))
  fi
done

if [ $SECURITY_COUNT -ge 3 ]; then
  log_success "✅ セキュリティ機能: 実装済み ($SECURITY_COUNT/${#SECURITY_FILES[@]}ファイル確認)"
  SECURITY_IMPLEMENTED=true
else
  log_warn "⚠️ セキュリティ機能: 実装確認が必要 ($SECURITY_COUNT/${#SECURITY_FILES[@]}ファイル)"
  SECURITY_IMPLEMENTED=false
fi

# データ取得・キャッシング機能の確認
DATA_FILES=(
  "src/stores/pagination.ts"
  "src/composables/useDataFetch.ts"
  "src/composables/useDashboardData.ts"
)

DATA_COUNT=0
for file in "${DATA_FILES[@]}"; do
  if [ -f "$file" ]; then
    ((DATA_COUNT++))
  fi
done

if [ $DATA_COUNT -ge 2 ]; then
  log_success "✅ データ取得・キャッシング機能: 実装済み ($DATA_COUNT/${#DATA_FILES[@]}ファイル確認)"
  DATA_IMPLEMENTED=true
else
  log_warn "⚠️ データ取得・キャッシング機能: 実装確認が必要 ($DATA_COUNT/${#DATA_FILES[@]}ファイル)"
  DATA_IMPLEMENTED=false
fi

# 5. テスト状況の確認
log_info "テスト状況を確認中..."
if npm run test:unit --silent 2>/dev/null; then
  log_success "✅ ユニットテスト: 正常"
  TEST_STATUS="PASS"
else
  log_error "❌ ユニットテスト: 失敗あり"
  TEST_STATUS="FAIL"
fi

# 6. CI/CD品質チェック
log_info "品質チェックを実行中..."
QUALITY_CHECKS=()

if npm run ci:lint --silent 2>/dev/null; then
  QUALITY_CHECKS+=("✅ Lint: PASS")
else
  QUALITY_CHECKS+=("❌ Lint: FAIL")
fi

if npm run ci:type-check --silent 2>/dev/null; then
  QUALITY_CHECKS+=("✅ TypeScript: PASS")
else
  QUALITY_CHECKS+=("❌ TypeScript: FAIL")
fi

# 7. 監査レポートの生成
REPORT_FILE="issue-audit-$(date +%Y%m%d-%H%M%S).md"

cat > "$REPORT_FILE" << EOF
# Issue管理監査レポート

**実行日時**: $(date '+%Y-%m-%d %H:%M:%S')

## 📊 オープンIssue状況

### 優先度別集計
$(echo "$OPEN_ISSUES" | jq -r 'group_by(.labels[] | select(.name | startswith("priority:")) | .name) | map({priority: (.[0].labels[] | select(.name | startswith("priority:")).name), count: length}) | .[] | "- \(.priority): \(.count)件"' || echo "- 集計データなし")

### 長期間更新なしIssue (30日以上)
$(if [ -s /tmp/stale_issues.txt ]; then cat /tmp/stale_issues.txt | sed 's/^/- /'; else echo "- なし"; fi)

## 🔍 実装状況確認

- タグ機能: $([ "$TAG_IMPLEMENTED" = true ] && echo "✅ 実装済み" || echo "⚠️ 確認必要")
- セキュリティ機能: $([ "$SECURITY_IMPLEMENTED" = true ] && echo "✅ 実装済み" || echo "⚠️ 確認必要")
- データ取得・キャッシング: $([ "$DATA_IMPLEMENTED" = true ] && echo "✅ 実装済み" || echo "⚠️ 確認必要")

## 🧪 品質状況

- テスト実行: $([ "$TEST_STATUS" = "PASS" ] && echo "✅ 正常" || echo "❌ 失敗")
$(printf '%s\n' "${QUALITY_CHECKS[@]}" | sed 's/^/- /')

## 📋 推奨アクション

$(if [ -s /tmp/stale_issues.txt ]; then echo "### 長期間更新なしIssue対応"; echo "以下のIssueについて、現在の必要性を再評価してください:"; cat /tmp/stale_issues.txt | sed 's/^/- /'; echo ""; fi)

### 品質改善
$([ "$TEST_STATUS" = "FAIL" ] && echo "- ❗ **緊急**: テスト失敗の修復が必要です（Issue #69参照）")
$(echo "${QUALITY_CHECKS[@]}" | grep -q "FAIL" && echo "- CI/CD品質チェックでエラーが発生しています。修復してください。")

### 実装完了Issue候補
$([ "$TAG_IMPLEMENTED" = true ] && echo "- タグ機能関連Issueのクローズ検討")
$([ "$SECURITY_IMPLEMENTED" = true ] && echo "- セキュリティ関連Issueのクローズ検討")
$([ "$DATA_IMPLEMENTED" = true ] && echo "- データ取得・キャッシング関連Issueのクローズ検討")

---
*このレポートは自動生成されました。詳細な確認は手動で行ってください。*
EOF

log_success "📝 監査レポートを生成しました: $REPORT_FILE"

# 8. クリーンアップ
rm -f /tmp/stale_issues.txt

echo ""
log_success "🎉 Issue管理監査が完了しました！"
echo "詳細レポート: $REPORT_FILE"

# 9. 重要な問題がある場合は終了コードで通知
if [ "$TEST_STATUS" = "FAIL" ]; then
  log_error "重要: テスト失敗により、Issue #69の緊急対応が必要です"
  exit 1
fi