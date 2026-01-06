# プロジェクトアーキテクチャ

## 🏗️ 技術スタック

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

## 📁 ディレクトリ構成（Feature-based + Shared構造）

```
src/
├── features/           # 機能別モジュール（ドメイン駆動設計）
│   ├── auth/          # 認証・セキュリティ機能
│   │   ├── components/     # 認証関連コンポーネント
│   │   ├── composables/    # 認証コンポーザブル（useAuthGuard等）
│   │   ├── services/       # 認証サービス（session, lockout, password, audit）
│   │   ├── stores/         # 認証ストア（auth.ts, security.ts）
│   │   ├── types/          # 認証型定義
│   │   ├── utils/          # 認証ユーティリティ（guards等）
│   │   └── security/       # セキュリティモジュール
│   │       ├── core/           # セキュリティコア機能
│   │       ├── monitoring/     # セキュリティ監視
│   │       ├── reporting/      # セキュリティレポート
│   │       └── utils/          # セキュリティユーティリティ
│   ├── dashboard/     # ダッシュボード機能
│   │   ├── components/     # ダッシュボードコンポーネント
│   │   ├── composables/    # ダッシュボードコンポーザブル
│   │   └── types/          # ダッシュボード型定義
│   ├── diary/         # 日記機能
│   │   ├── components/     # 日記コンポーネント
│   │   └── composables/    # 日記コンポーザブル
│   ├── mood/          # 気分記録機能
│   │   ├── components/     # 気分記録コンポーネント
│   │   ├── stores/         # 気分記録ストア
│   │   └── types/          # 気分記録型定義
│   ├── notifications/ # 通知機能
│   │   ├── components/     # 通知コンポーネント
│   │   ├── composables/    # 通知コンポーザブル
│   │   └── stores/         # 通知ストア
│   ├── privacy/       # プライバシー機能
│   │   ├── components/     # プライバシーコンポーネント
│   │   └── utils/          # プライバシーユーティリティ
│   ├── reports/       # レポート機能
│   │   ├── components/     # レポートコンポーネント
│   │   ├── composables/    # レポートコンポーザブル
│   │   ├── services/       # レポートサービス
│   │   └── types/          # レポート型定義
│   └── settings/      # 設定機能
│       ├── components/     # 設定コンポーネント
│       └── stores/         # 設定ストア
├── shared/            # 共通コンポーネント・ユーティリティ
│   ├── components/    # 共通コンポーネント
│   │   ├── base/          # ベースコンポーネント（BaseButton, BaseCard等）
│   │   ├── a11y/          # アクセシビリティコンポーネント
│   │   └── pagination/    # ページネーションコンポーネント
│   ├── composables/   # 共通コンポーザブル
│   ├── utils/         # 共通ユーティリティ
│   └── types/         # 共通型定義
├── views/             # ページコンポーネント（機能別）
│   ├── auth/          # 認証ページ（LoginPage, AccountRegisterPage）
│   ├── dashboard/     # ダッシュボードページ
│   ├── diary/         # 日記ページ（Register, Edit, View）
│   ├── reports/       # レポートページ
│   └── settings/      # 設定ページ
├── core/              # コア機能（アプリ全体の基盤）
│   ├── config/        # アプリケーション設定
│   ├── lib/           # ライブラリ設定（supabase.ts等）
│   ├── plugins/       # プラグイン設定（vuetify.ts等）
│   ├── router/        # Vue Routerルート定義
│   └── stores/        # コアストア（app.ts等）
├── components/        # レガシーコンポーネント（段階的移行中）
├── composables/       # レガシーコンポーザブル（段階的移行中）
├── stores/            # レガシーストア（段階的移行中）
├── services/          # ビジネスロジック・サービス層
├── types/             # TypeScript型定義
│   ├── database.ts    # データベーススキーマ型（自動生成）
│   ├── supabase.ts    # Supabaseクライアント型（自動生成）
│   └── custom.ts      # カスタム型定義（手動管理）
├── utils/             # ユーティリティ関数
│   └── security/      # セキュリティユーティリティ
└── styles/            # グローバルスタイル

docs/                  # プロジェクトドキュメント（構造化）
scripts/               # 自動化スクリプト（Issue管理、PR作成等）
tasks/                 # Issue管理ファイル
tests/                 # テストファイル
```

## 🎯 Feature-based構造の設計原則

### 1. 機能別モジュール化（features/）

各機能（feature）は独立したモジュールとして設計され、以下の構造を持つ：

- **components/**: その機能専用のコンポーネント
- **composables/**: その機能専用のコンポーザブル
- **services/**: ビジネスロジック層
- **stores/**: 状態管理
- **types/**: 型定義
- **utils/**: ユーティリティ関数

### 2. 共通コード（shared/）

複数の機能で共有されるコードは `shared/` に配置：

- **components/**: 汎用的なUIコンポーネント（BaseButton, BaseCard等）
- **composables/**: 汎用的なコンポーザブル（useAppRouter, useErrorHandler等）
- **utils/**: 汎用的なユーティリティ関数
- **types/**: 共通型定義

### 3. コア機能（core/）

アプリケーション全体の基盤となる設定・ライブラリ：

- **config/**: アプリケーション設定
- **lib/**: 外部ライブラリ設定（Supabase等）
- **plugins/**: Vueプラグイン設定（Vuetify等）
- **router/**: ルーティング設定
- **stores/**: アプリ全体の状態管理

### 4. ページコンポーネント（views/）

ページコンポーネントは機能別に分類され、featuresモジュールを組み合わせて構成：

- `views/auth/` → `features/auth/` を使用
- `views/dashboard/` → `features/dashboard/` を使用
- `views/diary/` → `features/diary/` を使用

## 📐 importパス規約

```typescript
// ✅ 推奨: エイリアスパスを使用
import { useAuthStore } from '@features/auth/stores/auth'
import { BaseButton } from '@shared/components/base'
import { supabase } from '@core/lib/supabase'

// ❌ 非推奨: 相対パスは避ける
import { useAuthStore } from '../../../features/auth/stores/auth'

// ✅ エイリアス定義（vite.config.ts）
{
  '@features': '/src/features',
  '@shared': '/src/shared',
  '@core': '/src/core',
  '@views': '/src/views',
  '@': '/src'
}
```

## 🔒 セキュリティアーキテクチャ

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
│  - アクセス制御                         │
│  - 認可制御                            │
│  - 監査ログ                            │
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

### セキュリティ機能

#### 入力値検証・サニタイゼーション

- **リアルタイムバリデーション**: VeeValidate 4.15による即座検証
- **多層サニタイゼーション**: DOMPurify 3.2 + カスタムルール
- **攻撃パターン検出**: 統合セキュリティモジュールによる検出
- **サーバーサイド検証**: Supabaseでの最終検証

#### データ保護・暗号化

- **XSS攻撃対策**: HTML/JSタグ完全サニタイゼーション
- **SQLインジェクション対策**: Supabaseパラメータバインディング
- **CSP（Content Security Policy）**: 段階的実装準備中
- **状態データ保護**: Piniaストア暗号化対応準備

#### 認証・認可・監査

- **JWT認証**: Supabase自動トークン管理
- **セッション監視**: リアルタイムセッション状態管理（`features/auth/services/session-manager.ts`）
- **アカウントロックアウト**: ログイン失敗時の保護（`features/auth/services/lockout-manager.ts`）
- **パスワード管理**: 強力なパスワードポリシー（`features/auth/services/password-manager.ts`）
- **監査ログ**: 操作追跡（`features/auth/services/audit-logger.ts`）

#### セキュリティ監視・レポート

- **セキュリティ監視**: `features/auth/security/monitoring/` による異常検知
- **セキュリティレポート**: `features/auth/security/reporting/` によるインシデント報告
- **パフォーマンス監視**: 異常検出とセキュリティリスク連携

## 🧪 テスト戦略

### テスト構成

```
tests/
├── [feature]/          # 機能別テスト
│   ├── unit/          # ユニットテスト
│   └── integration/   # 統合テスト
└── e2e/               # E2Eテスト（Playwright）
```

### テストパターン

- **ユニットテスト**: 各コンポーネント・サービス・ユーティリティの単体テスト
- **統合テスト**: 複数モジュールの連携テスト
- **E2Eテスト**: ユーザーシナリオ全体のテスト

---

**最終更新**: 2026-01-06
**変更履歴**: Feature-based + Shared構造への完全移行、importパス規約追加、セキュリティアーキテクチャ更新
