# Issue #264: データベーススキーマとコードの整合性修正

## 概要
## 概要

データベーススキーマと型定義、ストア実装の不整合を修正し、型安全性を完全に確保します。

## 背景

### 現在の問題
1. **accountsテーブル参照エラー**: `src/stores/data.ts`で存在しない`accounts`テーブルを参照
   ```typescript
   // src/stores/data.ts:210-213
   const { data, error: fetchError } = await supabase
     .from('accounts')  // ❌ 存在しないテーブル
     .select('*')
   ```
   
2. **型定義の不足**: `database.ts`に`emotion_tags`, `diary_emotion_tags`の型定義が存在しない

3. **古いマイグレーションファイル残存**: `scripts/supabase-migration-steps.sql`に未実装テーブルの定義が残存

### 影響範囲
- アカウント関連機能が実行時エラーになる可能性（高）
- 感情タグ機能の型安全性欠如（中）
- 開発者の混乱（どのSQLファイルが正しいか不明確）

## タスク

- [ ] 型定義の完全再生成
  ```bash
  npm run generate-types
  ```
  
- [ ] `src/stores/data.ts`の修正
  - `accounts` → `profiles`に全て置換
  - `Account`型 → `Profile`型に変更
  - インポート文の修正
  
- [ ] 型定義の検証
  - `database.ts`が以下を含むことを確認:
    - `diaries`
    - `profiles`
    - `settings`
    - `emotion_tags`
    - `diary_emotion_tags`
    
- [ ] 古いマイグレーションファイルの整理
  - `scripts/supabase-migration-steps.sql`に非推奨コメント追加または削除
  - `database/README.md`に正しいファイル一覧を明記
  
- [ ] 型チェック実行
  ```bash
  npm run type-check
  ```

## Root Cause Analysis（根本原因分析）

**なぜこの問題が発生したか:**
- [x] 実装時のロジックミス - Issue #180でテーブル名変更時の修正漏れ
- [x] テストケースの不備 - 型定義の完全性チェックが不足

**具体的な原因:**
- PR #183でDB構造を整理した際、`profiles`テーブルに統一したが、`src/stores/data.ts`の修正が漏れた
- `npm run generate-types`が定期実行されていないため、スキーマと型定義がズレた

**今後の予防策:**
- CI/CDに型定義生成チェックを追加（スキーマ変更時の自動検証）
- PR作成時のチェックリストに「型定義の再生成」を追加
- E2Eテストでアカウント関連機能をカバー

## 受け入れ条件

- [ ] `npm run type-check`がエラーなく通る
- [ ] `src/stores/data.ts`で`profiles`テーブルを正しく参照している
- [ ] `database.ts`に全テーブル（5つ）の型定義が存在する
- [ ] `npm run ci:all`が全てグリーン
- [ ] 古いマイグレーションファイルが非推奨化または削除されている

## 影響範囲

### 変更ファイル
- `src/stores/data.ts`（修正）
- `src/types/database.ts`（再生成）
- `scripts/supabase-migration-steps.sql`（削除または非推奨化）

### テスト対象
- プロフィール取得機能
- 感情タグ機能
- 型チェック

## 参考資料

- [database/README.md](../database/README.md)
- [database/schema/master.sql](../database/schema/master.sql)
- [PR #183](https://github.com/hirata97/GoalCategorizationDiary/pull/183) - DB構造整理

## 関連Issue

親チケット: #263

## ラベル
priority:P0,size:S,type-basic:bugfix

## 実装タスク
- [ ] Issue内容の詳細確認
- [ ] 必要なファイルの特定
- [ ] 実装方針の決定
- [ ] コード実装
- [ ] テスト実行
- [ ] 動作確認

## 実行コマンド例
```bash
# Issue作業開始
npm run start-issue 264

# 作業完了後PR作成  
npm run create-pr "fix: Issue #264 データベーススキーマとコードの整合性修正" "Issue #264の対応

Closes #264"
```

## Claude Code用プロンプト
```
Issue #264の対応をお願いします。

タイトル: データベーススキーマとコードの整合性修正
ラベル: priority:P0,size:S,type-basic:bugfix

内容:
## 概要

データベーススキーマと型定義、ストア実装の不整合を修正し、型安全性を完全に確保します。

## 背景

### 現在の問題
1. **accountsテーブル参照エラー**: `src/stores/data.ts`で存在しない`accounts`テーブルを参照
   ```typescript
   // src/stores/data.ts:210-213
   const { data, error: fetchError } = await supabase
     .from('accounts')  // ❌ 存在しないテーブル
     .select('*')
   ```
   
2. **型定義の不足**: `database.ts`に`emotion_tags`, `diary_emotion_tags`の型定義が存在しない

3. **古いマイグレーションファイル残存**: `scripts/supabase-migration-steps.sql`に未実装テーブルの定義が残存

### 影響範囲
- アカウント関連機能が実行時エラーになる可能性（高）
- 感情タグ機能の型安全性欠如（中）
- 開発者の混乱（どのSQLファイルが正しいか不明確）

## タスク

- [ ] 型定義の完全再生成
  ```bash
  npm run generate-types
  ```
  
- [ ] `src/stores/data.ts`の修正
  - `accounts` → `profiles`に全て置換
  - `Account`型 → `Profile`型に変更
  - インポート文の修正
  
- [ ] 型定義の検証
  - `database.ts`が以下を含むことを確認:
    - `diaries`
    - `profiles`
    - `settings`
    - `emotion_tags`
    - `diary_emotion_tags`
    
- [ ] 古いマイグレーションファイルの整理
  - `scripts/supabase-migration-steps.sql`に非推奨コメント追加または削除
  - `database/README.md`に正しいファイル一覧を明記
  
- [ ] 型チェック実行
  ```bash
  npm run type-check
  ```

## Root Cause Analysis（根本原因分析）

**なぜこの問題が発生したか:**
- [x] 実装時のロジックミス - Issue #180でテーブル名変更時の修正漏れ
- [x] テストケースの不備 - 型定義の完全性チェックが不足

**具体的な原因:**
- PR #183でDB構造を整理した際、`profiles`テーブルに統一したが、`src/stores/data.ts`の修正が漏れた
- `npm run generate-types`が定期実行されていないため、スキーマと型定義がズレた

**今後の予防策:**
- CI/CDに型定義生成チェックを追加（スキーマ変更時の自動検証）
- PR作成時のチェックリストに「型定義の再生成」を追加
- E2Eテストでアカウント関連機能をカバー

## 受け入れ条件

- [ ] `npm run type-check`がエラーなく通る
- [ ] `src/stores/data.ts`で`profiles`テーブルを正しく参照している
- [ ] `database.ts`に全テーブル（5つ）の型定義が存在する
- [ ] `npm run ci:all`が全てグリーン
- [ ] 古いマイグレーションファイルが非推奨化または削除されている

## 影響範囲

### 変更ファイル
- `src/stores/data.ts`（修正）
- `src/types/database.ts`（再生成）
- `scripts/supabase-migration-steps.sql`（削除または非推奨化）

### テスト対象
- プロフィール取得機能
- 感情タグ機能
- 型チェック

## 参考資料

- [database/README.md](../database/README.md)
- [database/schema/master.sql](../database/schema/master.sql)
- [PR #183](https://github.com/hirata97/GoalCategorizationDiary/pull/183) - DB構造整理

## 関連Issue

親チケット: #263
```

---
Generated: 2025-11-18 13:33:53
Source: https://github.com/hirata97/GoalCategorizationDiary/issues/264
