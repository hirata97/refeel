import { ref } from 'vue'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface NotificationState {
  show: boolean
  message: string
  type: NotificationType
  timeout: number
  icon: string
}

/**
 * 通知システムのComposable
 * スナックバーによるユーザー通知を管理します
 */
export function useNotification() {
  const notification = ref<NotificationState>({
    show: false,
    message: '',
    type: 'info',
    timeout: 5000,
    icon: 'mdi-information',
  })

  /**
   * 通知を表示
   * @param message - 表示するメッセージ
   * @param type - 通知の種類
   * @param icon - 表示するアイコン
   * @param timeout - 表示時間（ミリ秒）
   */
  const showNotification = (
    message: string,
    type: NotificationType = 'info',
    icon: string = 'mdi-information',
    timeout: number = 5000,
  ): void => {
    notification.value = {
      show: true,
      message,
      type,
      icon,
      timeout,
    }
  }

  /**
   * 成功通知を表示
   */
  const showSuccess = (message: string, timeout?: number): void => {
    showNotification(message, 'success', 'mdi-check-circle', timeout)
  }

  /**
   * エラー通知を表示
   */
  const showError = (message: string, timeout?: number): void => {
    showNotification(message, 'error', 'mdi-alert-circle', timeout)
  }

  /**
   * 警告通知を表示
   */
  const showWarning = (message: string, timeout?: number): void => {
    showNotification(message, 'warning', 'mdi-alert', timeout)
  }

  /**
   * 情報通知を表示
   */
  const showInfo = (message: string, timeout?: number): void => {
    showNotification(message, 'info', 'mdi-information', timeout)
  }

  /**
   * 通知を閉じる
   */
  const closeNotification = (): void => {
    notification.value.show = false
  }

  return {
    notification,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeNotification,
  }
}
