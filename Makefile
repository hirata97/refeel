# GoalCategorizationDiary (Refeel) Makefile
# Docker Compose操作の便利なショートカット
# Issue #268: Docker Compose改善とマイグレーション自動化

.PHONY: help up down restart logs logs-app logs-db psql seed reset clean

# デフォルトターゲット: ヘルプを表示
help:
	@echo "GoalCategorizationDiary Docker Commands"
	@echo ""
	@echo "使用方法: make [COMMAND]"
	@echo ""
	@echo "主要コマンド:"
	@echo "  up          - 開発環境を起動（バックグラウンド）"
	@echo "  down        - 開発環境を停止"
	@echo "  restart     - 開発環境を再起動"
	@echo "  logs        - 全サービスのログを表示（フォロー）"
	@echo "  logs-app    - アプリケーションのログのみ表示"
	@echo "  logs-db     - データベースのログのみ表示"
	@echo "  psql        - PostgreSQLに接続"
	@echo "  seed        - Seedデータを投入"
	@echo "  reset       - データベースをリセット（全データ削除）"
	@echo "  clean       - 全てのコンテナ・ボリュームを削除"
	@echo ""
	@echo "開発フロー例:"
	@echo "  1. make up          # 初回起動"
	@echo "  2. make logs-app    # ログ確認"
	@echo "  3. make seed        # テストデータ投入"
	@echo "  4. make down        # 作業終了時"
	@echo ""

# 開発環境起動
up:
	@echo "🚀 開発環境を起動しています..."
	docker-compose up -d
	@echo "✅ 起動完了"
	@echo ""
	@echo "🌐 アクセス可能なサービス:"
	@echo "  - Vite Dev Server: http://localhost:5173"
	@echo "  - PostgreSQL: localhost:54322"
	@echo ""
	@echo "📝 次のステップ:"
	@echo "  make logs-app    # アプリログ確認"
	@echo "  make seed        # Seedデータ投入"
	@echo ""

# 開発環境停止
down:
	@echo "🛑 開発環境を停止しています..."
	docker-compose down
	@echo "✅ 停止完了"

# 開発環境再起動
restart:
	@echo "🔄 開発環境を再起動しています..."
	docker-compose restart
	@echo "✅ 再起動完了"

# 全サービスのログ表示
logs:
	docker-compose logs -f

# アプリケーションのログのみ表示
logs-app:
	docker-compose logs -f app

# データベースのログのみ表示
logs-db:
	docker-compose logs -f supabase-db

# PostgreSQLに接続
psql:
	@echo "📊 PostgreSQLに接続しています..."
	@echo "（終了するには \\q を入力）"
	docker-compose exec supabase-db psql -U postgres -d postgres

# Seedデータ投入
seed:
	@echo "🌱 Seedデータを投入しています..."
	@echo "注意: supabase/scripts/seed.sh を実行します"
	./supabase/scripts/seed.sh
	@echo "✅ Seedデータ投入完了"

# データベースリセット
reset:
	@echo "⚠️  警告: 全てのデータが削除されます！"
	@echo "本当に実行しますか？ [y/N]"
	@read -p "" response; \
	if [ "$$response" = "y" ] || [ "$$response" = "Y" ]; then \
		echo "🔄 データベースをリセットしています..."; \
		docker-compose down -v; \
		docker-compose up -d; \
		echo "✅ リセット完了"; \
		echo ""; \
		echo "📝 次のステップ:"; \
		echo "  make seed    # Seedデータを投入"; \
	else \
		echo "❌ キャンセルしました"; \
	fi

# 完全クリーンアップ
clean:
	@echo "⚠️  警告: 全てのコンテナ・ボリュームが削除されます！"
	@echo "本当に実行しますか？ [y/N]"
	@read -p "" response; \
	if [ "$$response" = "y" ] || [ "$$response" = "Y" ]; then \
		echo "🧹 クリーンアップしています..."; \
		docker-compose down -v --remove-orphans; \
		docker image prune -f; \
		echo "✅ クリーンアップ完了"; \
	else \
		echo "❌ キャンセルしました"; \
	fi
