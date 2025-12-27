# Supabase Database Documentation

## 概要

このディレクトリには、GoalCategorizationDiary（Refeel）アプリケーションのSupabaseデータベース関連ファイルが含まれています。

## 📁 ディレクトリ構成

```
supabase/
├── .gitignore               # Supabase CLI自動生成（下記参照）
├── config.toml              # Supabase CLI設定
├── seed.sql                 # Seedデータエントリポイント（supabase db reset で実行）
├── migrations/              # マイグレーションファイル
│   └── 00000000000000_initial_schema.sql  # 初期スキーマ（全テーブル+RLS+マスターデータ）
├── seed/                    # Seedデータ（参照用・手動実行用）
│   ├── 01_seed_profiles.sql
│   ├── 02_seed_settings.sql
│   ├── 03_seed_diaries_full.sql
│   └── 04_seed_diary_emotion_tags.sql
├── scripts/                 # ユーティリティスクリプト
│   ├── seed.sh             # Seedデータ一括投入
│   └── reset.sh            # DB完全リセット
└── README.md               # このファイル
```

### seed.sql について

`supabase db reset` 実行時に自動的に投入されるSeedデータのエントリポイントです。

**技術的背景:**
- Supabase CLIはSQLをバッチ処理するため、複数ファイル間での一時テーブル共有ができません
- `seed.sql`はPL/pgSQLの`DO $$`ブロックで全てを1セッションで実行します
- `seed/`ディレクトリの個別ファイルは参照用・手動実行用として保持しています

### .gitignore について

`supabase/.gitignore`はSupabase CLIが`supabase init`実行時に自動生成するファイルです。

| パターン | 説明 |
|----------|------|
| `.branches` | Supabase CLI内部ファイル（ブランチ管理） |
| `.temp` | Supabase CLI一時ファイル |
| `.env.keys` | dotenvx関連 |
| `.env.local` | ローカル環境変数 |

このファイルはSupabase公式の標準構成であり、ルートの`.gitignore`とは別に管理することで、Supabase固有のignoreルールを明確に分離しています。

## 📊 テーブル構造

### 主要テーブル

| テーブル | 説明 |
|----------|------|
| `diaries` | 日記エントリ（メイン） |
| `profiles` | ユーザープロフィール |
| `settings` | ユーザー設定 |
| `emotion_tags` | 感情タグマスタ（20件） |
| `diary_emotion_tags` | 日記と感情タグの関連（多対多） |

詳細なスキーマ定義は `migrations/00000000000000_initial_schema.sql` を参照してください。

### emotion_tags（感情マスタテーブル）

| カラム | 型 | 説明 |
|--------|-----|-----|
| id | UUID | 主キー |
| name | TEXT | 感情名（例: "達成感"） |
| category | TEXT | positive/negative/neutral |
| color | TEXT | UI表示色 |
| description | TEXT | 説明文 |
| display_order | INTEGER | 表示順序 |

**マスタデータ（20件）:**
- **ポジティブ感情（8種類）**: 達成感、集中、やりがい、安心、充実、興奮、喜び、感謝
- **ネガティブ感情（8種類）**: 疲労、不安、焦り、失望、孤独、退屈、怒り、悲しみ
- **中性感情（4種類）**: 平常、淡々、思考中、準備中

### diary_emotion_tags（日記-感情タグ関連テーブル）

| カラム | 型 | 説明 |
|--------|-----|-----|
| id | UUID | 主キー |
| diary_id | UUID | 日記テーブル外部キー |
| emotion_tag_id | UUID | 感情タグ外部キー |
| created_at | TIMESTAMPTZ | 作成日時 |

## 🔒 セキュリティ（RLS）

全テーブルでRow Level Securityが有効化されています：

- **diaries, profiles, settings**: ユーザー自身のデータのみアクセス可能
- **emotion_tags**: 全ユーザーが読み取り可能（システムマスターデータ）
- **diary_emotion_tags**: ユーザー自身の日記関連のみアクセス可能

## 🚀 セットアップ

### クイックスタート（推奨）

```bash
# Supabaseローカル環境を起動
supabase start

# DB初期化（マイグレーション + シード）
supabase db reset
```

### 手動でSeedデータを投入

```bash
# Supabase起動後
./supabase/scripts/seed.sh
```

### DB完全リセット

```bash
./supabase/scripts/reset.sh
```

## 📝 Seedデータ

開発環境用のテストデータ：

### 開発用アカウント（ログイン可能）

| メールアドレス | パスワード | 用途 |
|----------------|------------|------|
| dev@example.com | password123 | 開発・動作確認用 |

> ⚠️ このアカウントはローカル開発環境専用です。本番環境では使用しないでください。

### テストデータ

| データ | 件数 |
|--------|------|
| 開発用アカウント | 1人（dev） |
| テストユーザー | 5人（alice, bob, charlie, diana, eve）※ログイン不可 |
| 日記エントリ | 75件（各ユーザー15件） |
| 感情タグマスタ | 20件（マイグレーションで投入） |
| 日記-感情タグ関連 | 約75-225件 |

## 🔧 開発ガイド

### スキーマ変更

1. 新しいマイグレーションファイルを作成
   ```bash
   supabase migration new <migration_name>
   ```

2. `migrations/` に生成されたファイルにSQLを記述

3. マイグレーション適用
   ```bash
   supabase db reset
   ```

### 型定義の自動生成

```bash
npm run generate-types
```

## 🔗 関連ドキュメント

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Supabase CLI リファレンス](https://supabase.com/docs/reference/cli)
- プロジェクトルートの `CLAUDE.md` - 開発環境セットアップ
