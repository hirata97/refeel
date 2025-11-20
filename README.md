# Refeel

**Reflect（内省）+ Feel（感情）** - モチベーション変化を測定・分析するWebアプリケーション

## 📖 目次

- [プロジェクト概要](#プロジェクト概要)
- [🚀 クイックスタート](#セットアップ)
- [技術スタック](#技術スタック)
- [主な機能](#主な機能)
- [プロジェクト構造](#プロジェクト構造)
- [開発コマンド](#開発コマンド)
- [Claude Codeでの開発](#claude-codeでの開発)
- [📚 ドキュメント](#-ドキュメント)
- [貢献](#貢献)

## プロジェクト概要

Refeelは、日々の振り返りによってモチベーションの変化を測定し、感情や要因を分析するためのWebアプリケーションです。
Vue 3、TypeScript、Supabaseを使用して構築されており、ユーザーが内省を深めながら継続的な自己改善をサポートします。

### 🎯 新規開発者向けクイックガイド

1. **📖 全体把握**: このREADME.mdでプロジェクト全体を理解
2. **⚙️ 環境構築**: [セットアップ](#セットアップ) セクションで開発環境を構築
3. **🛠️ 開発準備**: [CLAUDE.md](CLAUDE.md) で開発フロー・重要原則を確認
4. **📚 詳細学習**: [docs/README.md](docs/README.md) で詳細ドキュメントを参照
5. **🚀 開発開始**: [開発コマンド](#開発コマンド) で実装作業開始

## 主な機能

### 🔍 振り返り・分析機能

- **気分トラッキング**: 日々の気分スコアと理由を記録
- **感情タグ**: 具体的な感情を複数選択して詳細分析
- **振り返りテンプレート**: 構造化された内省促進
- **週間振り返りビュー**: 1週間のモチベーション変化パターンを可視化

### 📊 データ可視化・比較

- **前日比較表示**: 気分・進捗の変化を意識化
- **気分推移グラフ**: Chart.jsによる時系列データ可視化
- **感情タグ分析**: 使用頻度と傾向分析
- **進捗パターン分析**: 目標カテゴリ別の傾向把握

### 🛡️ システム基盤

- **ユーザー認証**: Supabaseによる安全な認証システム
- **目標管理**: カテゴリ別の目標設定と管理
- **レスポンシブデザイン**: モバイルデバイス対応

## 技術スタック

- **フロントエンド**: Vue 3.5 + TypeScript 5.6 + Vite 5.4
- **UIフレームワーク**: Vuetify 3.7（Material Design）
- **バックエンド**: Supabase 2.49（認証、データベース、リアルタイム更新）
- **状態管理**: Pinia 2.2
- **ルーティング**: Vue Router 4.4
- **データ可視化**: Chart.js 4.4 + vue-chartjs 5.3
- **テスティング**: Vitest 2.1（ユニット）+ Playwright 1.48（E2E）
- **デプロイ**: Vercel
- **Node.js**: v20.19.0以降必須（Vite 7、Vitest 4、jsdom 27等の依存関係要件）
- **パッケージマネージャ**: npm v10以降

## セットアップ

### 🐳 Supabaseローカル環境（推奨）

Supabase CLIを使った公式ローカル開発環境：

```bash
git clone https://github.com/RsPYP/GoalCategorizationDiary.git
cd GoalCategorizationDiary
npm install

# 環境変数の設定（初回のみ）
cp .env.example .env

# Supabaseローカル環境の起動
npx supabase start

# 開発サーバーを起動
npm run dev
```

**利用可能なサービス：**
- 🌐 API: http://127.0.0.1:54321
- 🎨 Studio: http://127.0.0.1:54323
- 🗄️ Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres

**主要コマンド：**
```bash
npx supabase status    # ステータス確認
npx supabase stop      # 環境停止
npx supabase start     # 環境起動
```

詳細な手順は [Docker環境セットアップガイド](docs/DOCKER_SETUP.md) を参照してください。

### 手動セットアップ

#### 前提条件

- **Node.js v20.19.0以降（必須）**
  - Vite 7、Vitest 4、jsdom 27等の依存関係がNode.js 20+必須
  - `.nvmrc`ファイルで推奨バージョン指定済み
  - NVM使用の場合: `nvm use`で自動適用
- **npm v10以降**
- **Supabaseアカウント**（無料プラン可）

#### インストール

1. **リポジトリのクローン**

   ```bash
   git clone https://github.com/RsPYP/GoalCategorizationDiary.git
   cd GoalCategorizationDiary
   ```

2. **依存関係のインストール**

   ```bash
   npm install
   ```

3. **環境変数の設定**

   環境変数テンプレートをコピーして`.env`ファイルを作成：

   ```bash
   cp .env.example .env
   ```

   本番環境のSupabaseを使用する場合は、`.env`ファイルを編集：

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_KEY=your-anon-key
   ```

   ローカル開発環境では、`.env.example`のデフォルト値（ローカルSupabase）をそのまま使用できます。

4. **開発サーバーの起動**
   ```bash
   npm run dev
   ```

## 開発コマンド

### 基本コマンド

```bash
# 開発環境起動
npm run dev

# 型チェック付きビルド
npm run build

# リンティング
npm run lint

# コードフォーマット
npm run format

# ユニットテスト
npm run test:unit

# E2Eテスト（初回のみブラウザインストール）
npx playwright install
npm run test:e2e
```

### 🐳 Docker環境管理

```bash
# Docker環境の起動
npm run docker:start

# Docker環境の停止
npm run docker:stop

# Docker環境の再起動
npm run docker:restart

# ログ確認
npm run docker:logs

# データベースリセット
npm run docker:reset-db

# 環境のクリーンアップ
npm run docker:cleanup
```

### 🚀 自動化ワークフロー

#### GitHub Issue → PR 自動化コマンド

##### Issue管理

```bash
# Issue一覧表示
npm run fetch-issue

# 特定のIssue詳細とタスクファイル生成
npm run fetch-issue [issue番号]
```

##### 開発ワークフロー

```bash
# Issue作業開始
npm run start-issue [issue番号]
# - 専用ブランチ作成
# - タスクファイル生成
# - 自動アサイン
# - Claude Code用プロンプト準備

# PR作成
npm run create-pr "タイトル" "説明"
# - 自動コミット・プッシュ
# - develop向けPR作成
# - Claude Code署名付きメッセージ
```

#### 完全自動化（推奨）

```bash
# 単一Issue自動実装
npm run auto-issue [issue番号]
# - Issue詳細自動取得
# - Claude Codeによる自動実装
# - コード品質チェック
# - PR自動作成

# 全オープンIssue連続自動実装
npm run auto-cycle
```

## プロジェクト構造

### 📁 ディレクトリ概要

```
GoalCategorizationDiary/
├── src/                        # ソースコード → 詳細: src/README.md
├── tests/                      # テストファイル → 詳細: tests/README.md
├── docs/                       # プロジェクトドキュメント → 詳細: docs/README.md
├── scripts/                    # 自動化スクリプト → 詳細: scripts/README.md
├── database/                   # データベース関連 → 詳細: database/README.md
├── public/                     # 静的リソース
├── .github/                    # GitHub Actions・CI/CD設定
└── .vscode/                    # VS Code推奨設定
```

各ディレクトリの詳細な構造・設計方針・使用方法は、それぞれのREADME.mdを参照してください。

### 🗂️ 主要ディレクトリの役割

- **[src/](src/README.md)** - Vue 3 + TypeScript アプリケーションコード
  - コンポーネント設計パターン、Composition API使用方針、型定義ルール
- **[tests/](tests/README.md)** - Vitest + Playwright テストコード
  - テスト命名規則、モック戦略、カバレッジ目標
- **[docs/](docs/README.md)** - 18ファイルの詳細ドキュメント
  - 開発ワークフロー、アーキテクチャ、セキュリティ、CI/CD
- **[scripts/](scripts/README.md)** - Issue → PR自動化スクリプト
  - fetch-issue.sh, start-issue.sh, create-pr.sh
- **[database/](database/README.md)** - Supabaseデータベーススキーマ
  - テーブル構造、RLS設定、マスターデータ

## テスト戦略

テストの詳細な戦略・命名規則・実行方法は **[tests/README.md](tests/README.md)** を参照してください。

### クイックガイド

**テストファイル命名規則**: `正常系または異常系_コンポーネント名_ナンバリング.spec.js`

**例**:

- `normal_LoginPage_01.spec.js` - 正常系テスト
- `exception_LoginPage_01.spec.js` - 異常系テスト

**主要コマンド**:

```bash
npm run test:unit           # ユニットテスト実行
npm run test:e2e            # E2Eテスト実行
npm run ci:test            # カバレッジ付きテスト
```

**カバレッジ目標**: 全体80%以上、重要コンポーネント90%以上

## 🏷️ ラベル管理システム

### 優先度ラベル

- `priority:P0` 🔴 - 最高優先度（緊急・重要）
- `priority:P1` 🟡 - 高優先度（重要）
- `priority:P2` 🔵 - 中優先度（通常）

### 作業規模ラベル

- `size:S` 🔴 - 小規模（1-2日）
- `size:M` 🟡 - 中規模（3-5日）
- `size:L` 🔵 - 大規模（1週間以上）

### 実装内容ラベル

**基本的な作業（type-basic:）**

- `type-basic:bugfix` - バグ修正
- `type-basic:enhancement` - 既存機能改善
- `type-basic:feature` - 新機能追加
- `type-basic:refactor` - リファクタリング

**インフラ・技術（type-infra:）**

- `type-infra:automation` - 自動化・スクリプト
- `type-infra:ci-cd` - CI/CD・パイプライン
- `type-infra:performance` - パフォーマンス改善
- `type-infra:security` - セキュリティ

**品質・ドキュメント（type-quality:）**

- `type-quality:docs` - ドキュメント
- `type-quality:test` - テスト関連

## Claude Codeでの開発

このプロジェクトはClaude Code（claude.ai/code）での開発に最適化されています。

### 📖 開発ガイド

**完全な開発ガイド**: **[CLAUDE.md](CLAUDE.md)** を必ず確認してください

- 🚀 クイックスタート（必読）
- ⚡ 6ステップ開発フロー
- 🎯 重要原則（TypeScript厳格モード、段階的実装等）
- 📁 アーキテクチャ概要
- 🚨 よくある落とし穴と対策

### 主要な開発コマンド

```bash
npm run dev                 # 開発サーバー起動
npm run ci:all             # 全品質チェック（型生成+lint+型+テスト+ビルド）
npm run auto-issue [番号]  # Issue自動実装（推奨）
npm run generate-types     # Supabase型定義生成
npm run test:unit          # ユニットテスト
npm run build              # プロダクションビルド
```

### 自動化ワークフロー

**Issue → PR作成までの完全自動化** - 詳細は [scripts/README.md](scripts/README.md)

```bash
npm run start-issue [番号]  # Issue作業開始（ブランチ作成・タスクファイル生成）
npm run create-pr          # PR自動作成
npm run auto-issue [番号]  # 完全自動実装（推奨）
```

## デプロイメント

本プロジェクトはVercelで自動デプロイされます。mainブランチへのマージで自動的にデプロイが実行されます。

## 貢献

**開発ワークフロー詳細**: [docs/DEVELOPMENT/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT/DEVELOPMENT_WORKFLOW.md)

### 基本フロー

1. **Issue確認**: オープンなIssueから作業対象を選択
2. **作業開始**: `npm run start-issue [issue番号]` でブランチ作成・環境準備
3. **実装**: 機能実装・ユニットテスト作成
4. **品質チェック**: `npm run ci:all` で全品質チェック実行
5. **PR作成**: `npm run create-pr` で自動PR作成
6. **レビュー**: コードレビュー・CI/CD自動チェック通過
7. **マージ**: mainブランチへマージ・自動デプロイ

### 開発ルール

- **ブランチ戦略**: `feature/issue-[番号]-[説明]` 形式でブランチ作成
- **コミットメッセージ**: Claude Code署名付きメッセージ
- **テスト必須**: 新規機能・修正には必ずユニットテスト追加
- **型チェック**: TypeScript厳格モード遵守、`any`型禁止
- **ドキュメント**: 必要に応じてREADME.md更新

詳細は [CLAUDE.md](CLAUDE.md) を参照してください。

## ライセンス

このプロジェクトはプライベートリポジトリです。

## 📚 ドキュメント

プロジェクトの詳細ドキュメントは **[docs/](docs/)** ディレクトリに整理されています。

### 主要ドキュメント

#### 🛠️ 開発関連

- [DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT/DEVELOPMENT_WORKFLOW.md) - ブランチ戦略・PR作成手順
- [DEVELOPMENT_COMMANDS.md](docs/DEVELOPMENT/DEVELOPMENT_COMMANDS.md) - npm scripts・自動化コマンド
- [ARCHITECTURE.md](docs/DEVELOPMENT/ARCHITECTURE.md) - システムアーキテクチャ
- [BEST_PRACTICES.md](docs/DEVELOPMENT/BEST_PRACTICES.md) - 開発ベストプラクティス
- [PR_TESTING_GUIDE.md](docs/PROJECT_MANAGEMENT/PR_TESTING_GUIDE.md) - PRテスト・検証ガイド

#### ⚙️ 環境・設定

- [ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md) - 環境設定ガイド
- [DOCKER_SETUP.md](docs/DOCKER_SETUP.md) - Docker環境セットアップ
- [SUPABASE_QUICK_SETUP.md](docs/SUPABASE_QUICK_SETUP.md) - Supabase 5分セットアップ

#### 🚀 CI/CD・品質管理

- [CI_CD_GUIDE.md](docs/CI/CI_CD_GUIDE.md) - GitHub Actions・品質チェック
- [TYPE_GENERATION.md](docs/CI/TYPE_GENERATION.md) - 型定義自動生成システム
- [CI_CD_BEST_PRACTICES.md](docs/CI/CI_CD_BEST_PRACTICES.md) - CI/CDベストプラクティス

#### 🛡️ セキュリティ

- [SECURITY.md](docs/SECURITY.md) - セキュリティガイドライン
- [SECURITY_DEVELOPMENT.md](docs/SECURITY_DEVELOPMENT.md) - セキュリティ開発ガイド

全18ファイルの一覧は [docs/README.md](docs/README.md) を参照してください。

## サポート

質問やバグ報告は [Issues](https://github.com/RsPYP/GoalCategorizationDiary/issues) で受け付けています。

### トラブルシューティング

- **環境問題**: [ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md) のトラブルシューティング
- **Docker問題**: [DOCKER_SETUP.md](docs/DOCKER_SETUP.md) のよくある問題
- **認証問題**: [SUPABASE_AUTH.md](docs/SUPABASE_AUTH.md) の問題解決
- **CI/CD問題**: [CI_CD_GUIDE.md](docs/CI/CI_CD_GUIDE.md) のトラブルシューティング
