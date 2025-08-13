# CLAUDE.md

このファイルは、Claude Code（claude.ai/code）がGoalCategorizationDiaryプロジェクトでコードを作業する際のガイダンスを提供します。

## プロジェクト概要

**Goal Categorization Diary**は、ユーザーが目標を設定し、進捗を追跡するためのWebアプリケーションです。Vue 3 + TypeScript + Supabaseを使用したモダンなSPA（Single Page Application）として構築されています。

## 開発コマンド

```bash
# 依存関係のインストール
npm install

# 開発環境起動（ホットリロード有効）
npm run dev

# 型チェック付きプロダクションビルド
npm run build

# ビルドのプレビュー
npm run preview

# ユニットテスト実行
npm run test:unit

# E2Eテスト実行（初回のみブラウザインストール）
npx playwright install
npm run test:e2e

# 型チェック実行
npm run type-check

# リンティング（自動修正）
npm run lint

# コードフォーマット
npm run format
```

## 技術スタック

### フロントエンド
- **フレームワーク**: Vue 3 (Composition API)
- **言語**: TypeScript
- **ビルドツール**: Vite
- **UIフレームワーク**: Vuetify 3 (Material Design)
- **状態管理**: Pinia
- **ルーティング**: Vue Router 4
- **チャート**: Chart.js + vue-chartjs

### バックエンド・インフラ
- **BaaS**: Supabase（認証、データベース、リアルタイム機能）
- **デプロイ**: Vercel（自動デプロイ）

### 開発・テスト
- **テスト**: Vitest（ユニット）, Playwright（E2E）
- **リンティング**: ESLint
- **フォーマット**: Prettier

## アーキテクチャと構造

### ディレクトリ構造

```
src/
├── components/          # 再利用可能なコンポーネント
│   ├── MyComponent.vue
│   └── SupabaseComponent.vue
├── views/              # ページコンポーネント
│   ├── TopPage.vue         # トップページ
│   ├── LoginPage.vue       # ログインページ
│   ├── AccountRegisterPage.vue # アカウント登録
│   ├── DashBoardPage.vue   # ダッシュボード
│   ├── DiaryRegisterPage.vue # 目標登録
│   ├── DiaryViewPage.vue   # 目標表示
│   ├── DiaryReportPage.vue # レポート画面
│   ├── SettingPage.vue     # 設定
│   └── HelpPage.vue        # ヘルプ
├── router/             # ルーティング設定
│   └── index.ts
├── stores/             # Pinia状態管理
│   └── counter.ts
├── lib/                # 外部ライブラリ設定
│   └── supabase.ts
├── utils/              # ユーティリティ関数
│   └── auth.ts
├── App.vue            # メインアプリケーション
└── main.ts            # エントリーポイント
```

### 認証システム

- **認証状態管理**: `src/utils/auth.ts`の`isAuthenticated()`関数
- **ルートガード**: Vue Routerの`beforeEach`ガード
- **認証が必要なルート**: `meta: { requiresAuth: true }`で設定
- **ログイン後リダイレクト**: クエリパラメータで元ページを記憶

### UIアーキテクチャ

**App.vue**が全体レイアウトを管理：
- **サイドバー**: `v-navigation-drawer`（ログイン後のみ表示）
- **ツールバー**: `v-app-bar`（タイトル、ユーザーメニュー）
- **メインコンテンツ**: `router-view`でページを動的表示

## Supabase設定

### 環境変数

プロジェクトルートに`.env`ファイルを作成：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
```

### Supabaseクライアント

`src/lib/supabase.ts`でクライアント初期化：
- 環境変数の検証機能付き
- エラーハンドリング実装済み

## 開発パターンとベストプラクティス

### コンポーネント開発
1. **Composition API**を使用
2. **TypeScript**での型定義を徹底
3. **Vuetify**コンポーネントを活用したMaterial Design準拠
4. **単一責任の原則**でコンポーネント分割

### ルーティング
- **遅延ローディング**（dynamic import）でバンドルサイズ最適化
- **認証ガード**で保護されたルート管理
- **meta情報**でルート情報管理

### 状態管理
- **Pinia**でモダンな状態管理
- **Composition API**スタイルでの記述

## テスト戦略

### テストファイル命名規則
```
正常系または異常系_コンポーネント名_ナンバリング.spec.js
```

**例:**
- `normal_LoginPage_01.spec.js`
- `exception_LoginPage_01.spec.js`

### テストディレクトリ構造
```
tests/
└── [コンポーネント名]/
    ├── normal_ComponentName_01.spec.js
    └── exception_ComponentName_01.spec.js
```

## 重要なファイルと設定

### 設定ファイル
- `vite.config.ts` - Viteビルド設定（@エイリアス設定済み）
- `tsconfig.json` - TypeScript設定
- `eslint.config.js` - ESLint設定
- `playwright.config.ts` - E2Eテスト設定
- `vitest.config.ts` - ユニットテスト設定

### エイリアス設定
- `@/` → `src/`ディレクトリ（Vite設定済み）

## MCP（Model Context Protocol）統合

### Serena MCP Server

このプロジェクトには**Serena MCP Server**が統合されており、AIコーディングエージェント機能を提供します。

**主要機能:**
- セマンティックコード解析とシンボルレベル編集
- IDE風の機能（定義ジャンプ、参照検索、リファクタリング）
- 多言語サポート（JavaScript、TypeScript、Vue、Python等）
- プロジェクトコンテキストの理解とメモリ管理

**設定状況:**
- MCPサーバー: `serena`（自動設定済み）
- コンテキスト: `ide-assistant`
- プロジェクトパス: 自動検出
- メモリファイル: `.serena/memories/`（gitignore済み）

**使用方法:**
```bash
# MCP接続状況の確認
claude mcp list

# Serenaの再起動（必要時）
claude mcp restart serena
```

**Serenaへの質問例:**
- "このVueコンポーネントの構造を分析して"
- "TypeScriptの型エラーを修正して"
- "コードの最適化提案をして"
- "プロジェクト全体のアーキテクチャを説明して"

## デプロイメント

- **プラットフォーム**: Vercel
- **自動デプロイ**: GitHubプッシュ時に自動実行
- **環境変数**: Vercelダッシュボードで設定

## 現在の開発状況

### 現在の作業フォーカス
- 目標の登録機能の改善
- ユーザーインターフェースの改善
- 進捗の記録機能の実装

### 最近の変更
- 目標の登録ページのUI改善
- Vuetifyを使用したMaterial Design対応
- 認証システムの実装

### 次のステップ
1. 進捗の記録機能の実装
2. データ可視化（Chart.js）の充実
3. ユーザーフィードバックに基づく改善

### 技術的決定事項
- コンポーネントベースの設計パターンを採用
- Composition APIを標準とする
- TypeScriptでの厳密な型チェックを実施

## 開発ワークフロー

### コミット前チェックリスト
1. **型チェック**: `npm run type-check`
2. **リンティング**: `npm run lint`
3. **テスト実行**: `npm run test:unit`
4. **ビルド確認**: `npm run build`

### 新機能開発時の手順
1. 該当するViewまたはComponentの作成/修正
2. 必要に応じてルーティング追加（認証が必要な場合は`meta: { requiresAuth: true }`）
3. テストケース作成（命名規則に従う）
4. TypeScript型定義の追加
5. ドキュメント更新

## 開発時の注意点

### 必須事項
1. **型チェック**: コミット前に`npm run type-check`を実行
2. **リンティング**: `npm run lint`でコード品質を保持
3. **テスト**: 新機能追加時はテストも併せて作成
4. **認証**: 新しい保護されたルート追加時は`meta: { requiresAuth: true }`を忘れずに
5. **環境変数**: Supabase設定は`.env`ファイルで管理（リポジトリにコミットしない）

### コーディング規約
1. **Vue 3 Composition API**を使用
2. **TypeScript**での厳密な型付け
3. **Vuetify**コンポーネントを優先使用
4. **単一責任の原則**でコンポーネント分割
5. **ファイル名**: PascalCaseを使用（例: DiaryRegisterPage.vue）

## トラブルシューティング

### よくある問題と解決方法

1. **Supabase接続エラー**
   - `.env`ファイルの環境変数を確認
   - SupabaseダッシュボードでAPI設定を確認

2. **認証関連の問題**
   - `localStorage`のuser情報を確認
   - ルーターガードの設定を確認

3. **ビルドエラー**
   - TypeScriptの型エラーを解決
   - 未使用のimportを削除

4. **Vuetifyコンポーネントが表示されない**
   - Vuetifyのテーマ設定を確認
   - 必要なアイコンパックの読み込みを確認

## プロジェクト進化の記録

### 技術選択の経緯
1. **Vue 3**: Composition APIとTypeScript統合の優位性
2. **Vuetify 3**: Material Designガイドラインに準拠したUI
3. **Supabase**: 認証とリアルタイム機能の簡単な実装
4. **Vercel**: Vue.jsアプリの高速デプロイ

### アーキテクチャの進化
- 初期: 単純なVueアプリ
- 現在: 認証付きSPA、コンポーネントベース設計
- 今後: PWA対応、オフライン機能追加予定

## Claude Codeプロジェクト

このプロジェクトはClaude Code（claude.ai/code）での開発に最適化されています。このCLAUDE.mdファイルには、プロジェクトの全ての情報が集約されています。