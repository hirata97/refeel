import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from '@features/settings'

// DOM環境のモック
const mockMatchMedia = vi.fn()
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

// LocalStorageのモック
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Vuetifyテーマのモック
vi.mock('vuetify', () => ({
  useTheme: () => ({
    global: {
      name: {
        value: 'light'
      }
    }
  })
}))

describe('ThemeStore - 正常系', () => {
  let themeStore

  beforeEach(() => {
    // Piniaを初期化
    setActivePinia(createPinia())
    themeStore = useThemeStore()
    
    // モックをリセット
    vi.clearAllMocks()
    
    // デフォルトの返り値を設定
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })
    
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('初期状態が正しく設定されている', () => {
    expect(themeStore.selectedTheme).toBe('light')
    expect(themeStore.systemPreference).toBe(false)
    expect(themeStore.isDarkMode).toBe(false)
    expect(themeStore.effectiveTheme).toBe('light')
  })

  it('ライトテーマに設定できる', () => {
    themeStore.setTheme('light')
    
    expect(themeStore.selectedTheme).toBe('light')
    expect(themeStore.isDarkMode).toBe(false)
    expect(themeStore.effectiveTheme).toBe('light')
  })

  it('ダークテーマに設定できる', () => {
    themeStore.setTheme('dark')
    
    expect(themeStore.selectedTheme).toBe('dark')
    expect(themeStore.isDarkMode).toBe(true)
    expect(themeStore.effectiveTheme).toBe('dark')
  })

  it('自動テーマ（システム設定に従う）に設定できる', () => {
    // matchMediaのモックを再設定（ダークモード検知）
    mockMatchMedia.mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)' ? true : false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }))

    themeStore.setTheme('system')

    expect(themeStore.selectedTheme).toBe('system')
    expect(themeStore.effectiveTheme).toBe('dark') // システムがダークモードの場合
  })

  it('テーマトグルが正しく動作する', () => {
    // light -> dark
    themeStore.setTheme('light')
    themeStore.toggleTheme()
    expect(themeStore.selectedTheme).toBe('dark')

    // dark -> system
    themeStore.toggleTheme()
    expect(themeStore.selectedTheme).toBe('system')

    // system -> light
    themeStore.toggleTheme()
    expect(themeStore.selectedTheme).toBe('light')
  })

  it('LocalStorageへの保存が正しく行われる', () => {
    themeStore.setTheme('dark')
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'theme-preferences',
      expect.stringContaining('"selectedTheme":"dark"')
    )
  })

  it('LocalStorageからの読み込みが正しく行われる', () => {
    const savedPreferences = {
      selectedTheme: 'dark',
      systemPreference: true,
      lastChanged: Date.now() - 1000
    }
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedPreferences))
    
    themeStore.loadFromLocalStorage()
    
    expect(themeStore.selectedTheme).toBe('dark')
    expect(themeStore.systemPreference).toBe(true)
  })

  it('テーマオプションが正しく取得できる', () => {
    const options = themeStore.getThemeOptions()
    
    expect(options).toHaveLength(3)
    expect(options[0]).toEqual({
      title: 'ライトモード',
      value: 'light',
      icon: 'mdi-white-balance-sunny'
    })
    expect(options[1]).toEqual({
      title: 'ダークモード',
      value: 'dark',
      icon: 'mdi-moon-waning-crescent'
    })
    expect(options[2]).toEqual({
      title: 'システム設定に従う',
      value: 'system',
      icon: 'mdi-theme-light-dark'
    })
  })

  it('themePreferences計算プロパティが正しく動作する', () => {
    themeStore.setTheme('dark')
    
    const preferences = themeStore.themePreferences
    
    expect(preferences.selectedTheme).toBe('dark')
    expect(preferences.systemPreference).toBe(false)
    expect(typeof preferences.lastChanged).toBe('number')
  })

  it('システムプリファレンスの設定が正しく動作する', () => {
    themeStore.setSystemPreference(true)
    
    expect(themeStore.systemPreference).toBe(true)
    expect(mockLocalStorage.setItem).toHaveBeenCalled()
  })

  it('システムテーマリスナーの初期化が正しく行われる', () => {
    const cleanup = themeStore.initialize()
    
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
    expect(typeof cleanup).toBe('function')
  })
})