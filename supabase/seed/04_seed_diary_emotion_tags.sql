-- Seedデータ: 日記と感情タグの関連データ
-- Issue #267, #290: 日記と感情タグの多対多関連データ
-- 実行前提:
--   - マイグレーションが適用済み（emotion_tagsマスタデータが存在）
--   - 03_seed_diaries_full.sql が実行済み（日記データが存在）
--
-- 注意: このファイルはローカル開発環境専用です
--       各日記に1-3個の感情タグをランダムに関連付け

-- 日記と感情タグの関連データを生成
-- moodに応じて適切な感情タグを選択
WITH diary_list AS (
  SELECT
    d.id as diary_id,
    d.mood,
    d.goal_category
  FROM public.diaries d
  WHERE NOT EXISTS (
    SELECT 1 FROM public.diary_emotion_tags det WHERE det.diary_id = d.id
  )
),
emotion_tag_list AS (
  SELECT
    id as emotion_tag_id,
    name,
    category
  FROM public.emotion_tags
),
-- 各日記に対して、moodに基づいた感情タグを1-3個選択
diary_emotion_mapping AS (
  SELECT
    dl.diary_id,
    et.emotion_tag_id,
    ROW_NUMBER() OVER (
      PARTITION BY dl.diary_id
      ORDER BY
        -- moodが高い（8-10）場合はポジティブ感情を優先
        CASE
          WHEN dl.mood >= 8 AND et.category = 'positive' THEN 1
          WHEN dl.mood >= 8 AND et.category = 'neutral' THEN 2
          WHEN dl.mood >= 8 AND et.category = 'negative' THEN 3
          -- moodが低い（1-4）場合はネガティブ感情を優先
          WHEN dl.mood <= 4 AND et.category = 'negative' THEN 1
          WHEN dl.mood <= 4 AND et.category = 'neutral' THEN 2
          WHEN dl.mood <= 4 AND et.category = 'positive' THEN 3
          -- moodが中程度（5-7）場合は中性とポジティブを優先
          WHEN dl.mood BETWEEN 5 AND 7 AND et.category = 'neutral' THEN 1
          WHEN dl.mood BETWEEN 5 AND 7 AND et.category = 'positive' THEN 2
          ELSE 3
        END,
        -- さらにランダム性を追加（diary_idとemotion_tag_idのハッシュ値を使用）
        abs(hashtext(dl.diary_id::text || et.emotion_tag_id::text))
    ) as tag_rank
  FROM diary_list dl
  CROSS JOIN emotion_tag_list et
)
-- 各日記に1-3個の感情タグを挿入
-- diary_idのハッシュ値を使って、日記ごとに1-3個のタグを選択
INSERT INTO public.diary_emotion_tags (diary_id, emotion_tag_id)
SELECT
  diary_id,
  emotion_tag_id
FROM diary_emotion_mapping
WHERE tag_rank <= (
  -- diary_idのハッシュ値を使って1-3の範囲でタグ数を決定
  1 + (abs(hashtext(diary_id::text)) % 3)
)
ON CONFLICT (diary_id, emotion_tag_id) DO NOTHING;

-- 実行結果確認用クエリ（コメントアウト）
-- 各日記に関連付けられた感情タグの数を確認
-- SELECT
--   COUNT(DISTINCT det.diary_id) as total_diaries_with_tags,
--   ROUND(AVG(tag_count), 1) as avg_tags_per_diary,
--   MIN(tag_count) as min_tags,
--   MAX(tag_count) as max_tags
-- FROM (
--   SELECT diary_id, COUNT(*) as tag_count
--   FROM public.diary_emotion_tags
--   GROUP BY diary_id
-- ) as tag_counts;

-- 感情タグカテゴリ別の使用回数を確認
-- SELECT
--   et.category,
--   COUNT(*) as usage_count,
--   STRING_AGG(et.name, ', ') as tag_names
-- FROM public.diary_emotion_tags det
-- JOIN public.emotion_tags et ON det.emotion_tag_id = et.id
-- GROUP BY et.category
-- ORDER BY et.category;

-- サンプル日記と感情タグの関連を確認（最新5件）
-- SELECT
--   d.date,
--   d.title,
--   d.mood,
--   STRING_AGG(et.name, ', ' ORDER BY et.category, et.name) as emotion_tags
-- FROM public.diaries d
-- LEFT JOIN public.diary_emotion_tags det ON d.id = det.diary_id
-- LEFT JOIN public.emotion_tags et ON det.emotion_tag_id = et.id
-- GROUP BY d.id, d.date, d.title, d.mood
-- ORDER BY d.date DESC
-- LIMIT 5;
