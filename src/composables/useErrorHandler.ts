import { ref, computed } from 'vue'

export interface NotificationOptions {
  type?: 'success' | 'error' | 'warning' | 'info'
  timeout?: number
  icon?: string
  closable?: boolean
}

export interface ErrorHandlerState {
  loading: boolean
  error: string | null
  notification: {
    show: boolean
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    timeout: number
    icon: string
  }
}

/**
 * エラーハンドリングと通知機能を提供するComposable
 */
export function useErrorHandler() {
  // 内部状態
  const loading = ref(false)
  const error = ref<string | null>(null)
  const notification = ref({
    show: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    timeout: 5000,
    icon: 'mdi-information',
  })

  // Computed
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value && error.value.trim() !== '')
  const displayError = computed(() => {
    const errorValue = error.value
    return errorValue && errorValue.trim() ? errorValue : null
  })

  /**
   * 通知を表示
   */
  const showNotification = (message: string, options: NotificationOptions = {}) => {
    const { type = 'info', timeout = 5000, icon } = options

    // アイコンの自動設定
    let notificationIcon = icon
    if (!notificationIcon) {
      switch (type) {
        case 'success':
          notificationIcon = 'mdi-check-circle'
          break
        case 'error':
          notificationIcon = 'mdi-alert-circle'
          break
        case 'warning':
          notificationIcon = 'mdi-alert'
          break
        default:
          notificationIcon = 'mdi-information'
      }
    }

    notification.value = {
      show: true,
      message,
      type,
      timeout,
      icon: notificationIcon,
    }

    // 自動非表示
    if (timeout > 0) {
      setTimeout(() => {
        notification.value.show = false
      }, timeout)
    }
  }

  /**
   * 通知を非表示
   */
  const hideNotification = () => {
    notification.value.show = false
  }

  /**
   * エラーを設定
   */
  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  /**
   * エラーをクリア
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * ローディング状態を設定
   */
  const setLoading = (loadingState: boolean) => {
    loading.value = loadingState
  }

  /**
   * 成功通知を表示
   */
  const showSuccess = (message: string, timeout?: number) => {
    showNotification(message, { type: 'success', timeout })
  }

  /**
   * エラー通知を表示
   */
  const showError = (message: string, timeout?: number) => {
    showNotification(message, { type: 'error', timeout })
    setError(message)
  }

  /**
   * 警告通知を表示
   */
  const showWarning = (message: string, timeout?: number) => {
    showNotification(message, { type: 'warning', timeout })
  }

  /**
   * 情報通知を表示
   */
  const showInfo = (message: string, timeout?: number) => {
    showNotification(message, { type: 'info', timeout })
  }

  /**
   * 非同期処理をラップしてエラーハンドリングを自動化
   */
  const withErrorHandling = async <T>(
    asyncFn: () => Promise<T>,
    options?: {
      loadingMessage?: string
      successMessage?: string
      errorMessage?: string
      showSuccessNotification?: boolean
    },
  ): Promise<T | null> => {
    const {
      successMessage,
      errorMessage = '処理中にエラーが発生しました',
      showSuccessNotification = false,
    } = options || {}

    try {
      setLoading(true)
      clearError()

      const result = await asyncFn()

      if (successMessage && showSuccessNotification) {
        showSuccess(successMessage)
      }

      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : errorMessage
      showError(message)
      logger.error('Error in withErrorHandling:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * すべての状態をリセット
   */
  const resetState = () => {
    loading.value = false
    error.value = null
    notification.value = {
      show: false,
      message: '',
      type: 'info',
      timeout: 5000,
      icon: 'mdi-information',
    }
  }

  return {
    // State
    loading: isLoading,
    error: displayError,
    hasError,
    notification: computed(() => notification.value),

    // Basic functions
    setLoading,
    setError,
    clearError,
    resetState,

    // Notification functions
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,

    // Utility functions
    withErrorHandling,
  }
}
