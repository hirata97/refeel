import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useReminderStore } from '@features/notifications'
import { useNotificationStore } from '@features/notifications'

// モック設定
vi.mock('@/utils/notifications', () => ({
  NotificationUtils: {
    loadNotificationSettings: vi.fn(() => ({
      browserNotifications: true,
      pushNotifications: false,
      sound: true,
      vibration: true,
      customSounds: {},
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00'
      }
    })),
    loadReminderSettings: vi.fn(() => []),
    loadProgressSettings: vi.fn(() => ({
      streakNotifications: true,
      goalAchievementNotifications: true,
      weeklyReports: true,
      monthlyReports: true,
      motivationalMessages: true
    })),
    saveNotificationSettings: vi.fn(),
    saveReminderSettings: vi.fn(),
    saveProgressSettings: vi.fn(),
    getNotificationPermission: vi.fn(() => 'granted'),
    requestNotificationPermission: vi.fn(() => Promise.resolve('granted')),
    showBrowserNotification: vi.fn(() => Promise.resolve({})),
    getNextReminderTime: vi.fn(() => new Date(Date.now() + 3600000)), // 1時間後
    generateReminderId: vi.fn(() => 'test-reminder-id'),
    calculateSnoozeTime: vi.fn((minutes) => new Date(Date.now() + minutes * 60000)),
    isQuietTime: vi.fn(() => false),
    playNotificationSound: vi.fn(),
    vibrate: vi.fn()
  }
}))

// ブラウザAPI のモック
Object.defineProperty(global, 'Notification', {
  value: vi.fn(() => ({
    onclick: null,
    close: vi.fn()
  })),
  writable: true
})

Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: {
      register: vi.fn(() => Promise.resolve({}))
    },
    vibrate: vi.fn()
  },
  writable: true
})

describe('ReminderStore - 正常系テスト', () => {
  let reminderStore
  let notificationStore

  beforeEach(() => {
    setActivePinia(createPinia())
    reminderStore = useReminderStore()
    notificationStore = useNotificationStore()
    
    // NotificationStoreの関数をモック
    vi.spyOn(notificationStore, 'showInfo')
    vi.spyOn(notificationStore, 'showSuccess')
    vi.spyOn(notificationStore, 'showError')
    
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('ストアが正常に初期化される', () => {
    expect(reminderStore.reminders).toEqual([])
    expect(reminderStore.notificationSettings).toBeDefined()
    expect(reminderStore.progressSettings).toBeDefined()
    expect(reminderStore.scheduledNotifications).toEqual([])
    expect(reminderStore.isServiceWorkerRegistered).toBe(false)
  })

  it('通知許可状態を正しく取得できる', () => {
    expect(reminderStore.hasNotificationPermission).toBe(true)
  })

  it('リマインダーを正常に追加できる', () => {
    const reminderData = {
      enabled: true,
      time: '20:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      type: 'diary_entry',
      title: 'テストリマインダー',
      message: 'テストメッセージ',
      snoozeEnabled: true,
      snoozeDuration: 10
    }

    const reminderId = reminderStore.addReminder(reminderData)

    expect(reminderId).toBe('test-reminder-id')
    expect(reminderStore.reminders).toHaveLength(1)
    expect(reminderStore.reminders[0]).toMatchObject({
      id: 'test-reminder-id',
      ...reminderData
    })
  })

  it('リマインダーを正常に更新できる', () => {
    // まずリマインダーを追加
    const reminderId = reminderStore.addReminder({
      enabled: true,
      time: '20:00',
      days: ['monday'],
      type: 'diary_entry',
      title: '元のタイトル',
      message: '元のメッセージ',
      snoozeEnabled: true,
      snoozeDuration: 10
    })

    // 更新
    const success = reminderStore.updateReminder(reminderId, {
      title: '更新されたタイトル',
      time: '21:00'
    })

    expect(success).toBe(true)
    expect(reminderStore.reminders[0].title).toBe('更新されたタイトル')
    expect(reminderStore.reminders[0].time).toBe('21:00')
  })

  it('リマインダーを正常に削除できる', () => {
    // リマインダーを追加
    const reminderId = reminderStore.addReminder({
      enabled: true,
      time: '20:00',
      days: ['monday'],
      type: 'diary_entry',
      title: 'テストリマインダー',
      message: 'テストメッセージ',
      snoozeEnabled: true,
      snoozeDuration: 10
    })

    expect(reminderStore.reminders).toHaveLength(1)

    // 削除
    const success = reminderStore.removeReminder(reminderId)

    expect(success).toBe(true)
    expect(reminderStore.reminders).toHaveLength(0)
  })

  it('リマインダーの有効/無効を切り替えできる', () => {
    // リマインダーを追加（有効状態）
    const reminderId = reminderStore.addReminder({
      enabled: true,
      time: '20:00',
      days: ['monday'],
      type: 'diary_entry',
      title: 'テストリマインダー',
      message: 'テストメッセージ',
      snoozeEnabled: true,
      snoozeDuration: 10
    })

    expect(reminderStore.reminders[0].enabled).toBe(true)

    // 無効にする
    const success = reminderStore.toggleReminder(reminderId)

    expect(success).toBe(true)
    expect(reminderStore.reminders[0].enabled).toBe(false)

    // 再度有効にする
    reminderStore.toggleReminder(reminderId)
    expect(reminderStore.reminders[0].enabled).toBe(true)
  })

  it('有効なリマインダーのみを取得できる', () => {
    // 有効なリマインダーを追加
    reminderStore.addReminder({
      enabled: true,
      time: '20:00',
      days: ['monday'],
      type: 'diary_entry',
      title: '有効なリマインダー',
      message: 'テストメッセージ',
      snoozeEnabled: true,
      snoozeDuration: 10
    })

    // 無効なリマインダーを追加
    reminderStore.addReminder({
      enabled: false,
      time: '21:00',
      days: ['tuesday'],
      type: 'goal_review',
      title: '無効なリマインダー',
      message: 'テストメッセージ',
      snoozeEnabled: true,
      snoozeDuration: 10
    })

    expect(reminderStore.reminders).toHaveLength(2)
    expect(reminderStore.enabledReminders).toHaveLength(1)
    expect(reminderStore.enabledReminders[0].title).toBe('有効なリマインダー')
  })

  it('通知許可を正常に要求できる', async () => {
    const result = await reminderStore.requestNotificationPermission()

    expect(result).toBe(true)
  })

  it('通知設定を正常に更新できる', () => {
    const updates = {
      browserNotifications: false,
      sound: false
    }

    reminderStore.updateNotificationSettings(updates)

    expect(reminderStore.notificationSettings.browserNotifications).toBe(false)
    expect(reminderStore.notificationSettings.sound).toBe(false)
  })

  it('進捗通知設定を正常に更新できる', () => {
    const updates = {
      streakNotifications: false,
      goalAchievementNotifications: false
    }

    reminderStore.updateProgressSettings(updates)

    expect(reminderStore.progressSettings.streakNotifications).toBe(false)
    expect(reminderStore.progressSettings.goalAchievementNotifications).toBe(false)
  })

  it('テスト通知を正常に送信できる', async () => {
    await reminderStore.testNotification()

    // モック関数が呼び出されたことを確認
    const { NotificationUtils } = await import('@/utils/notifications')
    expect(NotificationUtils.showBrowserNotification).toHaveBeenCalled()
    expect(notificationStore.showInfo).toHaveBeenCalled()
  })

  it('スヌーズ機能が正常に動作する', () => {
    // リマインダーを追加
    const reminderId = reminderStore.addReminder({
      enabled: true,
      time: '20:00',
      days: ['monday'],
      type: 'diary_entry',
      title: 'テストリマインダー',
      message: 'テストメッセージ',
      snoozeEnabled: true,
      snoozeDuration: 10
    })

    // スヌーズを実行
    reminderStore.snoozeReminder(reminderId, 10)

    // スケジュールされた通知が追加されることを確認
    expect(reminderStore.scheduledNotifications.length).toBeGreaterThan(0)
    
    // 成功通知が表示されることを確認
    expect(notificationStore.showSuccess).toHaveBeenCalledWith(
      'スヌーズ設定完了',
      '10分後に再通知します'
    )
  })

  it('Service Worker登録が正常に動作する', async () => {
    const result = await reminderStore.registerServiceWorker()

    expect(result).toBe(true)
    expect(reminderStore.isServiceWorkerRegistered).toBe(true)
  })
})