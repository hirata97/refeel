#!/bin/bash
# Seedデータ一括実行スクリプト
# Issue #267, #290: ローカル開発環境用のテストデータ投入
#
# 使用方法:
#   ./supabase/scripts/seed.sh
#
# 前提条件:
#   - Supabase CLIがインストール済み
#   - `supabase start` でローカル環境が起動済み
#   - マイグレーションが適用済み

set -e  # エラーが発生したら即座に終了

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUPABASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# カラー出力用
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Seedデータ投入を開始します${NC}"
echo -e "${BLUE}========================================${NC}"

# PostgreSQL接続情報（Supabaseローカル環境のデフォルト）
DB_HOST="${POSTGRES_HOST:-127.0.0.1}"
DB_PORT="${POSTGRES_PORT:-54322}"
DB_NAME="${POSTGRES_DB:-postgres}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD:-postgres}"

# psqlコマンド実行関数
run_sql() {
  local sql_file=$1
  local description=$2

  echo -e "${YELLOW}→ $description${NC}"
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$sql_file"

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $description 完了${NC}"
  else
    echo -e "${RED}✗ $description 失敗${NC}"
    exit 1
  fi
}

# Seedファイルを番号順に実行
run_sql "$SUPABASE_DIR/seed/01_seed_profiles.sql" "テストユーザー作成"
run_sql "$SUPABASE_DIR/seed/02_seed_settings.sql" "ユーザー設定データ投入"
run_sql "$SUPABASE_DIR/seed/03_seed_diaries_full.sql" "日記データ投入（各ユーザー15件）"
run_sql "$SUPABASE_DIR/seed/04_seed_diary_emotion_tags.sql" "日記-感情タグ関連データ投入"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Seedデータ投入が完了しました！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}投入されたデータ:${NC}"
echo -e "  - テストユーザー: 5人"
echo -e "  - 日記エントリ: 75件（各ユーザー15件）"
echo -e "  - 感情タグマスタ: 20件（マイグレーションで投入済み）"
echo -e "  - 日記-感情タグ関連: 約75-225件"
echo ""
echo -e "${BLUE}確認方法:${NC}"
echo -e "  npm run dev で開発サーバーを起動して確認してください"
echo ""
