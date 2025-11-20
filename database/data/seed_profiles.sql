-- Seedデータ: ユーザープロフィール
-- Issue #267: テスト・開発用のユーザーデータ
-- 実行前提: database/schema/master.sqlでテーブルが作成済みであること
--
-- 注意: このファイルはローカル開発環境専用です
--       Supabase CLIのローカル環境で使用することを想定しています

-- テストユーザーのUUIDを生成・保存
-- 他のSeedファイルで参照するため、一時テーブルに保存
DROP TABLE IF EXISTS temp_test_users;
CREATE TEMP TABLE temp_test_users (
  user_id UUID PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL
);

-- 5人のテストユーザーを作成
INSERT INTO temp_test_users (user_id, username, email) VALUES
  (gen_random_uuid(), 'alice', 'alice@example.com'),
  (gen_random_uuid(), 'bob', 'bob@example.com'),
  (gen_random_uuid(), 'charlie', 'charlie@example.com'),
  (gen_random_uuid(), 'diana', 'diana@example.com'),
  (gen_random_uuid(), 'eve', 'eve@example.com');

-- auth.usersテーブルにユーザーを作成
-- ローカル開発環境では、auth.usersへの直接挿入が可能
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
SELECT
  user_id,
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  email,
  '$2a$10$dummypasswordhash1234567890123456789012345678901234',  -- ダミーハッシュ
  now(),
  now(),
  now(),
  '{}',
  jsonb_build_object('username', username),
  false,
  '',
  '',
  '',
  ''
FROM temp_test_users
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE auth.users.id = temp_test_users.user_id
);

-- profilesテーブルにユーザープロフィールを作成
INSERT INTO public.profiles (user_id, username, email)
SELECT user_id, username, email
FROM temp_test_users
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE public.profiles.user_id = temp_test_users.user_id
);

-- 実行結果確認用クエリ（コメントアウト）
-- SELECT
--   p.username,
--   p.email,
--   p.created_at
-- FROM public.profiles p
-- ORDER BY p.created_at DESC
-- LIMIT 5;

-- 注意: temp_test_usersテーブルはセッション終了まで保持されます
--       他のSeedファイル（seed_settings.sql, seed_diaries_full.sql）で参照可能
