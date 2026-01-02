import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotificationStore } from '@features/notifications'

// Notification API のモック
const mockNotification = vi.fn()
Object.defineProperty(global, 'Notification', {
  value: mockNotification,
  writable: true
})

describe('NotificationStore - 異常系', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('無効な時刻形式でエラーが発生する', async () => {
    const store = useNotificationStore()
    
    const invalidTimeSettings = { reminderTime: '25:00' }
    await expect(store.updateSettings(invalidTimeSettings)).rejects.toThrow('リマインダー時刻の形式が正しくありません')
    
    const invalidFormatSettings = { reminderTime: 'abc' }
    await expect(store.updateSettings(invalidFormatSettings)).rejects.toThrow('リマインダー時刻の形式が正しくありません')
  })

  it('無効な表示時間でエラーが発生する', async () => {
    const store = useNotificationStore()
    
    const invalidDurationSettings = { displayDuration: 500 }
    await expect(store.updateSettings(invalidDurationSettings)).rejects.toThrow('表示時間は1000ミリ秒以上である必要があります')
    
    const negativeDurationSettings = { displayDuration: -1000 }
    await expect(store.updateSettings(negativeDurationSettings)).rejects.toThrow('表示時間は1000ミリ秒以上である必要があります')
  })

  it('通知サポートが無い環境でのエラーハンドリング', () => {
    // Notification を未定義にする
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true
    })

    const store = useNotificationStore()
    store.checkNotificationSupport()
    
    expect(store.isSupported).toBe(false)
    expect(store.lastError).toContain('通知機能がサポートされていません')
  })

  it('通知権限要求の失敗ハンドリング', async () => {
    // Notification.requestPermission を失敗させる
    Object.defineProperty(global, 'Notification', {
      value: {
        requestPermission: vi.fn().mockRejectedValue(new Error('Permission denied'))
      },
      writable: true
    })

    Object.defineProperty(global, 'window', {
      value: {
        Notification: {
          requestPermission: vi.fn().mockRejectedValue(new Error('Permission denied'))
        }
      },
      writable: true
    })

    const store = useNotificationStore()
    store.isSupported.value = true
    
    const result = await store.requestPermission()
    
    expect(result).toBe('denied')
    expect(store.lastError).toBeTruthy()
  })

  it('localStorage エラーのハンドリング', async () => {
    // localStorage.setItem でエラーを発生させる
    const mockLocalStorage = {
      setItem: vi.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })
    }
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })

    const store = useNotificationStore()
    
    // エラーが発生してもPromiseが解決されることを確認
    await expect(store.saveToStorage()).rejects.toThrow()
  })

  it('localStorage から無効なデータを読み込んだ場合のハンドリング', () => {
    // 無効なJSON文字列を返すlocalStorage
    const mockLocalStorage = {
      getItem: vi.fn(() => 'invalid json')
    }
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })

    const store = useNotificationStore()
    
    // エラーが発生してもデフォルト値が設定されることを確認
    store.loadFromStorage()
    
    expect(store.settings.enabled).toBe(false)
    expect(store.settings.reminderTime).toBe('20:00')
  })

  it('通知表示時のエラーハンドリング', async () => {
    // Notification コンストラクタでエラーを発生させる
    Object.defineProperty(global, 'Notification', {
      value: vi.fn().mockImplementation(() => {
        throw new Error('Notification constructor failed')
      }),
      writable: true
    })

    const store = useNotificationStore()
    
    // ストアの内部状態を直接更新
    await store.updateSettings({ enabled: true })
    store.permission = 'granted'
    store.isSupported = true
    
    const result = await store.showNotification('Test', {})
    
    expect(result).toBe(false)
    expect(store.lastError).toBeTruthy()
  })

  it('通知が無効な状態での表示試行', async () => {
    const store = useNotificationStore()
    
    // 通知が無効な状態を設定
    await store.updateSettings({ enabled: false })
    store.permission = 'denied'
    store.isSupported = false
    
    const result = await store.showNotification('Test', {})
    
    expect(result).toBe(false)
  })
})