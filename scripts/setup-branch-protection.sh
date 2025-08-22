#!/bin/bash

# ブランチ保護ルール設定スクリプト
# GitHub CLI を使用してmainブランチの保護ルールを設定

set -e

echo "🔒 ブランチ保護ルールを設定しています..."

# メインブランチの保護ルール設定
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["Code Quality Checks","Comprehensive Testing","Security Analysis"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":false,"require_last_push_approval":false}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field block_creations=false

echo "✅ メインブランチ保護ルール設定完了"

# developブランチが存在する場合の保護ルール（存在しない場合はスキップ）
if gh api repos/:owner/:repo/branches/develop > /dev/null 2>&1; then
  echo "🔒 developブランチ保護ルール設定中..."
  
  gh api repos/:owner/:repo/branches/develop/protection \
    --method PUT \
    --field required_status_checks='{"strict":true,"contexts":["Code Quality Checks","Comprehensive Testing"]}' \
    --field enforce_admins=false \
    --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
    --field restrictions=null \
    --field allow_force_pushes=false \
    --field allow_deletions=false
    
  echo "✅ developブランチ保護ルール設定完了"
else
  echo "ℹ️ developブランチが存在しないため、スキップします"
fi

# 設定確認
echo ""
echo "📋 設定された保護ルール:"
gh api repos/:owner/:repo/branches/main/protection --jq '{
  "required_status_checks": .required_status_checks.contexts,
  "required_reviews": .required_pull_request_reviews.required_approving_review_count,
  "enforce_admins": .enforce_admins.enabled,
  "allow_force_pushes": .allow_force_pushes.enabled
}'

echo ""
echo "🎉 ブランチ保護ルール設定が完了しました！"
echo ""
echo "📌 設定内容:"
echo "   - PR必須: ✅"
echo "   - レビュー必須: ✅ (1名以上)"
echo "   - ステータスチェック必須: ✅"
echo "   - 管理者ルール適用: ✅"
echo "   - 強制プッシュ禁止: ✅"
echo "   - ブランチ削除禁止: ✅"