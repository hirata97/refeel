import { useRouter, type RouteLocationRaw } from 'vue-router'

export interface NavigationOptions {
  replace?: boolean
  query?: Record<string, string | string[]>
}

/**
 * アプリ固有のナビゲーション処理を提供するComposable
 * 共通的な画面遷移処理を統一されたAPIで提供
 */
export function useAppRouter() {
  const router = useRouter()

  /**
   * 指定されたルートに遷移
   */
  const navigateTo = (path: string | RouteLocationRaw, options: NavigationOptions = {}) => {
    const routeOptions = {
      ...options.query && { query: options.query },
    }

    const route = typeof path === 'string' ? { path, ...routeOptions } : { ...path, ...routeOptions }

    if (options.replace) {
      router.replace(route)
    } else {
      router.push(route)
    }
  }

  /**
   * トップページに遷移
   */
  const navigateToTop = () => {
    navigateTo('/')
  }

  /**
   * ダッシュボードに遷移
   */
  const navigateToDashboard = () => {
    navigateTo('/dashboard')
  }

  /**
   * ログインページに遷移
   */
  const navigateToLogin = () => {
    navigateTo('/login')
  }

  /**
   * 日記一覧ページに遷移
   */
  const navigateToDiaryView = () => {
    navigateTo('/diary-view')
  }

  /**
   * 日記登録ページに遷移
   */
  const navigateToDiaryRegister = () => {
    navigateTo('/diary-register')
  }

  /**
   * 日記編集ページに遷移
   */
  const navigateToDiaryEdit = (diaryId: string) => {
    navigateTo(`/diary-edit/${diaryId}`)
  }

  /**
   * 設定ページに遷移
   */
  const navigateToSettings = () => {
    navigateTo('/settings')
  }

  /**
   * レポートページに遷移
   */
  const navigateToReport = () => {
    navigateTo('/diary-report')
  }

  /**
   * 週間振り返りページに遷移
   */
  const navigateToWeeklyReflection = () => {
    navigateTo('/weekly-reflection')
  }

  /**
   * 前のページに戻る
   */
  const goBack = () => {
    // ブラウザの履歴がある場合は戻る、ない場合はダッシュボードに遷移
    if (window.history.length > 1) {
      router.go(-1)
    } else {
      navigateToDashboard()
    }
  }

  /**
   * ページをリロード（認証チェック付き）
   */
  const refreshPage = () => {
    router.go(0)
  }

  return {
    // Basic router functions
    router,
    navigateTo,
    goBack,
    refreshPage,
    
    // App-specific navigation
    navigateToTop,
    navigateToDashboard,
    navigateToLogin,
    navigateToDiaryView,
    navigateToDiaryRegister,
    navigateToDiaryEdit,
    navigateToSettings,
    navigateToReport,
    navigateToWeeklyReflection,

    // Aliases for compatibility
    navigateToTopPage: navigateToTop,
  }
}