import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@features/auth'
import type { DiaryEntry } from '@shared/types'

// 週間データの型定義
export interface WeeklyMoodData {
  date: string
  mood: number
  label: string
  dayOfWeek: string
}

export interface WeeklyEmotionTag {
  name: string
  count: number
  category: string
  percentage: number
}

export interface WeeklyProgressData {
  goalCategory: string
  averageProgress: number
  entries: number
  trend: 'up' | 'down' | 'stable'
}

export interface WeeklyAnalysisComment {
  type: 'mood' | 'emotion' | 'progress' | 'general'
  message: string
  icon: string
  color: string
}

export interface WeeklyReflectionData {
  weekLabel: string
  startDate: string
  endDate: string
  moodData: WeeklyMoodData[]
  emotionTags: WeeklyEmotionTag[]
  progressData: WeeklyProgressData[]
  comments: WeeklyAnalysisComment[]
  stats: {
    totalEntries: number
    averageMood: number
    highestMood: number
    lowestMood: number
    mostActiveDay: string
    dominantEmotion: string | null
  }
}

export interface WeeklyLoadingState {
  overall: boolean
  moodData: boolean
  emotionTags: boolean
  progressData: boolean
}

export interface WeeklyError {
  overall: string | null
  moodData: string | null
  emotionTags: string | null
  progressData: string | null
}

export function useWeeklyAnalysis() {
  const dataStore = useDataStore()
  const authStore = useAuthStore()

  // 状態管理
  const loading = ref<WeeklyLoadingState>({
    overall: false,
    moodData: false,
    emotionTags: false,
    progressData: false,
  })

  const error = ref<WeeklyError>({
    overall: null,
    moodData: null,
    emotionTags: null,
    progressData: null,
  })

  const reflectionData = ref<WeeklyReflectionData>({
    weekLabel: '',
    startDate: '',
    endDate: '',
    moodData: [],
    emotionTags: [],
    progressData: [],
    comments: [],
    stats: {
      totalEntries: 0,
      averageMood: 0,
      highestMood: 0,
      lowestMood: 0,
      mostActiveDay: '',
      dominantEmotion: null,
    },
  })

  // 選択された週のオフセット（0=今週、1=先週、2=先々週...）
  const selectedWeekOffset = ref(0)

  // ユーティリティ関数
  const getWeekRange = (weekOffset: number = 0) => {
    const now = new Date()

    // 今週の開始日（月曜日）を計算
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(now)
    monday.setDate(now.getDate() + mondayOffset - weekOffset * 7)
    monday.setHours(0, 0, 0, 0)

    // 今週の終了日（日曜日）を計算
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    return {
      start: monday,
      end: sunday,
      startString: monday.toISOString().split('T')[0],
      endString: sunday.toISOString().split('T')[0],
    }
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getDayOfWeekLabel = (date: Date): string => {
    const days = ['日', '月', '火', '水', '木', '金', '土']
    return days[date.getDay()]
  }

  const getWeekLabel = (weekOffset: number): string => {
    if (weekOffset === 0) return '今週'
    if (weekOffset === 1) return '先週'
    if (weekOffset === 2) return '先々週'
    return `${weekOffset}週間前`
  }

  // 週間気分データの作成
  const createWeeklyMoodData = (
    diaries: DiaryEntry[],
    weekRange: ReturnType<typeof getWeekRange>,
  ): WeeklyMoodData[] => {
    const moodData: WeeklyMoodData[] = []

    // 1週間の各日について処理
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekRange.start)
      date.setDate(weekRange.start.getDate() + i)
      const dateString = date.toISOString().split('T')[0]

      // その日の日記を検索
      const dayDiaries = diaries.filter((diary) => {
        const diaryDate = new Date(diary.created_at).toISOString().split('T')[0]
        return diaryDate === dateString
      })

      // その日の平均気分スコアを計算
      const averageMood =
        dayDiaries.length > 0
          ? Math.round(
              (dayDiaries.reduce((sum, diary) => sum + (diary.mood || 5), 0) / dayDiaries.length) *
                10,
            ) / 10
          : 0

      moodData.push({
        date: dateString,
        mood: averageMood,
        label: formatDate(date),
        dayOfWeek: getDayOfWeekLabel(date),
      })
    }

    return moodData
  }

  // 週間感情タグ分析（旧tagsフィールド対応削除）
  const createWeeklyEmotionTags = (_diaries: DiaryEntry[]): WeeklyEmotionTag[] => {
    // 旧tagsフィールドは削除されたため、空配列を返す
    // 今後はemotion_tagsテーブルからデータを取得する必要がある
    return []
  }

  // 週間進捗データの作成
  const createWeeklyProgressData = (diaries: DiaryEntry[]): WeeklyProgressData[] => {
    const progressByCategory: Record<string, { sum: number; count: number }> = {}

    diaries.forEach((diary) => {
      const category = diary.goal_category
      const progress = diary.progress_level || 0

      if (!progressByCategory[category]) {
        progressByCategory[category] = { sum: 0, count: 0 }
      }
      progressByCategory[category].sum += progress
      progressByCategory[category].count++
    })

    return Object.entries(progressByCategory)
      .map(([goalCategory, data]) => ({
        goalCategory,
        averageProgress: Math.round((data.sum / data.count) * 10) / 10,
        entries: data.count,
        trend: 'stable' as const, // 実際は前週との比較で決定
      }))
      .sort((a, b) => b.averageProgress - a.averageProgress)
  }

  // 分析コメント生成
  const generateAnalysisComments = (
    moodData: WeeklyMoodData[],
    emotionTags: WeeklyEmotionTag[],
    progressData: WeeklyProgressData[],
  ): WeeklyAnalysisComment[] => {
    const comments: WeeklyAnalysisComment[] = []

    // 気分に関するコメント
    const validMoods = moodData.filter((d) => d.mood > 0)
    if (validMoods.length > 0) {
      const averageMood = validMoods.reduce((sum, d) => sum + d.mood, 0) / validMoods.length
      const highestDay = validMoods.reduce((prev, current) =>
        prev.mood > current.mood ? prev : current,
      )

      if (averageMood >= 7) {
        comments.push({
          type: 'mood',
          message: `今週は全体的に良い気分で過ごせました（平均${averageMood.toFixed(1)}/10）`,
          icon: 'mdi-emoticon-happy',
          color: 'success',
        })
      } else if (averageMood >= 5) {
        comments.push({
          type: 'mood',
          message: `今週の気分は安定していました（平均${averageMood.toFixed(1)}/10）`,
          icon: 'mdi-emoticon-neutral',
          color: 'primary',
        })
      } else {
        comments.push({
          type: 'mood',
          message: `今週は少し気分が低めでした。来週はより良い週になりそうです`,
          icon: 'mdi-emoticon-sad',
          color: 'warning',
        })
      }

      comments.push({
        type: 'mood',
        message: `${highestDay.dayOfWeek}曜日（${highestDay.label}）の気分が特に良好でした`,
        icon: 'mdi-calendar-star',
        color: 'success',
      })
    }

    // 感情タグに関するコメント
    if (emotionTags.length > 0) {
      const dominantEmotion = emotionTags[0]
      comments.push({
        type: 'emotion',
        message: `「${dominantEmotion.name}」が最も多く記録されました（${dominantEmotion.percentage}%）`,
        icon: 'mdi-tag-heart',
        color: 'info',
      })
    }

    // 進捗に関するコメント
    if (progressData.length > 0) {
      const bestCategory = progressData[0]
      comments.push({
        type: 'progress',
        message: `「${bestCategory.goalCategory}」の取り組みが特に順調でした（平均${bestCategory.averageProgress}/10）`,
        icon: 'mdi-trending-up',
        color: 'success',
      })
    }

    return comments
  }

  // 統計データの計算
  const calculateWeeklyStats = (
    moodData: WeeklyMoodData[],
    diaries: DiaryEntry[],
    emotionTags: WeeklyEmotionTag[],
  ) => {
    const validMoods = moodData.filter((d) => d.mood > 0)
    const moods = validMoods.map((d) => d.mood)

    const mostActiveDay = moodData.reduce((prev, current) => {
      const prevEntries = diaries.filter(
        (d) => new Date(d.created_at).toISOString().split('T')[0] === prev.date,
      ).length
      const currentEntries = diaries.filter(
        (d) => new Date(d.created_at).toISOString().split('T')[0] === current.date,
      ).length
      return currentEntries > prevEntries ? current : prev
    })

    return {
      totalEntries: diaries.length,
      averageMood:
        moods.length > 0
          ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10
          : 0,
      highestMood: moods.length > 0 ? Math.max(...moods) : 0,
      lowestMood: moods.length > 0 ? Math.min(...moods) : 0,
      mostActiveDay: mostActiveDay.dayOfWeek,
      dominantEmotion: emotionTags.length > 0 ? emotionTags[0].name : null,
    }
  }

  // 週間データの取得と分析
  const fetchWeeklyReflection = async (weekOffset: number = 0): Promise<void> => {
    if (!authStore.user?.id) {
      error.value.overall = '認証が必要です'
      return
    }

    try {
      loading.value.overall = true
      error.value.overall = null
      selectedWeekOffset.value = weekOffset

      const weekRange = getWeekRange(weekOffset)

      // 日記データを取得（指定された週の範囲で絞り込み）
      await dataStore.fetchDiaries(authStore.user.id, true)
      const allDiaries = dataStore.sortedDiaries

      // 指定された週の日記のみフィルタリング
      const weeklyDiaries = allDiaries.filter((diary) => {
        const diaryDate = new Date(diary.created_at)
        return diaryDate >= weekRange.start && diaryDate <= weekRange.end
      })

      // 各データを並行計算
      const [moodData, emotionTags, progressData] = await Promise.all([
        Promise.resolve(createWeeklyMoodData(weeklyDiaries, weekRange)),
        Promise.resolve(createWeeklyEmotionTags(weeklyDiaries)),
        Promise.resolve(createWeeklyProgressData(weeklyDiaries)),
      ])

      const comments = generateAnalysisComments(moodData, emotionTags, progressData)
      const stats = calculateWeeklyStats(moodData, weeklyDiaries, emotionTags)

      reflectionData.value = {
        weekLabel: getWeekLabel(weekOffset),
        startDate: weekRange.startString,
        endDate: weekRange.endString,
        moodData,
        emotionTags,
        progressData,
        comments,
        stats,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '週間データの取得に失敗しました'
      error.value.overall = errorMessage
    } finally {
      loading.value.overall = false
    }
  }

  // 週の変更
  const changeWeek = async (offset: number): Promise<void> => {
    await fetchWeeklyReflection(offset)
  }

  // リフレッシュ機能
  const refresh = async (): Promise<void> => {
    await fetchWeeklyReflection(selectedWeekOffset.value)
  }

  // Chart.jsデータ形式への変換
  const chartData = computed(() => {
    return {
      labels: reflectionData.value.moodData.map((point) => `${point.dayOfWeek}(${point.label})`),
      datasets: [
        {
          label: '気分スコア',
          data: reflectionData.value.moodData.map((point) => point.mood),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          fill: true,
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
        text: `${reflectionData.value.weekLabel}の気分推移`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        title: {
          display: true,
          text: '気分スコア',
        },
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  // 計算プロパティ
  const hasData = computed(() => {
    return reflectionData.value.stats.totalEntries > 0
  })

  const hasError = computed(() => {
    return !!(
      error.value.overall ||
      error.value.moodData ||
      error.value.emotionTags ||
      error.value.progressData
    )
  })

  const isLoading = computed(() => {
    return !!(
      loading.value.overall ||
      loading.value.moodData ||
      loading.value.emotionTags ||
      loading.value.progressData
    )
  })

  return {
    // 状態
    reflectionData: computed(() => reflectionData.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    selectedWeekOffset: computed(() => selectedWeekOffset.value),

    // 計算プロパティ
    hasData,
    hasError,
    isLoading,
    chartData,
    chartOptions,

    // メソッド
    fetchWeeklyReflection,
    changeWeek,
    refresh,

    // ユーティリティ
    getWeekLabel,
    getWeekRange,
  }
}
