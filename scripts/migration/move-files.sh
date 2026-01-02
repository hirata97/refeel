#!/bin/bash
# ファイル移動スクリプト（ドライラン対応）
set -e

DRY_RUN="${DRY_RUN:-false}"

move_file() {
  local src="$1"
  local dest="$2"
  
  if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY RUN] git mv $src $dest"
  else
    git mv "$src" "$dest"
  fi
}

# 使用例
# DRY_RUN=true ./scripts/migration/move-files.sh  # ドライラン
# ./scripts/migration/move-files.sh                # 実行
