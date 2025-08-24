# REFERENCE.md - GoalCategorizationDiary詳細リファレンス

このファイルには、CLAUDE.mdでカバーしきれない詳細な技術情報とリファレンスを記載しています。

## 📚 目次

- [完全な技術スタック](#完全な技術スタック)
- [開発コマンド詳細](#開発コマンド詳細)
- [アーキテクチャ詳細](#アーキテクチャ詳細)
- [開発ワークフロー](#開発ワークフロー)
- [テスト戦略](#テスト戦略)
- [セキュリティ詳細](#セキュリティ詳細)
- [環境設定](#環境設定)
- [トラブルシューティング](#トラブルシューティング)

---

## 完全な技術スタック

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
- **状態管理**: Pinia 2.2.8（統合ページネーションストア含む）
- **ルーティング**: Vue Router 4.4.5（認証ガード付き）
- **フォーム管理**: VeeValidate 4.15.1 + カスタムバリデーション

### 品質・テスト
- **テスト**: Vitest 2.1.8 + Playwright 1.48.2 + @vitest/coverage-v8
- **リンティング**: ESLint 9.14.0 + Prettier 3.3.3
- **型チェック**: TypeScript strict mode + vue-tsc

### セキュリティ
- **XSS対策**: DOMPurify 3.2.0
- **認証**: Supabase JWT + RLS
- **CSP**: Content Security Policy（準備中）

---

## 開発コマンド詳細

### 基本開発
```bash
# 開発環境起動
npm run dev

# 型チェック付きビルド
npm run build

# リンティング
npm run lint

# コードフォーマット
npm run format

# 型チェック
npm run type-check

# 全品質チェック
npm run ci:all  # lint + type-check + test + build
```

### テスト実行
```bash
# ユニットテスト
npm run test:unit

# E2Eテスト（初回のみブラウザインストール）
npx playwright install
npm run test:e2e

# カバレッジ付きテスト
npm run test:coverage
```

### Issue自動化システム
```bash
# 完全自動Issue実装（推奨）
npm run auto-issue [issue番号]
# - Issue詳細自動取得
# - Claude Codeによる自動実装
# - コード品質チェック
# - PR自動作成

# Issue一覧表示
npm run fetch-issue

# 特定Issue詳細とタスクファイル生成
npm run fetch-issue [issue番号]

# Issue作業開始（従来方式）
npm run start-issue [issue番号]

# PR作成
npm run create-pr "タイトル" "説明"
```

### セキュリティ・品質
```bash
# セキュリティチェック
npm run lint && npm run type-check

# 依存関係の脆弱性チェック
npm audit

# 脆弱性自動修正（注意して実行）
npm audit fix
```

---

## アーキテクチャ詳細

### ディレクトリ構造
```
src/
├── views/                    # ページコンポーネント
│   ├── AccountRegisterPage.vue    # アカウント登録
│   ├── DashBoardPage.vue          # ダッシュボード
│   ├── DiaryRegisterPage.vue      # 目標登録
│   ├── DiaryReportPage.vue        # レポート画面
│   ├── DiaryViewPage.vue          # 目標表示
│   ├── LoginPage.vue              # ログイン
│   ├── SettingPage.vue            # 設定
│   └── TopPage.vue                # トップページ
├── components/               # 再利用可能コンポーネント
├── stores/                   # Piniaストア
│   ├── auth.ts                    # 認証状態管理
│   ├── diary.ts                   # 日記データ管理
│   └── pagination.ts              # ページネーション共通ロジック
├── lib/                      # 設定・ユーティリティ
│   ├── supabase.ts                # Supabaseクライアント設定
│   ├── validation.ts              # バリデーションルール
│   └── sanitization.ts            # サニタイゼーション
├── assets/                   # 静的リソース
├── router/                   # ルーティング設定
└── types/                    # TypeScript型定義

tests/                        # テストファイル
├── [component]/              # コンポーネント別テスト
│   ├── normal_[Component]_[No].spec.js    # 正常系テスト
│   └── exception_[Component]_[No].spec.js # 異常系テスト
└── e2e/                      # E2Eテスト（Playwright）

docs/                         # ドキュメント
├── DEVELOPMENT/              # 開発関連
├── PROJECT_MANAGEMENT/       # プロジェクト管理
├── SECURITY/                 # セキュリティ
├── ENVIRONMENT/              # 環境設定
└── CI/                       # CI/CD

scripts/                      # 自動化スクリプト
├── create-pr.sh              # PR自動作成
├── fetch-issue.sh            # Issue取得・タスク化
└── start-issue.sh            # Issue作業開始
```

### 重要設定ファイル
- `src/lib/supabase.ts` - Supabaseクライアント設定
- `vite.config.ts` - Viteビルド設定
- `eslint.config.js` - ESLint設定
- `playwright.config.ts` - E2Eテスト設定
- `vitest.config.ts` - ユニットテスト設定

---

## 開発ワークフロー詳細

### 1. Issue理解フェーズ
- `npm run fetch-issue [番号]` でIssue詳細取得
- タスクファイル生成（`tasks/issue-[番号]-tasks.md`）
- 要件定義と制約条件の理解

### 2. 探索・計画フェーズ
- 既存コードの調査（型定義、インターフェース）
- 依存関係チェック（`npm outdated`, `npm audit`）
- アーキテクチャ影響範囲の特定
- テスト戦略の策定

### 3. 段階的実装フェーズ
- **フェーズ1**: 基盤準備
  - 型定義・インターフェース作成
  - 基本構造の実装
- **フェーズ2**: 機能実装
  - コア機能実装
  - ユニットテスト同時作成（必須）
- **フェーズ3**: 統合・最適化
  - 他コンポーネントとの統合
  - E2Eテストの追加
- **フェーズ4**: 最終検証
  - リファクタリング・コード品質向上

### 4. 品質検証フェーズ
- `npm run ci:all` で全チェック実行
- 型エラー、リントエラーの解決
- テストカバレッジ確認
- セキュリティチェック

### 5. PR作成フェーズ
- `npm run create-pr` で自動PR作成
- レビュー準備（コード説明、テスト結果）
- マージ後のフォローアップ

---

## テスト戦略

### ユニットテスト（Vitest）
- **命名規則**: `正常系または異常系_コンポーネント名_ナンバリング.spec.js`
- **配置**: `tests/[コンポーネント名]/`
- **カバレッジ目標**: 80%以上
- **必須テスト**:
  - 新規ストア・コンポーネント
  - 重要なビジネスロジック
  - API連携部分

### E2Eテスト（Playwright）
- **実行環境**: Chrome, Firefox, Safari
- **テストシナリオ**:
  - ユーザー認証フロー
  - 主要機能の動作確認
  - レスポンシブデザイン
- **データ管理**: テスト専用Supabaseプロジェクト

---

## セキュリティ詳細

### 認証・認可
- **JWT認証**: Supabaseによる安全なトークン管理
- **RLS**: Row Level Security による細かい権限制御
- **セッション管理**: 自動リフレッシュとタイムアウト

### 入力値検証・サニタイゼーション
- **DOMPurify**: XSS攻撃対策
- **VeeValidate**: フォーム入力検証
- **型安全性**: TypeScript strict modeによる型チェック

### データ保護
- **暗号化**: Supabase側での暗号化ストレージ
- **プライバシー**: 個人情報の適切な取り扱い
- **監査**: アクセスログとセキュリティ監視

---

## 環境設定

### 必須環境変数
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
```

### 推奨開発環境
- **エディタ**: VSCode
- **拡張機能**:
  - Volar（Vue 3サポート）
  - Veturは無効化
  - Prettier（コードフォーマット）
  - ESLint（リンティング）

### Claude Code設定
```json
{
  "bypass_permission_prompts": true,
  "auto_save": true,
  "default_branch_prefix": "feature/"
}
```

---

## トラブルシューティング

### よくある問題と解決法

#### 依存関係エラー
```bash
# キャッシュクリア
npm run clean
rm -rf node_modules package-lock.json
npm install

# バージョン競合確認
npm outdated
npm audit
```

#### TypeScript型エラー
```bash
# 型チェック実行
npm run type-check

# よくある解決法
# 1. 型定義の追加・修正
# 2. Supabaseスキーマからの型生成
# 3. any型の具体化
```

#### テスト失敗
```bash
# ユニットテスト詳細実行
npm run test:unit -- --reporter=verbose

# E2Eテスト詳細実行
npm run test:e2e -- --debug

# よくある原因
# 1. セレクタの変更
# 2. 非同期処理のタイミング
# 3. モックの不備
```

#### Supabase認証エラー
```bash
# 環境変数確認
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_KEY

# よくある原因
# 1. RLSポリシー設定
# 2. セッション期限切れ
# 3. 権限不足
```

---

## 参考情報

### 公式ドキュメント
- [Vue 3](https://vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Supabase](https://supabase.com/docs)
- [Vuetify](https://vuetifyjs.com/)
- [Pinia](https://pinia.vuejs.org/)

### プロジェクト固有リソース
- **GitHub**: リポジトリ管理・Issue追跡
- **Vercel**: デプロイメント・本番環境
- **Supabase Dashboard**: データベース・認証管理

---

**更新日**: 2025-08-24
**バージョン**: GoalCategorizationDiary v1.0