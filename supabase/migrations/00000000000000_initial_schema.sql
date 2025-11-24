-- GoalCategorizationDiary (Refeel) 初期マイグレーションSQL
-- Docker Compose初回起動時に自動実行される完全スキーマ定義
-- Version: 2024-11-20 (Issue #268対応)
--
-- このファイルはPostgreSQLの/docker-entrypoint-initdb.dディレクトリから自動実行されます
-- 実行順序: スキーマ定義 → マスターデータ → RLSポリシー

-- ==========================================
-- PART 1: スキーマ定義
-- ==========================================

-- 1. UUID拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 更新トリガー関数の作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. diaries テーブル - 日記エントリ（メインテーブル）
CREATE TABLE IF NOT EXISTS public.diaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood SMALLINT NOT NULL CHECK (mood >= 1 AND mood <= 10),
  mood_reason TEXT,
  goal_category TEXT NOT NULL,
  progress_level SMALLINT NOT NULL CHECK (progress_level >= 0 AND progress_level <= 10),
  template_type TEXT CHECK (template_type IN ('free', 'reflection', 'mood')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  encrypted_data TEXT
);

DROP TRIGGER IF EXISTS update_diaries_updated_at ON public.diaries;
CREATE TRIGGER update_diaries_updated_at
    BEFORE UPDATE ON public.diaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. profiles テーブル - ユーザープロフィール
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. settings テーブル - ユーザー設定
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  language TEXT NOT NULL DEFAULT 'ja' CHECK (language IN ('ja', 'en')),
  notifications BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

DROP TRIGGER IF EXISTS update_settings_updated_at ON public.settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. emotion_tags テーブル - 感情タグマスタ
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

DROP TRIGGER IF EXISTS update_emotion_tags_updated_at ON public.emotion_tags;
CREATE TRIGGER update_emotion_tags_updated_at
    BEFORE UPDATE ON public.emotion_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. diary_emotion_tags テーブル - 日記と感情タグの関連（多対多）
CREATE TABLE IF NOT EXISTS public.diary_emotion_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  diary_id UUID NOT NULL REFERENCES public.diaries(id) ON DELETE CASCADE,
  emotion_tag_id UUID NOT NULL REFERENCES public.emotion_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(diary_id, emotion_tag_id)
);

-- 8. インデックス作成
CREATE INDEX IF NOT EXISTS idx_diaries_user_id ON public.diaries(user_id);
CREATE INDEX IF NOT EXISTS idx_diaries_date ON public.diaries(date);
CREATE INDEX IF NOT EXISTS idx_diaries_goal_category ON public.diaries(goal_category);
CREATE INDEX IF NOT EXISTS idx_diaries_mood ON public.diaries(mood);
CREATE INDEX IF NOT EXISTS idx_diaries_created_at ON public.diaries(created_at);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings(user_id);

CREATE INDEX IF NOT EXISTS idx_emotion_tags_category ON public.emotion_tags(category);
CREATE INDEX IF NOT EXISTS idx_emotion_tags_display_order ON public.emotion_tags(display_order);

CREATE INDEX IF NOT EXISTS idx_diary_emotion_tags_diary_id ON public.diary_emotion_tags(diary_id);
CREATE INDEX IF NOT EXISTS idx_diary_emotion_tags_emotion_tag_id ON public.diary_emotion_tags(emotion_tag_id);

-- ==========================================
-- PART 2: マスターデータ投入
-- ==========================================

-- 感情タグマスターデータ（20件）
INSERT INTO public.emotion_tags (name, category, color, description, display_order)
SELECT * FROM (VALUES
  -- ポジティブ感情（8種類）
  ('達成感', 'positive', '#4CAF50', '目標達成や成功体験による満足感', 1),
  ('集中', 'positive', '#2196F3', '作業や活動に深く没頭している状態', 2),
  ('やりがい', 'positive', '#FF9800', '仕事や活動に意味や価値を感じている', 3),
  ('安心', 'positive', '#009688', '心配や不安がなく落ち着いている状態', 4),
  ('充実', 'positive', '#8BC34A', '満足感と生きがいを感じている', 5),
  ('興奮', 'positive', '#E91E63', '高揚感や期待感に満ちている状態', 6),
  ('喜び', 'positive', '#FFEB3B', '嬉しさや楽しさを感じている状態', 7),
  ('感謝', 'positive', '#795548', '他者や状況に対する感謝の気持ち', 8),

  -- ネガティブ感情（8種類）
  ('疲労', 'negative', '#795548', '身体的・精神的な疲れを感じている', 11),
  ('不安', 'negative', '#9C27B0', '将来への心配や恐れを感じている', 12),
  ('焦り', 'negative', '#F44336', '時間や結果に対する切迫感', 13),
  ('失望', 'negative', '#607D8B', '期待が裏切られた時の落胆', 14),
  ('孤独', 'negative', '#424242', '他者とのつながりを感じられない状態', 15),
  ('退屈', 'negative', '#9E9E9E', 'つまらなさや刺激の不足を感じている', 16),
  ('怒り', 'negative', '#D32F2F', '不満やフラストレーションを感じている', 17),
  ('悲しみ', 'negative', '#3F51B5', '落ち込みや憂鬱な気分', 18),

  -- 中性感情（4種類）
  ('平常', 'neutral', '#757575', '特に感情の起伏がない普通の状態', 21),
  ('淡々', 'neutral', '#90A4AE', '感情的にならず事務的に進めている', 22),
  ('思考中', 'neutral', '#546E7A', '何かについて考えを巡らせている状態', 23),
  ('準備中', 'neutral', '#37474F', '次の行動に向けて準備や計画をしている', 24)
) AS new_data(name, category, color, description, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.emotion_tags WHERE emotion_tags.name = new_data.name
);

-- ==========================================
-- PART 3: RLSポリシー設定
-- ==========================================

-- diariesテーブル: ユーザー自身のデータのみアクセス可能
ALTER TABLE public.diaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "diaries_user_access" ON public.diaries;
CREATE POLICY "diaries_user_access" ON public.diaries
  FOR ALL USING (auth.uid() = user_id);

-- emotion_tagsテーブル: 全ユーザー読み取り可能（システムマスターデータ）
ALTER TABLE public.emotion_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "emotion_tags_public_read" ON public.emotion_tags;
CREATE POLICY "emotion_tags_public_read" ON public.emotion_tags
  FOR SELECT USING (true);

-- diary_emotion_tagsテーブル: ユーザー自身の日記関連のみアクセス可能
ALTER TABLE public.diary_emotion_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diary_emotion_tags_select" ON public.diary_emotion_tags;
CREATE POLICY "diary_emotion_tags_select" ON public.diary_emotion_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.diaries
      WHERE diaries.id = diary_emotion_tags.diary_id
      AND diaries.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "diary_emotion_tags_insert" ON public.diary_emotion_tags;
CREATE POLICY "diary_emotion_tags_insert" ON public.diary_emotion_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.diaries
      WHERE diaries.id = diary_emotion_tags.diary_id
      AND diaries.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "diary_emotion_tags_delete" ON public.diary_emotion_tags;
CREATE POLICY "diary_emotion_tags_delete" ON public.diary_emotion_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.diaries
      WHERE diaries.id = diary_emotion_tags.diary_id
      AND diaries.user_id = auth.uid()
    )
  );

-- profilesテーブル: ユーザー自身のプロフィールのみアクセス可能
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_user_access" ON public.profiles;
CREATE POLICY "profiles_user_access" ON public.profiles
  FOR ALL USING (auth.uid() = user_id);

-- settingsテーブル: ユーザー自身の設定のみアクセス可能
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_user_access" ON public.settings;
CREATE POLICY "settings_user_access" ON public.settings
  FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- マイグレーション完了
-- ==========================================
-- 初期スキーマのセットアップが完了しました
-- 次のステップ: 開発環境でSeedデータを投入（supabase db reset または ./supabase/scripts/seed.sh）
