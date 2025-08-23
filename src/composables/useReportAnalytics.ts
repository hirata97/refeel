/**
 * レポート分析機能のコンポーザブル
 * 
 * Issue #40: レポート機能の大幅拡張
 */

import { ref, reactive, computed, watch } from 'vue'
import type { DateRange, AnalyticsPeriod, AnalyticsResult } from '@/types/report'
import { generateAnalyticsReport } from '@/services/reportAnalytics'
import { dateRangePresets, getPresetRange } from '@/utils/dateRange'
import type { ChartData } from 'chart.js'

interface UseReportAnalyticsOptions {
  defaultPreset?: string
  autoRefresh?: boolean
  enableCache?: boolean
}

export const useReportAnalytics = (options: UseReportAnalyticsOptions = {}) => {
  const {
    defaultPreset = 'last30Days',
    autoRefresh = true,
    enableCache = true
  } = options

  // 状態管理
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentPeriod = ref<AnalyticsPeriod | null>(null)
  const analyticsResult = ref<AnalyticsResult | null>(null)

  // キャッシュ
  const cache = reactive<Record<string, AnalyticsResult>>({})

  // 初期期間を設定
  const initializePeriod = () => {
    const range = getPresetRange(defaultPreset)
    if (range) {
      currentPeriod.value = {
        range,
        preset: defaultPreset
      }
    }
  }

  // キャッシュキーを生成
  const getCacheKey = (period: AnalyticsPeriod): string => {
    return `${period.range.startDate}_${period.range.endDate}_${period.preset || 'custom'}`
  }

  // 分析レポートを生成
  const generateReport = async (period?: AnalyticsPeriod) => {
    const targetPeriod = period || currentPeriod.value
    if (!targetPeriod) {
      error.value = '期間が設定されていません'
      return null
    }

    loading.value = true
    error.value = null

    try {
      const cacheKey = getCacheKey(targetPeriod)
      
      // キャッシュチェック
      if (enableCache && cache[cacheKey]) {
        analyticsResult.value = cache[cacheKey]
        loading.value = false
        return cache[cacheKey]
      }

      // 分析実行
      const result = await generateAnalyticsReport(targetPeriod)
      
      // 結果を保存
      analyticsResult.value = result
      if (enableCache) {
        cache[cacheKey] = result
      }

      return result
    } catch (err) {
      console.error('Analytics generation failed:', err)
      error.value = err instanceof Error ? err.message : '分析の生成に失敗しました'
      return null
    } finally {
      loading.value = false
    }
  }

  // 期間を更新
  const updatePeriod = async (newPeriod: AnalyticsPeriod) => {
    currentPeriod.value = newPeriod
    if (autoRefresh) {
      await generateReport(newPeriod)
    }
  }

  // プリセット期間を設定
  const setPresetPeriod = async (presetId: string) => {
    const range = getPresetRange(presetId)
    if (range) {
      await updatePeriod({
        range,
        preset: presetId
      })
    }
  }

  // カスタム期間を設定
  const setCustomPeriod = async (range: DateRange) => {
    await updatePeriod({ range })
  }

  // キャッシュをクリア
  const clearCache = () => {
    Object.keys(cache).forEach(key => {
      delete cache[key]
    })
  }

  // チャートデータ変換用ヘルパー

  // 投稿頻度チャート（曜日別）
  const weeklyFrequencyChartData = computed<ChartData | null>(() => {
    if (!analyticsResult.value) return null

    const { weeklyPattern } = analyticsResult.value.frequency
    const weekdays = ['月', '火', '水', '木', '金', '土', '日']
    
    return {
      labels: weekdays,
      datasets: [{
        label: '投稿数',
        data: weekdays.map(day => weeklyPattern[day] || 0),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        tension: 0.1
      }]
    }
  })

  // 気分推移チャート
  const moodTrendChartData = computed<ChartData | null>(() => {
    if (!analyticsResult.value) return null

    const { weeklyAverage } = analyticsResult.value.mood
    const weekdays = ['月', '火', '水', '木', '金', '土', '日']
    
    return {
      labels: weekdays,
      datasets: [{
        label: '平均気分スコア',
        data: weekdays.map(day => weeklyAverage[day] || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        tension: 0.1,
        fill: true
      }]
    }
  })

  // 時間帯別投稿チャート
  const hourlyPostsChartData = computed<ChartData | null>(() => {
    if (!analyticsResult.value) return null

    const { hourlyPattern } = analyticsResult.value.time
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
    
    return {
      labels: hours,
      datasets: [{
        label: '投稿数',
        data: hours.map((_, i) => hourlyPattern[i.toString()] || 0),
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 2
      }]
    }
  })

  // 文字数分布チャート
  const lengthDistributionChartData = computed<ChartData | null>(() => {
    if (!analyticsResult.value) return null

    const { lengthDistribution } = analyticsResult.value.content
    const labels = Object.keys(lengthDistribution).sort()
    
    return {
      labels: labels.map(label => label.replace('-', '〜') + '文字'),
      datasets: [{
        label: '投稿数',
        data: labels.map(label => lengthDistribution[label] || 0),
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 205, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      }]
    }
  })

  // 統計サマリー
  const statisticsSummary = computed(() => {
    if (!analyticsResult.value) return null

    const result = analyticsResult.value
    
    return {
      frequency: [
        {
          label: '総投稿数',
          value: result.continuity.totalActiveDays,
          color: 'primary'
        },
        {
          label: '週平均投稿',
          value: `${result.continuity.averageFrequency}回`,
          color: 'success'
        }
      ],
      mood: [
        {
          label: '平均気分',
          value: result.mood.average,
          color: 'info'
        },
        {
          label: '最高気分',
          value: result.mood.max,
          color: 'success'
        },
        {
          label: '最低気分',
          value: result.mood.min,
          color: 'warning'
        }
      ],
      continuity: [
        {
          label: '現在の連続記録',
          value: `${result.continuity.currentStreak}日`,
          color: 'success'
        },
        {
          label: '最長連続記録',
          value: `${result.continuity.longestStreak}日`,
          color: 'primary'
        }
      ]
    }
  })

  // 期間の変更を監視
  watch(
    () => currentPeriod.value,
    (newPeriod) => {
      if (newPeriod && autoRefresh) {
        generateReport(newPeriod)
      }
    },
    { deep: true }
  )

  // 初期化
  initializePeriod()

  return {
    // 状態
    loading,
    error,
    currentPeriod,
    analyticsResult,
    
    // アクション
    generateReport,
    updatePeriod,
    setPresetPeriod,
    setCustomPeriod,
    clearCache,
    
    // チャートデータ
    weeklyFrequencyChartData,
    moodTrendChartData,
    hourlyPostsChartData,
    lengthDistributionChartData,
    
    // 統計データ
    statisticsSummary,
    
    // ユーティリティ
    presets: dateRangePresets
  }
}