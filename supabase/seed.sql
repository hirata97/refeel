-- Supabase Seed Data Entry Point
-- Issue #267, #290: 全seedファイルを1つのセッションで実行
--
-- このファイルは config.toml の sql_paths から参照されます

DO $$
DECLARE
  v_dev_id UUID := gen_random_uuid();
  v_alice_id UUID := gen_random_uuid();
  v_bob_id UUID := gen_random_uuid();
  v_charlie_id UUID := gen_random_uuid();
  v_diana_id UUID := gen_random_uuid();
  v_eve_id UUID := gen_random_uuid();
  v_user_ids UUID[] := ARRAY[v_alice_id, v_bob_id, v_charlie_id, v_diana_id, v_eve_id];
  v_usernames TEXT[] := ARRAY['alice', 'bob', 'charlie', 'diana', 'eve'];
  v_emails TEXT[] := ARRAY['alice@example.com', 'bob@example.com', 'charlie@example.com', 'diana@example.com', 'eve@example.com'];
  v_user_id UUID;
  v_username TEXT;
  v_email TEXT;
  i INT;
  n INT;
  v_diary_id UUID;
  v_mood INT;
  v_tag_id UUID;
BEGIN
  -- ==========================================
  -- 00: 開発用アカウント（ログイン可能）
  -- ==========================================
  -- メール: dev@example.com / パスワード: password123
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin,
    confirmation_token, email_change, email_change_token_new, recovery_token
  )
  SELECT
    v_dev_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'dev@example.com',
    crypt('password123', gen_salt('bf')),
    now(), now(), now(),
    '{}', jsonb_build_object('username', 'dev'),
    false, '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'dev@example.com');

  INSERT INTO public.profiles (user_id, username, email)
  SELECT v_dev_id, 'dev', 'dev@example.com'
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'dev@example.com');

  INSERT INTO public.settings (user_id, theme, language, notifications)
  SELECT v_dev_id, 'light', 'ja', true
  WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE user_id = v_dev_id);

  -- ==========================================
  -- 01: テストユーザー作成（ダミーデータ用）
  -- ==========================================
  FOR i IN 1..5 LOOP
    v_user_id := v_user_ids[i];
    v_username := v_usernames[i];
    v_email := v_emails[i];

    -- auth.usersに挿入（存在しない場合）
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin,
      confirmation_token, email_change, email_change_token_new, recovery_token
    )
    SELECT
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', v_email,
      '$2a$10$dummypasswordhash1234567890123456789012345678901234',
      now(), now(), now(), '{}',
      jsonb_build_object('username', v_username),
      false, '', '', '', ''
    WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id);

    -- profilesに挿入
    INSERT INTO public.profiles (user_id, username, email)
    SELECT v_user_id, v_username, v_email
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = v_user_id);

    -- settingsに挿入
    INSERT INTO public.settings (user_id, theme, language, notifications)
    SELECT
      v_user_id,
      CASE WHEN v_username IN ('bob', 'diana') THEN 'dark' ELSE 'light' END,
      CASE WHEN v_username IN ('bob', 'eve') THEN 'en' ELSE 'ja' END,
      true
    WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE user_id = v_user_id);

    -- ==========================================
    -- 03: 日記エントリ（各ユーザー15件）
    -- ==========================================
    FOR n IN 0..14 LOOP
      v_mood := CASE
        WHEN n % 7 = 0 THEN 8
        WHEN n % 7 = 1 THEN 6
        WHEN n % 7 = 2 THEN 9
        WHEN n % 7 = 3 THEN 5
        WHEN n % 7 = 4 THEN 7
        WHEN n % 7 = 5 THEN 4
        ELSE 7
      END;

      INSERT INTO public.diaries (
        user_id, date, title, content, mood, mood_reason,
        goal_category, progress_level, template_type
      )
      SELECT
        v_user_id,
        (CURRENT_DATE - (n * 2))::text,
        CASE (n % 5)
          WHEN 0 THEN '今日の振り返り'
          WHEN 1 THEN '目標に向けて前進'
          WHEN 2 THEN '新しい発見があった日'
          WHEN 3 THEN '課題と向き合った日'
          ELSE '充実した一日'
        END,
        CASE (n % 5)
          WHEN 0 THEN '今日は予定通りタスクを完了できました。'
          WHEN 1 THEN '目標達成に向けて着実に進んでいます。'
          WHEN 2 THEN '新しいアプローチを試してみました。'
          WHEN 3 THEN '難しい課題がありましたが取り組みました。'
          ELSE '今日は特に集中して作業できました。'
        END,
        v_mood,
        CASE (n % 5)
          WHEN 0 THEN '計画通りに進められた'
          WHEN 1 THEN '新しいスキルが身についた'
          WHEN 2 THEN 'チームワークがうまくいった'
          WHEN 3 THEN '予想外の困難があった'
          ELSE '目標を達成できた'
        END,
        CASE (n % 4)
          WHEN 0 THEN 'キャリア'
          WHEN 1 THEN '健康'
          WHEN 2 THEN '学習'
          ELSE '趣味'
        END,
        CASE (n % 5)
          WHEN 0 THEN 8 WHEN 1 THEN 6 WHEN 2 THEN 9 WHEN 3 THEN 4 ELSE 7
        END,
        CASE (n % 3)
          WHEN 0 THEN 'free' WHEN 1 THEN 'reflection' ELSE 'mood'
        END
      WHERE NOT EXISTS (
        SELECT 1 FROM public.diaries d
        WHERE d.user_id = v_user_id AND d.date = (CURRENT_DATE - (n * 2))::text
      )
      RETURNING id INTO v_diary_id;

      -- 日記が作成された場合、感情タグを関連付け
      IF v_diary_id IS NOT NULL THEN
        -- 1つ目の感情タグ
        SELECT id INTO v_tag_id FROM public.emotion_tags
        WHERE category = CASE
          WHEN v_mood >= 7 THEN 'positive'
          WHEN v_mood <= 4 THEN 'negative'
          ELSE 'neutral'
        END
        ORDER BY random() LIMIT 1;

        IF v_tag_id IS NOT NULL THEN
          INSERT INTO public.diary_emotion_tags (diary_id, emotion_tag_id)
          VALUES (v_diary_id, v_tag_id)
          ON CONFLICT DO NOTHING;
        END IF;

        -- 2つ目の感情タグ（50%の確率）
        IF random() < 0.5 THEN
          SELECT id INTO v_tag_id FROM public.emotion_tags
          WHERE category = CASE
            WHEN v_mood >= 6 THEN 'positive'
            ELSE 'neutral'
          END
          ORDER BY random() LIMIT 1;

          IF v_tag_id IS NOT NULL THEN
            INSERT INTO public.diary_emotion_tags (diary_id, emotion_tag_id)
            VALUES (v_diary_id, v_tag_id)
            ON CONFLICT DO NOTHING;
          END IF;
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Seed data inserted successfully';
END $$;
