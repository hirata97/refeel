// タグ・目標連携機能の型定義

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description?: string
  category: string
  target_value: number
  current_value: number
  target_date?: string
  status: 'active' | 'completed' | 'paused' | 'archived'
  created_at: string
  updated_at: string
}

export interface TagGoal {
  tag_id: string
  goal_id: string
  weight: number
}

export interface GoalProgress {
  goal_id: string
  diary_id: string
  progress_value: number
  recorded_at: string
}

export interface DiaryTag {
  diary_id: string
  tag_id: string
}

// 進捗計算用の型
export interface ProgressCalculation {
  goalId: string
  currentProgress: number
  targetProgress: number
  progressPercentage: number
  estimatedCompletionDate?: string
  dailyAverageProgress: number
}

// 分析用の型
export interface CategoryAnalysis {
  category: string
  totalDiaries: number
  averageProgress: number
  tags: TagUsage[]
  progressTrend: ProgressTrendPoint[]
}

export interface TagUsage {
  tag: Tag
  usageCount: number
  averageProgress: number
}

export interface ProgressTrendPoint {
  date: string
  value: number
}

// フィルタリング用の型
export interface TagGoalFilters {
  tags?: string[]
  goals?: string[]
  categories?: string[]
  dateRange?: {
    start: string
    end: string
  }
  progressRange?: {
    min: number
    max: number
  }
}
