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

describe('ThemeStore - 異常系・エッジケース', () => {
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

  it('LocalStorage読み込みエラー時にデフォルト値が設定される', () => {
    // 不正なJSONを返すようにモック
    mockLocalStorage.getItem.mockReturnValue('invalid json')
    
    // エラーが発生してもクラッシュしない
    expect(() => themeStore.loadFromLocalStorage()).not.toThrow()
    
    // デフォルト値が設定される
    expect(themeStore.selectedTheme).toBe('light')
  })

  it('LocalStorage保存エラー時でもクラッシュしない', () => {
    // setItemがエラーを投げるようにモック
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded')
    })
    
    // エラーが発生してもクラッシュしない
    expect(() => themeStore.setTheme('dark')).not.toThrow()
    
    // 状態は正しく更新される
    expect(themeStore.selectedTheme).toBe('dark')
  })

  it('matchMediaが存在しない環境でも動作する', () => {
    // matchMediaが未定義の場合をシミュレート
    Object.defineProperty(window, 'matchMedia', {
      value: undefined,
    })
    
    // エラーが発生しないことを確認
    expect(() => themeStore.initialize()).not.toThrow()
  })

  it('古いブラウザのmatchMediaでも動作する', () => {
    // 古いAPIのみサポートするmatchMediaをモック
    mockMatchMedia.mockReturnValue({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      // addEventListener/removeEventListenerがない
    })
    
    // エラーが発生しないことを確認
    expect(() => themeStore.initialize()).not.toThrow()
  })

  it('無効なテーマ値でも適切に処理される', () => {
    const invalidTheme = 'invalid-theme'
    
    // 直接内部状態を変更（通常のAPIでは防がれるため）
    themeStore.selectedTheme = invalidTheme
    
    // effectiveThemeは有効な値を返す
    expect(['light', 'dark'].includes(themeStore.effectiveTheme)).toBe(true)
  })

  it('破損したLocalStorageデータでも復旧できる', () => {
    // 一部のフィールドが欠損したデータ
    const brokenPreferences = {
      selectedTheme: 'dark',
      // systemPreferenceとlastChangedが欠損
    }
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(brokenPreferences))
    
    themeStore.loadFromLocalStorage()
    
    // 有効なフィールドは復元され、欠損フィールドはデフォルト値
    expect(themeStore.selectedTheme).toBe('dark')
    expect(themeStore.systemPreference).toBe(false) // デフォルト値
  })

  it('nullや空文字のLocalStorageでも正常に処理される', () => {
    // null値をモック
    mockLocalStorage.getItem.mockReturnValue(null)
    expect(() => themeStore.loadFromLocalStorage()).not.toThrow()
    
    // 空文字をモック
    mockLocalStorage.getItem.mockReturnValue('')
    expect(() => themeStore.loadFromLocalStorage()).not.toThrow()
  })

  it('システムテーマ変更イベントでエラーが発生してもクラッシュしない', () => {
    const mockEventTarget = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }
    
    mockMatchMedia.mockReturnValue(mockEventTarget)
    
    const cleanup = themeStore.initialize()
    
    // エラーを投げるイベントリスナーをシミュレート
    const errorHandler = mockEventTarget.addEventListener.mock.calls[0]?.[1] || 
                        mockEventTarget.addListener.mock.calls[0]?.[0]
    
    if (errorHandler) {
      // エラーが発生してもクラッシュしない
      expect(() => errorHandler({ matches: true })).not.toThrow()
    }
    
    // クリーンアップ関数も正常に動作する
    expect(() => cleanup()).not.toThrow()
  })

  it('CSS変数の更新でDOMエラーが発生してもクラッシュしない', () => {
    // documentが未定義の環境をシミュレート
    const originalDocument = global.document
    global.document = undefined
    
    // エラーが発生してもクラッシュしない
    expect(() => themeStore.updateCSSVariables()).not.toThrow()
    
    // documentを復元
    global.document = originalDocument
  })

  it('極端なtimestamp値でも正常に処理される', () => {
    const extremePreferences = {
      selectedTheme: 'dark',
      systemPreference: false,
      lastChanged: Number.MAX_SAFE_INTEGER
    }
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(extremePreferences))
    
    expect(() => themeStore.loadFromLocalStorage()).not.toThrow()
    expect(themeStore.lastChanged).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('頻繁なテーマ切り替えでもパフォーマンス問題が発生しない', () => {
    const start = performance.now()
    
    // 100回の高速テーマ切り替え
    for (let i = 0; i < 100; i++) {
      themeStore.toggleTheme()
    }
    
    const end = performance.now()
    const duration = end - start
    
    // 1秒以内に完了することを確認（パフォーマンステスト）
    expect(duration).toBeLessThan(1000)
  })
})