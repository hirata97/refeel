-- Supabase テーブル作成状況確認用SQL
-- Supabase SQL Editorで実行してください

-- 1. 現在の全テーブル確認
SELECT 
  table_name,
  CASE 
    WHEN table_name = 'tags' THEN '🎯 TARGET TABLE'
    WHEN table_name = 'diaries' THEN '📔 MAIN TABLE'
    ELSE '📋 OTHER'
  END as table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. diariesテーブルの列構造確認（goal_category, progress_level があるか）
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default,
  CASE 
    WHEN column_name IN ('goal_category', 'progress_level') THEN '🆕 NEW COLUMN'
    ELSE '✅ EXISTING'
  END as column_status
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'diaries'
ORDER BY ordinal_position;

-- 3. tagsテーブルの存在確認
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'tags'
    ) 
    THEN '✅ tagsテーブル存在'
    ELSE '❌ tagsテーブル未作成 - マイグレーション必要'
  END as tags_table_status;

-- 4. RLS設定確認（tagsテーブルが存在する場合）
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '🔒 RLS有効' ELSE '❌ RLS無効' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'tags';

-- 5. 認証ユーザー確認
SELECT 
  CASE 
    WHEN auth.uid() IS NOT NULL THEN CONCAT('✅ 認証済み: ', auth.uid())
    ELSE '❌ 未認証 - ログインが必要'
  END as auth_status;