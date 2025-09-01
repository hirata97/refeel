-- RLS (Row Level Security) ポリシー修正・統合SQL
-- Issue #180: 感情タグ機能関連のRLS設定修正
-- 実行前提: 対象テーブルが作成済みであること

-- ==========================================
-- 1. diariesテーブルのRLS設定確認・修正
-- ==========================================
-- diariesテーブルのRLS有効化
ALTER TABLE public.diaries ENABLE ROW LEVEL SECURITY;

-- diaries: ユーザー自身のデータのみアクセス可能
DROP POLICY IF EXISTS "diaries_user_access" ON public.diaries;
CREATE POLICY "diaries_user_access" ON public.diaries
  FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 2. emotion_tagsテーブルのRLS設定
-- ==========================================
-- emotion_tagsテーブル: 全ユーザー読み取り可能 (システムマスターデータ)
ALTER TABLE public.emotion_tags ENABLE ROW LEVEL SECURITY;

-- emotion_tags: 全ユーザーが読み取り可能
DROP POLICY IF EXISTS "emotion_tags_public_read" ON public.emotion_tags;
CREATE POLICY "emotion_tags_public_read" ON public.emotion_tags
  FOR SELECT USING (true);

-- ==========================================
-- 3. diary_emotion_tagsテーブルのRLS設定
-- ==========================================
-- diary_emotion_tagsテーブル: ユーザー自身の日記関連のみアクセス可能
ALTER TABLE public.diary_emotion_tags ENABLE ROW LEVEL SECURITY;

-- diary_emotion_tags: 選択権限（ユーザー自身の日記に関連するもののみ）
DROP POLICY IF EXISTS "diary_emotion_tags_select" ON public.diary_emotion_tags;
CREATE POLICY "diary_emotion_tags_select" ON public.diary_emotion_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.diaries 
      WHERE diaries.id = diary_emotion_tags.diary_id 
      AND diaries.user_id = auth.uid()
    )
  );

-- diary_emotion_tags: 挿入権限（ユーザー自身の日記に関連するもののみ）
DROP POLICY IF EXISTS "diary_emotion_tags_insert" ON public.diary_emotion_tags;
CREATE POLICY "diary_emotion_tags_insert" ON public.diary_emotion_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.diaries 
      WHERE diaries.id = diary_emotion_tags.diary_id 
      AND diaries.user_id = auth.uid()
    )
  );

-- diary_emotion_tags: 削除権限（ユーザー自身の日記に関連するもののみ）
DROP POLICY IF EXISTS "diary_emotion_tags_delete" ON public.diary_emotion_tags;
CREATE POLICY "diary_emotion_tags_delete" ON public.diary_emotion_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.diaries 
      WHERE diaries.id = diary_emotion_tags.diary_id 
      AND diaries.user_id = auth.uid()
    )
  );

-- ==========================================
-- 4. profilesテーブルのRLS設定
-- ==========================================
-- profilesテーブル: ユーザー自身のプロフィールのみアクセス可能
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_user_access" ON public.profiles;
CREATE POLICY "profiles_user_access" ON public.profiles
  FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 5. settingsテーブルのRLS設定
-- ==========================================
-- settingsテーブル: ユーザー自身の設定のみアクセス可能
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_user_access" ON public.settings;
CREATE POLICY "settings_user_access" ON public.settings
  FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 6. 設定確認用クエリ（実行確認）
-- ==========================================
-- 実行結果確認用クエリ（コメントアウト）
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;