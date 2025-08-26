// 感情タグ機能の型定義
// Issue #164: 感情タグ機能の実装

// 感情カテゴリ
export type EmotionCategory = 'positive' | 'negative' | 'neutral'

// 感情タグマスタ
export interface EmotionTag {
  id: string
  name: string
  category: EmotionCategory
  color: string
  description?: string
  display_order: number
  created_at: string
  updated_at: string
}

// 日記と感情タグの関連
export interface DiaryEmotionTag {
  id: string
  diary_id: string
  emotion_tag_id: string
  created_at: string
}

// UI用の感情タグ（選択状態を含む）
export interface SelectableEmotionTag extends EmotionTag {
  selected: boolean
}

// カテゴリ別感情タググループ
export interface EmotionTagGroup {
  category: EmotionCategory
  label: string
  tags: EmotionTag[]
  color: string
}

// 感情タグ選択用のオプション
export interface EmotionTagSelection {
  selectedTagIds: string[]
  availableTags: EmotionTag[]
}

// 分析用の感情タグ統計
export interface EmotionTagStats {
  tag: EmotionTag
  usageCount: number
  lastUsed: string
  averageMoodWhenUsed: number
}

// 感情タグトレンド分析
export interface EmotionTagTrend {
  tag: EmotionTag
  dataPoints: EmotionTagDataPoint[]
  totalUsage: number
  trendDirection: 'up' | 'down' | 'stable'
}

export interface EmotionTagDataPoint {
  date: string
  usageCount: number
  averageMood: number
}

// 日記エントリと感情タグの結合データ
export interface DiaryWithEmotionTags {
  id: string
  user_id: string
  date: string
  title: string
  content: string
  mood: number
  mood_reason?: string
  goal_category: string
  progress_level: number
  created_at: string
  updated_at: string
  emotion_tags: EmotionTag[]
}

// 感情タグフィルター
export interface EmotionTagFilter {
  categories?: EmotionCategory[]
  tagIds?: string[]
  dateRange?: {
    start: string
    end: string
  }
  moodRange?: {
    min: number
    max: number
  }
}

// レポート用の感情タグサマリー
export interface EmotionTagSummary {
  totalTags: number
  mostUsedTag: EmotionTag
  categoryDistribution: Record<EmotionCategory, number>
  averageMoodByCategory: Record<EmotionCategory, number>
  recentTrends: EmotionTagTrend[]
}

// API レスポンス型
export interface EmotionTagsResponse {
  emotion_tags: EmotionTag[]
  total: number
}

export interface DiaryEmotionTagsResponse {
  diary_emotion_tags: DiaryEmotionTag[]
  total: number
}

// フォーム用の感情タグデータ
export interface EmotionTagFormData {
  selectedTagIds: string[]
}

// Supabaseデータベース型の拡張用（database.tsに追加される部分）
export interface EmotionTagsTable {
  Row: EmotionTag
  Insert: Omit<EmotionTag, 'id' | 'created_at' | 'updated_at'> & {
    id?: string
    created_at?: string
    updated_at?: string
  }
  Update: Partial<Omit<EmotionTag, 'id' | 'created_at' | 'updated_at'>> & {
    id?: string
    created_at?: string
    updated_at?: string
  }
}

export interface DiaryEmotionTagsTable {
  Row: DiaryEmotionTag
  Insert: Omit<DiaryEmotionTag, 'id' | 'created_at'> & {
    id?: string
    created_at?: string
  }
  Update: Partial<Omit<DiaryEmotionTag, 'id' | 'created_at'>> & {
    id?: string
    created_at?: string
  }
}