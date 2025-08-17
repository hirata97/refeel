# プロジェクトアーキテクチャ

## 技術スタック

- **フロントエンド**: Vue 3 + TypeScript + Vite
- **バックエンド**: Supabase（認証、データベース、リアルタイム更新）
- **UI**: Vuetify（Material Design）
- **チャート**: Chart.js + vue-chartjs
- **状態管理**: Pinia
- **ルーティング**: Vue Router
- **セキュリティ**: VeeValidate + DOMPurify（バリデーション・サニタイゼーション）
- **デプロイ**: Vercel（自動デプロイ）

## コンポーネント構造

### src/views/ - 各ページのメインビュー

- `AccountRegisterPage.vue` - アカウント登録
- `DashBoardPage.vue` - ダッシュボード
- `DiaryRegisterPage.vue` - 目標登録
- `DiaryReportPage.vue` - レポート画面
- `DiaryViewPage.vue` - 目標表示
- `LoginPage.vue` - ログイン
- `SettingPage.vue` - 設定
- `TopPage.vue` - トップページ

### 重要な設定ファイル

- `src/lib/supabase.ts` - Supabaseクライアント設定
- `vite.config.ts` - Viteビルド設定
- `eslint.config.js` - ESLint設定
- `playwright.config.ts` - E2Eテスト設定

## ディレクトリ構成

```
src/
├── components/          # 再利用可能なコンポーネント
│   └── base/           # ベースコンポーネント
├── views/              # ページコンポーネント
├── stores/             # Pinia状態管理
├── router/             # Vue Routerルート定義
├── utils/              # ユーティリティ関数
│   ├── validation.ts   # バリデーションルール定義
│   └── sanitization.ts # セキュリティサニタイゼーション
├── composables/        # Vue3コンポーザブル
│   └── useValidation.ts # フォームバリデーション用
├── lib/                # ライブラリ設定
└── plugins/            # プラグイン設定
    └── validation.ts   # バリデーションプラグイン

docs/                   # プロジェクトドキュメント
scripts/                # 自動化スクリプト
tasks/                  # Issue管理ファイル
tests/                  # テストファイル
```

## セキュリティアーキテクチャ

### セキュリティ層の構成

```
┌─────────────────────────────────────────┐
│              UI Layer (Vue)             │
├─────────────────────────────────────────┤
│         Validation Layer                │
│  - VeeValidate（リアルタイムバリデーション） │
│  - カスタムルール（日本語エラーメッセージ）    │
├─────────────────────────────────────────┤
│       Sanitization Layer               │
│  - DOMPurify（XSS対策）                │
│  - 入力値サニタイゼーション                │
│  - 攻撃パターン検出                     │
├─────────────────────────────────────────┤
│         Store Layer (Pinia)            │
│  - セキュリティチェック統合               │
│  - データ整合性確保                     │
├─────────────────────────────────────────┤
│        Backend (Supabase)              │
│  - RLS（Row Level Security）           │
│  - JWT認証                             │
└─────────────────────────────────────────┘
```

### セキュリティ機能

#### 入力値検証
- **リアルタイムバリデーション**: ユーザー入力時の即座検証
- **サーバーサイド検証**: Supabaseでの最終検証
- **カスタムルール**: 業務要件に応じた独自バリデーション

#### データ保護
- **XSS攻撃対策**: HTMLタグのサニタイゼーション
- **SQLインジェクション対策**: パラメータバインディング
- **CSP（Content Security Policy）**: 将来実装予定

#### 認証・認可
- **JWT認証**: Supabaseによる安全な認証
- **セッション管理**: 自動トークン更新
- **アクセス制御**: ユーザー権限に基づくデータアクセス