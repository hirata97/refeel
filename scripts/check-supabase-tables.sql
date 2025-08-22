-- 現在のSupabaseテーブル構造確認用SQL

-- 1. 既存テーブル一覧確認
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. diariesテーブルの列構造確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'diaries'
ORDER BY ordinal_position;

-- 3. 新規テーブルの存在確認
SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tags', 'goals', 'tag_goals', 'goal_progress', 'diary_tags');

-- 4. 既存データのサンプル確認（diariesテーブル）
SELECT id, title, goal_category, progress_level, created_at
FROM diaries 
LIMIT 5;