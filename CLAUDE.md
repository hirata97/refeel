# CLAUDE.md - GoalCategorizationDiary開発ガイド

**Vue 3 + TypeScript + Supabase**による目標管理Webアプリケーション

## 🚀 クイックスタート（必読）

### 技術スタック
- **フロントエンド**: Vue 3.5 + TypeScript 5.6 + Vite 5.4
- **バックエンド**: Supabase 2.49（JWT認証、PostgreSQL、RLS）
- **UI**: Vuetify 3.7（Material Design）
- **状態管理**: Pinia 2.2
- **テスト**: Vitest 2.1 + Playwright 1.48
- **デプロイ**: Vercel自動デプロイ

### 頻用コマンド
```bash
npm run dev          # 開発サーバー起動
npm run ci:all       # 全品質チェック（型生成+lint+型+テスト+ビルド）
npm run auto-issue   # Issue自動実装（推奨）
npm run test:unit    # ユニットテスト
npm run build        # 本番ビルド

# 型定義関連（Issue #144対応）
npm run generate-types      # ローカル型定義生成
npm run generate-types:prod # 本番型定義生成（Supabase接続）
npm run dev:with-types      # 型生成後に開発サーバー起動
```

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

### 段階的実装
- 最小単位での確認（実装→テスト→品質チェック）
- 新規コンポーネント・ストアは必ずユニットテスト同時作成
- 既存テスト破綻は即座修正
- **テスト実行**: 新規・修正したテストのみ確認、既存の全テスト実行は不要（PR時にCI/CDで自動実行）

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

## Root Cause Analysis (根本原因分析)
**なぜこの問題が発生したか:**
- [ ] 設計段階での考慮不足
- [ ] 実装時のロジックミス
- [ ] テストケースの不備
- [ ] 外部依存関係の変更
- [ ] 要件の理解不足
- [ ] 技術選定の問題
- [ ] その他: [具体的な原因を記述]

**具体的な原因:**
[問題が発生した技術的・プロセス的な詳細を記述]

**今後の予防策:**
[同様の問題を防ぐための具体的な改善案]

## Test plan
[テスト方法や確認項目のチェックリスト]

Closes #[Issue番号]
```

## 📚 詳細情報

複雑な設定やアーキテクチャ詳細は **[docs/REFERENCE.md](docs/REFERENCE.md)** を参照

---

## 🎯 重要指示
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

**重要**: このファイルは80%の作業で必要な情報に特化。詳細情報は必要に応じてREFERENCE.mdを確認すること。