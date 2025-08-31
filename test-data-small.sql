-- テスト用日記データ挿入SQL（3レコードのみ）
-- 実行前に適切なuser_idに置き換えてください

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
);