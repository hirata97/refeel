import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useRouter, useRoute } from 'vue-router'

export interface PaginationState {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PaginationFilters {
  goal_category?: string
  progress_level_min?: number | null
  progress_level_max?: number | null
  date_from?: string
  date_to?: string
  search_text?: string
}

export const usePaginationStore = defineStore('pagination', () => {
  const router = useRouter()
  const route = useRoute()

  // 各ページの状態を個別に管理
  const states = ref<Record<string, PaginationState>>({})
  const filters = ref<Record<string, PaginationFilters>>({})
  const loading = ref<Record<string, boolean>>({})
  const error = ref<Record<string, string | null>>({})

  // 現在のページキー（ルート名ベース）
  const getCurrentPageKey = (): string => {
    return route.name?.toString() || 'default'
  }

  // デフォルト状態
  const getDefaultState = (): PaginationState => ({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1
  })

  // 現在のページの状態を取得
  const getCurrentState = computed(() => {
    const key = getCurrentPageKey()
    return states.value[key] || getDefaultState()
  })

  // 現在のページのフィルターを取得
  const getCurrentFilters = computed(() => {
    const key = getCurrentPageKey()
    return filters.value[key] || {}
  })

  // 現在のページのローディング状態
  const getCurrentLoading = computed(() => {
    const key = getCurrentPageKey()
    return loading.value[key] || false
  })

  // 現在のページのエラー状態
  const getCurrentError = computed(() => {
    const key = getCurrentPageKey()
    return error.value[key] || null
  })

  // URLクエリからパラメータを読み込み
  const loadFromUrlQuery = () => {
    const pageKey = getCurrentPageKey()
    const query = route.query

    // ページネーション状態の復元
    const pageFromQuery = query.page ? parseInt(query.page.toString()) : 1
    const pageSizeFromQuery = query.pageSize ? parseInt(query.pageSize.toString()) : 10

    const newState = {
      ...getDefaultState(),
      page: pageFromQuery,
      pageSize: pageSizeFromQuery
    }

    states.value[pageKey] = newState

    // フィルター状態の復元
    const newFilters: PaginationFilters = {}
    if (query.category) newFilters.goal_category = query.category.toString()
    if (query.progress_min) newFilters.progress_level_min = parseInt(query.progress_min.toString())
    if (query.progress_max) newFilters.progress_level_max = parseInt(query.progress_max.toString())
    if (query.date_from) newFilters.date_from = query.date_from.toString()
    if (query.date_to) newFilters.date_to = query.date_to.toString()
    if (query.search) newFilters.search_text = query.search.toString()

    filters.value[pageKey] = newFilters
  }

  // URLクエリへの同期
  const syncToUrlQuery = () => {
    const pageKey = getCurrentPageKey()
    const currentState = states.value[pageKey]
    const currentFilters = filters.value[pageKey]
    
    if (!currentState) return

    const query: Record<string, string | string[]> = {}

    // ページネーション情報をクエリに追加（デフォルト値以外のみ）
    if (currentState.page > 1) {
      query.page = currentState.page.toString()
    }
    if (currentState.pageSize !== 10) {
      query.pageSize = currentState.pageSize.toString()
    }

    // フィルター情報をクエリに追加
    if (currentFilters) {
      if (currentFilters.goal_category) query.category = currentFilters.goal_category
      if (currentFilters.progress_level_min !== undefined && currentFilters.progress_level_min !== null) query.progress_min = currentFilters.progress_level_min.toString()
      if (currentFilters.progress_level_max !== undefined && currentFilters.progress_level_max !== null) query.progress_max = currentFilters.progress_level_max.toString()
      if (currentFilters.date_from) query.date_from = currentFilters.date_from
      if (currentFilters.date_to) query.date_to = currentFilters.date_to
      if (currentFilters.search_text) query.search = currentFilters.search_text
    }

    // URLを更新（ページリロードなし）
    router.replace({ query }).catch(() => {
      // ルートが同じ場合のエラーを無視
    })
  }

  // 状態の更新
  const updateState = (newState: Partial<PaginationState>) => {
    const pageKey = getCurrentPageKey()
    const currentState = states.value[pageKey] || getDefaultState()
    
    states.value[pageKey] = {
      ...currentState,
      ...newState
    }

    // URL同期
    syncToUrlQuery()
  }

  // フィルターの更新
  const updateFilters = (newFilters: Partial<PaginationFilters>) => {
    const pageKey = getCurrentPageKey()
    
    filters.value[pageKey] = {
      ...filters.value[pageKey],
      ...newFilters
    }

    // フィルター変更時は1ページ目に戻る
    updateState({ page: 1 })
  }

  // フィルターのクリア
  const clearFilters = () => {
    const pageKey = getCurrentPageKey()
    filters.value[pageKey] = {}
    updateState({ page: 1 })
  }

  // ページ変更
  const changePage = (page: number) => {
    updateState({ page })
  }

  // ページサイズ変更
  const changePageSize = (pageSize: number) => {
    updateState({ pageSize, page: 1 })
  }

  // ローディング状態の設定
  const setLoading = (isLoading: boolean) => {
    const pageKey = getCurrentPageKey()
    loading.value[pageKey] = isLoading
  }

  // エラー状態の設定
  const setError = (errorMessage: string | null) => {
    const pageKey = getCurrentPageKey()
    error.value[pageKey] = errorMessage
  }

  // 状態のリセット
  const resetState = (pageKey?: string) => {
    const key = pageKey || getCurrentPageKey()
    states.value[key] = getDefaultState()
    filters.value[key] = {}
    loading.value[key] = false
    error.value[key] = null
    
    // URL同期
    syncToUrlQuery()
  }

  // 履歴の管理（ブラウザの戻る/進むボタン対応）
  const handlePopState = () => {
    loadFromUrlQuery()
  }

  // ローカルストレージへの永続化
  const persistState = () => {
    const pageKey = getCurrentPageKey()
    const stateData = {
      state: states.value[pageKey],
      filters: filters.value[pageKey],
      timestamp: Date.now()
    }
    
    try {
      localStorage.setItem(`pagination_${pageKey}`, JSON.stringify(stateData))
    } catch (error) {
      console.warn('ページネーション状態の永続化に失敗:', error)
    }
  }

  // ローカルストレージからの復元
  const restoreState = () => {
    const pageKey = getCurrentPageKey()
    
    try {
      const stored = localStorage.getItem(`pagination_${pageKey}`)
      if (stored) {
        const { state, filters: storedFilters, timestamp } = JSON.parse(stored)
        
        // 1時間以内のデータのみ復元
        if (Date.now() - timestamp < 60 * 60 * 1000) {
          states.value[pageKey] = { ...getDefaultState(), ...state }
          filters.value[pageKey] = storedFilters || {}
        }
      }
    } catch (error) {
      console.warn('ページネーション状態の復元に失敗:', error)
    }
  }

  // 初期化処理
  const initialize = () => {
    // URL優先でローカルストレージから復元
    if (Object.keys(route.query).length > 0) {
      loadFromUrlQuery()
    } else {
      restoreState()
    }

    // popstateイベントのリスナー設定
    window.addEventListener('popstate', handlePopState)

    // 状態変更の監視と永続化
    watch([states, filters], persistState, { deep: true })
  }

  // クリーンアップ
  const cleanup = () => {
    window.removeEventListener('popstate', handlePopState)
  }

  // デバッグ用情報
  const getDebugInfo = computed(() => ({
    states: states.value,
    filters: filters.value,
    loading: loading.value,
    error: error.value,
    currentPageKey: getCurrentPageKey(),
    urlQuery: route.query
  }))

  return {
    // 状態
    getCurrentState,
    getCurrentFilters,
    getCurrentLoading,
    getCurrentError,

    // アクション
    updateState,
    updateFilters,
    clearFilters,
    changePage,
    changePageSize,
    setLoading,
    setError,
    resetState,
    
    // URL同期
    loadFromUrlQuery,
    syncToUrlQuery,
    
    // ライフサイクル
    initialize,
    cleanup,

    // ユーティリティ
    getDebugInfo
  }
})