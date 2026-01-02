import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NotificationUtils } from '@/utils/notifications'

// loggerのモック
vi.mock('@shared/utils/logger', () => ({
  createLogger: vi.fn(() => ({
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }))
}))

// LocalStorageのモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

describe('NotificationUtils - 正常系テスト', () => {
  let mockNotification
  let mockAudio
  let mockAudioInstance

  beforeEach(() => {
    vi.clearAllMocks()

    // LocalStorageのセットアップ
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    })

    // Notificationのモック
    mockNotification = vi.fn()
    mockNotification.permission = 'granted'
    mockNotification.requestPermission = vi.fn(() => Promise.resolve('granted'))
    Object.defineProperty(global, 'Notification', {
      value: mockNotification,
      writable: true,
      configurable: true
    })

    // Audioのモック
    mockAudioInstance = {
      play: vi.fn(() => Promise.resolve())
    }
    mockAudio = vi.fn(() => mockAudioInstance)
    Object.defineProperty(global, 'Audio', {
      value: mockAudio,
      writable: true,
      configurable: true
    })

    // Navigatorのモック
    Object.defineProperty(global, 'navigator', {
      value: {
        vibrate: vi.fn()
      },
      writable: true,
      configurable: true
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    delete global.Notification
    delete global.Audio
    delete global.navigator
    delete global.localStorage
  })

  describe('通知許可関連', () => {
    it('通知許可を正常に要求できる', async () => {
      const permission = await NotificationUtils.requestNotificationPermission()

      expect(permission).toBe('granted')
      expect(mockNotification.requestPermission).toHaveBeenCalledOnce()
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'notification_permission_requested',
        'true'
      )
    })

    it('通知許可状態を正しく取得できる', () => {
      const permission = NotificationUtils.getNotificationPermission()
      expect(permission).toBe('granted')
    })

    it('通知未サポートブラウザでdeniedを返す', () => {
      // Notificationを削除してブラウザ非対応をシミュレート
      delete global.Notification

      const permission = NotificationUtils.getNotificationPermission()
      expect(permission).toBe('denied')
    })
  })

  describe('ブラウザ通知', () => {
    it('ブラウザ通知を正常に表示できる', async () => {
      const mockNotificationInstance = {
        onclick: null,
        close: vi.fn()
      }
      // 新しいNotificationコンストラクタを再定義
      const NotificationConstructor = vi.fn(function() {
        return mockNotificationInstance
      })
      NotificationConstructor.permission = 'granted'
      NotificationConstructor.requestPermission = vi.fn(() => Promise.resolve('granted'))

      Object.defineProperty(global, 'Notification', {
        value: NotificationConstructor,
        writable: true,
        configurable: true
      })

      const notification = await NotificationUtils.showBrowserNotification(
        'テストタイトル',
        { body: 'テストメッセージ' }
      )

      expect(NotificationConstructor).toHaveBeenCalledWith('テストタイトル', {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        body: 'テストメッセージ'
      })
      expect(notification).toBe(mockNotificationInstance)
    })

    it('通知許可がない場合nullを返す', async () => {
      // permissionをdeniedに変更したNotificationコンストラクタを再定義
      const NotificationConstructor = vi.fn()
      NotificationConstructor.permission = 'denied'

      Object.defineProperty(global, 'Notification', {
        value: NotificationConstructor,
        writable: true,
        configurable: true
      })

      const notification = await NotificationUtils.showBrowserNotification(
        'テストタイトル'
      )

      expect(notification).toBeNull()
      expect(NotificationConstructor).not.toHaveBeenCalled()
    })
  })

  describe('設定の保存・読み込み', () => {
    it('通知設定を正常に保存できる', () => {
      const settings = {
        browserNotifications: true,
        sound: false,
        vibration: true,
        quietHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '08:00'
        }
      }

      NotificationUtils.saveNotificationSettings(settings)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'notification_settings',
        JSON.stringify(settings)
      )
    })

    it('通知設定を正常に読み込みできる', () => {
      const savedSettings = {
        browserNotifications: false,
        sound: true,
        vibration: false,
        quietHours: {
          enabled: true,
          startTime: '23:00',
          endTime: '07:00'
        }
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedSettings))

      const settings = NotificationUtils.loadNotificationSettings()

      expect(localStorageMock.getItem).toHaveBeenCalledWith('notification_settings')
      expect(settings).toEqual(savedSettings)
    })

    it('保存された設定がない場合デフォルト設定を返す', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const settings = NotificationUtils.loadNotificationSettings()

      expect(settings).toEqual({
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
      })
    })

    it('リマインダー設定を正常に保存・読み込みできる', () => {
      const reminders = [
        {
          id: 'test-1',
          enabled: true,
          time: '20:00',
          days: ['monday', 'wednesday', 'friday'],
          type: 'diary_entry',
          title: 'テストリマインダー',
          message: 'テストメッセージ',
          snoozeEnabled: true,
          snoozeDuration: 10
        }
      ]

      // 保存
      NotificationUtils.saveReminderSettings(reminders)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'reminder_settings',
        JSON.stringify(reminders)
      )

      // 読み込み
      localStorageMock.getItem.mockReturnValue(JSON.stringify(reminders))
      const loadedReminders = NotificationUtils.loadReminderSettings()
      expect(loadedReminders).toEqual(reminders)
    })

    it('進捗通知設定を正常に保存・読み込みできる', () => {
      const progressSettings = {
        streakNotifications: false,
        goalAchievementNotifications: true,
        weeklyReports: false,
        monthlyReports: true,
        motivationalMessages: false
      }

      // 保存
      NotificationUtils.saveProgressSettings(progressSettings)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'progress_notification_settings',
        JSON.stringify(progressSettings)
      )

      // 読み込み
      localStorageMock.getItem.mockReturnValue(JSON.stringify(progressSettings))
      const loadedSettings = NotificationUtils.loadProgressSettings()
      expect(loadedSettings).toEqual(progressSettings)
    })
  })

  describe('静寂時間判定', () => {
    it('静寂時間内の判定が正常に動作する', () => {
      const settings = {
        quietHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '08:00'
        }
      }

      // 現在時刻を23:30に設定
      const mockDate = new Date('2025-01-01T23:30:00')
      vi.setSystemTime(mockDate)

      const isQuiet = NotificationUtils.isQuietTime(settings)
      expect(isQuiet).toBe(true)

      vi.useRealTimers()
    })

    it('静寂時間外の判定が正常に動作する', () => {
      const settings = {
        quietHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '08:00'
        }
      }

      // 現在時刻を14:30に設定
      const mockDate = new Date('2025-01-01T14:30:00')
      vi.setSystemTime(mockDate)

      const isQuiet = NotificationUtils.isQuietTime(settings)
      expect(isQuiet).toBe(false)

      vi.useRealTimers()
    })

    it('静寂時間が無効の場合はfalseを返す', () => {
      const settings = {
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00'
        }
      }

      const isQuiet = NotificationUtils.isQuietTime(settings)
      expect(isQuiet).toBe(false)
    })
  })

  describe('リマインダー時刻計算', () => {
    it('次のリマインダー時刻を正常に計算できる', () => {
      const reminder = {
        enabled: true,
        time: '20:00',
        days: ['monday', 'wednesday', 'friday']
      }

      // 現在を月曜日の10:00に設定
      const mockDate = new Date('2025-01-06T10:00:00') // 2025-01-06は月曜日
      vi.setSystemTime(mockDate)

      const nextTime = NotificationUtils.getNextReminderTime(reminder)

      expect(nextTime).toBeDefined()
      expect(nextTime.getHours()).toBe(20)
      expect(nextTime.getMinutes()).toBe(0)

      vi.useRealTimers()
    })

    it('無効なリマインダーの場合nullを返す', () => {
      const reminder = {
        enabled: false,
        time: '20:00',
        days: ['monday']
      }

      const nextTime = NotificationUtils.getNextReminderTime(reminder)
      expect(nextTime).toBeNull()
    })
  })

  describe('ユーティリティ関数', () => {
    it('リマインダーIDを生成できる', () => {
      const id = NotificationUtils.generateReminderId()
      expect(id).toMatch(/^reminder-\d+-[a-z0-9]+$/)
    })

    it('スヌーズ時刻を正常に計算できる', () => {
      const now = new Date()
      const snoozeTime = NotificationUtils.calculateSnoozeTime(10)
      
      const expectedTime = new Date(now.getTime() + 10 * 60000)
      expect(Math.abs(snoozeTime.getTime() - expectedTime.getTime())).toBeLessThan(1000)
    })

    it('通知音を正常に再生できる', () => {
      // 新しいAudioコンストラクタを再定義
      const mockAudioInstance = {
        play: vi.fn(() => Promise.resolve())
      }
      const AudioConstructor = vi.fn(function() {
        return mockAudioInstance
      })
      Object.defineProperty(global, 'Audio', {
        value: AudioConstructor,
        writable: true,
        configurable: true
      })

      NotificationUtils.playNotificationSound()
      expect(AudioConstructor).toHaveBeenCalledWith('/sounds/notification.mp3')
    })

    it('カスタム通知音を正常に再生できる', () => {
      // 新しいAudioコンストラクタを再定義
      const mockAudioInstance = {
        play: vi.fn(() => Promise.resolve())
      }
      const AudioConstructor = vi.fn(function() {
        return mockAudioInstance
      })
      Object.defineProperty(global, 'Audio', {
        value: AudioConstructor,
        writable: true,
        configurable: true
      })

      const customSoundUrl = '/sounds/custom.mp3'
      NotificationUtils.playNotificationSound(customSoundUrl)
      expect(AudioConstructor).toHaveBeenCalledWith(customSoundUrl)
    })

    it('バイブレーションを正常に実行できる', () => {
      NotificationUtils.vibrate([200, 100, 200])
      expect(navigator.vibrate).toHaveBeenCalledWith([200, 100, 200])
    })

    it('デフォルトパターンでバイブレーションを実行できる', () => {
      NotificationUtils.vibrate()
      expect(navigator.vibrate).toHaveBeenCalledWith([100, 50, 100])
    })
  })
})