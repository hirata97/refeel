-- マイグレーション: diariesテーブルにmood_reasonカラムを追加
-- 日付: 2025-08-26
-- Issue: #162 - 気分理由入力フィールドの追加

-- mood_reasonカラムを追加（任意フィールド、最大100文字）
ALTER TABLE diaries 
ADD COLUMN mood_reason VARCHAR(100);

-- インデックスを追加（検索性能向上のため）
CREATE INDEX IF NOT EXISTS idx_diaries_mood_reason 
ON diaries(mood_reason) 
WHERE mood_reason IS NOT NULL;

-- コメント追加
COMMENT ON COLUMN diaries.mood_reason IS '気分の理由（任意、最大100文字）';