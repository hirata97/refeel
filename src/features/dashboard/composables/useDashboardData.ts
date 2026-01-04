/**
 * ダッシュボードデータ管理コンポーザブル
 * Issue #38: ダッシュボードの動的データ表示実装
 */

import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@features/auth'
import type {
  DashboardData,
  DashboardStats,
  RecentDiary,
  MoodDataPoint,
  DashboardLoadingState,
  DashboardError,
} from '@/features/dashboard'
import type { ComparisonData } from '@/features/dashboardComparisonCard.vue'
import type { DiaryEntry } from '@/stores/data'

export function useDashboardData() {
  const dataStore = useDataStore()
  const authStore = useAuthStore()

  // 状態管理
  const loading = ref<DashboardLoadingState>({
    stats: false,
    recentDiaries: false,
    moodData: false,
    emotionTagAnalysis: false,
    overall: false,
  })

  const error = ref<DashboardError>({
    stats: null,
    recentDiaries: null,
    moodData: null,
    emotionTagAnalysis: null,
    overall: null,
  })

  const dashboardData = ref<DashboardData>({
    stats: {
      totalDiaries: 0,
      weeklyDiaries: 0,
      averageMood: 0,
      streakDays: 0,
    },
    recentDiaries: [],
    moodData: [],
  })

  // 前日比較データ
  const comparisonData = ref<ComparisonData | null>(null)
  const comparisonLoading = ref(false)
  const comparisonError = ref<string | null>(null)

  // ユーティリティ関数
  const truncateText = (text: string, maxLength: number): string => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getDateRanges = () => {
    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(now.getDate() - 7)

    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 6) // 今日を含む7日間

    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)

    return {
      weekAgo: weekAgo.toISOString().split('T')[0],
      sevenDaysAgo: sevenDaysAgo.toISOString().split('T')[0],
      today: now.toISOString().split('T')[0],
      yesterday: yesterday.toISOString().split('T')[0],
    }
  }

  // 統計データの計算
  const calculateStats = (diaries: DiaryEntry[]): DashboardStats => {
    const { weekAgo } = getDateRanges()

    // 今週の日記をフィルタリング
    const weeklyDiaries = diaries.filter((diary) => new Date(diary.created_at) >= new Date(weekAgo))

    // 平均気分スコアの計算（moodフィールドを使用）
    const averageMood =
      diaries.length > 0
        ? Math.round(
            (diaries.reduce((sum, diary) => sum + (diary.mood || 5), 0) / diaries.length) * 10,
          ) / 10
        : 0

    // 連続投稿日数の計算（簡易版）
    const sortedDiaries = [...diaries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )

    let streakDays = 0
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    for (const diary of sortedDiaries) {
      const diaryDate = new Date(diary.created_at)
      diaryDate.setHours(0, 0, 0, 0)

      const diffTime = currentDate.getTime() - diaryDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === streakDays) {
        streakDays++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return {
      totalDiaries: diaries.length,
      weeklyDiaries: weeklyDiaries.length,
      averageMood,
      streakDays,
    }
  }

  // 最近の日記データの作成
  const createRecentDiaries = (diaries: DiaryEntry[]): RecentDiary[] => {
    return diaries
      .slice(0, 5) // 最新5件
      .map((diary) => ({
        id: diary.id,
        title: diary.title,
        preview: truncateText(diary.content, 50),
        created_at: diary.created_at,
        mood: diary.mood || 5, // moodフィールドを直接使用
        date: diary.date,
        goal_category: diary.goal_category,
        progress_level: diary.progress_level,
      }))
  }

  // 7日間の気分データの作成
  const createMoodData = (diaries: DiaryEntry[]): MoodDataPoint[] => {
    const moodData: MoodDataPoint[] = []

    // 過去7日間の各日付を生成
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split('T')[0]

      // その日の日記を検索
      const dayDiaries = diaries.filter((diary) => {
        const diaryDate = new Date(diary.created_at).toISOString().split('T')[0]
        return diaryDate === dateString
      })

      // その日の平均気分スコアを計算（moodフィールドを使用）
      const averageMood =
        dayDiaries.length > 0
          ? Math.round(
              (dayDiaries.reduce((sum, diary) => sum + (diary.mood || 5), 0) / dayDiaries.length) *
                10,
            ) / 10
          : null

      if (averageMood !== null) {
        moodData.push({
          date: dateString,
          mood: averageMood,
          label: formatDate(dateString),
        })
      }
    }

    return moodData
  }

  // 前日比較データの作成
  const createComparisonData = (diaries: DiaryEntry[]): ComparisonData | null => {
    const { today, yesterday } = getDateRanges()

    // 今日の日記を検索
    const todayDiaries = diaries.filter((diary) => {
      const diaryDate = new Date(diary.created_at).toISOString().split('T')[0]
      return diaryDate === today
    })

    // 昨日の日記を検索
    const yesterdayDiaries = diaries.filter((diary) => {
      const diaryDate = new Date(diary.created_at).toISOString().split('T')[0]
      return diaryDate === yesterday
    })

    // 昨日のデータがない場合はnullを返す
    if (yesterdayDiaries.length === 0) {
      return null
    }

    // 今日の平均気分（データがない場合は5をデフォルト）
    const currentMood =
      todayDiaries.length > 0
        ? Math.round(
            todayDiaries.reduce((sum, diary) => sum + (diary.mood || 5), 0) / todayDiaries.length,
          )
        : 5

    // 昨日の平均気分
    const previousMood = Math.round(
      yesterdayDiaries.reduce((sum, diary) => sum + (diary.mood || 5), 0) / yesterdayDiaries.length,
    )

    // 気分理由の取得（最新の日記から） - mood_reasonフィールドが削除されたため無効化
    const currentReason = undefined
    const previousReason = undefined

    // 連続記録日数の計算（既存の統計から取得）
    const stats = calculateStats(diaries)

    return {
      previousMood,
      currentMood,
      previousReason,
      currentReason,
      streakDays: stats.streakDays,
    }
  }

  // データの取得と更新
  const fetchDashboardData = async (): Promise<void> => {
    if (!authStore.user?.id) {
      error.value.overall = '認証が必要です'
      return
    }

    try {
      loading.value.overall = true
      error.value.overall = null

      // 日記データを取得
      await dataStore.fetchDiaries(authStore.user.id, true)
      const diaries = dataStore.sortedDiaries

      // 各データを並行計算
      loading.value.stats = true
      loading.value.recentDiaries = true
      loading.value.moodData = true
      comparisonLoading.value = true

      const [stats, recentDiaries, moodData, comparison] = await Promise.all([
        Promise.resolve(calculateStats(diaries)),
        Promise.resolve(createRecentDiaries(diaries)),
        Promise.resolve(createMoodData(diaries)),
        Promise.resolve(createComparisonData(diaries)),
      ])

      dashboardData.value = {
        stats,
        recentDiaries,
        moodData,
      }

      comparisonData.value = comparison
      comparisonError.value = null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'データの取得に失敗しました'
      error.value.overall = errorMessage

      // 比較データのエラーも設定（全体のエラーとは別扱い）
      comparisonError.value = '前日比較データの取得に失敗しました'
    } finally {
      loading.value = {
        stats: false,
        recentDiaries: false,
        moodData: false,
        emotionTagAnalysis: false,
        overall: false,
      }
      comparisonLoading.value = false
    }
  }

  // リフレッシュ機能
  const refresh = async (): Promise<void> => {
    await fetchDashboardData()
  }

  // 計算プロパティ
  const hasData = computed(() => {
    return dashboardData.value.stats.totalDiaries > 0
  })

  const hasError = computed(() => {
    return !!(
      error.value.overall ||
      error.value.stats ||
      error.value.recentDiaries ||
      error.value.moodData
    )
  })

  const isLoading = computed(() => {
    return !!(
      loading.value.overall ||
      loading.value.stats ||
      loading.value.recentDiaries ||
      loading.value.moodData
    )
  })

  // Chart.jsデータ形式への変換
  const chartData = computed(() => {
    return {
      labels: dashboardData.value.moodData.map((point) => point.label),
      datasets: [
        {
          label: '気分スコア',
          data: dashboardData.value.moodData.map((point) => point.mood),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
        },
      ],
    }
  })

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: '過去7日間の気分推移',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: '気分スコア',
        },
      },
    },
  }

  return {
    // 状態
    dashboardData: computed(() => dashboardData.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),

    // 前日比較データ
    comparisonData: computed(() => comparisonData.value),
    comparisonLoading: computed(() => comparisonLoading.value),
    comparisonError: computed(() => comparisonError.value),

    // 計算プロパティ
    hasData,
    hasError,
    isLoading,
    chartData,
    chartOptions,

    // メソッド
    fetchDashboardData,
    refresh,
  }
}
