-- 感情タグ機能テーブル作成SQL (統合版)
-- Issue #164, #180: 感情タグ機能のデータベース実装
-- 実行順序: 001_initial_tables.sql → 002_emotion_tags.sql

-- ==========================================
-- 1. 感情タグマスタテーブル
-- ==========================================
CREATE TABLE IF NOT EXISTS public.emotion_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('positive', 'negative', 'neutral')),
  color TEXT NOT NULL DEFAULT '#757575',
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. 日記-感情タグ関連テーブル (多対多)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.diary_emotion_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  diary_id UUID NOT NULL REFERENCES public.diaries(id) ON DELETE CASCADE,
  emotion_tag_id UUID NOT NULL REFERENCES public.emotion_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- 同じ日記に同じ感情タグの重複登録を防止
  UNIQUE(diary_id, emotion_tag_id)
);

-- ==========================================
-- 3. インデックス作成
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_emotion_tags_category ON public.emotion_tags(category);
CREATE INDEX IF NOT EXISTS idx_emotion_tags_display_order ON public.emotion_tags(display_order);
CREATE INDEX IF NOT EXISTS idx_diary_emotion_tags_diary_id ON public.diary_emotion_tags(diary_id);
CREATE INDEX IF NOT EXISTS idx_diary_emotion_tags_emotion_tag_id ON public.diary_emotion_tags(emotion_tag_id);

-- ==========================================
-- 4. RLS (Row Level Security) 設定
-- ==========================================

-- emotion_tagsテーブル: 全ユーザー読み取り可能 (システムマスターデータ)
ALTER TABLE public.emotion_tags ENABLE ROW LEVEL SECURITY;

-- emotion_tags: 全ユーザーが読み取り可能
CREATE POLICY IF NOT EXISTS "emotion_tags_public_read" ON public.emotion_tags
  FOR SELECT USING (true);

-- diary_emotion_tagsテーブル: ユーザー自身の日記関連のみアクセス可能
ALTER TABLE public.diary_emotion_tags ENABLE ROW LEVEL SECURITY;

-- diary_emotion_tags: ユーザー自身の日記に関連するもののみ選択可能
CREATE POLICY IF NOT EXISTS "diary_emotion_tags_select" ON public.diary_emotion_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.diaries 
      WHERE diaries.id = diary_emotion_tags.diary_id 
      AND diaries.user_id = auth.uid()
    )
  );

-- diary_emotion_tags: ユーザー自身の日記に関連するもののみ挿入可能
CREATE POLICY IF NOT EXISTS "diary_emotion_tags_insert" ON public.diary_emotion_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.diaries 
      WHERE diaries.id = diary_emotion_tags.diary_id 
      AND diaries.user_id = auth.uid()
    )
  );

-- diary_emotion_tags: ユーザー自身の日記に関連するもののみ削除可能
CREATE POLICY IF NOT EXISTS "diary_emotion_tags_delete" ON public.diary_emotion_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.diaries 
      WHERE diaries.id = diary_emotion_tags.diary_id 
      AND diaries.user_id = auth.uid()
    )
  );

-- ==========================================
-- 5. 更新トリガー関数・トリガー
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- emotion_tagsテーブルのupdated_at自動更新トリガー
DROP TRIGGER IF EXISTS update_emotion_tags_updated_at ON public.emotion_tags;
CREATE TRIGGER update_emotion_tags_updated_at
    BEFORE UPDATE ON public.emotion_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();