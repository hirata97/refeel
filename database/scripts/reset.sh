#!/bin/bash
# データベース完全リセット + Seedデータ投入スクリプト
# Issue #267: ローカル開発環境のDB初期化とテストデータ投入
#
# 使用方法:
#   ./database/scripts/reset.sh
#
# 前提条件:
#   - Supabase CLIがインストール済み
#   - `supabase start` でローカル環境が起動済み
#
# 注意: このスクリプトは既存データを全て削除します！

set -e  # エラーが発生したら即座に終了

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DATABASE_DIR="$PROJECT_ROOT/database"

# カラー出力用
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${RED}========================================${NC}"
echo -e "${RED}データベースリセットを開始します${NC}"
echo -e "${RED}⚠️  既存データは全て削除されます！${NC}"
echo -e "${RED}========================================${NC}"
echo ""

# 確認プロンプト
read -p "本当にリセットしますか？ (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo -e "${YELLOW}リセットをキャンセルしました${NC}"
  exit 0
fi

echo ""

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

# 1. スキーマリセット（全テーブル再作成）
echo -e "${BLUE}ステップ1: スキーマリセット${NC}"
run_sql "$DATABASE_DIR/schema/master.sql" "全テーブル作成"

# 2. RLSポリシー設定
echo ""
echo -e "${BLUE}ステップ2: セキュリティ設定${NC}"
run_sql "$DATABASE_DIR/maintenance/rls_policies.sql" "RLSポリシー適用"

# 3. Seedデータ投入
echo ""
echo -e "${BLUE}ステップ3: Seedデータ投入${NC}"
bash "$SCRIPT_DIR/seed.sh"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}データベースリセットが完了しました！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}データベースの状態:${NC}"
echo -e "  - 全テーブル: 再作成済み"
echo -e "  - RLSポリシー: 適用済み"
echo -e "  - テストユーザー: 5人"
echo -e "  - 日記エントリ: 75件"
echo -e "  - 感情タグマスタ: 20件"
echo ""
echo -e "${BLUE}次のステップ:${NC}"
echo -e "  npm run dev で開発サーバーを起動してください"
echo ""
