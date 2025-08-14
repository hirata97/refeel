# CLAUDE.md

このファイルは、Claude Code（claude.ai/code）がこのリポジトリでコードを作業する際のガイダンスを提供します。

## プロジェクト概要

**GoalCategorizationDiary** - 目標設定と進捗追跡のためのVue.js Webアプリケーション
- Vue 3 + TypeScript + Supabase + Vite構成
- Vuetify（Material Design）
- Chart.js（データ可視化）
- Pinia（状態管理）
- Vercel自動デプロイ

## 開発コマンド

### 基本開発コマンド
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

### 🚀 自動Issue実装システム

#### 完全自動化コマンド（推奨）
```bash
# 単一Issue自動実装
npm run auto-issue [issue番号]
# - Issue詳細自動取得
# - Claude Codeによる自動実装
# - コード品質チェック
# - PR自動作成
# 引数なしの場合は最新のオープンIssueを自動選択

# 高度な自動実装（Claude Code API使用）
npm run auto-implement [issue番号]

# 全オープンIssue連続自動実装
npm run auto-cycle
```

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
# Issue作業開始（従来方式）
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

## アーキテクチャと構造

### 技術スタック
- **フロントエンド**: Vue 3 + TypeScript + Vite
- **バックエンド**: Supabase（認証、データベース、リアルタイム更新）
- **UI**: Vuetify（Material Design）
- **チャート**: Chart.js + vue-chartjs
- **状態管理**: Pinia
- **ルーティング**: Vue Router
- **デプロイ**: Vercel（自動デプロイ）

### コンポーネント構造
- `src/views/` - 各ページのメインビュー
  - AccountRegisterPage.vue - アカウント登録
  - DashBoardPage.vue - ダッシュボード
  - DiaryRegisterPage.vue - 目標登録
  - DiaryReportPage.vue - レポート画面
  - DiaryViewPage.vue - 目標表示
  - LoginPage.vue - ログイン
  - SettingPage.vue - 設定
  - TopPage.vue - トップページ

### 重要な設定ファイル
- `src/lib/supabase.ts` - Supabaseクライアント設定
- `vite.config.ts` - Viteビルド設定
- `eslint.config.js` - ESLint設定
- `playwright.config.ts` - E2Eテスト設定

## 開発規則とパターン

### コード規則
1. **命名規則**: Vue標準規則に従う
2. **パッケージマネージャ**: npm使用
3. **型チェック**: TypeScript必須
4. **リンティング**: ESLint + Prettier

### テストパターン
- **テストファイル命名**: `正常系または異常系_コンポーネント名_ナンバリング.spec.js`
- **例**: `normal_LoginPage_01.spec.js`, `exception_LoginPage_01.spec.js`
- **テストディレクトリ**: `tests/[コンポーネント名]/`
- **ユニットテスト**: Vitest
- **E2Eテスト**: Playwright

### Git ワークフロー
- **メインブランチ**: develop
- **フィーチャーブランチ**: `feature/機能名` or `issue/番号-説明`
- **コミットメッセージ**: Conventional Commits形式
- **PR**: developブランチに向けて作成

## 環境設定

### Supabase設定
環境変数ファイル（`.env`）を作成：
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
```

### 推奨開発環境
- エディタ: VSCode
- 拡張機能: 
  - Volar（Vue）
  - Veturは無効化
  - Prettier
  - ESLint

## 自動化スクリプト

### scripts/ ディレクトリ
- `create-pr.sh` - PR自動作成スクリプト
- `fetch-issue.sh` - Issue取得・タスク化スクリプト
- `start-issue.sh` - Issue作業開始スクリプト

### 生成ファイル
- `tasks/issue-[番号]-tasks.md` - Issue用タスク管理ファイル

## 重要な注意点

- TypeScriptの型エラーは必ず解決してからコミット
- リンティング・フォーマットルールに従う
- テストの実行確認を忘れずに行う
- Supabase環境変数の設定確認
- 自動化スクリプトを活用した効率的な開発フロー推奨

## Claude Code使用時の推奨フロー

1. **Issue確認**: `npm run fetch-issue` でタスク確認
2. **作業開始**: `npm run start-issue [番号]` で環境準備
3. **実装作業**: 生成されたプロンプトを使用して依頼
4. **品質確認**: `npm run lint`, `npm run type-check` で検証
5. **PR作成**: `npm run create-pr` で完了