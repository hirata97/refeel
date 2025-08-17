# プロジェクトアーキテクチャ

## 技術スタック

- **フロントエンド**: Vue 3 + TypeScript + Vite
- **バックエンド**: Supabase（認証、データベース、リアルタイム更新）
- **UI**: Vuetify（Material Design）
- **チャート**: Chart.js + vue-chartjs
- **状態管理**: Pinia
- **ルーティング**: Vue Router
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
├── lib/                # ライブラリ設定
└── plugins/            # プラグイン設定

docs/                   # プロジェクトドキュメント
scripts/                # 自動化スクリプト
tasks/                  # Issue管理ファイル
tests/                  # テストファイル
```