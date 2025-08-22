# Docker開発環境セットアップガイド

## 概要

このガイドでは、GoalCategorizationDiaryプロジェクトのDocker開発環境のセットアップと使用方法について説明します。

## 必要な条件

- Docker Desktop 4.0 以上
- Docker Compose v2 以上
- Git
- VSCode（推奨）

## 🚀 クイックスタート

### 1. 初回セットアップ

```bash
# リポジトリクローン
git clone https://github.com/RsPYP/GoalCategorizationDiary.git
cd GoalCategorizationDiary

# 自動セットアップ実行
npm run docker:setup
```

このコマンドで以下が自動実行されます：
- Docker環境の確認
- 環境ファイルの作成
- Dockerイメージのビルド
- 開発環境の起動

### 2. 開発環境へのアクセス

セットアップ完了後、以下のURLでアクセスできます：

- **アプリケーション**: http://localhost:5173
- **Supabase Studio**: http://localhost:3001
- **PostgreSQL**: localhost:54322

## 📋 利用可能なコマンド

### Docker環境管理

```bash
# 開発環境の起動
npm run docker:start

# 開発環境の停止
npm run docker:stop

# 開発環境の再起動
npm run docker:restart

# ログの確認
npm run docker:logs

# データベースのリセット
npm run docker:reset-db

# 環境のクリーンアップ
npm run docker:cleanup
```

### 開発用コマンド

```bash
# コンテナ内でシェル実行
docker-compose exec app bash

# 依存関係のインストール
docker-compose exec app npm install

# テスト実行
docker-compose exec app npm test

# ビルド
docker-compose exec app npm run build
```

## 🏗️ アーキテクチャ

### サービス構成

| サービス | 説明 | ポート |
|---------|------|--------|
| `app` | Vue.js開発サーバー | 5173 |
| `supabase-db` | PostgreSQL データベース | 54322 |
| `supabase-studio` | Supabase管理画面 | 3001 |
| `test` | テスト実行環境 | - |

### ボリューム構成

```yaml
volumes:
  - .:/app:cached                 # ソースコードの同期
  - node_modules:/app/node_modules # Node.jsモジュールの永続化
  - supabase-db-data:/var/lib/postgresql/data # DB永続化
```

## 🔧 VSCode Dev Containers

### 1. 拡張機能のインストール

VSCode拡張機能「Dev Containers」をインストール：
```
ms-vscode-remote.remote-containers
```

### 2. コンテナで開く

1. VSCodeでプロジェクトを開く
2. コマンドパレット（Ctrl+Shift+P）を開く
3. `Dev Containers: Reopen in Container` を実行
4. 自動的にコンテナ環境で再起動

### 3. 自動設定される機能

- Vue.js開発に必要な拡張機能
- ESLint/Prettierの自動フォーマット
- TypeScript IntelliSense
- デバッグ設定
- タスク定義

## 📁 ディレクトリ構造

```
GoalCategorizationDiary/
├── .devcontainer/           # VSCode Dev Container設定
│   ├── devcontainer.json    # Dev Container設定ファイル
│   └── setup.sh            # コンテナ初期化スクリプト
├── scripts/
│   └── docker-setup.sh     # Docker環境管理スクリプト
├── Dockerfile              # アプリケーションコンテナ定義
├── docker-compose.yml      # サービス構成定義
├── .dockerignore           # Docker無視ファイル
└── .env                    # 環境変数（自動生成）
```

## ⚙️ カスタマイズ

### 環境変数

`.env`ファイルで設定をカスタマイズできます：

```bash
# Supabase設定
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<your-key>

# 開発環境設定
NODE_ENV=development
VITE_APP_ENV=development

# データベース設定
DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres
```

### ポート変更

`docker-compose.yml`でポート設定を変更できます：

```yaml
services:
  app:
    ports:
      - "3000:5173"  # 5173 → 3000 に変更
```

## 🐛 トラブルシューティング

### よくある問題

#### 1. ポートが既に使用されている

```bash
# 使用中のポートを確認
lsof -i :5173

# コンテナを停止
npm run docker:stop
```

#### 2. パーミッションエラー

```bash
# ファイル所有者を変更
sudo chown -R $(whoami):$(whoami) .

# Dockerボリュームをリセット
npm run docker:cleanup
```

#### 3. データベース接続エラー

```bash
# データベースをリセット
npm run docker:reset-db

# ログを確認
npm run docker:logs
```

#### 4. Node.jsモジュールの問題

```bash
# node_modulesボリュームを削除
docker volume rm goalcategorizationdiary_node_modules

# 再ビルド
npm run docker:setup
```

### ログの確認方法

```bash
# 全サービスのログ
docker-compose logs -f

# 特定のサービスのログ
docker-compose logs -f app
docker-compose logs -f supabase-db

# 最新のログのみ
docker-compose logs --tail=100 -f app
```

## 🔄 開発ワークフロー

### 1. 日常的な開発

```bash
# 1. 環境起動
npm run docker:start

# 2. 開発作業
# http://localhost:5173 でアプリにアクセス
# VSCodeまたは好みのエディタでコード編集

# 3. 作業終了時
npm run docker:stop
```

### 2. テスト実行

```bash
# ユニットテスト
docker-compose exec app npm run test:unit

# E2Eテスト（テストプロファイル）
docker-compose --profile test run test npm run test:e2e

# カバレッジ付きテスト
docker-compose exec app npm run ci:test
```

### 3. データベース操作

```bash
# データベースに接続
docker-compose exec supabase-db psql -U postgres -d postgres

# データベースの状態確認
docker-compose exec app npm run db:status

# マイグレーション実行
docker-compose exec app npm run db:migrate
```

## 📊 パフォーマンス最適化

### 1. ボリュームマウント最適化

```yaml
# キャッシュ付きマウント（macOS/Windows）
volumes:
  - .:/app:cached

# 委任マウント（Linux）
volumes:
  - .:/app:delegated
```

### 2. ビルドキャッシュ

```bash
# マルチステージビルドキャッシュ活用
docker-compose build --parallel

# BuildKitの活用
DOCKER_BUILDKIT=1 docker-compose build
```

## 🚀 本番環境デプロイ

### 1. プロダクションビルド

```bash
# プロダクション用イメージビルド
docker build -f Dockerfile.prod -t goal-diary:prod .

# 本番環境用compose
docker-compose -f docker-compose.prod.yml up -d
```

### 2. 環境別設定

```bash
# 開発環境
docker-compose up -d

# ステージング環境  
docker-compose -f docker-compose.staging.yml up -d

# 本番環境
docker-compose -f docker-compose.prod.yml up -d
```

## 📚 参考資料

- [Docker公式ドキュメント](https://docs.docker.com/)
- [Docker Compose公式ドキュメント](https://docs.docker.com/compose/)
- [VSCode Dev Containers](https://code.visualstudio.com/docs/remote/containers)
- [Supabase Docker](https://supabase.com/docs/guides/self-hosting/docker)

## 🤝 サポート

問題が発生した場合は、以下の情報を添えてIssueを作成してください：

```bash
# システム情報の取得
docker version
docker-compose version
docker-compose config
docker-compose ps
docker-compose logs
```