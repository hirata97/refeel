/**
 * レポート機能の型定義
 *
 * Issue #40: レポート機能の大幅拡張
 */

export interface DateRange {
  /** 開始日（YYYY-MM-DD） */
  startDate: string
  /** 終了日（YYYY-MM-DD） */
  endDate: string
}

export interface PresetDateRange {
  /** プリセット識別子 */
  id: string
  /** 表示名 */
  label: string
  /** 期間計算関数 */
  getRange: () => DateRange
}

export interface AnalyticsPeriod {
  /** 期間設定 */
  range: DateRange
  /** プリセット名（任意） */
  preset?: string
}

// 統計データ型
export interface FrequencyStats {
  /** 曜日別投稿数 */
  weeklyPattern: Record<string, number>
  /** 月別投稿数 */
  monthlyPattern: Record<string, number>
  /** 日別投稿数 */
  dailyPattern: Record<string, number>
}

export interface ContentStats {
  /** 平均文字数 */
  averageLength: number
  /** 最大文字数 */
  maxLength: number
  /** 最小文字数 */
  minLength: number
  /** 文字数分布 */
  lengthDistribution: Record<string, number>
}

export interface MoodStats {
  /** 平均気分スコア */
  average: number
  /** 最高気分スコア */
  max: number
  /** 最低気分スコア */
  min: number
  /** 曜日別平均気分 */
  weeklyAverage: Record<string, number>
  /** 月別平均気分 */
  monthlyAverage: Record<string, number>
}

export interface ContinuityStats {
  /** 現在の連続記録 */
  currentStreak: number
  /** 最長連続記録 */
  longestStreak: number
  /** 総投稿日数 */
  totalActiveDays: number
  /** 投稿頻度（日/週） */
  averageFrequency: number
}

export interface TimeStats {
  /** 時間帯別投稿数 */
  hourlyPattern: Record<string, number>
  /** 最も活発な時間帯 */
  peakHours: string[]
}

export interface KeywordStats {
  /** キーワード頻度（上位20件） */
  topKeywords: Array<{ word: string; count: number }>
  /** 感情関連キーワード */
  emotionalKeywords: Array<{
    word: string
    count: number
    sentiment: 'positive' | 'negative' | 'neutral'
  }>
}

// チャートデータ型
export interface ChartDataPoint {
  /** X軸の値（日付、時間、カテゴリなど） */
  x: string | number
  /** Y軸の値 */
  y: number
  /** ラベル */
  label?: string
}

export interface ChartDataset {
  /** データセット名 */
  label: string
  /** データポイント */
  data: ChartDataPoint[]
  /** 色設定 */
  color?: string
  /** 追加オプション */
  options?: Record<string, unknown>
}

// レポート結果型
export interface AnalyticsResult {
  /** 分析期間 */
  period: AnalyticsPeriod
  /** 投稿頻度統計 */
  frequency: FrequencyStats
  /** 内容統計 */
  content: ContentStats
  /** 気分統計 */
  mood: MoodStats
  /** 継続性統計 */
  continuity: ContinuityStats
  /** 時間統計 */
  time: TimeStats
  /** キーワード統計 */
  keywords: KeywordStats
  /** 生成日時 */
  generatedAt: string
}

// レポート設定型
export interface ReportConfig {
  /** 分析期間 */
  period: AnalyticsPeriod
  /** 含める分析種別 */
  includeAnalytics: Array<keyof AnalyticsResult>
  /** チャート設定 */
  chartOptions?: {
    /** 表示サイズ */
    size: 'small' | 'medium' | 'large'
    /** カラーテーマ */
    theme: 'light' | 'dark'
    /** アニメーション有効 */
    animated: boolean
  }
}

// エクスポート関連型
export interface ExportOptions {
  /** フォーマット */
  format: 'pdf' | 'csv' | 'json' | 'image'
  /** ファイル名 */
  filename?: string
  /** 含める内容 */
  include: {
    charts: boolean
    statistics: boolean
    rawData: boolean
  }
}

export interface ExportResult {
  /** エクスポート成功フラグ */
  success: boolean
  /** ファイルURL（ダウンロード用） */
  fileUrl?: string
  /** エラーメッセージ */
  error?: string
}
