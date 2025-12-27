# CLAUDE.md - Refeel開発ガイド

> **対象**: 開発者・Claude Code
> **初見者**: まず [README.md](README.md) でプロジェクト概要とセットアップを確認

**Vue 3 + TypeScript + Supabase** による振り返り・感情分析Webアプリケーション

## 🚀 クイックスタート

### 技術スタック

- **Node.js**: v20.19.0以降必須（Vite 7、Vitest 4、jsdom 27等がNode.js 20+要求）
- **フロントエンド**: Vue 3.5 + TypeScript 5.6 + Vite 5.4
- **バックエンド**: Supabase 2.49（JWT認証、PostgreSQL、RLS）
- **UI**: Vuetify 3.7（Material Design）
- **状態管理**: Pinia 2.2
- **テスト**: Vitest 2.1 + Playwright 1.48
- **デプロイ**: Vercel自動デプロイ

### 頻用コマンド

```bash
npm run dev          # 開発サーバー起動
npm run ci:all       # 全品質チェック（lint+型+テスト+ビルド）
npm run auto-issue   # Issue自動実装（推奨）
npm run test:unit    # ユニットテスト
npm run build        # 本番ビルド
npm run generate-types  # Supabase型定義生成
```

詳細コマンド: [docs/DEVELOPMENT/DEVELOPMENT_COMMANDS.md](docs/DEVELOPMENT/DEVELOPMENT_COMMANDS.md)

### 環境変数設定

```bash
cp .env.example .env    # 環境変数テンプレートをコピー
supabase start          # Supabaseローカル環境を起動
npm run dev             # 開発サーバーを起動
```

詳細セットアップ: [docs/ENVIRONMENT/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT/ENVIRONMENT_SETUP.md)

## ⚡ 開発フロー（6ステップ）**【厳守】**

1. **最新状態取得** → **必須**: `git pull origin main` で最新状態に更新
2. **フィーチャーブランチ作成** → **必須**: `git checkout -b feature/[issue-number]-[description]`
3. **Issue理解** → `npm run fetch-issue [番号]` でタスク確認
4. **探索・計画** → アーキテクチャ理解、依存関係確認
5. **段階的実装** → 最小単位で実装→テスト→品質チェック
6. **PR作成** → 品質検証後、`npm run create-pr` で自動作成

### 🚨 ブランチ戦略（絶対厳守）

```bash
# ✅ 正しい手順
git pull origin main                                    # 1. 最新状態取得
git checkout -b feature/issue-123-diary-fix           # 2. フィーチャーブランチ作成
# ... 実装作業 ...
git push -u origin feature/issue-123-diary-fix        # 3. リモートにプッシュ
npm run create-pr                                      # 4. PR作成

# ❌ 絶対禁止
git commit -m "fix" main                               # mainブランチ直接コミット
git push origin main                                   # mainブランチ直接プッシュ
```

## 🎯 重要原則（絶対厳守）

### TypeScript厳格モード

- 型定義必須、`any`禁止
- インターフェース設計を先行
- 実装前に型チェック: `npm run type-check`

### Supabase認証セキュリティ

- RLS（Row Level Security）必須
- JWT認証状態の厳密チェック
- 入力値検証・サニタイゼーション（DOMPurify使用）

### Vue 3 Composition API

- `<script setup>`記法使用
- Pinia状態管理パターン遵守
- リアクティビティの適切な活用

### モジュール設計

- **1ファイル200行以下を目標**: 大きなファイルは機能別に分割
- **単一責任原則**: 1ファイル1機能の明確な責務分担
- **依存関係注入**: 疎結合な設計で保守性向上
- 詳細パターン: [docs/DEVELOPMENT/CODE_PATTERNS.md](docs/DEVELOPMENT/CODE_PATTERNS.md)

### 段階的実装

- 最小単位での確認（実装→テスト→品質チェック）
- 新規コンポーネント・ストアは必ずユニットテスト同時作成
- 既存テスト破綻は即座修正
- **テスト実行**: 新規・修正したテストのみ確認、既存の全テスト実行は不要（PR時にCI/CDで自動実行）

### 親チケット・子チケット管理

- **親チケット**: **タイトル部分**に`[親チケット]`を必ず記載
- **子チケット**: 具体的な実装タスクを記載
- **作業優先度**: 子チケットを優先的に実装、親チケットは統合・調整で使用

### CI/CD品質ゲート対応（Issue #194の教訓）

- **型インポート完全性**: 新しい型を使用する場合は必ずimport文に追加
  - ❌ `NotificationChannel`型を使用しているのにimportが不足
  - ✅ 使用する全ての型を適切にimport
- **テスト契約の遵守**: テストが期待する戻り値型と実装を一致させる
  - ❌ `Promise<void>`なのにテストが`{success, channels, errors}`を期待
  - ✅ テスト仕様と実装仕様を同期
- **段階的品質チェック**: 大規模修正時は小刻みにCI/CD確認
  - ❌ 複数の問題を一度に修正してCI/CD失敗の原因特定困難
  - ✅ 1つずつ修正→コミット→CI/CD確認のサイクル
- **デバッグログ制御**: テスト環境でのコンソール出力は慎重に
  - ❌ 大量の`console.log`でEPIPEエラーやテストタイムアウト
  - ✅ 本番では有効、テスト環境では無効化
- **未使用変数の適切な処理**: ESLintルールに従った命名規則
  - ❌ 未使用引数をそのまま放置してESLintエラー
  - ✅ `_type`, `_cron`のようにアンダースコアプリフィックス使用

## 📁 アーキテクチャ概要

```
src/
├── views/           # ページコンポーネント
│   ├── LoginPage.vue
│   ├── DashBoardPage.vue
│   └── ...
├── stores/          # Piniaストア
│   ├── auth.ts      # 認証状態
│   ├── diary.ts     # 日記データ
│   └── ...
├── lib/             # 設定・ユーティリティ
│   ├── supabase.ts  # Supabaseクライアント
│   └── validation.ts # バリデーション
tests/               # テストファイル
├── [component]/     # コンポーネント別
└── e2e/             # E2Eテスト
```

## 🚨 よくある落とし穴

### 認証関連

- 認証状態の未チェック → `authStore.isAuthenticated`確認必須
- ログアウト処理の不備 → `authStore.logout()`の適切な実行
- セッション期限切れ → 自動リダイレクト実装確認

### 型定義の不備（Issue #144で解決済み）

- ❌ `any`型の使用 → 具体的な型定義作成
- ❌ Props/Emitsの型不備 → `defineProps<>`使用
- ✅ **API レスポンスの型不備** → **自動生成された型定義を使用**
  - `src/types/database.ts` - データベーススキーマ型
  - `src/types/supabase.ts` - Supabaseクライアント型
  - `src/types/custom.ts` - カスタム型定義（手動管理）
- ✅ **型定義自動化** → `npm run generate-types` で最新スキーマから生成

### テスト関連

- 新機能のテスト不備 → ユニットテスト必須作成
- E2Eテストの破綻 → Playwrightセレクタ更新
- モック不備 → Supabaseクライアントのモック確認

## 🤖 Claude Code最適化

### 基本方針

- "Do what has been asked; nothing more, nothing less"
- 英語思考→日本語応答
- TodoWrite活用でタスク追跡

### 推奨設定

```json
{
  "bypass_permission_prompts": true,
  "auto_save": true,
  "default_branch_prefix": "feature/"
}
```

### 作業パターン

1. **ブランチ準備**: 必ず`git pull origin main`→フィーチャーブランチ作成
2. **段階的実装**: 最小単位での確認
3. **並列処理**: 複数ツール同時実行
4. **早期品質チェック**: 実装中の`npm run ci:lint && npm run ci:type-check` + 影響範囲テスト
5. **自動化活用**: `npm run auto-issue`での効率化
6. **PR作成**: フィーチャーブランチから必ず作成、`Closes #[Issue番号]`をPR本文に記載

### PR作成時の必須記載項目

```markdown
## Summary
[実装内容の概要を簡潔に記述]

## Test plan
[テスト方法や確認項目のチェックリスト]

Closes #[Issue番号]
```

詳細テンプレート: [docs/PROJECT_MANAGEMENT/PR_CREATION_GUIDE.md](docs/PROJECT_MANAGEMENT/PR_CREATION_GUIDE.md)

## 📚 詳細ドキュメント

| カテゴリ | ドキュメント |
|----------|--------------|
| **開発ワークフロー** | [docs/DEVELOPMENT/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT/DEVELOPMENT_WORKFLOW.md) |
| **コマンド一覧** | [docs/DEVELOPMENT/DEVELOPMENT_COMMANDS.md](docs/DEVELOPMENT/DEVELOPMENT_COMMANDS.md) |
| **アーキテクチャ** | [docs/DEVELOPMENT/ARCHITECTURE.md](docs/DEVELOPMENT/ARCHITECTURE.md) |
| **CI/CD** | [docs/CI/CI_CD_DEVELOPER_GUIDE.md](docs/CI/CI_CD_DEVELOPER_GUIDE.md) |
| **セキュリティ** | [docs/SECURITY/SECURITY_GUIDE.md](docs/SECURITY/SECURITY_GUIDE.md) |
| **Issue・PR管理** | [docs/PROJECT_MANAGEMENT/](docs/PROJECT_MANAGEMENT/) |

全ドキュメント一覧: [docs/README.md](docs/README.md)

## 🔗 外部リソース

公式ドキュメントへのリンク：

- [Vue 3](https://vuejs.org/) - プログレッシブJavaScriptフレームワーク
- [TypeScript](https://www.typescriptlang.org/) - 型安全なJavaScript
- [Supabase](https://supabase.com/docs) - オープンソースFirebase代替
- [Vuetify](https://vuetifyjs.com/) - Vue 3 Material Designコンポーネントライブラリ
- [Pinia](https://pinia.vuejs.org/) - Vue公式状態管理ライブラリ

---

## 🎯 Claude Code向け指示

- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files
- NEVER proactively create documentation files (*.md)
