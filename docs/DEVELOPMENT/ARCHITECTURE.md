# プロジェクトアーキテクチャ

## 🏗️ システムアーキテクチャ

- **フロントエンド**: Vue 3.5 + TypeScript 5.6 + Vite 5.4
- **UI フレームワーク**: Vuetify 3.7（Material Design）
- **状態管理**: Pinia 2.2（統合ページネーションストア含む）
- **データ可視化**: Chart.js 4.4 + vue-chartjs 5.3
- **認証・DB**: Supabase 2.49（JWT認証、RLS、リアルタイム更新）
- **フォーム検証**: VeeValidate 4.15 + カスタムルール
- **セキュリティ**: DOMPurify 3.2（XSS対策）+ CSP準備中
- **テスト**: Vitest 2.1 + Playwright 1.48 + @vitest/coverage-v8
- **リンティング**: ESLint 9.14 + Prettier 3.3
- **デプロイ**: Vercel自動デプロイ + CI/CD統合

## 技術スタック

### コア技術

- **フロントエンド**: Vue 3.5.12 + TypeScript 5.6.3 + Vite 5.4.10
- **バックエンド**: Supabase 2.49.1（JWT認証、PostgreSQL、RLS、リアルタイム更新）
- **ビルドツール**: Vite（高速開発サーバー、最適化されたバンドル）

### UI・UX

- **UIフレームワーク**: Vuetify 3.7.6（Material Design 3準拠）
- **アイコン**: @mdi/font 7.4.47（Material Design Icons）
- **データ可視化**: Chart.js 4.4.8 + vue-chartjs 5.3.2
- **レスポンシブデザイン**: Vuetifyブレークポイント + カスタムCSS

### 状態管理・ルーティング

- **状態管理**: Pinia 2.2.6（統合ページネーションストア含む）
- **ルーティング**: Vue Router 4.4.5
- **フォーム管理**: VeeValidate 4.15.1 + @vee-validate/rules

### セキュリティ・検証

- **XSS対策**: DOMPurify 3.2.6
- **フォーム検証**: VeeValidate + カスタムルール
- **入力値サニタイゼーション**: 統合セキュリティレイヤー
- **認証**: Supabase JWT + セッション管理

### 開発・テスト・品質管理

- **テスト**: Vitest 2.1.4 + @vitest/coverage-v8 + @vue/test-utils 2.4.6
- **E2Eテスト**: Playwright 1.48.2
- **リンティング**: ESLint 9.14.0 + @vue/eslint-config-typescript
- **フォーマット**: Prettier 3.3.3
- **型チェック**: vue-tsc 2.1.10

### デプロイ・CI/CD

- **デプロイ**: Vercel（自動デプロイ）
- **CI/CD**: 5項目品質チェック（lint・型・テスト・ビルド・セキュリティ）
- **パッケージ管理**: npm + npm-run-all2

## コンポーネント構造

### src/views/ - 各ページのメインビュー

- `AccountRegisterPage.vue` - アカウント登録
- `DashBoardPage.vue` - ダッシュボード
- `DiaryRegisterPage.vue` - 目標登録
- `DiaryEditPage.vue` - 目標編集
- `DiaryReportPage.vue` - レポート画面（Chart.js統合）
- `DiaryViewPage.vue` - 目標表示（ページネーション・フィルター統合）
- `LoginPage.vue` - ログイン
- `SettingPage.vue` - 設定
- `TopPage.vue` - トップページ
- `HelpPage.vue` - ヘルプページ

### src/components/ - 再利用可能コンポーネント

#### 基本コンポーネント（src/components/base/）

- `BaseButton.vue` - 標準化されたボタン
- `BaseCard.vue` - 統一されたカードレイアウト
- `BaseForm.vue` - フォームバリデーション統合
- `BaseAlert.vue` - アラート・通知表示

#### 機能コンポーネント

- `PaginationComponent.vue` - ページネーション統合コンポーネント（229行）
- `pagination/` - ページネーション機能モジュール
  - `PaginationCore.vue` - 基本機能（185行）
  - `PaginationControls.vue` - ナビゲーション制御（198行）
  - `PaginationAnimation.vue` - アニメーション・エラー処理（166行）
  - `PaginationJump.vue` - ページジャンプ機能（112行）
- `settings/` - 設定タブコンポーネント
  - `ProfileTab.vue` - プロフィール設定
  - `SecurityTab.vue` - セキュリティ設定
  - `DataTab.vue` - データ管理設定
- `DiaryFilter.vue` - 日記フィルタリング
- `SupabaseComponent.vue` - Supabase連携
- `MyComponent.vue` - カスタムコンポーネント

### src/stores/ - Pinia状態管理

#### 認証ストア（モジュール化済み）
- `auth/` - 認証機能モジュール
  - `index.ts` - 統合インターフェース（185行）
  - `session.ts` - セッション管理（258行）
  - `authentication.ts` - ログイン・ログアウト処理（404行）
  - `security.ts` - セキュリティチェック（29行）
  - `lockout.ts` - アカウントロックアウト（33行）

#### その他ストア
- `data.ts` - データ取得・キャッシング（サーバーサイドページネーション対応）
- `pagination.ts` - ページネーション状態管理（URL同期・永続化） ⭐ 新規
- `counter.ts` - カウンター状態（サンプル）

### 重要な設定ファイル

- `src/lib/supabase.ts` - Supabaseクライアント設定
- `src/security/` - 統合セキュリティモジュール
  - `index.ts` - セキュリティ機能統一エクスポート
  - `core/index.ts` - 基本セキュリティ機能
  - `monitoring/index.ts` - セキュリティ監視システム
  - `reporting/index.ts` - セキュリティレポート機能
- `vite.config.ts` - Viteビルド設定
- `eslint.config.js` - ESLint設定
- `playwright.config.ts` - E2Eテスト設定

## ディレクトリ構成（2025年更新版）

```
src/
├── components/          # 再利用可能なコンポーネント
│   ├── base/           # ベースコンポーネント（BaseButton, BaseCard等）
│   ├── pagination/     # ページネーション機能モジュール
│   │   ├── PaginationCore.vue      # 基本機能（185行）
│   │   ├── PaginationControls.vue  # ナビゲーション制御（198行）
│   │   ├── PaginationAnimation.vue # アニメーション処理（166行）
│   │   └── PaginationJump.vue      # ページジャンプ（112行）
│   ├── settings/       # 設定タブコンポーネント
│   │   ├── ProfileTab.vue    # プロフィール設定
│   │   ├── SecurityTab.vue   # セキュリティ設定
│   │   └── DataTab.vue       # データ管理設定
│   ├── PaginationComponent.vue  # ページネーション統合（229行）
│   ├── DiaryFilter.vue          # フィルタリング機能
│   └── SupabaseComponent.vue    # Supabase連携
├── views/              # ページコンポーネント（9ページ）
├── stores/             # Pinia状態管理
│   ├── auth/           # 認証ストアモジュール
│   │   ├── index.ts           # 統合インターフェース（185行）
│   │   ├── session.ts         # セッション管理（258行）
│   │   ├── authentication.ts  # 認証処理（404行）
│   │   ├── security.ts        # セキュリティ（29行）
│   │   └── lockout.ts         # ロックアウト（33行）
│   ├── data.ts         # データ・キャッシング
│   ├── pagination.ts   # ページネーション（新規）
│   └── counter.ts      # サンプル
├── composables/        # Vue3コンポーザブル
│   ├── useSimpleForm.ts     # フォーム管理
│   └── useDataFetch.ts      # データ取得
├── security/           # 統合セキュリティモジュール
│   ├── index.ts        # セキュリティ機能統一エクスポート
│   ├── core/           # 基本セキュリティ機能
│   │   └── index.ts    # セキュリティコア機能
│   ├── monitoring/     # セキュリティ監視
│   │   └── index.ts    # 監視システム・アラート管理
│   └── reporting/      # セキュリティレポート
│       └── index.ts    # インシデント報告・統計
├── utils/              # ユーティリティ関数
│   ├── sanitization.ts      # セキュリティサニタイゼーション
│   ├── auth.ts             # 認証ヘルパー
│   ├── authorization.ts     # 認可制御
│   ├── access-control.ts    # アクセス制御
│   ├── audit-logger.ts      # 監査ログ
│   └── performance.ts       # パフォーマンス監視
├── types/              # TypeScript型定義
│   └── security.d.ts   # セキュリティ型定義
├── router/             # Vue Routerルート定義
├── lib/                # ライブラリ設定
│   └── supabase.ts     # Supabaseクライアント
└── plugins/            # プラグイン設定
    └── vuetify.ts      # Vuetify設定

docs/                   # プロジェクトドキュメント（構造化）
scripts/                # 自動化スクリプト（Issue管理、PR作成等）
tasks/                  # Issue管理ファイル
tests/                  # テストファイル
│   ├── BaseButton/     # コンポーネント別テスト
│   ├── BaseCard/
│   └── BaseForm/
```

## セキュリティアーキテクチャ（2025年強化版）

### 多層防御セキュリティ構成

```
┌─────────────────────────────────────────┐
│         UI Layer (Vue 3.5 + Vuetify)   │
│  - アクセシビリティ対応                  │
│  - レスポンシブセキュリティ               │
├─────────────────────────────────────────┤
│         Validation Layer                │
│  - VeeValidate 4.15（リアルタイム）      │
│  - カスタムルール + i18n                │
│  - フォーム状態管理                     │
├─────────────────────────────────────────┤
│       Sanitization Layer               │
│  - DOMPurify 3.2（XSS対策強化）         │
│  - 入力値サニタイゼーション統合           │
│  - 攻撃パターン検出・ブロック             │
│  - セキュリティ設定管理                  │
├─────────────────────────────────────────┤
│      Authorization Layer               │
│  - アクセス制御（utils/access-control）  │
│  - 認可制御（utils/authorization）       │
│  - 監査ログ（utils/audit-logger）        │
├─────────────────────────────────────────┤
│     Store Layer (Pinia 2.2)           │
│  - 統合セキュリティチェック               │
│  - 状態データ暗号化準備                  │
│  - キャッシュセキュリティ                │
├─────────────────────────────────────────┤
│       Performance Layer                │
│  - パフォーマンス監視                    │
│  - セキュリティメトリクス                │
├─────────────────────────────────────────┤
│       Backend (Supabase 2.49)          │
│  - JWT認証 + 自動更新                   │
│  - RLS（Row Level Security）強化        │
│  - PostgreSQL 15セキュリティ機能        │
└─────────────────────────────────────────┘
```

### セキュリティ機能（2025年強化版）

#### 入力値検証・サニタイゼーション

- **リアルタイムバリデーション**: VeeValidate 4.15による即座検証
- **多層サニタイゼーション**: DOMPurify 3.2 + カスタムルール
- **攻撃パターン検出**: utils/sanitization.tsによる統合チェック
- **サーバーサイド検証**: Supabaseでの最終検証

#### データ保護・暗号化

- **XSS攻撃対策**: HTML/JSタグ完全サニタイゼーション
- **SQLインジェクション対策**: Supabaseパラメータバインディング
- **CSP（Content Security Policy）**: 段階的実装準備中
- **状態データ保護**: Piniaストア暗号化対応準備

#### 認証・認可・監査

- **JWT認証**: Supabase自動トークン管理
- **セッション監視**: リアルタイムセッション状態管理
- **アクセス制御**: utils/access-control.tsによる細かい制御
- **認可システム**: utils/authorization.tsによる権限管理
- **監査ログ**: utils/audit-logger.tsによる操作追跡

#### パフォーマンス・監視

- **セキュリティメトリクス**: utils/performance.tsによる監視
- **異常検出**: パフォーマンス異常とセキュリティリスク連携
- **リアルタイム監視**: Supabaseリアルタイム機能活用
