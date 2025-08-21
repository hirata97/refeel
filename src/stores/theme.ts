import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useTheme } from 'vuetify'

export type ThemeName = 'light' | 'dark' | 'auto'

export interface ThemePreferences {
  selectedTheme: ThemeName
  systemPreference: boolean
  lastChanged: number
}

export const useThemeStore = defineStore('theme', () => {
  // 状態
  const selectedTheme = ref<ThemeName>('light')
  const systemPreference = ref<boolean>(false)
  const lastChanged = ref<number>(Date.now())

  // 計算プロパティ
  const isDarkMode = computed(() => {
    if (selectedTheme.value === 'dark') {
      return true
    }
    if (selectedTheme.value === 'auto' && systemPreference.value) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  const effectiveTheme = computed(() => {
    if (selectedTheme.value === 'auto') {
      try {
        if (typeof window !== 'undefined' && window.matchMedia) {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        }
      } catch (error) {
        console.warn('システムテーマ検出に失敗しました:', error)
      }
      return 'light' // fallback
    }
    return selectedTheme.value === 'dark' || selectedTheme.value === 'light' ? selectedTheme.value : 'light'
  })

  const themePreferences = computed((): ThemePreferences => ({
    selectedTheme: selectedTheme.value,
    systemPreference: systemPreference.value,
    lastChanged: lastChanged.value,
  }))

  // アクション
  const setTheme = (theme: ThemeName) => {
    selectedTheme.value = theme
    lastChanged.value = Date.now()
    
    try {
      // Vuetifyテーマに反映
      const vuetifyTheme = useTheme()
      if (theme === 'auto') {
        if (typeof window !== 'undefined' && window.matchMedia) {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          vuetifyTheme.global.name.value = mediaQuery.matches ? 'dark' : 'light'
        } else {
          // fallback to light theme if matchMedia is not available
          vuetifyTheme.global.name.value = 'light'
        }
      } else {
        vuetifyTheme.global.name.value = theme
      }
    } catch (error) {
      console.warn('テーマ設定の反映に失敗しました:', error)
    }
    
    // ローカルストレージに保存
    saveToLocalStorage()
  }

  const toggleTheme = () => {
    if (selectedTheme.value === 'light') {
      setTheme('dark')
    } else if (selectedTheme.value === 'dark') {
      setTheme('auto')
    } else {
      setTheme('light')
    }
  }

  const setSystemPreference = (preference: boolean) => {
    systemPreference.value = preference
    lastChanged.value = Date.now()
    saveToLocalStorage()
  }

  // ローカルストレージ管理
  const saveToLocalStorage = () => {
    try {
      const preferences: ThemePreferences = {
        selectedTheme: selectedTheme.value,
        systemPreference: systemPreference.value,
        lastChanged: lastChanged.value,
      }
      localStorage.setItem('theme-preferences', JSON.stringify(preferences))
    } catch (error) {
      console.warn('テーマ設定の保存に失敗しました:', error)
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('theme-preferences')
      if (saved) {
        const preferences: ThemePreferences = JSON.parse(saved)
        selectedTheme.value = preferences.selectedTheme || 'light'
        systemPreference.value = preferences.systemPreference || false
        lastChanged.value = preferences.lastChanged || Date.now()
        
        // Vuetifyテーマに即座に反映
        const vuetifyTheme = useTheme()
        if (selectedTheme.value === 'auto') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          vuetifyTheme.global.name.value = mediaQuery.matches ? 'dark' : 'light'
        } else {
          vuetifyTheme.global.name.value = selectedTheme.value
        }
      }
    } catch (error) {
      console.warn('テーマ設定の読み込みに失敗しました:', error)
      // デフォルト値を設定
      setTheme('light')
    }
  }

  // システムテーマ変更の監視
  const setupSystemThemeListener = () => {
    try {
      if (typeof window === 'undefined' || !window.matchMedia) {
        return () => {} // matchMediaが利用できない場合は何もしない
      }

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        try {
          if (selectedTheme.value === 'auto') {
            const vuetifyTheme = useTheme()
            vuetifyTheme.global.name.value = e.matches ? 'dark' : 'light'
          }
        } catch (error) {
          console.warn('システムテーマ変更の処理に失敗しました:', error)
        }
      }

      // MediaQueryListEvent のリスナー追加
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleSystemThemeChange)
      } else {
        // 古いブラウザ対応
        mediaQuery.addListener(handleSystemThemeChange)
      }

      return () => {
        try {
          if (mediaQuery.removeEventListener) {
            mediaQuery.removeEventListener('change', handleSystemThemeChange)
          } else {
            // 古いブラウザ対応
            mediaQuery.removeListener(handleSystemThemeChange)
          }
        } catch (error) {
          console.warn('システムテーマリスナーの削除に失敗しました:', error)
        }
      }
    } catch (error) {
      console.warn('システムテーマリスナーの設定に失敗しました:', error)
      return () => {} // エラー時は何もしないクリーンアップ関数を返す
    }
  }

  // 初期化
  const initialize = () => {
    loadFromLocalStorage()
    return setupSystemThemeListener()
  }

  // テーマオプション取得
  const getThemeOptions = () => [
    { title: 'ライトモード', value: 'light' as ThemeName, icon: 'mdi-white-balance-sunny' },
    { title: 'ダークモード', value: 'dark' as ThemeName, icon: 'mdi-moon-waning-crescent' },
    { title: 'システム設定に従う', value: 'auto' as ThemeName, icon: 'mdi-theme-light-dark' },
  ]

  // CSS変数更新（カスタムスタイルが必要な場合）
  const updateCSSVariables = () => {
    try {
      if (typeof document === 'undefined' || !document.documentElement) {
        return // サーバーサイドレンダリングやテスト環境では何もしない
      }
      
      const root = document.documentElement
      const currentTheme = effectiveTheme.value
      
      if (currentTheme === 'dark') {
        root.style.setProperty('--app-background', '#121212')
        root.style.setProperty('--app-surface', '#1E1E1E')
        root.style.setProperty('--app-text', '#FFFFFF')
      } else {
        root.style.setProperty('--app-background', '#f5f7fa')
        root.style.setProperty('--app-surface', '#ffffff')
        root.style.setProperty('--app-text', '#000000')
      }
    } catch (error) {
      console.warn('CSS変数の更新に失敗しました:', error)
    }
  }

  return {
    // 状態
    selectedTheme,
    systemPreference,
    lastChanged,
    
    // 計算プロパティ
    isDarkMode,
    effectiveTheme,
    themePreferences,
    
    // アクション
    setTheme,
    toggleTheme,
    setSystemPreference,
    saveToLocalStorage,
    loadFromLocalStorage,
    setupSystemThemeListener,
    initialize,
    getThemeOptions,
    updateCSSVariables,
  }
})