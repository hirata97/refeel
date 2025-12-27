# Refeel

**Reflect（内省）+ Feel（感情）** - モチベーション変化を測定・分析するWebアプリケーション

## プロジェクト概要

Refeelは、日々の振り返りによってモチベーションの変化を測定し、感情や要因を分析するためのWebアプリケーションです。Vue 3、TypeScript、Supabaseを使用して構築されています。

## 主な機能

- **気分トラッキング**: 日々の気分スコアと理由を記録
- **感情タグ分析**: 具体的な感情を複数選択して詳細分析
- **データ可視化**: 気分推移グラフ、週間振り返りビュー
- **目標管理**: カテゴリ別の目標設定と進捗追跡

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フロントエンド | Vue 3.5 + TypeScript 5.6 + Vite 5.4 |
| UI | Vuetify 3.7（Material Design） |
| バックエンド | Supabase 2.49（認証、PostgreSQL、RLS） |
| 状態管理 | Pinia 2.2 |
| テスト | Vitest 2.1 + Playwright 1.48 |
| デプロイ | Vercel |

## 🌐 本番環境

**本番URL**: デプロイ後にここに記載

詳細なデプロイ手順・運用情報は以下を参照してください：
- [Vercelデプロイ手順書](docs/DEPLOYMENT/VERCEL_DEPLOYMENT.md)
- [本番環境デプロイ実施レポート](docs/DEPLOYMENT/PRODUCTION_DEPLOYMENT_REPORT.md)
- [運用ガイド](docs/DEPLOYMENT/OPERATIONS_GUIDE.md)
- [ロールバック手順](docs/DEPLOYMENT/ROLLBACK_GUIDE.md)

## 動作要件

- **Node.js**: v20.19.0以降
- **npm**: v10以降
- **Docker**: ローカルSupabase使用時に必要

## 🚀 クイックスタート

### 推奨: VS Code Dev Containers

**前提条件**: Docker Desktop がインストール・起動済み

```bash
git clone https://github.com/RsPYP/GoalCategorizationDiary.git
cd GoalCategorizationDiary
# VS Codeで開く → 「Reopen in Container」をクリック
npm run dev
```

### 手動セットアップ

```bash
git clone https://github.com/RsPYP/GoalCategorizationDiary.git
cd GoalCategorizationDiary
npm install
cp .env.example .env
# .envファイルを編集（詳細: docs/ENVIRONMENT/ENVIRONMENT_SETUP.md）
npx supabase start
npm run dev
```

詳細なセットアップ手順は [docs/ENVIRONMENT/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT/ENVIRONMENT_SETUP.md) を参照してください。

## 基本コマンド

```bash
npm run dev        # 開発サーバー起動
npm run build      # 本番ビルド
npm run test:unit  # ユニットテスト
npm run ci:all     # 全品質チェック
```

全コマンド一覧: [docs/DEVELOPMENT/DEVELOPMENT_COMMANDS.md](docs/DEVELOPMENT/DEVELOPMENT_COMMANDS.md)

## 🗄️ ローカルSupabase

### 基本操作

```bash
supabase start     # 起動
supabase stop      # 停止
supabase status    # 状態確認
```

起動後の管理画面: http://localhost:54323

詳細なSupabase操作（CLIインストール、DBリセット、URL一覧等）は [supabase/README.md](supabase/README.md) を参照してください。

## 📁 プロジェクト構造

```
├── src/       # アプリケーションコード
├── tests/     # テストファイル
├── docs/      # 詳細ドキュメント
├── scripts/   # 自動化スクリプト
└── supabase/  # DBマイグレーション・Seed・設定
```

各ディレクトリの詳細は配下のREADME.mdを参照してください。

## 📚 ドキュメント

| カテゴリ | ドキュメント |
|----------|--------------|
| **開発ガイド** | [CLAUDE.md](CLAUDE.md) - 開発フロー・重要原則 |
| **環境構築** | [docs/ENVIRONMENT/](docs/ENVIRONMENT/) - セットアップ・Docker・Supabase |
| **開発ワークフロー** | [docs/DEVELOPMENT/](docs/DEVELOPMENT/) - ブランチ戦略・コマンド・アーキテクチャ |
| **CI/CD** | [docs/CI/](docs/CI/) - GitHub Actions・型生成 |
| **セキュリティ** | [docs/SECURITY/](docs/SECURITY/) - セキュリティガイドライン |
| **プロジェクト管理** | [docs/PROJECT_MANAGEMENT/](docs/PROJECT_MANAGEMENT/) - Issue・PR・ラベル |
| **テスト** | [tests/README.md](tests/README.md) - テスト戦略・命名規則 |
| **自動化スクリプト** | [scripts/README.md](scripts/README.md) - Issue→PR自動化 |

全ドキュメント一覧: [docs/README.md](docs/README.md)

## 貢献

詳細な開発フローは [CLAUDE.md](CLAUDE.md) および [docs/DEVELOPMENT/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT/DEVELOPMENT_WORKFLOW.md) を参照してください。

基本的な流れ:
1. Issueから作業対象を選択
2. フィーチャーブランチを作成（`git checkout -b feature/issue-XXX-description`）
3. 実装・テスト作成
4. `npm run ci:all` で品質チェック
5. PRを作成

## ライセンス

このプロジェクトはプライベートリポジトリです。

## サポート

質問・バグ報告は [Issues](https://github.com/RsPYP/GoalCategorizationDiary/issues) で受け付けています。
