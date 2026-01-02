#!/bin/bash
# importパス一括置換スクリプト
set -e

PATTERN_FROM="$1"
PATTERN_TO="$2"
DRY_RUN="${DRY_RUN:-false}"

if [ -z "$PATTERN_FROM" ] || [ -z "$PATTERN_TO" ]; then
  echo "Usage: $0 <from-pattern> <to-pattern>"
  echo "Example: $0 \"from '@/lib/supabase'\" \"from '@core/lib/supabase'\""
  exit 1
fi

if [ "$DRY_RUN" = "true" ]; then
  echo "[DRY RUN] Replacing: $PATTERN_FROM -> $PATTERN_TO"
  grep -r "$PATTERN_FROM" src/ --include="*.ts" --include="*.vue" || true
else
  find src -type f \( -name "*.ts" -o -name "*.vue" \) \
    -exec sed -i "s|$PATTERN_FROM|$PATTERN_TO|g" {} +
  echo "Replaced: $PATTERN_FROM -> $PATTERN_TO"
fi
