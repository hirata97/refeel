import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotificationStore } from '@/stores/notifications'

// Notification API のモック
const mockNotification = vi.fn()
mockNotification.prototype.close = vi.fn()

Object.defineProperty(global, 'Notification', {
  value: mockNotification,
  writable: true
})

Object.defineProperty(global, 'window', {
  value: {
    Notification: mockNotification,
    matchMedia: vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  },
  writable: true
})

describe('NotificationStore - 正常系', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // 各テストでモックをリセット
    vi.clearAllMocks()
  })

  it('初期状態が正しく設定される', () => {
    const store = useNotificationStore()
    
    expect(store.settings.enabled).toBe(false)
    expect(store.settings.diaryReminder).toBe(false)
    expect(store.settings.reminderTime).toBe('20:00')
    expect(store.settings.soundEnabled).toBe(true)
    expect(store.settings.displayDuration).toBe(5000)
    expect(store.permission).toBe('default')
  })

  it('通知サポートのチェックが正常に動作する', () => {
    // serviceWorker をモック
    Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: {}
      },
      writable: true
    })

    const store = useNotificationStore()
    store.checkNotificationSupport()
    
    expect(store.isSupported).toBe(true)
  })

  it('設定の更新が正常に動作する', async () => {
    const store = useNotificationStore()
    
    const newSettings = {
      enabled: true,
      diaryReminder: true,
      reminderTime: '21:00'
    }
    
    await store.updateSettings(newSettings)
    
    expect(store.settings.enabled).toBe(true)
    expect(store.settings.diaryReminder).toBe(true)
    expect(store.settings.reminderTime).toBe('21:00')
  })

  it('リマインダー時刻の形式検証が正常に動作する', async () => {
    const store = useNotificationStore()
    
    // 正常な時刻形式
    const validSettings = { reminderTime: '09:30' }
    await expect(store.updateSettings(validSettings)).resolves.not.toThrow()
  })

  it('通知表示時間の検証が正常に動作する', async () => {
    const store = useNotificationStore()
    
    // 正常な表示時間
    const validSettings = { displayDuration: 3000 }
    await expect(store.updateSettings(validSettings)).resolves.not.toThrow()
  })

  it('設定のローカルストレージ保存が正常に動作する', async () => {
    // localStorage をモック
    const mockLocalStorage = {
      setItem: vi.fn(),
      getItem: vi.fn(),
    }
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })

    const store = useNotificationStore()
    await store.saveToStorage()
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'notification-settings',
      expect.any(String)
    )
  })

  it('設定のローカルストレージ読み込みが正常に動作する', () => {
    const savedSettings = {
      settings: {
        enabled: true,
        diaryReminder: true,
        reminderTime: '22:00',
        soundEnabled: false,
        displayDuration: 3000
      },
      permission: 'granted'
    }

    // localStorage をモック
    const mockLocalStorage = {
      getItem: vi.fn(() => JSON.stringify(savedSettings)),
    }
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })

    const store = useNotificationStore()
    store.loadFromStorage()
    
    expect(store.settings.enabled).toBe(true)
    expect(store.settings.reminderTime).toBe('22:00')
    expect(store.permission).toBe('granted')
  })

  it('設定リセットが正常に動作する', async () => {
    // localStorage モックを設定
    const mockLocalStorage = {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
    }
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })

    const store = useNotificationStore()
    
    // 設定を変更
    await store.updateSettings({ enabled: true, reminderTime: '18:00' })
    
    // リセット
    await store.resetSettings()
    
    expect(store.settings.enabled).toBe(false)
    expect(store.settings.reminderTime).toBe('20:00')
  })
})