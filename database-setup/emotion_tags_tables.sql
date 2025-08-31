-- 感情タグ機能のテーブル作成SQL
-- Issue #180: 感情タグ機能のバックエンド実装

-- 1. 感情タグマスタテーブル
CREATE TABLE public.emotion_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('positive', 'negative', 'neutral')),
  color TEXT NOT NULL DEFAULT '#757575',
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 日記-感情タグ関連テーブル
CREATE TABLE public.diary_emotion_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  diary_id UUID NOT NULL REFERENCES public.diaries(id) ON DELETE CASCADE,
  emotion_tag_id UUID NOT NULL REFERENCES public.emotion_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(diary_id, emotion_tag_id)
);

-- 3. セキュリティ設定（RLS - Row Level Security）
ALTER TABLE public.emotion_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_emotion_tags ENABLE ROW LEVEL SECURITY;

-- 4. ポリシー設定
-- 感情タグマスタは全ユーザー読み取り可能（管理者のみ編集）
CREATE POLICY "Everyone can read emotion tags" ON public.emotion_tags FOR SELECT USING (true);

-- 日記-感情タグ関連は自分の日記のもののみアクセス可能
CREATE POLICY "Users can manage own diary emotion tags" ON public.diary_emotion_tags
USING (EXISTS (
  SELECT 1 FROM public.diaries 
  WHERE id = diary_emotion_tags.diary_id 
  AND user_id = auth.uid()
));

-- 5. インデックス作成（パフォーマンス向上）
CREATE INDEX idx_emotion_tags_category ON public.emotion_tags(category);
CREATE INDEX idx_emotion_tags_display_order ON public.emotion_tags(display_order);
CREATE INDEX idx_diary_emotion_tags_diary_id ON public.diary_emotion_tags(diary_id);
CREATE INDEX idx_diary_emotion_tags_emotion_tag_id ON public.diary_emotion_tags(emotion_tag_id);

-- 6. 初期マスタデータ投入
INSERT INTO public.emotion_tags (name, category, color, description, display_order) VALUES
-- ポジティブ感情
('達成感', 'positive', '#4CAF50', '目標達成や成功体験による満足感', 1),
('集中', 'positive', '#2196F3', '作業や活動に深く没頭している状態', 2),
('やりがい', 'positive', '#FF9800', '仕事や活動に意味や価値を感じている', 3),
('安心', 'positive', '#009688', '心配や不安がなく落ち着いている状態', 4),
('充実', 'positive', '#8BC34A', '満足感と生きがいを感じている', 5),
('興奮', 'positive', '#E91E63', '高揚感や期待感に満ちている状態', 6),
('喜び', 'positive', '#FFEB3B', '嬉しさや楽しさを感じている状態', 7),
('感謝', 'positive', '#795548', '他者や状況に対する感謝の気持ち', 8),

-- ネガティブ感情  
('疲労', 'negative', '#795548', '身体的・精神的な疲れを感じている', 11),
('不安', 'negative', '#9C27B0', '将来への心配や恐れを感じている', 12),
('焦り', 'negative', '#F44336', '時間や結果に対する切迫感', 13),
('失望', 'negative', '#607D8B', '期待が裏切られた時の落胆', 14),
('孤独', 'negative', '#424242', '他者とのつながりを感じられない状態', 15),
('退屈', 'negative', '#9E9E9E', 'つまらなさや刺激の不足を感じている', 16),
('怒り', 'negative', '#D32F2F', '不満やフラストレーションを感じている', 17),
('悲しみ', 'negative', '#3F51B5', '落ち込みや憂鬱な気分', 18),

-- 中性感情
('平常', 'neutral', '#757575', '特に感情の起伏がない普通の状態', 21),
('淡々', 'neutral', '#90A4AE', '感情的にならず事務的に進めている', 22),
('思考中', 'neutral', '#5D4037', '何かについて深く考えている状態', 23),
('準備中', 'neutral', '#37474F', '次の行動や段階への準備をしている', 24);

-- 7. 更新トリガー（updated_at自動更新）
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_emotion_tags_updated_at
  BEFORE UPDATE ON public.emotion_tags
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();