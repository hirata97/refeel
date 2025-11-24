-- Seedデータ: ユーザー設定
-- Issue #267, #290: テスト・開発用のユーザー設定データ
-- 実行前提: 01_seed_profiles.sql が実行済みであること（temp_test_usersテーブルが存在）
--
-- 注意: このファイルはローカル開発環境専用です

-- 各ユーザーに設定データを作成（theme、languageのバリエーション）
INSERT INTO public.settings (user_id, theme, language, notifications)
SELECT
  user_id,
  CASE
    WHEN username = 'alice' THEN 'light'
    WHEN username = 'bob' THEN 'dark'
    WHEN username = 'charlie' THEN 'light'
    WHEN username = 'diana' THEN 'dark'
    WHEN username = 'eve' THEN 'light'
  END as theme,
  CASE
    WHEN username = 'alice' THEN 'ja'
    WHEN username = 'bob' THEN 'en'
    WHEN username = 'charlie' THEN 'ja'
    WHEN username = 'diana' THEN 'ja'
    WHEN username = 'eve' THEN 'en'
  END as language,
  CASE
    WHEN username IN ('alice', 'bob', 'charlie') THEN true
    ELSE false
  END as notifications
FROM temp_test_users
WHERE NOT EXISTS (
  SELECT 1 FROM public.settings WHERE public.settings.user_id = temp_test_users.user_id
);

-- 実行結果確認用クエリ（コメントアウト）
-- SELECT
--   p.username,
--   s.theme,
--   s.language,
--   s.notifications
-- FROM public.settings s
-- JOIN public.profiles p ON s.user_id = p.user_id
-- ORDER BY p.username;
