/**
 * ダッシュボード関連の型定義
 */

export interface DashboardStats {
  /** 総日記投稿数 */
  totalDiaries: number
  /** 今週の投稿数 */
  weeklyDiaries: number
  /** 平均気分スコア（1-10） */
  averageMood: number
  /** 継続日数（連続投稿記録） */
  streakDays: number
}

export interface RecentDiary {
  /** 日記ID */
  id: string
  /** タイトル */
  title: string
  /** プレビューテキスト（50文字以内） */
  preview: string
  /** 作成日時 */
  created_at: string
  /** 気分スコア（1-10） */
  mood: number
  /** 日記の日付 */
  date: string
  /** 目標カテゴリ */
  goal_category: string
  /** 進捗レベル（0-100） */
  progress_level: number
}

export interface MoodDataPoint {
  /** 日付（YYYY-MM-DD形式） */
  date: string
  /** 気分スコア（0-100） */
  mood: number
  /** 日付ラベル（表示用） */
  label: string
}

export interface DashboardData {
  /** 統計データ */
  stats: DashboardStats
  /** 最近の日記（最大5件） */
  recentDiaries: RecentDiary[]
  /** 7日間の気分データ */
  moodData: MoodDataPoint[]
}

export interface DashboardLoadingState {
  /** 統計データローディング中 */
  stats: boolean
  /** 最近の日記ローディング中 */
  recentDiaries: boolean
  /** 気分データローディング中 */
  moodData: boolean
  /** 感情タグ分析ローディング中 */
  emotionTagAnalysis: boolean
  /** 全体ローディング中 */
  overall: boolean
}

export interface DashboardError {
  /** 統計データエラー */
  stats: string | null
  /** 最近の日記エラー */
  recentDiaries: string | null
  /** 気分データエラー */
  moodData: string | null
  /** 感情タグ分析エラー */
  emotionTagAnalysis: string | null
  /** 全体エラー */
  overall: string | null
}
