-- 緊急用：最小限のタグ機能マイグレーション

-- 1. diariesテーブル更新（必要な場合のみ）
ALTER TABLE public.diaries 
ADD COLUMN IF NOT EXISTS goal_category TEXT NOT NULL DEFAULT 'general';

ALTER TABLE public.diaries 
ADD COLUMN IF NOT EXISTS progress_level INTEGER DEFAULT 0;

-- 2. tagsテーブル作成（最優先）
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#2196F3',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(user_id, name)
);

-- 3. RLS設定
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tags" ON public.tags 
  USING (auth.uid() = user_id);

-- 4. 動作確認
SELECT 'タグテーブル作成完了' as status;