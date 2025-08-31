-- RLSセキュリティ修正SQL
-- 感情タグテーブルのRLS設定を修正

-- 1. RLSを確実に有効化
ALTER TABLE public.emotion_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_emotion_tags ENABLE ROW LEVEL SECURITY;

-- 2. 既存ポリシーを削除（もしあれば）
DROP POLICY IF EXISTS "Everyone can read emotion tags" ON public.emotion_tags;
DROP POLICY IF EXISTS "Users can manage own diary emotion tags" ON public.diary_emotion_tags;

-- 3. 感情タグマスタの正しいポリシー設定
-- 全ユーザーが感情タグマスタを読み取り可能
CREATE POLICY "emotion_tags_read_policy" ON public.emotion_tags
FOR SELECT USING (true);

-- 管理者のみが感情タグマスタを編集可能（将来の管理機能用）
CREATE POLICY "emotion_tags_admin_policy" ON public.emotion_tags
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.accounts 
    WHERE id = auth.uid() 
    AND email IN ('admin@example.com') -- 管理者メールアドレスを設定
  )
);

-- 4. 日記-感情タグ関連の正しいポリシー設定
-- ユーザーは自分の日記に関連する感情タグのみ操作可能
CREATE POLICY "diary_emotion_tags_policy" ON public.diary_emotion_tags
USING (
  EXISTS (
    SELECT 1 FROM public.diaries 
    WHERE id = diary_emotion_tags.diary_id 
    AND user_id = auth.uid()
  )
);

-- 5. RLS有効化の確認
-- 以下のクエリでRLSが有効になっていることを確認
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('emotion_tags', 'diary_emotion_tags')
  AND schemaname = 'public';

-- 6. ポリシー確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('emotion_tags', 'diary_emotion_tags')
  AND schemaname = 'public';