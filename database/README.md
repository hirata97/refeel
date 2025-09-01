# Database Documentation

## 概要

このディレクトリには、GoalCategorizationDiary（Refeel）アプリケーションのSupabaseデータベース関連ファイルが含まれています。

## 📊 現在のテーブル構造

### 主要テーブル

#### 1. `diaries` - 日記エントリ
```sql
-- 主要カラム
id               UUID PRIMARY KEY
user_id          UUID NOT NULL (FK to auth.users)
date             TEXT NOT NULL
title            TEXT NOT NULL
content          TEXT NOT NULL
mood             SMALLINT NOT NULL CHECK (1 <= mood <= 10)
mood_reason      TEXT (感情の理由 - Issue #142で追加)
goal_category    TEXT NOT NULL
progress_level   SMALLINT NOT NULL CHECK (0 <= progress_level <= 10)
template_type    TEXT CHECK (template_type IN ('free', 'reflection', 'mood'))
created_at       TIMESTAMPTZ DEFAULT NOW()
updated_at       TIMESTAMPTZ DEFAULT NOW()
encrypted_data   TEXT (将来的な暗号化対応用)
```

#### 2. `emotion_tags` - 感情タグマスタ (Issue #180で追加)
```sql
-- システム管理の感情タグマスタデータ
id               UUID PRIMARY KEY
name             TEXT NOT NULL (感情タグ名)
category         TEXT NOT NULL CHECK (category IN ('positive', 'negative', 'neutral'))
color            TEXT NOT NULL DEFAULT '#757575' (UI表示用カラーコード)
description      TEXT (感情の説明)
display_order    INTEGER NOT NULL DEFAULT 0 (表示順序)
created_at       TIMESTAMPTZ DEFAULT NOW()
updated_at       TIMESTAMPTZ DEFAULT NOW()
```

**マスターデータ**: 20件の感情タグ
- **ポジティブ感情**: 8種類 (達成感、集中、やりがい、安心、充実、興奮、喜び、感謝)
- **ネガティブ感情**: 8種類 (疲労、不安、焦り、失望、孤独、退屈、怒り、悲しみ)  
- **中性感情**: 4種類 (平常、淡々、思考中、準備中)

#### 3. `diary_emotion_tags` - 日記と感情タグの関連 (Issue #180で追加)
```sql
-- 多対多の関連テーブル
id               UUID PRIMARY KEY
diary_id         UUID NOT NULL (FK to diaries.id)
emotion_tag_id   UUID NOT NULL (FK to emotion_tags.id)
created_at       TIMESTAMPTZ DEFAULT NOW()
UNIQUE(diary_id, emotion_tag_id) -- 重複防止
```

#### 4. `profiles` - ユーザープロフィール
```sql
id               UUID PRIMARY KEY
user_id          UUID NOT NULL (FK to auth.users)
username         TEXT NOT NULL
email            TEXT NOT NULL
created_at       TIMESTAMPTZ DEFAULT NOW()
updated_at       TIMESTAMPTZ DEFAULT NOW()
```

#### 5. `settings` - ユーザー設定
```sql
id               UUID PRIMARY KEY
user_id          UUID NOT NULL (FK to auth.users)
theme            TEXT DEFAULT 'light'
language         TEXT DEFAULT 'ja'
notifications    BOOLEAN DEFAULT true
created_at       TIMESTAMPTZ DEFAULT NOW()
updated_at       TIMESTAMPTZ DEFAULT NOW()
```

## 🔒 セキュリティ設定

### Row Level Security (RLS)
全テーブルでRLSが有効化されています：

#### diaries テーブル
- ユーザーは自分の日記のみアクセス可能
- `user_id = auth.uid()` による制限

#### emotion_tags テーブル  
- **全ユーザーが読み取り可能** (システムマスターデータのため)
- 管理者のみ更新可能

#### diary_emotion_tags テーブル
- ユーザーは自分の日記に関連する感情タグのみアクセス可能
- 日記テーブルとの結合でuser_id確認

#### profiles, settings テーブル
- ユーザーは自分のデータのみアクセス可能

## 📁 ファイル構成

```
database/
├── README.md                        # このファイル
├── schema/                          # テーブル定義・構造
│   ├── master.sql                  # 全テーブル作成（新規環境用）
│   └── 002_emotion_tags.sql        # 感情タグ機能テーブル作成（統合版）
├── data/                           # 初期・マスターデータ
│   ├── emotion_tags_master.sql     # 感情タグマスターデータ
│   └── test_sample_diaries.sql     # サンプル日記データ
└── maintenance/                    # 運用・メンテナンス
    ├── verify_current_structure.sql # 現在の構造確認用クエリ
    └── rls_policies.sql           # RLSポリシー設定（統合版）
```

### 他の関連ファイル (プロジェクト全体)
```
scripts/                           # 残存運用スクリプト
├── minimal-migration.sql          # 最小マイグレーション
├── supabase-migration-steps.sql   # マイグレーション手順
└── verify-migration.sql           # マイグレーション検証

# 整理済み・削除されたファイル
# ❌ database-setup/ (削除) → database/に統合
# ❌ database/migrations/ (削除) → master.sqlに全て統合済み
# ❌ scripts/check-supabase-tables.sql (削除) → maintenance/に統合 
# ❌ scripts/debug-supabase-status.sql (削除) → 不要
# ❌ test-data*.sql (削除) → database/data/に移動
# ❌ fix-mood-constraint.sql (削除) → master.sqlに統合済み
```

## 🚀 セットアップ手順

### 新規環境での初期化

#### 🚀 **クイックセットアップ（推奨）**
```bash
# 1. 全テーブル一括作成
psql < database/schema/master.sql

# 2. マスターデータ投入
psql < database/data/emotion_tags_master.sql

# 3. RLSポリシー設定
psql < database/maintenance/rls_policies.sql
```

#### 🔧 **段階的セットアップ（カスタマイズ用）**
```bash
# 1. 感情タグ機能のみ追加（既存環境）
psql < database/schema/002_emotion_tags.sql
psql < database/data/emotion_tags_master.sql

# 2. 個別RLS設定（必要に応じて）
psql < database/maintenance/rls_policies.sql
```

4. **テストデータ投入** (開発環境のみ)
   ```bash
   # user_idを実際の値に置換してから実行
   psql < database/data/test_sample_diaries.sql
   ```

### 構造確認

```bash
# 現在の構造を確認
psql < database/maintenance/verify_current_structure.sql
```

## 🔧 開発・運用ガイド

### データベース変更のルール

1. **新機能追加時**
   - `database/schema/` に新しいテーブル定義を追加
   - `database/data/` に必要なマスターデータを作成
   - `database/maintenance/rls_policies.sql` にセキュリティ設定を追加
   - `master.sql` を更新（新規環境対応）

2. **テーブル変更時**
   - 既存環境向けの変更SQLを `database/schema/` に作成
   - `master.sql` に変更を反映
   - 影響範囲の確認とテスト実行

3. **品質保証**
   - `verify_current_structure.sql` でテーブル構造確認
   - 新規環境での `master.sql` 実行テスト
   - RLSポリシーの動作確認

### トラブルシューティング

#### よくある問題

1. **RLSエラー**: "Row Level Security is enabled"
   ```sql
   -- ポリシーが正しく設定されているか確認
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

2. **感情タグが表示されない**
   ```sql
   -- emotion_tagsテーブルにデータが存在するか確認
   SELECT category, COUNT(*) FROM emotion_tags GROUP BY category;
   ```

3. **外部キー制約エラー**
   ```sql
   -- 制約の確認
   SELECT * FROM information_schema.table_constraints 
   WHERE constraint_type = 'FOREIGN KEY';
   ```

### パフォーマンス最適化

#### 推奨インデックス
```sql
-- 既存の主要インデックス
CREATE INDEX idx_diaries_user_id ON diaries(user_id);
CREATE INDEX idx_diaries_date ON diaries(date);
CREATE INDEX idx_diary_emotion_tags_diary_id ON diary_emotion_tags(diary_id);
CREATE INDEX idx_diary_emotion_tags_emotion_tag_id ON diary_emotion_tags(emotion_tag_id);
CREATE INDEX idx_emotion_tags_category ON emotion_tags(category);
```

## 📝 変更履歴

| 日付 | Issue | 変更内容 |
|------|-------|----------|
| 2024-09-01 | #182 | データベース構造完全整理・master.sql作成 |
| 2024-08-31 | #180 | 感情タグ機能の完全実装、既存タグシステム排除 |
| 2024-08-31 | #164 | 感情タグマスターデータ・関連テーブル追加 |

## 🔗 関連ドキュメント

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [PostgreSQL公式ドキュメント](https://www.postgresql.org/docs/)
- プロジェクトルートの `CLAUDE.md` - 開発環境セットアップ
- `docs/ENVIRONMENT/SUPABASE_QUICK_SETUP.md` - Supabase設定ガイド