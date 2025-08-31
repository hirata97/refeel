-- 現在のSupabaseデータベース構造確認用SQL
-- database/README.md作成のための調査用

-- ==============================================
-- 1. 全テーブル一覧確認
-- ==============================================
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- ==============================================  
-- 2. diariesテーブルの詳細構造確認
-- ==============================================
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'diaries'
ORDER BY ordinal_position;

-- ==============================================
-- 3. 感情タグ関連テーブルの確認
-- ==============================================
-- emotion_tags テーブル構造
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'emotion_tags'
ORDER BY ordinal_position;

-- diary_emotion_tags テーブル構造  
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'diary_emotion_tags'
ORDER BY ordinal_position;

-- ==============================================
-- 4. 外部キー制約の確認
-- ==============================================
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- ==============================================
-- 5. インデックスの確認
-- ==============================================
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ==============================================
-- 6. RLSポリシーの確認
-- ==============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ==============================================
-- 7. トリガー・関数の確認
-- ==============================================
SELECT 
  trigger_schema,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ==============================================
-- 8. 感情タグマスターデータの確認
-- ==============================================
SELECT 
  category,
  COUNT(*) as count,
  STRING_AGG(name, ', ' ORDER BY display_order) as tag_names
FROM public.emotion_tags 
GROUP BY category 
ORDER BY category;

-- 全感情タグデータ
SELECT 
  id,
  name,
  category,
  color,
  display_order,
  LEFT(description, 30) as short_description
FROM public.emotion_tags 
ORDER BY display_order;

-- ==============================================
-- 9. データ件数確認
-- ==============================================
SELECT 'diaries' as table_name, COUNT(*) as record_count FROM public.diaries
UNION ALL
SELECT 'emotion_tags' as table_name, COUNT(*) as record_count FROM public.emotion_tags
UNION ALL  
SELECT 'diary_emotion_tags' as table_name, COUNT(*) as record_count FROM public.diary_emotion_tags
ORDER BY table_name;