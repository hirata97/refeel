/**
 * useDashboardData コンポーザブルの正常系テスト
 * Issue #38: ダッシュボードの動的データ表示実装
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDashboardData } from '@/composables/useDashboardData'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'

// モック設定
vi.mock('@/stores/data')
vi.mock('@/stores/auth')

describe('useDashboardData - 正常系', () => {
  let mockDataStore
  let mockAuthStore

  beforeEach(() => {
    setActivePinia(createPinia())
    
    // データストアのモック
    mockDataStore = {
      fetchDiaries: vi.fn().mockResolvedValue({
        data: [],
        count: 0,
        totalPages: 1,
      }),
      sortedDiaries: [],
    }
    
    // 認証ストアのモック
    mockAuthStore = {
      user: {
        id: 'test-user-id',
      },
    }
    
    vi.mocked(useDataStore).mockReturnValue(mockDataStore)
    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore)
  })

  it('初期状態が正しく設定されている', () => {
    const { dashboardData, loading, error, hasData, hasError, isLoading } = useDashboardData()

    // 初期状態の確認
    expect(dashboardData.value.stats.totalDiaries).toBe(0)
    expect(dashboardData.value.stats.weeklyDiaries).toBe(0)
    expect(dashboardData.value.stats.averageMood).toBe(0)
    expect(dashboardData.value.stats.streakDays).toBe(0)
    expect(dashboardData.value.recentDiaries).toEqual([])
    expect(dashboardData.value.moodData).toEqual([])
    expect(dashboardData.value.quickActions).toEqual([])

    expect(loading.value.overall).toBe(false)
    expect(error.value.overall).toBe(null)
    expect(hasData.value).toBe(false)
    expect(hasError.value).toBe(false)
    expect(isLoading.value).toBe(false)
  })

  it('日記データが存在する場合の統計計算が正しい', async () => {
    // テストデータの準備
    const testDiaries = [
      {
        id: '1',
        title: 'Test Diary 1',
        content: 'Content 1',
        goal_category: 'Health',
        progress_level: 80,
        created_at: new Date().toISOString(), // 今日
        user_id: 'test-user-id',
      },
      {
        id: '2',
        title: 'Test Diary 2',
        content: 'Content 2',
        goal_category: 'Work',
        progress_level: 60,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 昨日
        user_id: 'test-user-id',
      },
      {
        id: '3',
        title: 'Test Diary 3',
        content: 'Content 3',
        goal_category: 'Learning',
        progress_level: 90,
        created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8日前
        user_id: 'test-user-id',
      },
    ]

    mockDataStore.sortedDiaries = testDiaries
    mockDataStore.fetchDiaries.mockResolvedValue({
      data: testDiaries,
      count: testDiaries.length,
      totalPages: 1,
    })

    const { dashboardData, fetchDashboardData } = useDashboardData()

    await fetchDashboardData()

    // 統計の確認
    expect(dashboardData.value.stats.totalDiaries).toBe(3)
    expect(dashboardData.value.stats.weeklyDiaries).toBe(2) // 今日と昨日の2件
    expect(dashboardData.value.stats.averageMood).toBe(77) // (80+60+90)/3 = 76.7 → 77
    expect(dashboardData.value.stats.streakDays).toBeGreaterThanOrEqual(0)
  })

  it('最近の日記データが正しく生成される', async () => {
    const testDiaries = [
      {
        id: '1',
        title: 'Very Long Title That Should Be Truncated Because It Exceeds The Limit',
        content: 'Very long content that should be truncated to 50 characters',
        goal_category: 'Health',
        progress_level: 80,
        created_at: new Date().toISOString(),
        user_id: 'test-user-id',
      },
    ]

    mockDataStore.sortedDiaries = testDiaries

    const { dashboardData, fetchDashboardData } = useDashboardData()

    await fetchDashboardData()

    const recentDiary = dashboardData.value.recentDiaries[0]
    expect(recentDiary.id).toBe('1')
    expect(recentDiary.title).toBe('Very Long Title That Should Be Truncated Because It Exceeds The Limit')
    expect(recentDiary.preview.length).toBeLessThanOrEqual(53) // 50文字 + \"...\"
    expect(recentDiary.goal_category).toBe('Health')
    expect(recentDiary.progress_level).toBe(80)
  })

  it('7日間の気分データが正しく生成される', async () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    
    const testDiaries = [
      {
        id: '1',
        title: 'Today Diary',
        content: 'Content',
        goal_category: 'Health',
        progress_level: 80,
        created_at: today.toISOString(),
        user_id: 'test-user-id',
      },
      {
        id: '2',
        title: 'Yesterday Diary',
        content: 'Content',
        goal_category: 'Health',
        progress_level: 60,
        created_at: yesterday.toISOString(),
        user_id: 'test-user-id',
      },
    ]

    mockDataStore.sortedDiaries = testDiaries

    const { dashboardData, fetchDashboardData } = useDashboardData()

    await fetchDashboardData()

    const moodData = dashboardData.value.moodData
    expect(moodData.length).toBeGreaterThan(0)
    expect(moodData.length).toBeLessThanOrEqual(7)
    
    // 各データポイントの構造確認
    moodData.forEach(point => {
      expect(point).toHaveProperty('date')
      expect(point).toHaveProperty('mood')
      expect(point).toHaveProperty('label')
      expect(point.mood).toBeGreaterThanOrEqual(0)
      expect(point.mood).toBeLessThanOrEqual(100)
    })
  })

  it('Chart.jsデータ形式が正しく生成される', async () => {
    const { chartData, chartOptions } = useDashboardData()

    // チャートデータの構造確認
    expect(chartData.value).toHaveProperty('labels')
    expect(chartData.value).toHaveProperty('datasets')
    expect(Array.isArray(chartData.value.labels)).toBe(true)
    expect(Array.isArray(chartData.value.datasets)).toBe(true)

    // チャートオプションの確認
    expect(chartOptions).toHaveProperty('responsive')
    expect(chartOptions).toHaveProperty('plugins')
    expect(chartOptions).toHaveProperty('scales')
    expect(chartOptions.responsive).toBe(true)
  })

  it('エラーハンドリングが正しく動作する', async () => {
    const testError = new Error('データ取得エラー')
    mockDataStore.fetchDiaries.mockRejectedValue(testError)

    const { error, hasError, fetchDashboardData } = useDashboardData()

    try {
      await fetchDashboardData()
    } catch (err) {
      expect(err.message).toBe('データ取得エラー')
    }
    
    expect(error.value.overall).toBe('データ取得エラー')
    expect(hasError.value).toBe(true)
  })

  it('リフレッシュ機能が正しく動作する', async () => {
    const { refresh, fetchDashboardData } = useDashboardData()

    const fetchSpy = vi.fn().mockImplementation(fetchDashboardData)
    
    // リフレッシュの呼び出し確認
    await refresh()
    expect(mockDataStore.fetchDiaries).toHaveBeenCalled()
  })
})