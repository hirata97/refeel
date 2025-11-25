-- Seedデータ: 日記エントリ（充実版）
-- Issue #267, #290: テスト・開発用の日記データ（各ユーザー15件、合計75件）
-- 実行前提: 01_seed_profiles.sql が実行済みであること（temp_test_usersテーブルが存在）
--
-- 注意: このファイルはローカル開発環境専用です
--       過去30日分のデータを様々なmood、goal_category、progress_levelでバリエーション

-- 一時テーブルに日記データを生成
DROP TABLE IF EXISTS temp_diary_data;
CREATE TEMP TABLE temp_diary_data AS
WITH user_list AS (
  SELECT user_id, username, ROW_NUMBER() OVER (ORDER BY username) as user_num
  FROM temp_test_users
),
diary_sequence AS (
  SELECT generate_series(0, 14) as day_offset
)
SELECT
  u.user_id,
  u.username,
  (CURRENT_DATE - (d.day_offset + (u.user_num - 1) * 2)::integer)::text as date,
  -- タイトルのバリエーション
  CASE (d.day_offset % 15)
    WHEN 0 THEN '今日は素晴らしい一日でした'
    WHEN 1 THEN '少し疲れを感じた日'
    WHEN 2 THEN '新しい挑戦の始まり'
    WHEN 3 THEN '集中して作業できた'
    WHEN 4 THEN '友人との楽しい時間'
    WHEN 5 THEN '振り返りと反省の日'
    WHEN 6 THEN '目標達成に向けて前進'
    WHEN 7 THEN '予想外の困難に直面'
    WHEN 8 THEN '学びの多い一日'
    WHEN 9 THEN '充実した週末'
    WHEN 10 THEN 'ルーティンワークの日'
    WHEN 11 THEN '新しい発見があった'
    WHEN 12 THEN 'リフレッシュの時間'
    WHEN 13 THEN 'チャレンジングな課題'
    ELSE '平穏な一日'
  END as title,
  -- コンテンツのバリエーション
  CASE (d.day_offset % 15)
    WHEN 0 THEN '朝から天気が良く、散歩をして気持ちがリフレッシュしました。新しいプロジェクトも順調に進んでいます。充実感があります。'
    WHEN 1 THEN '仕事が忙しく、少し疲れました。でも、友人とのランチで元気をもらいました。バランスが大切ですね。'
    WHEN 2 THEN '新しいスキルを学び始めました。最初は難しく感じましたが、成長できそうでワクワクしています。継続が鍵ですね。'
    WHEN 3 THEN '今日は集中力が高まり、予定していたタスクを全て完了できました。達成感があります。'
    WHEN 4 THEN '久しぶりに友人と会って、たくさん話ができました。笑いと共感に満ちた時間でした。'
    WHEN 5 THEN '今週を振り返り、改善点を見つけました。次週はもっと効率的に進められそうです。'
    WHEN 6 THEN '目標に向けて着実に前進しています。小さな成功を積み重ねることの重要性を実感しています。'
    WHEN 7 THEN '予想していなかった問題が発生しましたが、冷静に対処できました。柔軟性が大切だと学びました。'
    WHEN 8 THEN '新しい知識を得ることができました。学び続けることの喜びを感じています。'
    WHEN 9 THEN '週末は趣味に没頭し、リフレッシュできました。仕事とプライベートのバランスが取れています。'
    WHEN 10 THEN '特に大きな出来事はありませんでしたが、日常のルーティンを着実にこなせました。'
    WHEN 11 THEN '新しい視点や考え方に気づくことができました。視野が広がった感覚があります。'
    WHEN 12 THEN '運動と読書でリフレッシュ。心身ともにリセットできた一日でした。'
    WHEN 13 THEN '難しい課題に取り組みましたが、最後までやり遂げることができました。自信につながりました。'
    ELSE '平穏で穏やかな一日を過ごすことができました。こういう日も大切ですね。'
  END as content,
  -- moodのバリエーション（1-10）
  CASE
    WHEN d.day_offset % 15 IN (0, 3, 4, 6, 11, 13) THEN 8 + (d.day_offset % 3)  -- 高いmood: 8-10
    WHEN d.day_offset % 15 IN (1, 7) THEN 4 + (d.day_offset % 3)  -- 低いmood: 4-6
    ELSE 6 + (d.day_offset % 3)  -- 中程度のmood: 6-8
  END as mood,
  -- mood_reasonのバリエーション
  CASE (d.day_offset % 15)
    WHEN 0 THEN '新しいプロジェクトが順調'
    WHEN 1 THEN '仕事が忙しかった'
    WHEN 2 THEN '新しいことへのワクワク感'
    WHEN 3 THEN 'タスク完了の達成感'
    WHEN 4 THEN '友人との楽しい会話'
    WHEN 5 THEN '自己改善の手応え'
    WHEN 6 THEN '目標達成に近づいている実感'
    WHEN 7 THEN '予想外の問題対処'
    WHEN 8 THEN '新しい学びの喜び'
    WHEN 9 THEN '趣味に没頭できた'
    WHEN 10 THEN '日常の安定感'
    WHEN 11 THEN '新しい発見'
    WHEN 12 THEN 'リフレッシュできた'
    WHEN 13 THEN '困難を乗り越えた達成感'
    ELSE '穏やかな心持ち'
  END as mood_reason,
  -- goal_categoryのバリエーション
  CASE (d.day_offset % 6)
    WHEN 0 THEN 'health'
    WHEN 1 THEN 'work'
    WHEN 2 THEN 'study'
    WHEN 3 THEN 'hobby'
    WHEN 4 THEN 'personal'
    ELSE 'general'
  END as goal_category,
  -- progress_levelのバリエーション（0-10）
  CASE
    WHEN d.day_offset % 15 IN (0, 3, 6, 13) THEN 8 + (d.day_offset % 3)  -- 高い進捗: 8-10
    WHEN d.day_offset % 15 IN (1, 7) THEN 3 + (d.day_offset % 3)  -- 低い進捗: 3-5
    ELSE 5 + (d.day_offset % 4)  -- 中程度の進捗: 5-8
  END as progress_level,
  -- template_typeのバリエーション
  CASE (d.day_offset % 3)
    WHEN 0 THEN 'free'
    WHEN 1 THEN 'reflection'
    ELSE 'mood'
  END as template_type,
  (CURRENT_TIMESTAMP - (d.day_offset + (u.user_num - 1) * 2)::integer * INTERVAL '1 day') as created_at
FROM user_list u
CROSS JOIN diary_sequence d;

-- 日記データを挿入
INSERT INTO public.diaries (
  user_id,
  date,
  title,
  content,
  mood,
  mood_reason,
  goal_category,
  progress_level,
  template_type,
  created_at,
  updated_at
)
SELECT
  user_id,
  date,
  title,
  content,
  mood,
  mood_reason,
  goal_category,
  progress_level,
  template_type,
  created_at,
  created_at
FROM temp_diary_data
WHERE NOT EXISTS (
  SELECT 1 FROM public.diaries d
  WHERE d.user_id = temp_diary_data.user_id
  AND d.date = temp_diary_data.date
);

-- 実行結果確認用クエリ（コメントアウト）
-- 各ユーザーの日記件数とmood分布を確認
-- SELECT
--   p.username,
--   COUNT(*) as diary_count,
--   ROUND(AVG(d.mood), 1) as avg_mood,
--   MIN(d.date) as oldest_date,
--   MAX(d.date) as latest_date
-- FROM public.diaries d
-- JOIN public.profiles p ON d.user_id = p.user_id
-- GROUP BY p.username
-- ORDER BY p.username;

-- goal_categoryの分布を確認
-- SELECT
--   goal_category,
--   COUNT(*) as count
-- FROM public.diaries
-- GROUP BY goal_category
-- ORDER BY goal_category;
