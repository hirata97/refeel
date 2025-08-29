import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export interface AuthGuardOptions {
  redirectTo?: string
  requireAuth?: boolean
  onAuthenticated?: () => void | Promise<void>
  onUnauthenticated?: () => void | Promise<void>
}

/**
 * 認証ガード用のComposable
 * 認証状態をチェックし、適切なリダイレクトを行う
 */
export function useAuthGuard(options: AuthGuardOptions = {}) {
  const {
    redirectTo = '/login',
    requireAuth = true,
    onAuthenticated,
    onUnauthenticated
  } = options

  const router = useRouter()
  const authStore = useAuthStore()

  const checkAuth = async () => {
    const isAuthenticated = authStore.isAuthenticated

    if (requireAuth && !isAuthenticated) {
      // 認証が必要だが未認証の場合
      if (onUnauthenticated) {
        await onUnauthenticated()
      }
      router.push(redirectTo)
      return false
    }

    if (!requireAuth && isAuthenticated) {
      // 認証不要だが認証済みの場合（ログインページなど）
      if (onAuthenticated) {
        await onAuthenticated()
      }
      router.push('/dashboard')
      return false
    }

    // 適切な状態の場合
    if (isAuthenticated && onAuthenticated) {
      await onAuthenticated()
    }

    return true
  }

  // マウント時に認証チェック実行
  onMounted(checkAuth)

  return {
    authStore,
    router,
    checkAuth,
    isAuthenticated: () => authStore.isAuthenticated
  }
}