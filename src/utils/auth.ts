import { useAuthStore } from '@/stores/auth'

/**
 * 認証関連のユーティリティ関数
 * 
 * 注意: ルートガードやコンポーネントでは直接 useAuthStore() を使用することを推奨します。
 * このファイルは後方互換性と共通ロジックのために提供されています。
 */

/**
 * 認証が必要なページのガード関数
 * @returns 認証されている場合は true、そうでなければ false
 */
export const requireAuth = (): boolean => {
  const authStore = useAuthStore()
  
  if (!authStore.isAuthenticated) {
    console.warn('認証が必要です')
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
    console.warn('すでにログインしています')
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
