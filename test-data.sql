-- テスト用日記データ挿入SQL
-- 実行前に適切なuser_idに置き換えてください

-- 注意: このSQLを実行する前に、以下の手順を実行してください：
-- 1. Supabase Dashboard > Authentication > Users で対象ユーザーのUUIDを確認
-- 2. 下記の '31e1a3e6-61a8-4cd5-87d7-7d9710e10d1e' を実際のUUIDに置き換え
-- 3. Supabase Dashboard > SQL Editor で実行

-- 例: '31e1a3e6-61a8-4cd5-87d7-7d9710e10d1e' → '12345678-1234-5678-9012-123456789012'

INSERT INTO diaries (
  user_id,
  date,
  title,
  content,
  mood,
  mood_reason,
  goal_category,
  progress_level,
  created_at,
  updated_at
) VALUES 
-- 1日前
(
  '31e1a3e6-61a8-4cd5-87d7-7d9710e10d1e',
  (NOW() - INTERVAL '1 day')::date,
  '今日は素晴らしい一日でした',
  '朝から天気が良く、散歩をして気持ちがリフレッシュしました。新しいプロジェクトも順調に進んでいます。充実感があります。',
  8,
  '新しいプロジェクトが順調',
  'general',
  0,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),

-- 2日前
(
  '31e1a3e6-61a8-4cd5-87d7-7d9710e10d1e',
  (NOW() - INTERVAL '2 days')::date,
  '少し疲れを感じた日',
  '仕事が忙しく、少し疲れました。でも、友人とのランチで元気をもらいました。バランスが大切ですね。',
  6,
  '仕事が忙しかった',
  'general',
  0,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
),

-- 3日前
(
  '31e1a3e6-61a8-4cd5-87d7-7d9710e10d1e',
  (NOW() - INTERVAL '3 days')::date,
  '新しい挑戦の始まり',
  '新しいスキルを学び始めました。最初は難しく感じましたが、成長できそうでワクワクしています。継続が鍵ですね。',
  7,
  '新しいことへのワクワク感',
  'general',
  0,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
),

-- 4日前
(
  '31e1a3e6-61a8-4cd5-87d7-7d9710e10d1e',
  (NOW() - INTERVAL '4 days')::date,
  '静かな休日',
  '家でゆっくり過ごしました。本を読んで、音楽を聞いて、穏やかな時間でした。こういう日も大切だと思います。',
  7,
  '学びがあった',
  'general',
  0,
  NOW() - INTERVAL '4 days',
  NOW() - INTERVAL '4 days'
),

-- 5日前
(
  '31e1a3e6-61a8-4cd5-87d7-7d9710e10d1e',
  (NOW() - INTERVAL '5 days')::date,
  'ちょっとした困難',
  'プロジェクトで予期しない問題が発生しました。ストレスを感じましたが、チームで解決策を見つけられました。',
  5,
  'チームで問題解決できた',
  'general',
  0,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
),

-- 6日前
(
  '31e1a3e6-61a8-4cd5-87d7-7d9710e10d1e',
  (NOW() - INTERVAL '6 days')::date,
  '家族との時間',
  '家族と一緒に過ごす時間がありました。久しぶりにみんなで笑い合えて、とても幸せでした。',
  9,
  '家族と過ごせて幸せ',
  'general',
  0,
  NOW() - INTERVAL '6 days',
  NOW() - INTERVAL '6 days'
),

-- 7日前
(
  '31e1a3e6-61a8-4cd5-87d7-7d9710e10d1e',
  (NOW() - INTERVAL '7 days')::date,
  '学びの一日',
  '新しいことを多く学んだ日でした。情報量が多くて少し疲れましたが、知識が増えたことが嬉しいです。',
  7,
  '学びがあった',
  'general',
  0,
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '7 days'
),

-- 8日前
(
  '31e1a3e6-61a8-4cd5-87d7-7d9710e10d1e',
  (NOW() - INTERVAL '8 days')::date,
  '友達との再会',
  '久しぶりに古い友人と会いました。昔話に花が咲き、楽しい時間を過ごせました。人とのつながりの大切さを感じます。',
  8,
  '人とのつながりを実感',
  'general',
  0,
  NOW() - INTERVAL '8 days',
  NOW() - INTERVAL '8 days'
),

-- 9日前
(
  '31e1a3e6-61a8-4cd5-87d7-7d9710e10d1e',
  (NOW() - INTERVAL '9 days')::date,
  '目標達成への一歩',
  '長期目標に向けて小さな進歩がありました。まだ道のりは長いですが、着実に前進している実感があります。',
  7,
  '目標に向かって前進',
  'general',
  0,
  NOW() - INTERVAL '9 days',
  NOW() - INTERVAL '9 days'
),

-- 10日前
(
  '31e1a3e6-61a8-4cd5-87d7-7d9710e10d1e',
  (NOW() - INTERVAL '10 days')::date,
  '雨の日の瞑想',
  '雨の音を聞きながら瞑想の時間を持ちました。心が落ち着き、内面と向き合うことができました。',
  6,
  'リフレッシュできた',
  'general',
  0,
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
),

-- 11日前
(
  '31e1a3e6-61a8-4cd5-87d7-7d9710e10d1e',
  (NOW() - INTERVAL '11 days')::date,
  '創作活動の楽しみ',
  '久しぶりに絵を描いてみました。思うようにいかない部分もありましたが、創作する喜びを感じられました。',
  7,
  '創作活動の楽しさ',
  'general',
  0,
  NOW() - INTERVAL '11 days',
  NOW() - INTERVAL '11 days'
),

-- 12日前
(
  '31e1a3e6-61a8-4cd5-87d7-7d9710e10d1e',
  (NOW() - INTERVAL '12 days')::date,
  '体調管理の大切さ',
  '少し体調を崩してしまいました。休養の大切さを改めて実感しています。健康第一ですね。',
  4,
  '体調管理の大切さ実感',
  'general',
  0,
  NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '12 days'
),

-- 13日前
(
  '31e1a3e6-61a8-4cd5-87d7-7d9710e10d1e',
  (NOW() - INTERVAL '13 days')::date,
  '感謝の気持ち',
  '周りの人たちのサポートに感謝する一日でした。一人では成し遂げられないことも、みんなと一緒なら可能だと感じます。',
  8,
  '人とのつながりを実感',
  'general',
  0,
  NOW() - INTERVAL '13 days',
  NOW() - INTERVAL '13 days'
),

-- 14日前
(
  '31e1a3e6-61a8-4cd5-87d7-7d9710e10d1e',
  (NOW() - INTERVAL '14 days')::date,
  '自然との触れ合い',
  '公園を散歩し、自然の美しさに癒されました。忙しい日々の中で、こうした時間が心の栄養になります。',
  7,
  '自然に癒された',
  'general',
  0,
  NOW() - INTERVAL '14 days',
  NOW() - INTERVAL '14 days'
),

-- 15日前
(
  '31e1a3e6-61a8-4cd5-87d7-7d9710e10d1e',
  (NOW() - INTERVAL '15 days')::date,
  '予期しない喜び',
  '思いがけないサプライズがありました。小さな幸せが日常を彩ってくれることを実感しました。',
  8,
  '成長を感じられた',
  'general',
  0,
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '15 days'
);

-- データ確認用クエリ
-- SELECT 
--   title, 
--   mood, 
--   mood_reason,
--   goal_category,
--   progress_level,
--   DATE(created_at) as date
-- FROM diaries 
-- WHERE user_id = '31e1a3e6-61a8-4cd5-87d7-7d9710e10d1e'
-- ORDER BY created_at DESC;