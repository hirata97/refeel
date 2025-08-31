# 感情タグ機能セットアップガイド

## 概要
感情タグ機能のSupabaseテーブル作成とセットアップ手順

## 🚀 セットアップ手順

### ステップ1: Supabase SQL Editorでテーブル作成

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択
3. 左メニューから「**Database**」→「**SQL Editor**」をクリック
4. 「**New Query**」をクリック
5. 以下のSQLファイルの内容をコピー&ペースト:
   ```
   database-setup/emotion_tags_tables.sql
   ```
6. 「**Run**」ボタンをクリックして実行

### ステップ2: テーブル作成確認

1. 左メニューから「**Database**」→「**Tables**」
2. 以下のテーブルが作成されていることを確認:
   - `emotion_tags` (20行のマスタデータ)  
   - `diary_emotion_tags`

### ステップ3: 型定義の再生成

```bash
# Supabase型定義の再生成
npm run generate-types

# 開発サーバー起動
npm run dev
```

## 📋 作成されるテーブル

### emotion_tags（感情マスタテーブル）
| カラム | 型 | 説明 |
|--------|-----|-----|
| id | UUID | 主キー |
| name | TEXT | 感情名（例: "達成感"） |
| category | TEXT | positive/negative/neutral |
| color | TEXT | UI表示色 |
| description | TEXT | 説明文 |
| display_order | INTEGER | 表示順序 |

### diary_emotion_tags（関連テーブル）
| カラム | 型 | 説明 |
|--------|-----|-----|
| id | UUID | 主キー |
| diary_id | UUID | 日記テーブル外部キー |
| emotion_tag_id | UUID | 感情タグ外部キー |

## 🎯 マスタデータ

### ポジティブ感情（8種類）
- 達成感、集中、やりがい、安心、充実、興奮、喜び、感謝

### ネガティブ感情（8種類）  
- 疲労、不安、焦り、失望、孤独、退屈、怒り、悲しみ

### 中性感情（4種類）
- 平常、淡々、思考中、準備中

## ✅ 動作確認

1. 日記登録画面で感情タグ選択UIが表示される
2. 感情タグを選択して日記を保存できる
3. 保存した感情タグが日記表示画面で確認できる

## 🔧 トラブルシューティング

### エラー: relation "diaries" does not exist
→ 先にdiariesテーブルが作成されている必要があります。
`docs/ENVIRONMENT/SUPABASE_QUICK_SETUP.md` を実行してください。

### エラー: permission denied for table
→ RLS (Row Level Security) の設定を確認してください。
ポリシーが正しく作成されているか確認してください。

## 🔗 関連ファイル
- `src/stores/emotionTags.ts` - 感情タグストア
- `src/components/EmotionTagSelector.vue` - 選択UI
- `src/types/emotion-tags.ts` - 型定義