#!/bin/bash
# データベース完全リセット + Seedデータ投入スクリプト
# Issue #267, #290: ローカル開発環境のDB初期化とテストデータ投入
#
# 使用方法:
#   ./supabase/scripts/reset.sh
#
# 前提条件:
#   - Supabase CLIがインストール済み
#   - `supabase start` でローカル環境が起動済み
#
# 注意: このスクリプトは既存データを全て削除します！
#
# 推奨: `supabase db reset` コマンドを使用することで、
#       マイグレーション + シードが自動実行されます。

set -e  # エラーが発生したら即座に終了

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

# Supabase CLIを使ってリセット（マイグレーション + シードを自動実行）
echo -e "${BLUE}Supabase DB リセットを実行中...${NC}"
echo -e "${YELLOW}→ supabase db reset${NC}"

supabase db reset

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}データベースリセットが完了しました！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}データベースの状態:${NC}"
echo -e "  - 全テーブル: 再作成済み（マイグレーション適用）"
echo -e "  - RLSポリシー: 適用済み"
echo -e "  - 感情タグマスタ: 20件（マイグレーションで投入）"
echo -e "  - テストユーザー: 5人（シードで投入）"
echo -e "  - 日記エントリ: 75件（シードで投入）"
echo ""
echo -e "${BLUE}次のステップ:${NC}"
echo -e "  npm run dev で開発サーバーを起動してください"
echo ""
