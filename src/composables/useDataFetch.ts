import { ref, computed, watch, onUnmounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
import { performanceMonitor, debounce, throttle } from '@/utils/performance'
import type { DiaryEntry } from '@/stores/data'

// データ取得オプション
interface FetchOptions {
  immediate?: boolean
  cache?: boolean
  refresh?: boolean
  debounceMs?: number
  throttleMs?: number
}

// 汎用データ取得コンポーザブル
export function useDataFetch<T>(
  fetcher: () => Promise<T>,
  key: string,
  options: FetchOptions = {}
) {
  const {
    immediate = true,
    refresh = false,
    debounceMs = 0,
    throttleMs = 0
  } = options

  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetched = ref<Date | null>(null)

  // エラー処理
  const handleError = (err: unknown): void => {
    const message = err instanceof Error ? err.message : 'データ取得エラー'
    error.value = message
    console.error(`Fetch error for ${key}:`, err)
  }

  // データ取得実行
  const execute = async (forceRefresh = false): Promise<T | null> => {
    if (loading.value && !forceRefresh) {
      return data.value
    }

    try {
      loading.value = true
      error.value = null
      
      performanceMonitor.start(`fetch_${key}`)
      
      const result = await fetcher()
      
      data.value = result
      lastFetched.value = new Date()
      
      return result
    } catch (err) {
      handleError(err)
      return null
    } finally {
      loading.value = false
      performanceMonitor.end(`fetch_${key}`)
    }
  }

  // デバウンス・スロットル対応
  let debouncedExecute = execute
  let throttledExecute = execute

  if (debounceMs > 0) {
    debouncedExecute = debounce(execute, debounceMs)
  }

  if (throttleMs > 0) {
    throttledExecute = throttle(execute, throttleMs)
  }

  const finalExecute = debounceMs > 0 ? debouncedExecute : 
                      throttleMs > 0 ? throttledExecute : execute

  // 初期実行
  if (immediate) {
    finalExecute(refresh)
  }

  // 計算プロパティ
  const isStale = computed(() => {
    if (!lastFetched.value) return true
    const staleTime = 5 * 60 * 1000 // 5分
    return Date.now() - lastFetched.value.getTime() > staleTime
  })

  const hasData = computed(() => data.value !== null)

  return {
    data,
    loading,
    error,
    execute: finalExecute,
    refresh: () => finalExecute(true),
    isStale,
    hasData
  }
}

// 日記データ専用フック
export function useDiaries(options: FetchOptions = {}) {
  const dataStore = useDataStore()
  const authStore = useAuthStore()

  const {
    data: diaries,
    loading,
    error,
    execute,
    refresh,
    isStale,
    hasData
  } = useDataFetch(
    async () => {
      if (!authStore.user?.id) {
        throw new Error('ユーザーが認証されていません')
      }
      return await dataStore.fetchDiaries(authStore.user.id, options.refresh)
    },
    'diaries',
    options
  )

  // フィルタリング機能
  const filteredDiaries = ref<DiaryEntry[]>([])
  const filter = ref({
    category: '',
    dateRange: { start: '', end: '' },
    searchText: ''
  })

  // フィルター適用
  const applyFilters = () => {
    if (!diaries.value) return

    let filtered = [...diaries.value]

    // カテゴリフィルター
    if (filter.value.category) {
      filtered = filtered.filter(d => d.goal_category === filter.value.category)
    }

    // 日付範囲フィルター
    if (filter.value.dateRange.start) {
      const startDate = new Date(filter.value.dateRange.start)
      filtered = filtered.filter(d => new Date(d.created_at) >= startDate)
    }

    if (filter.value.dateRange.end) {
      const endDate = new Date(filter.value.dateRange.end)
      filtered = filtered.filter(d => new Date(d.created_at) <= endDate)
    }

    // テキスト検索
    if (filter.value.searchText) {
      const searchLower = filter.value.searchText.toLowerCase()
      filtered = filtered.filter(d => 
        d.title.toLowerCase().includes(searchLower) ||
        d.content.toLowerCase().includes(searchLower)
      )
    }

    filteredDiaries.value = filtered
  }

  // フィルター変更監視
  watch([() => diaries.value, filter], applyFilters, { deep: true, immediate: true })

  // ページネーション
  const pagination = ref({
    page: 1,
    pageSize: 10,
    total: computed(() => filteredDiaries.value.length)
  })

  const paginatedDiaries = computed(() => {
    const start = (pagination.value.page - 1) * pagination.value.pageSize
    const end = start + pagination.value.pageSize
    return filteredDiaries.value.slice(start, end)
  })

  // カテゴリ統計
  const categoryStats = computed(() => {
    if (!diaries.value) return {}
    
    const stats: Record<string, { count: number; avgProgress: number }> = {}
    
    diaries.value.forEach((diary: DiaryEntry) => {
      if (!stats[diary.goal_category]) {
        stats[diary.goal_category] = { count: 0, avgProgress: 0 }
      }
      stats[diary.goal_category].count++
      stats[diary.goal_category].avgProgress += diary.progress_level
    })

    // 平均値計算
    Object.keys(stats).forEach(category => {
      stats[category].avgProgress /= stats[category].count
    })

    return stats
  })

  return {
    // データ
    diaries: paginatedDiaries,
    allDiaries: diaries.value,
    loading,
    error,
    
    // フィルタリング
    filter,
    filteredDiaries,
    applyFilters,
    
    // ページネーション
    pagination,
    
    // 統計
    categoryStats,
    
    // アクション
    execute,
    refresh,
    
    // 状態
    isStale,
    hasData
  }
}

// アカウントデータ専用フック
export function useAccounts(options: FetchOptions = {}) {
  const dataStore = useDataStore()
  const authStore = useAuthStore()

  return useDataFetch(
    async () => {
      if (!authStore.user?.id) {
        throw new Error('ユーザーが認証されていません')
      }
      return await dataStore.fetchAccounts(authStore.user.id, options.refresh)
    },
    'accounts',
    options
  )
}

// リアルタイム更新フック
export function useRealtimeData() {
  const dataStore = useDataStore()
  const authStore = useAuthStore()
  const updateInterval = ref<NodeJS.Timeout | null>(null)

  const startPolling = (intervalMs = 30000) => { // 30秒間隔
    if (updateInterval.value) {
      clearInterval(updateInterval.value)
    }

    updateInterval.value = setInterval(async () => {
      if (authStore.user?.id) {
        try {
          await dataStore.fetchDiaries(authStore.user.id, true)
        } catch (error) {
          console.error('ポーリング更新エラー:', error)
        }
      }
    }, intervalMs)
  }

  const stopPolling = () => {
    if (updateInterval.value) {
      clearInterval(updateInterval.value)
      updateInterval.value = null
    }
  }

  // 認証状態変更の監視
  watch(() => authStore.isAuthenticated, (isAuth) => {
    if (isAuth) {
      startPolling()
    } else {
      stopPolling()
    }
  }, { immediate: true })

  // クリーンアップ
  onUnmounted(() => {
    stopPolling()
  })

  return {
    startPolling,
    stopPolling,
    isPolling: computed(() => updateInterval.value !== null)
  }
}

// バックグラウンド同期フック
export function useBackgroundSync() {
  const dataStore = useDataStore()
  const authStore = useAuthStore()

  const syncQueue = ref<Array<{ type: string; data: unknown; timestamp: number }>>([])
  const isSyncing = ref(false)

  // オフライン検知
  const isOnline = ref(navigator.onLine)

  const updateOnlineStatus = () => {
    isOnline.value = navigator.onLine
  }

  addEventListener('online', updateOnlineStatus)
  addEventListener('offline', updateOnlineStatus)

  // 同期実行
  const sync = async () => {
    if (!isOnline.value || isSyncing.value || !authStore.user?.id) {
      return
    }

    isSyncing.value = true

    try {
      // 未同期データを処理
      for (const item of syncQueue.value) {
        switch (item.type) {
          case 'diary_create':
            await dataStore.createDiary(item.data as Parameters<typeof dataStore.createDiary>[0])
            break
          case 'diary_update':
            const updateData = item.data as { id: string; updates: Parameters<typeof dataStore.updateDiary>[1] }
            await dataStore.updateDiary(updateData.id, updateData.updates)
            break
          case 'diary_delete':
            const deleteData = item.data as { id: string; userId: string }
            await dataStore.deleteDiary(deleteData.id, deleteData.userId)
            break
        }
      }

      // 同期完了後キューをクリア
      syncQueue.value = []
    } catch (syncError) {
      console.error('バックグラウンド同期エラー:', syncError)
    } finally {
      isSyncing.value = false
    }
  }

  // オンライン復帰時の同期
  watch(isOnline, (online) => {
    if (online) {
      sync()
    }
  })

  // キューへの追加
  const addToQueue = (type: string, data: unknown) => {
    syncQueue.value.push({
      type,
      data,
      timestamp: Date.now()
    })
  }

  // クリーンアップ
  onUnmounted(() => {
    removeEventListener('online', updateOnlineStatus)
    removeEventListener('offline', updateOnlineStatus)
  })

  return {
    isOnline,
    isSyncing,
    sync,
    addToQueue,
    queueSize: computed(() => syncQueue.value.length)
  }
}