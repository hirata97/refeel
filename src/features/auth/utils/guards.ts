import { useAuthStore } from '@features/auth'
import { createLogger } from '@shared/utils'
import DOMPurify from 'isomorphic-dompurify'

const logger = createLogger('AUTH')

/**
 * 認証が必要なページのガード関数
 * @returns 認証されている場合は true、そうでなければ false
 */
export const requireAuth = (): boolean => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    logger.warn('認証が必要です')
    return false
  }

  return true
}

/**
 * ゲストユーザー専用ページのガード関数
 * @returns ゲストユーザーの場合は true、認証済みの場合は false
 */
export const requireGuest = (): boolean => {
  const authStore = useAuthStore()

  if (authStore.isAuthenticated) {
    logger.warn('すでにログインしています')
    return false
  }

  return true
}

/**
 * 現在のユーザー情報を取得
 * @returns ユーザー情報（未認証の場合は null）
 */
export const getCurrentUser = () => {
  const authStore = useAuthStore()
  return authStore.user
}

/**
 * 認証状態を確認
 * @returns 認証されている場合は true
 * @deprecated 直接 useAuthStore().isAuthenticated を使用してください
 */
export const isAuthenticated = (): boolean => {
  const authStore = useAuthStore()
  return authStore.isAuthenticated
}

/**
 * セキュリティチェック機能
 */
export const performSecurityCheck = (input: string): string => {
  // XSS対策
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })

  // SQLインジェクション対策（基本的なパターンのみ）
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(-{2}|\/\*|\*\/)/g,
  ]

  let result = sanitized
  sqlPatterns.forEach((pattern) => {
    result = result.replace(pattern, '')
  })

  return result.trim()
}
