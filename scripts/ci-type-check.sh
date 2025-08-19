#!/bin/bash

# CI用のTypeScriptチェック
# Vuetify型定義の既知問題を除外してチェック

echo "Running TypeScript check with known issue filtering..."

# 通常のtype-checkを実行し、結果をキャプチャ
TYPE_CHECK_OUTPUT=$(npm run type-check 2>&1)
TYPE_CHECK_EXIT_CODE=$?

# Vuetify SubmitEventPromise エラーを除外
FILTERED_OUTPUT=$(echo "$TYPE_CHECK_OUTPUT" | grep -v "SubmitEventPromise" | grep -v "external module.*vuetify.*but cannot be named")

# フィルタリング後にエラーがあるかチェック
if echo "$FILTERED_OUTPUT" | grep -q "error TS"; then
  echo "TypeScript errors found (excluding known Vuetify issues):"
  echo "$FILTERED_OUTPUT"
  exit 1
else
  echo "TypeScript check passed (known Vuetify issues ignored)"
  exit 0
fi