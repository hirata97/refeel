import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface LoadingState {
  [key: string]: boolean
}

export const useLoadingStore = defineStore('loading', () => {
  const loadingStates = ref<LoadingState>({})
  const globalLoading = ref(false)

  // 任意のキーでローディング状態を管理
  const isLoading = computed(() => (key: string): boolean => {
    return loadingStates.value[key] || false
  })

  // 何かがローディング中かどうか
  const hasAnyLoading = computed((): boolean => {
    return globalLoading.value || Object.values(loadingStates.value).some((state) => state)
  })

  const setLoading = (key: string, loading: boolean): void => {
    if (loading) {
      loadingStates.value[key] = true
    } else {
      delete loadingStates.value[key]
    }
  }

  const setGlobalLoading = (loading: boolean): void => {
    globalLoading.value = loading
  }

  // 非同期操作を自動的にローディング状態で包む
  const withLoading = async <T>(key: string, operation: () => Promise<T>): Promise<T> => {
    try {
      setLoading(key, true)
      return await operation()
    } finally {
      setLoading(key, false)
    }
  }

  // グローバルローディング用のヘルパー
  const withGlobalLoading = async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      setGlobalLoading(true)
      return await operation()
    } finally {
      setGlobalLoading(false)
    }
  }

  // 複数の操作を並行実行しつつローディング管理
  const withMultipleLoading = async <T>(
    operations: Array<{
      key: string
      operation: () => Promise<T>
    }>,
  ): Promise<T[]> => {
    const promises = operations.map(({ key, operation }) => withLoading(key, operation))
    return Promise.all(promises)
  }

  // デバッグ用：現在のローディング状態を取得
  const getLoadingStates = computed(() => {
    return {
      global: globalLoading.value,
      specific: { ...loadingStates.value },
    }
  })

  return {
    loadingStates,
    globalLoading,
    isLoading,
    hasAnyLoading,
    setLoading,
    setGlobalLoading,
    withLoading,
    withGlobalLoading,
    withMultipleLoading,
    getLoadingStates,
  }
})
