-- タグ・目標連携機能のデータベースマイグレーション
-- Issue #79: 目標カテゴリとタグの連携機能実装

-- 1. diariesテーブルにgoal_categoryカラムを追加（既存実装で使用されているため）
ALTER TABLE public.diaries 
ADD COLUMN IF NOT EXISTS goal_category TEXT NOT NULL DEFAULT 'general',
ADD COLUMN IF NOT EXISTS progress_level INTEGER CHECK (progress_level >= 0 AND progress_level <= 100) DEFAULT 0;

-- 2. tagsテーブル - タグ管理
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  color TEXT NOT NULL DEFAULT '#2196F3' CHECK (color ~* '^#[0-9A-Fa-f]{6}$'),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- ユーザーごとのタグ名の一意制約
  UNIQUE(user_id, name)
);

-- 3. goalsテーブル - 目標管理
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

-- 4. tag_goalsテーブル - タグと目標の関連
CREATE TABLE IF NOT EXISTS public.tag_goals (
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  weight DECIMAL(3,2) NOT NULL DEFAULT 1.0 CHECK (weight > 0 AND weight <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  PRIMARY KEY (tag_id, goal_id)
);

-- 5. goal_progressテーブル - 目標進捗記録
CREATE TABLE IF NOT EXISTS public.goal_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  diary_id UUID REFERENCES public.diaries(id) ON DELETE CASCADE NOT NULL,
  progress_value DECIMAL(10,2) NOT NULL CHECK (progress_value >= 0),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- 同じ日記で同じ目標の進捗は1回のみ
  UNIQUE(goal_id, diary_id)
);

-- 6. diary_tagsテーブル - 日記とタグの関連
CREATE TABLE IF NOT EXISTS public.diary_tags (
  diary_id UUID REFERENCES public.diaries(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  PRIMARY KEY (diary_id, tag_id)
);

-- 7. インデックス作成（パフォーマンス向上）
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

-- 8. Row Level Security (RLS) 設定
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_tags ENABLE ROW LEVEL SECURITY;

-- 9. RLSポリシー作成

-- tagsテーブルのポリシー
CREATE POLICY "Users can manage own tags" ON public.tags 
  USING (auth.uid() = user_id);

-- goalsテーブルのポリシー
CREATE POLICY "Users can manage own goals" ON public.goals 
  USING (auth.uid() = user_id);

-- tag_goalsテーブルのポリシー（タグまたは目標の所有者のみアクセス可能）
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

-- 10. 更新トリガー関数（updated_atの自動更新）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. 更新トリガー設定
CREATE TRIGGER update_tags_updated_at 
  BEFORE UPDATE ON public.tags 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at 
  BEFORE UPDATE ON public.goals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. 目標進捗の自動更新トリガー
CREATE OR REPLACE FUNCTION update_goal_current_value()
RETURNS TRIGGER AS $$
BEGIN
    -- 新しい進捗が追加された場合、目標の現在値を更新
    IF TG_OP = 'INSERT' THEN
        UPDATE public.goals 
        SET current_value = LEAST(
          current_value + NEW.progress_value, 
          target_value
        ),
        updated_at = timezone('utc'::text, now())
        WHERE id = NEW.goal_id;
        
        -- 目標達成チェック
        UPDATE public.goals 
        SET status = 'completed',
        updated_at = timezone('utc'::text, now())
        WHERE id = NEW.goal_id 
        AND current_value >= target_value 
        AND status = 'active';
        
        RETURN NEW;
    END IF;
    
    -- 進捗が削除された場合、目標の現在値を再計算
    IF TG_OP = 'DELETE' THEN
        UPDATE public.goals 
        SET current_value = GREATEST(
          current_value - OLD.progress_value, 
          0
        ),
        updated_at = timezone('utc'::text, now())
        WHERE id = OLD.goal_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_goal_progress_trigger
  AFTER INSERT OR DELETE ON public.goal_progress
  FOR EACH ROW EXECUTE FUNCTION update_goal_current_value();

-- 13. サンプルデータ挿入（開発用）
-- 注意: 本番環境では実行しないこと

-- デフォルトタグ
INSERT INTO public.tags (user_id, name, color, description) 
SELECT 
  auth.uid(),
  'work',
  '#FF9800',
  '仕事関連の活動'
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO public.tags (user_id, name, color, description) 
SELECT 
  auth.uid(),
  'health',
  '#4CAF50',
  '健康・運動関連'
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO public.tags (user_id, name, color, description) 
SELECT 
  auth.uid(),
  'learning',
  '#2196F3',
  '学習・成長関連'
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;

-- コメント追加
COMMENT ON TABLE public.tags IS 'ユーザーが作成するタグ（ラベル）の管理';
COMMENT ON TABLE public.goals IS 'ユーザーの目標管理';
COMMENT ON TABLE public.tag_goals IS 'タグと目標の関連テーブル（多対多関係）';
COMMENT ON TABLE public.goal_progress IS '目標に対する進捗記録';
COMMENT ON TABLE public.diary_tags IS '日記エントリーとタグの関連テーブル';

COMMENT ON COLUMN public.goals.target_value IS '目標値（例：10km走る、5kg減量など）';
COMMENT ON COLUMN public.goals.current_value IS '現在の達成値';
COMMENT ON COLUMN public.tag_goals.weight IS 'タグと目標の関連度（1.0-10.0）';
COMMENT ON COLUMN public.goal_progress.progress_value IS 'その日記エントリーでの進捗値';