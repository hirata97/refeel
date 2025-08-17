# Goal Categorization Diary

目標設定と進捗追跡のためのVue.js Webアプリケーション

## プロジェクト概要

Goal Categorization Diaryは、日々の目標を管理し、進捗を追跡するためのWebアプリケーションです。Vue 3、TypeScript、Supabaseを使用して構築されており、ユーザーが目標を設定し、日記形式で進捗を記録できます。

## 主な機能

- **ユーザー認証**: Supabaseによる安全な認証システム
- **目標管理**: カテゴリ別の目標設定と管理
- **日記機能**: 日々の進捗を記録できる日記システム
- **データ可視化**: Chart.jsによる進捗データの可視化
- **レスポンシブデザイン**: モバイルデバイス対応

## 技術スタック

- **フロントエンド**: Vue 3 + TypeScript + Vite
- **UIフレームワーク**: Vuetify 3（Material Design）
- **バックエンド**: Supabase（認証、データベース、リアルタイム更新）
- **状態管理**: Pinia
- **ルーティング**: Vue Router
- **データ可視化**: Chart.js + vue-chartjs
- **テスティング**: Vitest（ユニット）+ Playwright（E2E）
- **デプロイ**: Vercel

## セットアップ

### 前提条件

- Node.js (v16以降)
- npm
- Supabaseアカウント

### インストール

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
   
   `.env`ファイルを作成し、Supabaseの設定を追加：
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_KEY=your-anon-key
   ```

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

```
src/
├── components/          # 再利用可能なコンポーネント
│   └── base/           # ベースコンポーネント
├── lib/                # ライブラリ設定
│   └── supabase.ts     # Supabaseクライアント
├── plugins/            # Vue プラグイン
│   └── vuetify.ts      # Vuetify設定
├── router/             # ルーティング設定
├── stores/             # Pinia ストア
├── utils/              # ユーティリティ関数
├── views/              # ページコンポーネント
│   ├── DashBoardPage.vue      # ダッシュボード
│   ├── DiaryRegisterPage.vue  # 日記登録
│   ├── DiaryViewPage.vue      # 日記一覧
│   ├── DiaryReportPage.vue    # レポート
│   ├── LoginPage.vue          # ログイン
│   ├── AccountRegisterPage.vue # アカウント登録
│   └── SettingPage.vue        # 設定
└── App.vue             # ルートコンポーネント
```

## テスト戦略

### テストファイル命名規則
- **形式**: `正常系または異常系_コンポーネント名_ナンバリング.spec.js`
- **例**: `normal_LoginPage_01.spec.js`, `exception_LoginPage_01.spec.js`

### ディレクトリ構造
```
tests/
└── [コンポーネント名]/
    ├── normal_[コンポーネント名]_01.spec.js
    └── exception_[コンポーネント名]_01.spec.js
```

## 🏷️ ラベル管理システム

### 優先度ラベル
- `priority:P0` 🔴 - 最高優先度（緊急・重要）
- `priority:P1` 🟡 - 高優先度（重要）  
- `priority:P2` 🔵 - 中優先度（通常）

<<<<<<< HEAD
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

## デプロイメント

本プロジェクトはVercelで自動デプロイされます。developブランチへのマージで自動的にデプロイが実行されます。

## 貢献

1. Issueを確認し、作業したいものを選択
2. `npm run start-issue [issue番号]` で作業開始
3. 機能実装・テスト追加
4. `npm run create-pr` でPR作成
5. レビュー後、developブランチにマージ

## ライセンス

このプロジェクトはプライベートリポジトリです。

## サポート

質問やバグ報告は [Issues](https://github.com/RsPYP/GoalCategorizationDiary/issues) で受け付けています。
=======
## Claude Codeでの開発

このプロジェクトはClaude Code（claude.ai/code）での開発に最適化されています。詳細な開発ガイドは`CLAUDE.md`を参照してください。

### 主要な開発コマンド
- `npm run dev` - 開発サーバー起動
- `npm run build` - プロダクションビルド
- `npm run test:unit` - ユニットテスト
- `npm run test:e2e` - E2Eテスト
- `npm run lint` - リンティング
- `npm run type-check` - 型チェック
>>>>>>> main
