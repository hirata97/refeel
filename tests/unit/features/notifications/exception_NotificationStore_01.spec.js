import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBrowserNotificationStore } from '@features/notifications'

describe('NotificationStore - 異常系', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // localStorageのモックをセットアップ
    const mockLocalStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    })

    // デフォルトのNotificationモック
    const mockNotification = vi.fn()
    mockNotification.permission = 'default'
    Object.defineProperty(global, 'Notification', {
      value: mockNotification,
      writable: true,
      configurable: true
    })

    // デフォルトのwindowモック
    Object.defineProperty(global, 'window', {
      value: {
        Notification: mockNotification
      },
      writable: true,
      configurable: true
    })

    // navigatorモック
    Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: {}
      },
      writable: true,
      configurable: true
    })
  })

  afterEach(() => {
    delete global.Notification
    delete global.window
    delete global.localStorage
    delete global.navigator
  })

  it('無効な時刻形式でエラーが発生する', async () => {
    const store = useBrowserNotificationStore()

    const invalidTimeSettings = { reminderTime: '25:00' }
    await expect(store.updateSettings(invalidTimeSettings)).rejects.toThrow('リマインダー時刻の形式が正しくありません')

    const invalidFormatSettings = { reminderTime: 'abc' }
    await expect(store.updateSettings(invalidFormatSettings)).rejects.toThrow('リマインダー時刻の形式が正しくありません')
  })

  it('無効な表示時間でエラーが発生する', async () => {
    const store = useBrowserNotificationStore()

    const invalidDurationSettings = { displayDuration: 500 }
    await expect(store.updateSettings(invalidDurationSettings)).rejects.toThrow('表示時間は1000ミリ秒以上である必要があります')

    const negativeDurationSettings = { displayDuration: -1000 }
    await expect(store.updateSettings(negativeDurationSettings)).rejects.toThrow('表示時間は1000ミリ秒以上である必要があります')
  })

  it('通知サポートが無い環境でのエラーハンドリング', () => {
    // Notificationとnavigatorを未定義にする
    delete global.Notification
    delete global.navigator

    Object.defineProperty(global, 'window', {
      value: {},
      writable: true,
      configurable: true
    })

    const store = useBrowserNotificationStore()
    store.checkNotificationSupport()

    expect(store.isSupported).toBe(false)
  })

  it('通知権限要求の失敗ハンドリング', async () => {
    // Notification.requestPermission を失敗させる
    delete global.Notification

    const mockNotification = vi.fn()
    mockNotification.requestPermission = vi.fn().mockRejectedValue(new Error('Permission denied'))
    mockNotification.permission = 'default'

    Object.defineProperty(global, 'Notification', {
      value: mockNotification,
      writable: true,
      configurable: true
    })

    Object.defineProperty(global, 'window', {
      value: {
        Notification: mockNotification
      },
      writable: true,
      configurable: true
    })

    const store = useBrowserNotificationStore()
    // サポート状態をチェックしてから権限要求
    store.checkNotificationSupport()

    const result = await store.requestPermission()

    expect(result).toBe('denied')
    expect(store.lastError).toBeTruthy()
  })

  it('localStorage エラーのハンドリング', async () => {
    // localStorage.setItem でエラーを発生させる
    const mockLocalStorage = {
      setItem: vi.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      }),
      getItem: vi.fn(() => null)
    }
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    })

    const store = useBrowserNotificationStore()

    // エラーが発生してもPromiseが解決されることを確認
    await expect(store.saveToStorage()).rejects.toThrow()
  })

  it('localStorage から無効なデータを読み込んだ場合のハンドリング', () => {
    // 無効なJSON文字列を返すlocalStorage
    const mockLocalStorage = {
      getItem: vi.fn(() => 'invalid json'),
      setItem: vi.fn()
    }
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    })

    const store = useBrowserNotificationStore()

    // エラーが発生してもデフォルト値が設定されることを確認
    store.loadFromStorage()

    expect(store.settings.enabled).toBe(false)
    expect(store.settings.reminderTime).toBe('20:00')
  })

  it('通知表示時のエラーハンドリング', async () => {
    // Notification コンストラクタでエラーを発生させる
    delete global.Notification

    const mockNotification = vi.fn().mockImplementation(() => {
      throw new Error('Notification constructor failed')
    })
    mockNotification.permission = 'granted'

    Object.defineProperty(global, 'Notification', {
      value: mockNotification,
      writable: true,
      configurable: true
    })

    Object.defineProperty(global, 'window', {
      value: {
        Notification: mockNotification
      },
      writable: true,
      configurable: true
    })

    const store = useBrowserNotificationStore()

    // ストアの内部状態を直接更新
    await store.updateSettings({ enabled: true })
    // サポート状態とpermissionを設定
    store.checkNotificationSupport()

    const result = await store.showNotification('Test', {})

    expect(result).toBe(false)
    expect(store.lastError).toBeTruthy()
  })

  it('通知が無効な状態での表示試行', async () => {
    const store = useBrowserNotificationStore()

    // 通知が無効な状態を設定
    await store.updateSettings({ enabled: false })

    const result = await store.showNotification('Test', {})

    expect(result).toBe(false)
  })
})
