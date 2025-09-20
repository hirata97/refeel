---
description: Issue実装完全自動化
---

# Issue実装完全自動化

現在のブランチのissueを完全自動で実装します。開発開始から品質チェック、PR作成まで一貫して実行。

## 完全自動化フロー

### 1. 準備フェーズ
- ブランチ状態確認
- Issue番号自動抽出
- Issue詳細取得・要件分析
- 実装計画作成

### 2. 環境準備
```bash
git pull origin main  # 最新状態確保
npm run generate-types  # 型定義更新
npm ci --prefer-offline --no-audit --no-fund  # 依存関係最適化
```

### 3. 実装フェーズ
- TodoWriteでタスク分解・管理
- 段階的実装（コンポーネント→ストア→テスト）
- リアルタイム品質チェック
- 既存テスト破綻の即座修正

### 4. 品質保証フェーズ
```bash
npm run ci:lint          # ESLint検証
npm run ci:type-check    # TypeScript型検証
npm run test:unit        # 新規・修正テストのみ実行
npm run build           # ビルド検証
```

### 5. 完了フェーズ
- PR作成（Root Cause Analysis含む）
- `Closes #[Issue番号]` 自動記載
- 品質チェック結果レポート

## 実装品質基準

### TypeScript厳格モード
- `any`型完全禁止
- Props/Emits型定義必須
- API型定義は自動生成型使用

### Vue 3ベストプラクティス
- `<script setup>`記法統一
- Composition API活用
- Piniaストアパターン遵守

### セキュリティ基準
- Supabase RLS確認
- 入力値検証・サニタイゼーション
- JWT認証状態厳密チェック

現在のブランチのissueを完全自動で実装開始してください。