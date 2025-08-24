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
npm run ci:all       # 全品質チェック（lint+型+テスト+ビルド）
npm run auto-issue   # Issue自動実装（推奨）
npm run test:unit    # ユニットテスト
npm run build        # 本番ビルド
```

## ⚡ 開発フロー（5ステップ）

1. **Issue理解** → `npm run fetch-issue [番号]` でタスク確認
2. **探索・計画** → アーキテクチャ理解、依存関係確認
3. **段階的実装** → 最小単位で実装→テスト→品質チェック
4. **品質検証** → lint・型チェック + 影響範囲のテスト実行（全テスト実行は不要、PR時に自動実行）
5. **PR作成** → `npm run create-pr` で自動作成（自動的に`Closes #[Issue番号]`追加）

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

### 型定義の不備
- `any`型の使用 → 具体的な型定義作成
- Props/Emitsの型不備 → `defineProps<>`使用
- API レスポンスの型不備 → Supabaseスキーマから型生成

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
1. **段階的実装**: 最小単位での確認
2. **並列処理**: 複数ツール同時実行
3. **早期品質チェック**: 実装中の`npm run ci:lint && npm run ci:type-check` + 影響範囲テスト
4. **自動化活用**: `npm run auto-issue`での効率化
5. **PR作成**: 必ず`Closes #[Issue番号]`をPR本文に記載（自動スクリプト使用時は自動追加）

## 📚 詳細情報

複雑な設定やアーキテクチャ詳細は **[docs/REFERENCE.md](docs/REFERENCE.md)** を参照

---

## 🎯 重要指示
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

**重要**: このファイルは80%の作業で必要な情報に特化。詳細情報は必要に応じてREFERENCE.mdを確認すること。