-- マイグレーション完了後の検証SQL

-- 1. 全テーブル確認
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('tags', 'goals', 'tag_goals', 'goal_progress', 'diary_tags') 
    THEN '🆕 NEW'
    ELSE '✅ EXISTING'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. diariesテーブルの新規列確認
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'diaries'
AND column_name IN ('goal_category', 'progress_level');

-- 3. RLS設定確認
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '🔒 ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tags', 'goals', 'tag_goals', 'goal_progress', 'diary_tags');

-- 4. サンプルデータ挿入テスト（認証ユーザーが必要）
-- ※ Supabaseダッシュボード内で実行時のみ有効
INSERT INTO public.tags (user_id, name, color, description) 
VALUES (auth.uid(), 'テストタグ', '#FF5722', 'マイグレーション確認用')
ON CONFLICT (user_id, name) DO NOTHING;

-- 5. サンプルデータ確認
SELECT id, name, color, description, created_at 
FROM tags 
WHERE name = 'テストタグ';