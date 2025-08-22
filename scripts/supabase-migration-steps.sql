-- =============================================================================
-- Supabase タグ・目標連携機能 マイグレーション手順
-- Issue #79対応 - 段階的実行推奨
-- =============================================================================

-- ステップ1: 既存テーブル確認
-- -----------------------------------------------------------------------------
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- ステップ2: diariesテーブル更新（goal_category, progress_levelが存在しない場合）
-- -----------------------------------------------------------------------------
-- まず列の存在確認
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'diaries' 
AND column_name IN ('goal_category', 'progress_level');

-- 必要に応じて列追加（既存の場合はSKIP）
ALTER TABLE public.diaries 
ADD COLUMN IF NOT EXISTS goal_category TEXT NOT NULL DEFAULT 'general';

ALTER TABLE public.diaries 
ADD COLUMN IF NOT EXISTS progress_level INTEGER CHECK (progress_level >= 0 AND progress_level <= 100) DEFAULT 0;

-- ステップ3: tagsテーブル作成
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  color TEXT NOT NULL DEFAULT '#2196F3' CHECK (color ~* '^#[0-9A-Fa-f]{6}$'),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(user_id, name)
);

-- ステップ4: goalsテーブル作成
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  target_value DECIMAL(10,2) NOT NULL CHECK (target_value > 0),
  current_value DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (current_value >= 0),
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ステップ5: 関連テーブル作成
-- -----------------------------------------------------------------------------
-- tag_goalsテーブル
CREATE TABLE IF NOT EXISTS public.tag_goals (
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  weight DECIMAL(3,2) NOT NULL DEFAULT 1.0 CHECK (weight > 0 AND weight <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  PRIMARY KEY (tag_id, goal_id)
);

-- goal_progressテーブル  
CREATE TABLE IF NOT EXISTS public.goal_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  diary_id UUID REFERENCES public.diaries(id) ON DELETE CASCADE NOT NULL,
  progress_value DECIMAL(10,2) NOT NULL CHECK (progress_value >= 0),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(goal_id, diary_id)
);

-- diary_tagsテーブル
CREATE TABLE IF NOT EXISTS public.diary_tags (
  diary_id UUID REFERENCES public.diaries(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  PRIMARY KEY (diary_id, tag_id)
);

-- ステップ6: インデックス作成
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_category ON public.goals(category);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_goal_progress_goal_id ON public.goal_progress(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_diary_id ON public.goal_progress(diary_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_recorded_at ON public.goal_progress(recorded_at);
CREATE INDEX IF NOT EXISTS idx_diary_tags_diary_id ON public.diary_tags(diary_id);
CREATE INDEX IF NOT EXISTS idx_diary_tags_tag_id ON public.diary_tags(tag_id);

-- ステップ7: Row Level Security (RLS) 設定
-- -----------------------------------------------------------------------------
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_tags ENABLE ROW LEVEL SECURITY;

-- ステップ8: RLSポリシー作成
-- -----------------------------------------------------------------------------
-- tagsテーブルのポリシー
CREATE POLICY "Users can manage own tags" ON public.tags 
  USING (auth.uid() = user_id);

-- goalsテーブルのポリシー
CREATE POLICY "Users can manage own goals" ON public.goals 
  USING (auth.uid() = user_id);

-- tag_goalsテーブルのポリシー
CREATE POLICY "Users can manage own tag-goal links" ON public.tag_goals 
  USING (
    EXISTS (
      SELECT 1 FROM public.tags t WHERE t.id = tag_id AND t.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.user_id = auth.uid()
    )
  );

-- goal_progressテーブルのポリシー
CREATE POLICY "Users can manage own goal progress" ON public.goal_progress 
  USING (
    EXISTS (
      SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM public.diaries d WHERE d.id = diary_id AND d.user_id = auth.uid()
    )
  );

-- diary_tagsテーブルのポリシー
CREATE POLICY "Users can manage own diary tags" ON public.diary_tags 
  USING (
    EXISTS (
      SELECT 1 FROM public.diaries d WHERE d.id = diary_id AND d.user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM public.tags t WHERE t.id = tag_id AND t.user_id = auth.uid()
    )
  );

-- ステップ9: 更新トリガー関数作成
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ステップ10: 更新トリガー設定
-- -----------------------------------------------------------------------------
CREATE TRIGGER update_tags_updated_at 
  BEFORE UPDATE ON public.tags 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at 
  BEFORE UPDATE ON public.goals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ステップ11: 最終確認
-- -----------------------------------------------------------------------------
-- テーブル作成確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tags', 'goals', 'tag_goals', 'goal_progress', 'diary_tags')
ORDER BY table_name;

-- RLS確認
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tags', 'goals', 'tag_goals', 'goal_progress', 'diary_tags');

-- ポリシー確認
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';