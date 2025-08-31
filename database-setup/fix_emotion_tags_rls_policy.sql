-- emotion_tagsテーブルのRLSポリシー修正
-- システム管理データなので全ユーザーが読み取り可能にする

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "emotion_tags_select_policy" ON emotion_tags;
DROP POLICY IF EXISTS "Users can read emotion tags" ON emotion_tags;
DROP POLICY IF EXISTS "Allow read access to emotion_tags" ON emotion_tags;

-- 新しいポリシーを作成：全ユーザーが読み取り可能
CREATE POLICY "emotion_tags_public_read" ON emotion_tags
  FOR SELECT 
  USING (true);  -- 全ユーザーが読み取り可能

-- diary_emotion_tagsテーブルも確認・修正
-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "diary_emotion_tags_policy" ON diary_emotion_tags;
DROP POLICY IF EXISTS "Users can manage their diary emotion tags" ON diary_emotion_tags;

-- 新しいポリシーを作成：ユーザーは自分の日記の感情タグのみアクセス可能
CREATE POLICY "diary_emotion_tags_user_access" ON diary_emotion_tags
  FOR ALL
  USING (
    diary_id IN (
      SELECT id FROM diaries WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    diary_id IN (
      SELECT id FROM diaries WHERE user_id = auth.uid()
    )
  );

-- RLSが有効になっていることを確認
ALTER TABLE emotion_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_emotion_tags ENABLE ROW LEVEL SECURITY;

-- 確認用クエリ
SELECT 'emotion_tags' as table_name, count(*) as record_count FROM emotion_tags
UNION ALL
SELECT 'diary_emotion_tags' as table_name, count(*) as record_count FROM diary_emotion_tags;