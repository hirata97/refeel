# Refeel

**Reflect（内省）+ Feel（感情）** - モチベーション変化を測定・分析するWebアプリケーション

[![CI](https://github.com/hirata97/GoalCategorizationDiary/actions/workflows/ci.yml/badge.svg)](https://github.com/hirata97/GoalCategorizationDiary/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📖 このプロジェクトについて

**Refeelは、モダンなWebアプリケーション開発を学ぶための学習用プロジェクトです。**

日々の振り返り（Reflect）と感情（Feel）を記録・分析することで、モチベーション変化を可視化します。実践的な開発手法、セキュリティ、CI/CD、デプロイまで、プロダクション環境を想定した実装を学べます。

### 🎯 学習目標

このプロジェクトを通じて、以下の実践的なスキルを習得できます：

- **モダンなフロントエンド開発**: Vue 3 Composition API + TypeScript
- **型安全な開発**: 厳格な型チェック、Supabase型定義自動生成
- **認証・セキュリティ**: Supabase RLS、XSS/CSRF対策、セキュリティ監査
- **テスト駆動開発**: Vitest（ユニットテスト）、Playwright（E2Eテスト）
- **CI/CD**: GitHub Actions による自動テスト・ビルド・デプロイ
- **本番運用**: Vercelデプロイ、監視・ログ、ロールバック手順

## プロジェクト概要

Refeelは、日々の振り返りによってモチベーションの変化を測定し、感情や要因を分析するためのWebアプリケーションです。Vue 3、TypeScript、Supabaseを使用して構築されています。

## 主な機能

- **気分トラッキング**: 日々の気分スコアと理由を記録
- **感情タグ分析**: 具体的な感情を複数選択して詳細分析
- **データ可視化**: 気分推移グラフ、週間振り返りビュー
- **目標管理**: カテゴリ別の目標設定と進捗追跡

## 技術スタック

| カテゴリ | 技術 | バージョン |
|----------|------|-----------|
| **フロントエンド** | Vue 3 + TypeScript + Vite | 3.5 + 5.6 + 5.4 |
| **UI** | Vuetify（Material Design） | 3.7 |
| **バックエンド** | Supabase（認証、PostgreSQL、RLS） | 2.49 |
| **状態管理** | Pinia | 2.2 |
| **テスト** | Vitest + Playwright | 2.1 + 1.48 |
| **CI/CD** | GitHub Actions | - |
| **デプロイ** | Vercel | - |

## 🌐 本番環境

**本番URL**: デプロイ後にここに記載

詳細なデプロイ手順・運用情報は以下を参照してください：
- [Vercelデプロイ手順書](docs/DEPLOYMENT/VERCEL_DEPLOYMENT.md)
- [本番環境デプロイ実施レポート](docs/DEPLOYMENT/PRODUCTION_DEPLOYMENT_REPORT.md)
- [運用ガイド](docs/DEPLOYMENT/OPERATIONS_GUIDE.md)
- [ロールバック手順](docs/DEPLOYMENT/ROLLBACK_GUIDE.md)

## 動作要件

- **Node.js**: v20.19.0以降（必須）
- **npm**: v10以降
- **Docker**: ローカルSupabase使用時に必要

## 🚀 クイックスタート

### 推奨: VS Code Dev Containers

**前提条件**: Docker Desktop がインストール・起動済み

```bash
git clone https://github.com/hirata97/GoalCategorizationDiary.git
cd GoalCategorizationDiary
# VS Codeで開く → 「Reopen in Container」をクリック
npm run dev
```

開発サーバーが起動したら、ブラウザで http://localhost:5173 を開きます。

### 手動セットアップ

```bash
# 1. リポジトリをクローン
git clone https://github.com/hirata97/GoalCategorizationDiary.git
cd GoalCategorizationDiary

# 2. 依存パッケージをインストール
npm install

# 3. 環境変数を設定
cp .env.example .env
# .envファイルを編集（詳細: docs/ENVIRONMENT/ENVIRONMENT_SETUP.md）

# 4. ローカルSupabaseを起動
npx supabase start

# 5. 開発サーバーを起動
npm run dev
```

詳細なセットアップ手順は [docs/ENVIRONMENT/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT/ENVIRONMENT_SETUP.md) を参照してください。

## 基本コマンド

```bash
npm run dev        # 開発サーバー起動
npm run build      # 本番ビルド
npm run test:unit  # ユニットテスト
npm run ci:all     # 全品質チェック（lint+型チェック+テスト+ビルド）
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
├── src/               # アプリケーションコード
│   ├── views/        # ページコンポーネント
│   ├── stores/       # Piniaストア（状態管理）
│   ├── lib/          # ユーティリティ・設定
│   └── types/        # TypeScript型定義
├── tests/             # テストファイル
│   ├── unit/         # ユニットテスト（Vitest）
│   └── e2e/          # E2Eテスト（Playwright）
├── docs/              # 詳細ドキュメント
├── scripts/           # 自動化スクリプト
└── supabase/          # DBマイグレーション・Seed・設定
```

各ディレクトリの詳細は配下のREADME.mdを参照してください。

## 📚 ドキュメント

| カテゴリ | ドキュメント |
|----------|--------------|
| **開発ガイド** | [CLAUDE.md](CLAUDE.md) - 開発フロー・重要原則 |
| **環境構築** | [docs/ENVIRONMENT/](docs/ENVIRONMENT/) - セットアップ・Docker・Supabase |
| **開発ワークフロー** | [docs/DEVELOPMENT/](docs/DEVELOPMENT/) - ブランチ戦略・コマンド・アーキテクチャ |
| **デプロイ** | [docs/DEPLOYMENT/](docs/DEPLOYMENT/) - Vercelデプロイ・運用・ロールバック |
| **CI/CD** | [docs/CI/](docs/CI/) - GitHub Actions・型生成 |
| **セキュリティ** | [docs/SECURITY/](docs/SECURITY/) - セキュリティガイドライン・監査レポート |
| **プロジェクト管理** | [docs/PROJECT_MANAGEMENT/](docs/PROJECT_MANAGEMENT/) - Issue・PR・ラベル |
| **テスト** | [tests/README.md](tests/README.md) - テスト戦略・命名規則 |
| **自動化スクリプト** | [scripts/README.md](scripts/README.md) - Issue→PR自動化 |

全ドキュメント一覧: [docs/README.md](docs/README.md)

## 🤝 貢献

学習目的のプロジェクトですが、Issue報告やPRは歓迎します！

詳細な開発フローは [CLAUDE.md](CLAUDE.md) および [docs/DEVELOPMENT/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT/DEVELOPMENT_WORKFLOW.md) を参照してください。

### 基本的な開発フロー

1. Issueから作業対象を選択
2. フィーチャーブランチを作成（`git checkout -b feature/issue-XXX-description`）
3. 実装・テスト作成
4. `npm run ci:all` で品質チェック
5. PRを作成

## 📄 ライセンス

MIT License

Copyright (c) 2025 hirata97

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 💬 サポート

質問・バグ報告・機能要望は [Issues](https://github.com/hirata97/GoalCategorizationDiary/issues) で受け付けています。

## 🙏 謝辞

このプロジェクトは、モダンなWeb開発技術を学ぶために作成されました。使用している各種OSSライブラリの開発者の皆様に感謝します。
