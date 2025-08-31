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
├── verify_current_structure.sql     # 現在の構造確認用クエリ
└── migrations/                      # データベースマイグレーション
    ├── add_emotion_tags.sql         # 感情タグ機能追加 (Issue #164)
    ├── add_mood_reason_to_diaries.sql # mood_reason追加 (Issue #142)
    ├── add_template_type_to_diaries.sql # template_type追加
    └── tag_goal_integration.sql     # タグ・目標連携機能（現在未使用）
```

### 他の関連ファイル (プロジェクト全体)
```
database-setup/                     # 感情タグ関連セットアップ (Issue #180)
├── emotion_tags_tables.sql         # テーブル作成SQL
├── insert_emotion_tags_master_data.sql # マスターデータ投入
├── fix_rls_security.sql           # RLSセキュリティ修正
└── fix_emotion_tags_rls_policy.sql # 感情タグ用RLSポリシー修正

scripts/                            # 運用・デバッグ用
├── check-supabase-tables.sql       # テーブル構造確認
├── debug-supabase-status.sql       # デバッグ用クエリ
└── verify-migration.sql            # マイグレーション検証

test-data.sql                       # テスト用データ
test-data-small.sql                 # 最小テストデータ
fix-mood-constraint.sql             # mood制約修正
```

## 🚀 セットアップ手順

### 新規環境での初期化

1. **基本テーブル作成**
   ```sql
   -- Supabaseプロジェクト作成後、以下を順次実行
   ```

2. **マイグレーション適用** (推奨順序)
   ```bash
   # 1. 基本構造 (Supabaseダッシュボードで作成済みの想定)
   # 2. 追加フィールド
   psql < database/migrations/add_mood_reason_to_diaries.sql
   psql < database/migrations/add_template_type_to_diaries.sql
   
   # 3. 感情タグ機能
   psql < database/migrations/add_emotion_tags.sql
   
   # または統合版を使用
   psql < database-setup/emotion_tags_tables.sql
   psql < database-setup/insert_emotion_tags_master_data.sql
   ```

3. **RLSポリシー修正** (必要に応じて)
   ```bash
   psql < database-setup/fix_rls_security.sql
   psql < database-setup/fix_emotion_tags_rls_policy.sql
   ```

4. **テストデータ投入** (開発環境のみ)
   ```bash
   # user_idを実際の値に置換してから実行
   psql < test-data-small.sql
   ```

### 構造確認

```bash
# 現在の構造を確認
psql < database/verify_current_structure.sql
```

## 🔧 開発・運用ガイド

### マイグレーション追加のルール

1. **ファイル命名規則**
   ```
   YYYY-MM-DD_description.sql
   例: 2024-08-31_add_emotion_tags.sql
   ```

2. **内容に含めるべき項目**
   - コメント（Issue番号、目的）
   - テーブル作成・変更SQL
   - インデックス作成
   - RLSポリシー設定
   - 初期データ投入（必要に応じて）

3. **テスト**
   - 新規環境での実行テスト
   - 既存データへの影響確認
   - ロールバック手順の検証

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
| 2024-08-31 | #180 | 感情タグ機能の完全実装、既存タグシステム排除 |
| 2024-08-31 | #164 | 感情タグマスターデータ・関連テーブル追加 |
| - | #142 | diariesテーブルにmood_reason追加 |
| - | - | diariesテーブルにtemplate_type追加 |

## 🔗 関連ドキュメント

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [PostgreSQL公式ドキュメント](https://www.postgresql.org/docs/)
- プロジェクトルートの `CLAUDE.md` - 開発環境セットアップ
- `docs/ENVIRONMENT/SUPABASE_QUICK_SETUP.md` - Supabase設定ガイド