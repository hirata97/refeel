-- diariesテーブルのmoodチェック制約を1-10範囲に修正するSQL
-- 実行順序：
-- 1. 既存の制約を削除
-- 2. 新しい制約（1-10範囲）を追加

-- Step 1: 既存のmoodチェック制約を削除
ALTER TABLE diaries DROP CONSTRAINT IF EXISTS diaries_mood_check;

-- Step 2: 新しいmoodチェック制約を追加（1-10の範囲）
ALTER TABLE diaries ADD CONSTRAINT diaries_mood_check 
CHECK (mood >= 1 AND mood <= 10);

-- 確認用クエリ（コメントアウト）
-- SELECT conname, consrc 
-- FROM pg_constraint 
-- WHERE conrelid = 'diaries'::regclass 
-- AND conname = 'diaries_mood_check';