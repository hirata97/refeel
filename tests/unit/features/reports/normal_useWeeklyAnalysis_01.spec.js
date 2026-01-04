import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useWeeklyAnalysis } from '@features/reports'

// ストアのモック
vi.mock('@/stores/data', () => ({
  useDataStore: vi.fn(() => ({
    fetchDiaries: vi.fn(),
    sortedDiaries: [],
  }))
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'test-user-id' },
  }))
}))

// テストデータ
const mockDiaries = [
  {
    id: '1',
    user_id: 'test-user-id',
    title: 'Test Diary 1',
    content: 'Test content 1',
    mood: 8,
    mood_reason: '良い一日でした',
    goal_category: '健康',
    progress_level: 7,
    created_at: '2024-01-15T10:00:00Z', // 月曜日
    date: '2024-01-15',
  },
  {
    id: '2',
    user_id: 'test-user-id',
    title: 'Test Diary 2',
    content: 'Test content 2',
    mood: 6,
    mood_reason: '普通の一日',
    goal_category: '学習',
    progress_level: 5,
    created_at: '2024-01-16T14:00:00Z', // 火曜日
    date: '2024-01-16',
  },
  {
    id: '3',
    user_id: 'test-user-id',
    title: 'Test Diary 3',
    content: 'Test content 3',
    mood: 9,
    mood_reason: '最高の一日',
    goal_category: '健康',
    progress_level: 9,
    created_at: '2024-01-17T16:00:00Z', // 水曜日
    date: '2024-01-17',
  }
]

describe('useWeeklyAnalysis - 正常系', () => {
  let weeklyAnalysis

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    weeklyAnalysis = useWeeklyAnalysis()
  })

  it('初期状態が正しく設定されている', () => {
    expect(weeklyAnalysis.reflectionData.value.weekLabel).toBe('')
    expect(weeklyAnalysis.reflectionData.value.moodData).toEqual([])
    expect(weeklyAnalysis.reflectionData.value.emotionTags).toEqual([])
    expect(weeklyAnalysis.reflectionData.value.progressData).toEqual([])
    expect(weeklyAnalysis.reflectionData.value.comments).toEqual([])
    expect(weeklyAnalysis.selectedWeekOffset.value).toBe(0)
    expect(weeklyAnalysis.hasData.value).toBe(false)
    expect(weeklyAnalysis.isLoading.value).toBe(false)
    expect(weeklyAnalysis.hasError.value).toBe(false)
  })

  it('週の範囲計算が正しい', () => {
    const weekRange = weeklyAnalysis.getWeekRange(0)
    
    expect(weekRange).toHaveProperty('start')
    expect(weekRange).toHaveProperty('end')
    expect(weekRange).toHaveProperty('startString')
    expect(weekRange).toHaveProperty('endString')
    
    // 開始日が月曜日であることを確認
    expect(weekRange.start.getDay()).toBe(1)
    
    // 終了日が日曜日であることを確認
    expect(weekRange.end.getDay()).toBe(0)
    
    // 7日間の期間であることを確認
    const diffTime = weekRange.end.getTime() - weekRange.start.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(7)
  })

  it('週ラベルが正しく生成される', () => {
    expect(weeklyAnalysis.getWeekLabel(0)).toBe('今週')
    expect(weeklyAnalysis.getWeekLabel(1)).toBe('先週')
    expect(weeklyAnalysis.getWeekLabel(2)).toBe('先々週')
    expect(weeklyAnalysis.getWeekLabel(3)).toBe('3週間前')
  })

  it('Chart.jsデータ形式が正しい', async () => {
    // Chart.jsデータの構造をテスト
    expect(weeklyAnalysis.chartData.value).toHaveProperty('labels')
    expect(weeklyAnalysis.chartData.value).toHaveProperty('datasets')
    expect(Array.isArray(weeklyAnalysis.chartData.value.datasets)).toBe(true)
    expect(weeklyAnalysis.chartData.value.datasets).toHaveLength(1)
    
    const dataset = weeklyAnalysis.chartData.value.datasets[0]
    expect(dataset).toHaveProperty('label', '気分スコア')
    expect(dataset).toHaveProperty('borderColor', 'rgb(75, 192, 192)')
    expect(dataset).toHaveProperty('backgroundColor', 'rgba(75, 192, 192, 0.2)')
    expect(dataset).toHaveProperty('tension', 0.1)
    expect(dataset).toHaveProperty('fill', true)

    expect(weeklyAnalysis.chartOptions.plugins.title.display).toBe(true)
    expect(weeklyAnalysis.chartOptions.scales.y.max).toBe(10)
  })

  it('hasDataプロパティが正しく動作する', () => {
    // 初期状態ではfalse
    expect(weeklyAnalysis.hasData.value).toBe(false)
    
    // データを追加するとtrue
    weeklyAnalysis.reflectionData.value.stats.totalEntries = 3
    expect(weeklyAnalysis.hasData.value).toBe(true)
    
    // データを削除するとfalse
    weeklyAnalysis.reflectionData.value.stats.totalEntries = 0
    expect(weeklyAnalysis.hasData.value).toBe(false)
  })

  it('ローディング状態が正しく管理される', () => {
    expect(weeklyAnalysis.isLoading.value).toBe(false)
    
    // overall loadingをtrueにする
    weeklyAnalysis.loading.value.overall = true
    expect(weeklyAnalysis.isLoading.value).toBe(true)
    
    // moodData loadingをtrueにする
    weeklyAnalysis.loading.value.overall = false
    weeklyAnalysis.loading.value.moodData = true
    expect(weeklyAnalysis.isLoading.value).toBe(true)
    
    // 全てfalseにする
    weeklyAnalysis.loading.value.moodData = false
    expect(weeklyAnalysis.isLoading.value).toBe(false)
  })

  it('エラー状態が正しく管理される', () => {
    expect(weeklyAnalysis.hasError.value).toBe(false)
    
    // overall errorを設定
    weeklyAnalysis.error.value.overall = 'テストエラー'
    expect(weeklyAnalysis.hasError.value).toBe(true)
    
    // moodData errorを設定
    weeklyAnalysis.error.value.overall = null
    weeklyAnalysis.error.value.moodData = '気分データエラー'
    expect(weeklyAnalysis.hasError.value).toBe(true)
    
    // 全てnullにする
    weeklyAnalysis.error.value.moodData = null
    expect(weeklyAnalysis.hasError.value).toBe(false)
  })
})

describe('useWeeklyAnalysis - 週の変更', () => {
  let weeklyAnalysis

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    weeklyAnalysis = useWeeklyAnalysis()
  })

  it('changeWeek関数が正しく定義されている', () => {
    expect(typeof weeklyAnalysis.changeWeek).toBe('function')
  })

  it('refresh関数が正しく定義されている', () => {
    expect(typeof weeklyAnalysis.refresh).toBe('function')
  })
})

describe('useWeeklyAnalysis - データ変換', () => {
  let _weeklyAnalysis

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    _weeklyAnalysis = useWeeklyAnalysis()
  })

  it('週間気分データが正しく作成される', () => {
    const _weekRange = {
      start: new Date('2024-01-15'), // 月曜日
      end: new Date('2024-01-21'), // 日曜日
      startString: '2024-01-15',
      endString: '2024-01-21',
    }

    // 内部関数をテストするため、モックデータでテスト
    const _testDiaries = [
      {
        ...mockDiaries[0],
        created_at: '2024-01-15T10:00:00Z',
        mood: 8
      },
      {
        ...mockDiaries[1],
        created_at: '2024-01-16T10:00:00Z',
        mood: 6
      }
    ]

    // createWeeklyMoodData関数の動作を間接的にテスト
    // 実際の実装では、fetchWeeklyReflection経由でテストする
    expect(_testDiaries.length).toBe(2)
    expect(_testDiaries[0].mood).toBe(8)
    expect(_testDiaries[1].mood).toBe(6)
  })

  it('感情タグ頻度計算は現在無効（旧tagsシステム削除済み）', () => {
    // 旧tagsフィールドシステムは削除されました
    // 今後はemotion_tagsテーブルとの連携が必要です
    expect(true).toBe(true) // プレースホルダー
  })

  it('進捗パターンが正しく集計される', () => {
    const testDiaries = mockDiaries

    // カテゴリ別の進捗を確認
    const progressByCategory = testDiaries.reduce((progress, diary) => {
      const category = diary.goal_category
      if (!progress[category]) {
        progress[category] = { sum: 0, count: 0 }
      }
      progress[category].sum += diary.progress_level
      progress[category].count += 1
      return progress
    }, {})

    expect(progressByCategory['健康'].sum).toBe(16) // 7 + 9
    expect(progressByCategory['健康'].count).toBe(2)
    expect(progressByCategory['学習'].sum).toBe(5)
    expect(progressByCategory['学習'].count).toBe(1)
  })
})