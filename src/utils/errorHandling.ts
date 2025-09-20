import { useNotificationStore } from '@/stores/notification'
import { useLoadingStore } from '@/stores/loading'

export interface ErrorInfo {
  code?: string
  message: string
  details?: unknown
  retry?: () => Promise<void>
}

export interface RetryOptions {
  maxAttempts?: number
  delay?: number
  backoffMultiplier?: number
  shouldRetry?: (error: unknown, attempt: number) => boolean
}

export class ErrorHandler {
  private static defaultRetryOptions: RetryOptions = {
    maxAttempts: 3,
    delay: 1000,
    backoffMultiplier: 2,
    shouldRetry: (error: unknown, attempt: number) => {
      // ネットワークエラーや一時的なサーバーエラーの場合のみリトライ
      if (error instanceof Error) {
        const retryableErrors = ['Network Error', 'fetch failed', 'timeout', 'connection refused']
        return (
          retryableErrors.some((msg) => error.message.toLowerCase().includes(msg.toLowerCase())) &&
          attempt < 3
        )
      }
      return false
    },
  }

  static async handleAsyncOperation<T>(
    operation: () => Promise<T>,
    errorContext: {
      loadingKey?: string
      successMessage?: string
      errorMessage?: string
      retryOptions?: RetryOptions
    } = {},
  ): Promise<T | null> {
    const notificationStore = useNotificationStore()
    const loadingStore = useLoadingStore()

    const {
      loadingKey,
      successMessage,
      errorMessage = '操作に失敗しました',
      retryOptions = {},
    } = errorContext

    const finalRetryOptions = { ...this.defaultRetryOptions, ...retryOptions }

    const executeWithRetry = async (attempt = 1): Promise<T> => {
      try {
        const result = await operation()
        return result
      } catch (error) {
        console.error(`操作失敗 (試行回数: ${attempt}):`, error)

        if (
          attempt < (finalRetryOptions.maxAttempts || 3) &&
          finalRetryOptions.shouldRetry?.(error, attempt)
        ) {
          const delay =
            (finalRetryOptions.delay || 1000) *
            Math.pow(finalRetryOptions.backoffMultiplier || 2, attempt - 1)

          await new Promise((resolve) => setTimeout(resolve, delay))
          return executeWithRetry(attempt + 1)
        }

        throw error
      }
    }

    try {
      const result = loadingKey
        ? await loadingStore.withLoading(loadingKey, executeWithRetry)
        : await executeWithRetry()

      if (successMessage) {
        notificationStore.showSuccess(successMessage)
      }

      return result
    } catch (error) {
      console.error('最終的な操作エラー:', error)

      const errorInfo: ErrorInfo = {
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      }

      notificationStore.showError(errorMessage, errorInfo.message, {
        actions:
          finalRetryOptions.maxAttempts && finalRetryOptions.maxAttempts > 1
            ? [
                {
                  text: 'リトライ',
                  action: () => this.handleAsyncOperation(operation, errorContext),
                },
              ]
            : undefined,
      })

      return null
    }
  }

  static handleValidationError(
    fieldName: string,
    errorMessage: string,
    showNotification = true,
  ): void {
    if (showNotification) {
      const notificationStore = useNotificationStore()
      notificationStore.showWarning(`${fieldName}の入力エラー`, errorMessage)
    }
  }

  static handleNetworkError(error: unknown): void {
    const notificationStore = useNotificationStore()

    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        notificationStore.showError('ネットワークエラー', 'インターネット接続を確認してください', {
          persistent: true,
          actions: [
            {
              text: '再試行',
              action: () => window.location.reload(),
            },
          ],
        })
      } else {
        notificationStore.showError('サーバーエラー', error.message)
      }
    }
  }

  static handleAuthError(): void {
    const notificationStore = useNotificationStore()

    notificationStore.showError('認証エラー', 'ログインが必要です', {
      actions: [
        {
          text: 'ログインページへ',
          action: () => {
            window.location.href = '/login'
          },
        },
      ],
    })
  }

  // フォームバリデーションエラーの統一処理
  static handleFormValidationErrors(errors: Record<string, string[]>): void {
    const notificationStore = useNotificationStore()

    const errorMessages = Object.entries(errors)
      .map(([field, fieldErrors]) => `${field}: ${fieldErrors.join(', ')}`)
      .join('\n')

    notificationStore.showWarning('入力値を確認してください', errorMessages)
  }
}

// オフライン/オンライン状態の監視
export class NetworkMonitor {
  private static instance: NetworkMonitor
  private onlineCallbacks: (() => void)[] = []
  private offlineCallbacks: (() => void)[] = []

  private constructor() {
    this.setupEventListeners()
  }

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor()
    }
    return NetworkMonitor.instance
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      const notificationStore = useNotificationStore()
      notificationStore.showSuccess('インターネット接続が復旧しました')
      this.onlineCallbacks.forEach((callback) => callback())
    })

    window.addEventListener('offline', () => {
      const notificationStore = useNotificationStore()
      notificationStore.showWarning('オフライン状態です', '一部機能が制限されます', {
        persistent: true,
      })
      this.offlineCallbacks.forEach((callback) => callback())
    })
  }

  onOnline(callback: () => void): void {
    this.onlineCallbacks.push(callback)
  }

  onOffline(callback: () => void): void {
    this.offlineCallbacks.push(callback)
  }

  isOnline(): boolean {
    return navigator.onLine
  }
}

// アプリケーション初期化時にネットワーク監視を開始
export const initializeErrorHandling = (): void => {
  NetworkMonitor.getInstance()
}
