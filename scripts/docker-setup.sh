#!/bin/bash

# Docker環境セットアップスクリプト
# GoalCategorizationDiary開発環境の自動セットアップ

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# カラー出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Docker環境のチェック
check_docker() {
    log_info "Dockerの環境をチェックしています..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Dockerがインストールされていません"
        echo "Dockerをインストールしてください: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemonが起動していません"
        echo "Dockerを起動してください"
        exit 1
    fi
    
    # Docker Compose V2（docker compose）またはV1（docker-compose）の確認
    if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
        log_error "Docker Composeがインストールされていません"
        echo "Docker Composeをインストールしてください"
        exit 1
    fi
    
    log_success "Docker環境の確認完了"
}

# 環境ファイルの準備
setup_env() {
    log_info "環境ファイルをセットアップしています..."
    
    cd "${PROJECT_DIR}"
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_success ".env ファイルを作成しました"
        else
            cat > .env << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Development Configuration
NODE_ENV=development
VITE_APP_ENV=development

# Database Configuration (for local development)
DATABASE_URL=postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:54322/postgres
EOF
            log_success "デフォルトの.envファイルを作成しました"
        fi
    else
        log_info ".env ファイルは既に存在します"
    fi
}

# Dockerイメージのビルド
build_images() {
    log_info "Dockerイメージをビルドしています..."
    
    cd "${PROJECT_DIR}"
    
    # 既存のコンテナを停止・削除
    docker compose down --remove-orphans 2>/dev/null || true

    # イメージのビルド
    docker compose build --no-cache app
    
    log_success "Dockerイメージのビルド完了"
}

# 開発環境の起動
start_development() {
    log_info "開発環境を起動しています..."
    
    cd "${PROJECT_DIR}"
    
    # バックグラウンドでサービスを起動
    docker compose up -d

    # アプリケーションの起動を待機
    log_info "アプリケーションの起動を待機中..."
    sleep 10

    # ヘルスチェック
    if docker compose ps | grep -q "Up"; then
        log_success "開発環境が正常に起動しました"
        echo ""
        echo "🌐 アクセス可能なサービス:"
        echo "  - Vite Dev Server: http://localhost:5173"
        echo "  - Supabase Studio: http://localhost:3001"
        echo "  - PostgreSQL: localhost:54322"
        echo ""
        echo "🔧 有用なコマンド:"
        echo "  docker compose logs -f app    # アプリログの確認"
        echo "  docker compose exec app bash  # コンテナ内でシェル実行"
        echo "  docker compose down          # 環境の停止"
        echo ""
    else
        log_error "一部のサービスの起動に失敗しました"
        echo "詳細なログを確認してください: docker compose logs"
        exit 1
    fi
}

# クリーンアップ機能
cleanup() {
    log_info "開発環境をクリーンアップしています..."
    
    cd "${PROJECT_DIR}"
    
    # コンテナとボリュームを停止・削除
    docker compose down --volumes --remove-orphans
    
    # 未使用のイメージを削除
    docker image prune -f
    
    log_success "クリーンアップ完了"
}

# データベースリセット
reset_database() {
    log_info "データベースをリセットしています..."
    
    cd "${PROJECT_DIR}"
    
    # DBコンテナを停止・削除
    docker compose stop supabase-db
    docker compose rm -f supabase-db

    # DBボリュームを削除
    docker volume rm goalcategorizationdiary_supabase-db-data 2>/dev/null || true

    # DBコンテナを再起動
    docker compose up -d supabase-db
    
    log_success "データベースのリセット完了"
}

# ヘルプ表示
show_help() {
    echo "GoalCategorizationDiary Docker環境セットアップスクリプト"
    echo ""
    echo "使用方法: $0 [コマンド]"
    echo ""
    echo "コマンド:"
    echo "  setup     - 初回セットアップ（デフォルト）"
    echo "  start     - 開発環境の起動"
    echo "  stop      - 開発環境の停止"
    echo "  restart   - 開発環境の再起動"
    echo "  cleanup   - 環境のクリーンアップ"
    echo "  reset-db  - データベースのリセット"
    echo "  logs      - ログの表示"
    echo "  help      - このヘルプを表示"
    echo ""
}

# メイン処理
main() {
    local command="${1:-setup}"
    
    case "$command" in
        "setup")
            check_docker
            setup_env
            build_images
            start_development
            ;;
        "start")
            check_docker
            cd "${PROJECT_DIR}"
            docker compose up -d
            log_success "開発環境を起動しました"
            ;;
        "stop")
            cd "${PROJECT_DIR}"
            docker compose down
            log_success "開発環境を停止しました"
            ;;
        "restart")
            cd "${PROJECT_DIR}"
            docker compose restart
            log_success "開発環境を再起動しました"
            ;;
        "cleanup")
            cleanup
            ;;
        "reset-db")
            reset_database
            ;;
        "logs")
            cd "${PROJECT_DIR}"
            docker compose logs -f
            ;;
        "help")
            show_help
            ;;
        *)
            log_error "不明なコマンド: $command"
            show_help
            exit 1
            ;;
    esac
}

# スクリプト実行
main "$@"