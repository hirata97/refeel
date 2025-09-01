-- GoalCategorizationDiary (Refeel) 完全テーブル作成SQL
-- 新規環境での一括テーブル作成用マスターファイル
-- Version: 2024-09-01
-- 
-- 実行前提: Supabaseプロジェクトが作成済みであること
-- 実行方法: Supabase Dashboard > SQL Editor で実行
-- 実行順序: master.sql → emotion_tags_master.sql → rls_policies.sql

-- ==========================================
-- 1. UUID拡張機能の有効化
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. 更新トリガー関数の作成
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================
-- 3. diaries テーブル - 日記エントリ（メインテーブル）
-- ==========================================
CREATE TABLE IF NOT EXISTS public.diaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood SMALLINT NOT NULL CHECK (mood >= 1 AND mood <= 10),
  mood_reason TEXT, -- Issue #142: 感情の理由
  goal_category TEXT NOT NULL,
  progress_level SMALLINT NOT NULL CHECK (progress_level >= 0 AND progress_level <= 10),
  template_type TEXT CHECK (template_type IN ('free', 'reflection', 'mood')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  encrypted_data TEXT -- 将来的な暗号化対応用
);

-- diariesテーブルのupdated_at自動更新トリガー
DROP TRIGGER IF EXISTS update_diaries_updated_at ON public.diaries;
CREATE TRIGGER update_diaries_updated_at
    BEFORE UPDATE ON public.diaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 4. profiles テーブル - ユーザープロフィール
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- profilesテーブルのupdated_at自動更新トリガー
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 5. settings テーブル - ユーザー設定
-- ==========================================
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

-- settingsテーブルのupdated_at自動更新トリガー
DROP TRIGGER IF EXISTS update_settings_updated_at ON public.settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 6. emotion_tags テーブル - 感情タグマスタ
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

-- emotion_tagsテーブルのupdated_at自動更新トリガー
DROP TRIGGER IF EXISTS update_emotion_tags_updated_at ON public.emotion_tags;
CREATE TRIGGER update_emotion_tags_updated_at
    BEFORE UPDATE ON public.emotion_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 7. diary_emotion_tags テーブル - 日記と感情タグの関連（多対多）
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
-- 8. インデックス作成
-- ==========================================

-- diariesテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_diaries_user_id ON public.diaries(user_id);
CREATE INDEX IF NOT EXISTS idx_diaries_date ON public.diaries(date);
CREATE INDEX IF NOT EXISTS idx_diaries_goal_category ON public.diaries(goal_category);
CREATE INDEX IF NOT EXISTS idx_diaries_mood ON public.diaries(mood);
CREATE INDEX IF NOT EXISTS idx_diaries_created_at ON public.diaries(created_at);

-- profilesテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- settingsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings(user_id);

-- emotion_tagsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_emotion_tags_category ON public.emotion_tags(category);
CREATE INDEX IF NOT EXISTS idx_emotion_tags_display_order ON public.emotion_tags(display_order);

-- diary_emotion_tagsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_diary_emotion_tags_diary_id ON public.diary_emotion_tags(diary_id);
CREATE INDEX IF NOT EXISTS idx_diary_emotion_tags_emotion_tag_id ON public.diary_emotion_tags(emotion_tag_id);

-- ==========================================
-- 9. 実行結果確認用クエリ（コメントアウト）
-- ==========================================
-- すべてのテーブルが作成されたことを確認
-- SELECT 
--   table_name,
--   table_type
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('diaries', 'profiles', 'settings', 'emotion_tags', 'diary_emotion_tags')
-- ORDER BY table_name;

-- インデックス作成確認
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- AND tablename IN ('diaries', 'profiles', 'settings', 'emotion_tags', 'diary_emotion_tags')
-- ORDER BY tablename, indexname;

-- ==========================================
-- 次のステップ
-- ==========================================
-- 1. database/data/emotion_tags_master.sql でマスターデータを投入
-- 2. database/maintenance/rls_policies.sql でRLS設定を適用
-- 3. database/data/test_sample_diaries.sql でテストデータを投入（開発環境のみ）