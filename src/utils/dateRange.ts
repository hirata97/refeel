/**
 * 日付範囲ユーティリティ
 *
 * Issue #40: レポート機能の期間選択機能
 */

import type { DateRange, PresetDateRange } from '@/types/report'

/**
 * 今日の日付をYYYY-MM-DD形式で取得
 */
export const getToday = (): string => {
  return new Date().toISOString().split('T')[0]
}

/**
 * N日前の日付をYYYY-MM-DD形式で取得
 */
export const getDaysAgo = (days: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

/**
 * 週の開始日（月曜日）を取得
 */
export const getWeekStart = (date: Date = new Date()): string => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 月曜日を開始とする
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

/**
 * 週の終了日（日曜日）を取得
 */
export const getWeekEnd = (date: Date = new Date()): string => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() + ((7 - day) % 7)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

/**
 * 月の開始日を取得
 */
export const getMonthStart = (date: Date = new Date()): string => {
  const d = new Date(date)
  d.setDate(1)
  return d.toISOString().split('T')[0]
}

/**
 * 月の終了日を取得
 */
export const getMonthEnd = (date: Date = new Date()): string => {
  const d = new Date(date)
  d.setMonth(d.getMonth() + 1, 0) // 翌月の0日 = 当月末日
  return d.toISOString().split('T')[0]
}

/**
 * N ヶ月前の日付を取得
 */
export const getMonthsAgo = (months: number): string => {
  const date = new Date()
  date.setMonth(date.getMonth() - months)
  return date.toISOString().split('T')[0]
}

/**
 * プリセット期間の定義
 */
export const dateRangePresets: PresetDateRange[] = [
  {
    id: 'today',
    label: '今日',
    getRange: () => ({
      startDate: getToday(),
      endDate: getToday(),
    }),
  },
  {
    id: 'yesterday',
    label: '昨日',
    getRange: () => {
      const yesterday = getDaysAgo(1)
      return {
        startDate: yesterday,
        endDate: yesterday,
      }
    },
  },
  {
    id: 'thisWeek',
    label: '今週',
    getRange: () => ({
      startDate: getWeekStart(),
      endDate: getWeekEnd(),
    }),
  },
  {
    id: 'lastWeek',
    label: '先週',
    getRange: () => {
      const lastWeekDate = new Date()
      lastWeekDate.setDate(lastWeekDate.getDate() - 7)
      return {
        startDate: getWeekStart(lastWeekDate),
        endDate: getWeekEnd(lastWeekDate),
      }
    },
  },
  {
    id: 'thisMonth',
    label: '今月',
    getRange: () => ({
      startDate: getMonthStart(),
      endDate: getMonthEnd(),
    }),
  },
  {
    id: 'lastMonth',
    label: '先月',
    getRange: () => {
      const lastMonthDate = new Date()
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1)
      return {
        startDate: getMonthStart(lastMonthDate),
        endDate: getMonthEnd(lastMonthDate),
      }
    },
  },
  {
    id: 'last7Days',
    label: '過去7日間',
    getRange: () => ({
      startDate: getDaysAgo(6),
      endDate: getToday(),
    }),
  },
  {
    id: 'last30Days',
    label: '過去30日間',
    getRange: () => ({
      startDate: getDaysAgo(29),
      endDate: getToday(),
    }),
  },
  {
    id: 'last3Months',
    label: '過去3ヶ月',
    getRange: () => ({
      startDate: getMonthsAgo(3),
      endDate: getToday(),
    }),
  },
  {
    id: 'last6Months',
    label: '過去6ヶ月',
    getRange: () => ({
      startDate: getMonthsAgo(6),
      endDate: getToday(),
    }),
  },
  {
    id: 'lastYear',
    label: '過去1年',
    getRange: () => ({
      startDate: getMonthsAgo(12),
      endDate: getToday(),
    }),
  },
]

/**
 * プリセットIDから期間を取得
 */
export const getPresetRange = (presetId: string): DateRange | null => {
  const preset = dateRangePresets.find((p) => p.id === presetId)
  return preset ? preset.getRange() : null
}

/**
 * 日付範囲の妥当性チェック
 */
export const validateDateRange = (range: DateRange): boolean => {
  const start = new Date(range.startDate)
  const end = new Date(range.endDate)

  // 日付の妥当性
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false
  }

  // 開始日 <= 終了日
  return start <= end
}

/**
 * 期間内の日数を計算
 */
export const getDaysBetween = (range: DateRange): number => {
  if (!validateDateRange(range)) return 0

  const start = new Date(range.startDate)
  const end = new Date(range.endDate)
  const diffTime = end.getTime() - start.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 for inclusive
}

/**
 * 日付範囲を人間が読みやすい形式でフォーマット
 */
export const formatDateRange = (range: DateRange): string => {
  const start = new Date(range.startDate)
  const end = new Date(range.endDate)

  const startStr = start.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const endStr = end.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  if (range.startDate === range.endDate) {
    return startStr
  }

  return `${startStr} ～ ${endStr}`
}
