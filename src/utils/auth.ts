import { useAuthStore } from '@/stores/auth'
import { SecurityReporting } from './security'

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

/**
 * セキュリティ強化: 認証試行の監視
 * @param isSuccess 認証試行の成功/失敗
 * @param email 試行されたメールアドレス
 * @param reason 失敗理由（失敗時のみ）
 */
export const logAuthAttempt = async (
  isSuccess: boolean,
  email: string,
  reason?: string,
): Promise<void> => {
  const attemptData = {
    email: email.toLowerCase(),
    success: isSuccess,
    reason,
    ip: await getClientIP(),
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  }

  if (!isSuccess) {
    await SecurityReporting.reportSecurityIncident('auth_failure', attemptData)

    // 連続失敗の監視
    const failureCount = incrementFailureCount(email)
    if (failureCount >= 5) {
      await SecurityReporting.reportSecurityIncident('brute_force_attempt', {
        ...attemptData,
        failureCount,
      })
    }
  } else {
    // 成功時は失敗カウントをリセット
    resetFailureCount(email)
  }
}

/**
 * クライアントIPアドレスを取得（概算）
 * @returns IPアドレス
 */
const getClientIP = async (): Promise<string> => {
  try {
    // WebRTC経由でローカルIPを取得する試み
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

    return new Promise((resolve) => {
      pc.createDataChannel('')
      pc.createOffer().then((offer) => pc.setLocalDescription(offer))

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate.candidate
          const ipMatch = candidate.match(/(\d+\.\d+\.\d+\.\d+)/)
          if (ipMatch) {
            resolve(ipMatch[1])
            pc.close()
          }
        }
      }

      // フォールバック
      setTimeout(() => {
        resolve('unknown')
        pc.close()
      }, 1000)
    })
  } catch {
    return 'unknown'
  }
}

/**
 * 認証失敗カウントの管理
 */
const AUTH_FAILURE_KEY = 'auth_failures'

const incrementFailureCount = (email: string): number => {
  const failures = getFailureCounts()
  failures[email] = (failures[email] || 0) + 1
  localStorage.setItem(AUTH_FAILURE_KEY, JSON.stringify(failures))
  return failures[email]
}

const resetFailureCount = (email: string): void => {
  const failures = getFailureCounts()
  delete failures[email]
  localStorage.setItem(AUTH_FAILURE_KEY, JSON.stringify(failures))
}

const getFailureCounts = (): Record<string, number> => {
  try {
    const stored = localStorage.getItem(AUTH_FAILURE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

/**
 * セッションの有効性を検証
 * @returns セッションが有効な場合true
 */
export const validateSession = async (): Promise<boolean> => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    return false
  }

  try {
    // セッションの有効期限チェック
    const sessionData = authStore.session
    if (!sessionData?.expires_at) {
      return false
    }

    const expiresAt = new Date(sessionData.expires_at * 1000)
    const now = new Date()

    if (now >= expiresAt) {
      await SecurityReporting.reportSecurityIncident('session_expired', {
        user_id: authStore.user?.id,
        expires_at: expiresAt.toISOString(),
        current_time: now.toISOString(),
      })
      return false
    }

    return true
  } catch (err) {
    await SecurityReporting.reportSecurityIncident('session_validation_error', {
      error: err instanceof Error ? err.message : 'Unknown error',
    })
    return false
  }
}
