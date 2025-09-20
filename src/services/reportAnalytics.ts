/**
 * レポート分析サービス
 *
 * Issue #40: レポート機能の大幅拡張
 * diariesテーブルからデータを取得し、各種統計分析を実行
 */

import { supabase } from '@/lib/supabase'
import type { DiaryEntry } from '@/stores/data'
import type {
  DateRange,
  AnalyticsResult,
  FrequencyStats,
  ContentStats,
  MoodStats,
  ContinuityStats,
  TimeStats,
  KeywordStats,
  AnalyticsPeriod,
} from '@/types/report'
import { validateDateRange, getDaysBetween } from '@/utils/dateRange'

/**
 * 期間内の日記データを取得
 */
export const fetchDiariesForPeriod = async (range: DateRange): Promise<DiaryEntry[]> => {
  if (!validateDateRange(range)) {
    throw new Error('無効な日付範囲です')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ユーザーが認証されていません')
  }

  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', `${range.startDate}T00:00:00`)
    .lte('created_at', `${range.endDate}T23:59:59`)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`データ取得エラー: ${error.message}`)
  }

  return data || []
}

/**
 * 投稿頻度統計を計算
 */
export const analyzeFrequencyStats = (diaries: DiaryEntry[]): FrequencyStats => {
  const weeklyPattern: Record<string, number> = {
    月: 0,
    火: 0,
    水: 0,
    木: 0,
    金: 0,
    土: 0,
    日: 0,
  }
  const monthlyPattern: Record<string, number> = {}
  const dailyPattern: Record<string, number> = {}

  const weekdays = ['日', '月', '火', '水', '木', '金', '土']

  diaries.forEach((diary) => {
    const date = new Date(diary.created_at)

    // 曜日別パターン
    const weekday = weekdays[date.getDay()]
    weeklyPattern[weekday]++

    // 月別パターン（YYYY-MM）
    const monthKey = date.toISOString().substring(0, 7)
    monthlyPattern[monthKey] = (monthlyPattern[monthKey] || 0) + 1

    // 日別パターン（YYYY-MM-DD）
    const dayKey = date.toISOString().substring(0, 10)
    dailyPattern[dayKey] = (dailyPattern[dayKey] || 0) + 1
  })

  return {
    weeklyPattern,
    monthlyPattern,
    dailyPattern,
  }
}

/**
 * 内容統計を計算
 */
export const analyzeContentStats = (diaries: DiaryEntry[]): ContentStats => {
  if (diaries.length === 0) {
    return {
      averageLength: 0,
      maxLength: 0,
      minLength: 0,
      lengthDistribution: {},
    }
  }

  const lengths = diaries.map((diary) => {
    const content = diary.content || ''
    const title = diary.title || ''
    return content.length + title.length
  })

  const total = lengths.reduce((sum, length) => sum + length, 0)
  const averageLength = Math.round(total / lengths.length)
  const maxLength = Math.max(...lengths)
  const minLength = Math.min(...lengths)

  // 文字数分布（100文字刻み）
  const lengthDistribution: Record<string, number> = {}
  lengths.forEach((length) => {
    const bucket = Math.floor(length / 100) * 100
    const key = `${bucket}-${bucket + 99}`
    lengthDistribution[key] = (lengthDistribution[key] || 0) + 1
  })

  return {
    averageLength,
    maxLength,
    minLength,
    lengthDistribution,
  }
}

/**
 * 気分統計を計算
 * moodフィールドを気分スコアとして使用（1-10）
 */
export const analyzeMoodStats = (diaries: DiaryEntry[]): MoodStats => {
  // 曜日の初期化
  const weekdays = ['日', '月', '火', '水', '木', '金', '土']
  const weeklyAverage: Record<string, number> = {}
  weekdays.forEach((day) => {
    weeklyAverage[day] = 0
  })

  if (diaries.length === 0) {
    return {
      average: 0,
      max: 0,
      min: 0,
      weeklyAverage,
      monthlyAverage: {},
    }
  }

  const moods = diaries.map((diary) => diary.mood || 5)
  const average = Math.round(moods.reduce((sum, mood) => sum + mood, 0) / moods.length)
  const max = Math.max(...moods)
  const min = Math.min(...moods)

  // 曜日別平均
  const weeklyGroups: Record<string, number[]> = {}
  weekdays.forEach((day) => {
    weeklyGroups[day] = []
  })

  // 月別平均
  const monthlyGroups: Record<string, number[]> = {}

  diaries.forEach((diary) => {
    const date = new Date(diary.created_at)
    const mood = diary.mood || 5

    // 曜日別グループ化
    const weekday = weekdays[date.getDay()]
    weeklyGroups[weekday].push(mood)

    // 月別グループ化
    const monthKey = date.toISOString().substring(0, 7)
    if (!monthlyGroups[monthKey]) {
      monthlyGroups[monthKey] = []
    }
    monthlyGroups[monthKey].push(mood)
  })

  // 平均計算
  Object.entries(weeklyGroups).forEach(([day, values]) => {
    weeklyAverage[day] =
      values.length > 0 ? Math.round(values.reduce((sum, val) => sum + val, 0) / values.length) : 0
  })

  const monthlyAverage: Record<string, number> = {}
  Object.entries(monthlyGroups).forEach(([month, values]) => {
    monthlyAverage[month] =
      values.length > 0 ? Math.round(values.reduce((sum, val) => sum + val, 0) / values.length) : 0
  })

  return {
    average,
    max,
    min,
    weeklyAverage,
    monthlyAverage,
  }
}

/**
 * 継続性統計を計算
 */
export const analyzeContinuityStats = (
  diaries: DiaryEntry[],
  period: DateRange,
): ContinuityStats => {
  if (diaries.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      averageFrequency: 0,
    }
  }

  // 投稿日をセットに変換（重複除去）
  const activeDates = new Set(diaries.map((diary) => diary.created_at.substring(0, 10)))
  const totalActiveDays = activeDates.size

  // 日付を昇順ソート
  const sortedDates = Array.from(activeDates).sort()

  // 連続記録の計算
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 1

  const today = new Date().toISOString().substring(0, 10)

  // 現在の連続記録を計算（今日または昨日まで）
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().substring(0, 10)

  if (activeDates.has(today)) {
    currentStreak = 1
    // 昨日以前の連続記録をチェック
    const checkDate = new Date()
    checkDate.setDate(checkDate.getDate() - 1)

    while (activeDates.has(checkDate.toISOString().substring(0, 10))) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    }
  } else if (activeDates.has(yesterdayStr)) {
    currentStreak = 1
    // 一昨日以前の連続記録をチェック
    const checkDate2 = new Date()
    checkDate2.setDate(checkDate2.getDate() - 2)

    while (activeDates.has(checkDate2.toISOString().substring(0, 10))) {
      currentStreak++
      checkDate2.setDate(checkDate2.getDate() - 1)
    }
  }

  // 最長連続記録を計算
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1])
    const currDate = new Date(sortedDates[i])
    const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      tempStreak++
    } else {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak)

  // 平均投稿頻度（投稿日数/期間）
  const totalDays = getDaysBetween(period)
  const averageFrequency =
    totalDays > 0 ? Number((totalActiveDays / (totalDays / 7)).toFixed(1)) : 0

  return {
    currentStreak,
    longestStreak,
    totalActiveDays,
    averageFrequency,
  }
}

/**
 * 時間統計を計算
 */
export const analyzeTimeStats = (diaries: DiaryEntry[]): TimeStats => {
  const hourlyPattern: Record<string, number> = {}

  // 0-23時で初期化
  for (let i = 0; i < 24; i++) {
    hourlyPattern[i.toString()] = 0
  }

  diaries.forEach((diary) => {
    const date = new Date(diary.created_at)
    const hour = date.getHours().toString()
    hourlyPattern[hour]++
  })

  // 最も投稿の多い時間帯を特定
  const maxCount = Math.max(...Object.values(hourlyPattern))
  const peakHours = Object.entries(hourlyPattern)
    .filter(([_, count]) => count === maxCount && count > 0)
    .map(([hour, _]) => `${hour}:00`)

  return {
    hourlyPattern,
    peakHours,
  }
}

/**
 * 簡易キーワード統計を計算
 * より高度な解析には外部ライブラリが必要
 */
export const analyzeKeywordStats = (diaries: DiaryEntry[]): KeywordStats => {
  const wordCounts: Record<string, number> = {}
  const emotionalWords = {
    positive: [
      '嬉しい',
      '楽しい',
      '幸せ',
      '満足',
      '良い',
      'よい',
      '成功',
      '達成',
      '頑張',
      'がんば',
    ],
    negative: ['悲しい', '辛い', 'つらい', '疲れ', '不安', '心配', '失敗', '困難', '大変', 'だめ'],
    neutral: ['普通', '平常', '日常', 'いつも', '通り', '変化', '状況', '今日', 'きょう'],
  }

  diaries.forEach((diary) => {
    const text = `${diary.title || ''} ${diary.content || ''}`.toLowerCase()

    // 簡易的な単語分割（ひらがな・カタカナ・漢字の2-4文字）
    const words = text.match(/[ひらがなカタカナ漢字]{2,4}/g) || []

    words.forEach((word) => {
      if (word.length >= 2) {
        wordCounts[word] = (wordCounts[word] || 0) + 1
      }
    })
  })

  // 上位キーワード抽出
  const topKeywords = Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }))

  // 感情キーワード分析
  const emotionalKeywords: Array<{
    word: string
    count: number
    sentiment: 'positive' | 'negative' | 'neutral'
  }> = []

  Object.entries(wordCounts).forEach(([word, count]) => {
    if (emotionalWords.positive.some((ew) => word.includes(ew))) {
      emotionalKeywords.push({ word, count, sentiment: 'positive' })
    } else if (emotionalWords.negative.some((ew) => word.includes(ew))) {
      emotionalKeywords.push({ word, count, sentiment: 'negative' })
    } else if (emotionalWords.neutral.some((ew) => word.includes(ew))) {
      emotionalKeywords.push({ word, count, sentiment: 'neutral' })
    }
  })

  // 感情キーワードを使用頻度でソート
  emotionalKeywords.sort((a, b) => b.count - a.count)

  return {
    topKeywords,
    emotionalKeywords: emotionalKeywords.slice(0, 15),
  }
}

/**
 * 包括的な分析を実行
 */
export const generateAnalyticsReport = async (
  period: AnalyticsPeriod,
): Promise<AnalyticsResult> => {
  try {
    const diaries = await fetchDiariesForPeriod(period.range)

    const [frequency, content, mood, continuity, time, keywords] = await Promise.all([
      Promise.resolve(analyzeFrequencyStats(diaries)),
      Promise.resolve(analyzeContentStats(diaries)),
      Promise.resolve(analyzeMoodStats(diaries)),
      Promise.resolve(analyzeContinuityStats(diaries, period.range)),
      Promise.resolve(analyzeTimeStats(diaries)),
      Promise.resolve(analyzeKeywordStats(diaries)),
    ])

    return {
      period,
      frequency,
      content,
      mood,
      continuity,
      time,
      keywords,
      generatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Analytics generation error:', error)
    throw error
  }
}
