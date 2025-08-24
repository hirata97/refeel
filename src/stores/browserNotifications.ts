/**
 * 通知機能ストア
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  NotificationSettings,
  NotificationPermission,
} from '@/types/settings'
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/types/settings'

export const useBrowserNotificationStore = defineStore('browserNotifications', () => {
  // 状態
  const settings = ref<NotificationSettings>({ ...DEFAULT_NOTIFICATION_SETTINGS })
  const permission = ref<NotificationPermission>('default')
  const isSupported = ref<boolean>(false)
  const lastError = ref<string | null>(null)

  // 計算プロパティ
  const canShowNotifications = computed(() => {
    return isSupported.value && permission.value === 'granted' && settings.value.enabled
  })

  const hasPermission = computed(() => permission.value === 'granted')

  // 通知サポートの確認
  const checkNotificationSupport = () => {
    try {
      isSupported.value = 'Notification' in window && 'serviceWorker' in navigator
      if (isSupported.value && 'Notification' in window) {
        permission.value = Notification.permission as NotificationPermission
      }
    } catch (error) {
      console.warn('通知サポートの確認に失敗:', error)
      isSupported.value = false
      lastError.value = '通知機能がサポートされていません'
    }
  }

  // 通知権限の要求
  const requestPermission = async (): Promise<NotificationPermission> => {
    try {
      if (!isSupported.value) {
        throw new Error('通知機能がサポートされていません')
      }

      const result = await Notification.requestPermission()
      permission.value = result as NotificationPermission
      lastError.value = null
      
      return permission.value
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '通知権限の取得に失敗しました'
      console.error('通知権限エラー:', error)
      lastError.value = errorMessage
      return 'denied'
    }
  }

  // 通知の表示
  const showNotification = async (
    title: string,
    options: NotificationOptions = {}
  ): Promise<boolean> => {
    try {
      if (!canShowNotifications.value) {
        console.warn('通知表示不可:', {
          isSupported: isSupported.value,
          permission: permission.value,
          enabled: settings.value.enabled,
        })
        return false
      }

      const notificationOptions: NotificationOptions = {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'diary-reminder',
        requireInteraction: false,
        silent: !settings.value.soundEnabled,
        ...options,
      }

      const notification = new Notification(title, notificationOptions)

      // 自動で通知を閉じる
      setTimeout(() => {
        notification.close()
      }, settings.value.displayDuration)

      // 通知クリック時の処理
      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      lastError.value = null
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '通知の表示に失敗しました'
      console.error('通知表示エラー:', error)
      lastError.value = errorMessage
      return false
    }
  }

  // 日記リマインダー通知
  const showDiaryReminder = async (): Promise<boolean> => {
    if (!settings.value.diaryReminder) {
      return false
    }

    return await showNotification('日記の時間です！', {
      body: '今日の出来事や気持ちを記録してみませんか？',
      tag: 'diary-reminder',
      icon: '/favicon.ico',
    })
  }

  // 通知設定の更新
  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      // 設定の検証
      const updatedSettings = { ...settings.value, ...newSettings }
      
      // 基本的な検証
      if (typeof updatedSettings.displayDuration !== 'number' || updatedSettings.displayDuration < 1000) {
        throw new Error('表示時間は1000ミリ秒以上である必要があります')
      }

      if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(updatedSettings.reminderTime)) {
        throw new Error('リマインダー時刻の形式が正しくありません (HH:MM)')
      }

      settings.value = updatedSettings
      await saveToStorage()
      lastError.value = null
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '設定の更新に失敗しました'
      console.error('設定更新エラー:', error)
      lastError.value = errorMessage
      throw error
    }
  }

  // ローカルストレージに保存
  const saveToStorage = async () => {
    try {
      const data = {
        settings: settings.value,
        permission: permission.value,
        lastUpdated: Date.now(),
      }
      localStorage.setItem('notification-settings', JSON.stringify(data))
    } catch (error) {
      console.error('通知設定の保存に失敗:', error)
      throw error
    }
  }

  // ローカルストレージから読み込み
  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem('notification-settings')
      if (saved) {
        const data = JSON.parse(saved)
        if (data.settings) {
          settings.value = { ...DEFAULT_NOTIFICATION_SETTINGS, ...data.settings }
        }
        if (data.permission) {
          permission.value = data.permission
        }
      }
    } catch (error) {
      console.error('通知設定の読み込みに失敗:', error)
      settings.value = { ...DEFAULT_NOTIFICATION_SETTINGS }
    }
  }

  // リマインダーのスケジュール設定
  const scheduleReminder = () => {
    // 既存のリマインダーをクリア
    clearReminder()

    if (!settings.value.diaryReminder || !settings.value.reminderTime) {
      return
    }

    try {
      const [hours, minutes] = settings.value.reminderTime.split(':').map(Number)
      const now = new Date()
      const reminderTime = new Date()
      reminderTime.setHours(hours, minutes, 0, 0)

      // もし設定時刻が過ぎていたら翌日に設定
      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1)
      }

      const timeUntilReminder = reminderTime.getTime() - now.getTime()

      setTimeout(() => {
        showDiaryReminder()
        // 翌日のリマインダーもスケジュール
        scheduleReminder()
      }, timeUntilReminder)

      console.log(`リマインダーを設定しました: ${reminderTime.toLocaleString()}`)
    } catch (error) {
      console.error('リマインダーのスケジュールに失敗:', error)
    }
  }

  // リマインダーのクリア
  const clearReminder = () => {
    // TODO: setTimeoutのIDを管理してclearTimeoutを実行
    // 現在の実装では簡単のため省略
  }

  // テスト通知
  const testNotification = async (): Promise<boolean> => {
    return await showNotification('テスト通知', {
      body: '通知機能が正常に動作しています',
      tag: 'test-notification',
    })
  }

  // 初期化
  const initialize = () => {
    checkNotificationSupport()
    loadFromStorage()
    
    if (settings.value.diaryReminder) {
      scheduleReminder()
    }
  }

  // 設定のリセット
  const resetSettings = async () => {
    settings.value = { ...DEFAULT_NOTIFICATION_SETTINGS }
    clearReminder()
    await saveToStorage()
  }

  return {
    // 状態
    settings,
    permission,
    isSupported,
    lastError,

    // 計算プロパティ
    canShowNotifications,
    hasPermission,

    // アクション
    checkNotificationSupport,
    requestPermission,
    showNotification,
    showDiaryReminder,
    updateSettings,
    saveToStorage,
    loadFromStorage,
    scheduleReminder,
    clearReminder,
    testNotification,
    initialize,
    resetSettings,
  }
})

export default useBrowserNotificationStore