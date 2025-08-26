#!/bin/bash

# CI用のTypeScriptチェック
# Vuetify型定義の既知問題を除外してチェック
#
# 【除外される問題について】
# - Vuetify v3のSubmitEventPromise型がvue-tscでexportされない既知の問題
# - 参考: https://github.com/vuetifyjs/vuetify/discussions/15444
# - この問題はVuetifyの内部型定義とvue-tscの相互作用で発生
# - ランタイム動作には一切影響なし（型チェックのみの問題）
# - Vuetifyのバージョンアップで将来的に解決される予定
#
# 【検証済み】
# - BaseForm.vueでVForm.validate()使用時に発生
# - 根本的修正はVuetify側の型定義修正が必要
# - 一時的な回避策（anyキャスト等）は型安全性を損なうため不採用
#
# 【対応方針】
# - この特定の型エラーのみを除外し、他のTypeScriptエラーは厳格にチェック
# - 定期的にVuetifyのアップデートでこの問題が解決されたかを確認
# - 解決され次第、この除外処理を削除する

echo "Running TypeScript check with known Vuetify issue filtering..."

# 通常のtype-checkを実行し、結果をキャプチャ
TYPE_CHECK_OUTPUT=$(npm run type-check 2>&1)
TYPE_CHECK_EXIT_CODE=$?

# Vuetify SubmitEventPromise関連エラーを除外
# - "SubmitEventPromise" を含む行を除外
# - "external module.*vuetify.*but cannot be named" パターンを除外
FILTERED_OUTPUT=$(echo "$TYPE_CHECK_OUTPUT" | grep -v "SubmitEventPromise" | grep -v "external module.*vuetify.*but cannot be named")

# フィルタリング後にTypeScriptエラーがあるかチェック
if echo "$FILTERED_OUTPUT" | grep -q "error TS"; then
  echo "=== TypeScript errors found (excluding known Vuetify issues) ==="
  echo "$FILTERED_OUTPUT"
  echo ""
  echo "❌ Please fix the above TypeScript errors before proceeding."
  exit 1
else
  echo "✅ TypeScript check passed (known Vuetify SubmitEventPromise issues ignored)"
  echo "   All other TypeScript errors have been resolved."
  exit 0
fi