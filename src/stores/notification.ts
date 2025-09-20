import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface NotificationItem {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  timeout?: number
  persistent?: boolean
  actions?: Array<{
    text: string
    action: () => void
  }>
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<NotificationItem[]>([])
  const maxNotifications = 5

  const generateId = (): string => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  const addNotification = (notification: Omit<NotificationItem, 'id'>): string => {
    const id = generateId()
    const newNotification: NotificationItem = {
      id,
      timeout: 5000, // デフォルト5秒
      ...notification,
    }

    notifications.value.push(newNotification)

    // 最大通知数を超えた場合、古いものを削除
    if (notifications.value.length > maxNotifications) {
      notifications.value.shift()
    }

    // 自動削除（persistentでない場合）
    if (!newNotification.persistent && newNotification.timeout) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.timeout)
    }

    return id
  }

  const removeNotification = (id: string): void => {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearAll = (): void => {
    notifications.value = []
  }

  // 便利なヘルパーメソッド
  const showSuccess = (
    title: string,
    message?: string,
    options?: Partial<NotificationItem>,
  ): string => {
    return addNotification({
      type: 'success',
      title,
      message,
      ...options,
    })
  }

  const showError = (
    title: string,
    message?: string,
    options?: Partial<NotificationItem>,
  ): string => {
    return addNotification({
      type: 'error',
      title,
      message,
      timeout: 8000, // エラーは長めに表示
      ...options,
    })
  }

  const showWarning = (
    title: string,
    message?: string,
    options?: Partial<NotificationItem>,
  ): string => {
    return addNotification({
      type: 'warning',
      title,
      message,
      timeout: 6000,
      ...options,
    })
  }

  const showInfo = (
    title: string,
    message?: string,
    options?: Partial<NotificationItem>,
  ): string => {
    return addNotification({
      type: 'info',
      title,
      message,
      ...options,
    })
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
})
