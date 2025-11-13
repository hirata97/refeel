// リマインダー管理ストア
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  type ReminderSettings,
  type NotificationSettings,
  type ProgressNotificationSettings,
  type ScheduledNotification,
  NotificationUtils,
} from '@/utils/notifications'
import { useNotificationStore } from '@/stores/notification'
import { createLogger } from '@/utils/logger'

const logger = createLogger('REMINDER')

export const useReminderStore = defineStore('reminder', () => {
  // State
  const reminders = ref<ReminderSettings[]>([])
  const notificationSettings = ref<NotificationSettings>(
    NotificationUtils.loadNotificationSettings(),
  )
  const progressSettings = ref<ProgressNotificationSettings>(
    NotificationUtils.loadProgressSettings(),
  )
  const scheduledNotifications = ref<ScheduledNotification[]>([])
  const isServiceWorkerRegistered = ref(false)

  // Getters
  const enabledReminders = computed(() => reminders.value.filter((r) => r.enabled))

  const hasNotificationPermission = computed(
    () => NotificationUtils.getNotificationPermission() === 'granted',
  )

  const nextReminder = computed(() => {
    const nextTimes = enabledReminders.value
      .map((reminder) => ({
        reminder,
        nextTime: NotificationUtils.getNextReminderTime(reminder),
      }))
      .filter((item) => item.nextTime !== null)
      .sort((a, b) => a.nextTime!.getTime() - b.nextTime!.getTime())

    return nextTimes.length > 0 ? nextTimes[0] : null
  })

  // Actions
  const loadReminders = (): void => {
    reminders.value = NotificationUtils.loadReminderSettings()
  }

  const saveReminders = (): void => {
    NotificationUtils.saveReminderSettings(reminders.value)
  }

  const addReminder = (reminderData: Omit<ReminderSettings, 'id'>): string => {
    const id = NotificationUtils.generateReminderId()
    const reminder: ReminderSettings = {
      id,
      ...reminderData,
    }

    reminders.value.push(reminder)
    saveReminders()
    scheduleReminder(reminder)

    return id
  }

  const updateReminder = (id: string, updates: Partial<ReminderSettings>): boolean => {
    const index = reminders.value.findIndex((r) => r.id === id)
    if (index === -1) {
      return false
    }

    // 既存スケジュールをクリア
    unscheduleReminder(id)

    // 更新
    reminders.value[index] = { ...reminders.value[index], ...updates }
    saveReminders()

    // 有効な場合は再スケジュール
    if (reminders.value[index].enabled) {
      scheduleReminder(reminders.value[index])
    }

    return true
  }

  const removeReminder = (id: string): boolean => {
    const index = reminders.value.findIndex((r) => r.id === id)
    if (index === -1) {
      return false
    }

    unscheduleReminder(id)
    reminders.value.splice(index, 1)
    saveReminders()

    return true
  }

  const toggleReminder = (id: string): boolean => {
    const reminder = reminders.value.find((r) => r.id === id)
    if (!reminder) {
      return false
    }

    reminder.enabled = !reminder.enabled

    if (reminder.enabled) {
      scheduleReminder(reminder)
    } else {
      unscheduleReminder(id)
    }

    saveReminders()
    return true
  }

  const scheduleReminder = (reminder: ReminderSettings): void => {
    const nextTime = NotificationUtils.getNextReminderTime(reminder)
    if (!nextTime) {
      return
    }

    const scheduled: ScheduledNotification = {
      id: `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      reminderId: reminder.id,
      scheduledTime: nextTime,
      executed: false,
    }

    scheduledNotifications.value.push(scheduled)

    // タイマー設定
    const delay = nextTime.getTime() - Date.now()
    setTimeout(() => {
      executeReminder(scheduled)
    }, delay)
  }

  const unscheduleReminder = (reminderId: string): void => {
    scheduledNotifications.value = scheduledNotifications.value.filter(
      (s) => s.reminderId !== reminderId,
    )
  }

  const executeReminder = async (scheduled: ScheduledNotification): Promise<void> => {
    const reminder = reminders.value.find((r) => r.id === scheduled.reminderId)
    if (!reminder || !reminder.enabled) {
      return
    }

    const notificationStore = useNotificationStore()

    // 静寂時間チェック
    if (NotificationUtils.isQuietTime(notificationSettings.value)) {
      logger.debug('静寂時間中のためリマインダーをスキップしました')
      // 次回のリマインダーをスケジュール
      scheduleReminder(reminder)
      return
    }

    // 実行済みマーク
    scheduled.executed = true

    try {
      // ブラウザ通知
      if (notificationSettings.value.browserNotifications && hasNotificationPermission.value) {
        const notification = await NotificationUtils.showBrowserNotification(reminder.title, {
          body: reminder.message,
          tag: reminder.id,
          requireInteraction: true,
        })

        if (notification) {
          // 通知クリックイベント
          notification.onclick = () => {
            window.focus()
            notification.close()
          }
        }
      }

      // アプリ内通知
      notificationStore.showInfo(reminder.title, reminder.message, {
        persistent: reminder.snoozeEnabled,
        actions: reminder.snoozeEnabled
          ? [
              {
                text: `${reminder.snoozeDuration}分後に再通知`,
                action: () => snoozeReminder(reminder.id, reminder.snoozeDuration),
              },
            ]
          : undefined,
      })

      // 音・バイブレーション
      if (notificationSettings.value.sound) {
        NotificationUtils.playNotificationSound(reminder.sound)
      }

      if (notificationSettings.value.vibration) {
        NotificationUtils.vibrate()
      }

      // 次回のリマインダーをスケジュール
      scheduleReminder(reminder)
    } catch (error) {
      logger.error('リマインダーの実行に失敗しました:', error)
      notificationStore.showError('リマインダーエラー', 'リマインダーの表示に失敗しました')
    }
  }

  const snoozeReminder = (reminderId: string, minutes: number): void => {
    const reminder = reminders.value.find((r) => r.id === reminderId)
    if (!reminder) {
      return
    }

    const snoozeTime = NotificationUtils.calculateSnoozeTime(minutes)

    const scheduled: ScheduledNotification = {
      id: `snoozed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      reminderId: reminder.id,
      scheduledTime: snoozeTime,
      executed: false,
      snoozedUntil: snoozeTime,
    }

    scheduledNotifications.value.push(scheduled)

    // スヌーズタイマー設定
    const delay = snoozeTime.getTime() - Date.now()
    setTimeout(() => {
      executeReminder(scheduled)
    }, delay)

    const notificationStore = useNotificationStore()
    notificationStore.showSuccess('スヌーズ設定完了', `${minutes}分後に再通知します`)
  }

  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      const permission = await NotificationUtils.requestNotificationPermission()
      if (permission === 'granted') {
        const notificationStore = useNotificationStore()
        notificationStore.showSuccess('通知許可完了', 'リマインダー通知が有効になりました')
        return true
      } else {
        const notificationStore = useNotificationStore()
        notificationStore.showWarning(
          '通知許可が必要',
          'リマインダー機能を利用するには通知許可が必要です',
        )
        return false
      }
    } catch (error) {
      logger.error('通知許可の要求に失敗しました:', error)
      const notificationStore = useNotificationStore()
      notificationStore.showError('通知許可エラー', '通知許可の取得に失敗しました')
      return false
    }
  }

  const updateNotificationSettings = (updates: Partial<NotificationSettings>): void => {
    notificationSettings.value = { ...notificationSettings.value, ...updates }
    NotificationUtils.saveNotificationSettings(notificationSettings.value)
  }

  const updateProgressSettings = (updates: Partial<ProgressNotificationSettings>): void => {
    progressSettings.value = { ...progressSettings.value, ...updates }
    NotificationUtils.saveProgressSettings(progressSettings.value)
  }

  const testNotification = async (): Promise<void> => {
    const notificationStore = useNotificationStore()

    try {
      if (hasNotificationPermission.value) {
        await NotificationUtils.showBrowserNotification('テスト通知', {
          body: 'リマインダー機能が正常に動作しています',
          tag: 'test-notification',
        })
      }

      notificationStore.showInfo('テスト通知', 'リマインダー機能が正常に動作しています')

      if (notificationSettings.value.sound) {
        NotificationUtils.playNotificationSound()
      }

      if (notificationSettings.value.vibration) {
        NotificationUtils.vibrate()
      }
    } catch (error) {
      logger.error('テスト通知の送信に失敗しました:', error)
      notificationStore.showError('テスト通知エラー', 'テスト通知の送信に失敗しました')
    }
  }

  const initializeReminders = (): void => {
    loadReminders()

    // 既存のスケジュールをクリア
    scheduledNotifications.value = []

    // 有効なリマインダーをスケジュール
    enabledReminders.value.forEach((reminder) => {
      scheduleReminder(reminder)
    })
  }

  // Service Worker関連
  const registerServiceWorker = async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) {
      logger.warn('Service Workerがサポートされていません')
      return false
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js')
      logger.debug('Service Worker登録成功:', registration)
      isServiceWorkerRegistered.value = true
      return true
    } catch (error) {
      logger.error('Service Worker登録失敗:', error)
      return false
    }
  }

  return {
    // State
    reminders,
    notificationSettings,
    progressSettings,
    scheduledNotifications,
    isServiceWorkerRegistered,

    // Getters
    enabledReminders,
    hasNotificationPermission,
    nextReminder,

    // Actions
    loadReminders,
    saveReminders,
    addReminder,
    updateReminder,
    removeReminder,
    toggleReminder,
    snoozeReminder,
    requestNotificationPermission,
    updateNotificationSettings,
    updateProgressSettings,
    testNotification,
    initializeReminders,
    registerServiceWorker,
  }
})
