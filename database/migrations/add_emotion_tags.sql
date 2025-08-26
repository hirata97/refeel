-- 感情タグ機能のためのデータベースマイグレーション
-- Issue #164: 感情タグ機能の実装

-- 1. emotion_tags テーブル作成（感情タグマスタ）
CREATE TABLE emotion_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('positive', 'negative', 'neutral')),
    color VARCHAR(7) NOT NULL DEFAULT '#1976D2', -- HEX色コード
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. diary_emotion_tags 中間テーブル作成（多対多関係）
CREATE TABLE diary_emotion_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    diary_id UUID NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
    emotion_tag_id UUID NOT NULL REFERENCES emotion_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(diary_id, emotion_tag_id)
);

-- 3. インデックス作成
CREATE INDEX idx_diary_emotion_tags_diary_id ON diary_emotion_tags(diary_id);
CREATE INDEX idx_diary_emotion_tags_emotion_tag_id ON diary_emotion_tags(emotion_tag_id);
CREATE INDEX idx_emotion_tags_category ON emotion_tags(category);
CREATE INDEX idx_emotion_tags_display_order ON emotion_tags(display_order);

-- 4. updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_emotion_tags_updated_at
    BEFORE UPDATE ON emotion_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Row Level Security (RLS) 設定
ALTER TABLE emotion_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_emotion_tags ENABLE ROW LEVEL SECURITY;

-- emotion_tags はすべてのユーザーが読み取り可能（マスタデータ）
CREATE POLICY "emotion_tags_select_policy" ON emotion_tags
    FOR SELECT USING (true);

-- diary_emotion_tags は自分の日記に関連するもののみアクセス可能
CREATE POLICY "diary_emotion_tags_select_policy" ON diary_emotion_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM diaries 
            WHERE diaries.id = diary_emotion_tags.diary_id 
            AND diaries.user_id = auth.uid()
        )
    );

CREATE POLICY "diary_emotion_tags_insert_policy" ON diary_emotion_tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM diaries 
            WHERE diaries.id = diary_emotion_tags.diary_id 
            AND diaries.user_id = auth.uid()
        )
    );

CREATE POLICY "diary_emotion_tags_update_policy" ON diary_emotion_tags
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM diaries 
            WHERE diaries.id = diary_emotion_tags.diary_id 
            AND diaries.user_id = auth.uid()
        )
    );

CREATE POLICY "diary_emotion_tags_delete_policy" ON diary_emotion_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM diaries 
            WHERE diaries.id = diary_emotion_tags.diary_id 
            AND diaries.user_id = auth.uid()
        )
    );

-- 6. 初期データ投入（感情タグマスタデータ）
INSERT INTO emotion_tags (name, category, color, description, display_order) VALUES
    -- ポジティブ感情
    ('達成感', 'positive', '#4CAF50', '目標達成や成功体験による満足感', 1),
    ('集中', 'positive', '#2196F3', '作業や活動に深く没頭している状態', 2),
    ('やりがい', 'positive', '#FF9800', '仕事や活動に意味や価値を感じている', 3),
    ('安心', 'positive', '#009688', '心配や不安がなく落ち着いている状態', 4),
    ('充実', 'positive', '#8BC34A', '満足感と生きがいを感じている', 5),
    ('興奮', 'positive', '#E91E63', '高揚感や期待感に満ちている状態', 6),
    
    -- ネガティブ感情
    ('疲労', 'negative', '#795548', '身体的・精神的な疲れを感じている', 11),
    ('不安', 'negative', '#9C27B0', '将来への心配や恐れを感じている', 12),
    ('焦り', 'negative', '#F44336', '時間や結果に対する切迫感', 13),
    ('失望', 'negative', '#607D8B', '期待が裏切られた時の落胆', 14),
    ('孤独', 'negative', '#424242', '他者とのつながりを感じられない状態', 15),
    ('退屈', 'negative', '#9E9E9E', 'つまらなさや刺激の不足を感じている', 16),
    
    -- 中性感情
    ('平常', 'neutral', '#757575', '特に感情の起伏がない普通の状態', 21),
    ('淡々', 'neutral', '#90A4AE', '感情的にならず事務的に進めている', 22),
    ('思考中', 'neutral', '#5D4037', '何かについて深く考えている状態', 23),
    ('準備中', 'neutral', '#37474F', '次の行動や段階への準備をしている', 24);

-- 7. コメント追加
COMMENT ON TABLE emotion_tags IS '感情タグマスタテーブル';
COMMENT ON TABLE diary_emotion_tags IS '日記と感情タグの関連テーブル';
COMMENT ON COLUMN emotion_tags.category IS 'positive: ポジティブ, negative: ネガティブ, neutral: 中性';
COMMENT ON COLUMN emotion_tags.color IS 'UIで使用するHEX色コード';
COMMENT ON COLUMN emotion_tags.display_order IS '表示順序（小さいほど前に表示）';