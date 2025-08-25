import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createSessionStore } from './session'
import { createAuthenticationStore } from './authentication'
import { createSecurityStore } from './security'
import { createLockoutStore } from './lockout'
import { accountLockoutManager } from '../../utils/account-lockout'

export const useAuthStore = defineStore('auth', () => {
  // 基本状態
  const loading = ref(true)
  const error = ref<string | null>(null)

  // セッションストアを作成
  const sessionStore = createSessionStore()

  // 共通ユーティリティ関数
  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  const clearError = () => {
    error.value = null
  }

  // セキュリティストアを作成（user値はnullアクセサで初期化）
  const securityStore = createSecurityStore(() => null)

  // 認証ストアを作成（セッション管理関数を渡す）
  const authenticationStore = createAuthenticationStore(
    sessionStore.setSession,
    setLoading,
    setError,
    clearError,
    securityStore.getClientIP,
    sessionStore.updateLastActivity,
  )

  // セキュリティストアのユーザー参照を更新
  const updatedSecurityStore = createSecurityStore(() => authenticationStore.user.value)

  // ロックアウトストアを作成
  const lockoutStore = createLockoutStore()

  // 統合された計算プロパティ
  const isAuthenticated = computed(() => {
    return (
      !!authenticationStore.user.value &&
      !!sessionStore.session.value &&
      !sessionStore.isSessionExpired.value &&
      !lockoutStore.isAccountLocked.value
    )
  })

  const userProfile = computed(() => {
    const user = authenticationStore.user.value
    if (!user) return null
    return {
      id: user.id,
      email: user.email,
      lastSignIn: user.last_sign_in_at,
      createdAt: user.created_at,
    }
  })

  // 拡張されたメソッド（元の機能を維持）
  const enhancedInitialize = async () => {
    try {
      setLoading(true)
      clearError()

      await authenticationStore.initialize()
      
      // セッションの有効性を検証
      if (sessionStore.session.value) {
        const isValid = await sessionStore.validateSession()
        if (!isValid) {
          authenticationStore.setUser(null)
          sessionStore.setSession(null)
        }
      }
    } catch (err) {
      console.error('拡張初期化エラー:', err)
      setError(err instanceof Error ? err.message : '初期化に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const enhancedSignIn = async (email: string, password: string) => {
    // ロックアウト状態をチェック
    const lockStatus = await lockoutStore.checkLockoutStatus(email)
    
    return await authenticationStore.signIn(
      email,
      password,
      lockStatus,
      accountLockoutManager,
      sessionStore.regenerateSession,
    )
  }

  const enhancedSignOut = async (terminateAllSessions: boolean = false) => {
    const userId = authenticationStore.user.value?.id
    const sessionId = sessionStore.session.value?.access_token

    if (userId && sessionId) {
      // セッション終了
      await sessionStore.terminateUserSession(sessionId)
    }

    // 全セッション終了の場合
    if (terminateAllSessions && userId) {
      await sessionStore.terminateAllUserSessions()
    }

    // 基本ログアウト処理
    return await authenticationStore.signOut(terminateAllSessions)
  }

  return {
    // 基本状態
    loading,
    error,

    // セッションストアの状態とメソッド
    session: sessionStore.session,
    sessionExpiresAt: sessionStore.sessionExpiresAt,
    lastActivity: sessionStore.lastActivity,
    sessionTimeout: sessionStore.sessionTimeout,
    isSessionExpired: sessionStore.isSessionExpired,
    timeUntilExpiry: sessionStore.timeUntilExpiry,
    
    // 認証ストアの状態とメソッド
    user: authenticationStore.user,
    passwordValidationResult: authenticationStore.passwordValidationResult,
    
    // ロックアウトストアの状態とメソッド
    lockoutStatus: lockoutStore.lockoutStatus,
    isAccountLocked: lockoutStore.isAccountLocked,
    
    // セキュリティストアの状態とメソッド
    securityStats: updatedSecurityStore.securityStats,

    // 統合された計算プロパティ
    isAuthenticated,
    userProfile,

    // 基本アクション
    setLoading,
    setError,
    clearError,

    // セッション管理
    setSession: sessionStore.setSession,
    updateLastActivity: sessionStore.updateLastActivity,
    setSessionTimeout: sessionStore.setSessionTimeout,
    invalidateSession: sessionStore.invalidateSession,
    regenerateSession: sessionStore.regenerateSession,
    validateSession: sessionStore.validateSession,
    refreshSession: sessionStore.refreshSession,
    setupAuthListener: sessionStore.setupAuthListener,
    startSessionMonitoring: sessionStore.startSessionMonitoring,
    getActiveSessions: sessionStore.getActiveSessions,
    getUserDevices: sessionStore.getUserDevices,
    terminateUserSession: sessionStore.terminateUserSession,
    terminateAllUserSessions: sessionStore.terminateAllUserSessions,

    // 認証メソッド
    initialize: enhancedInitialize,
    signIn: enhancedSignIn,
    signUp: authenticationStore.signUp,
    signOut: enhancedSignOut,
    changePassword: authenticationStore.changePassword,

    // セキュリティメソッド
    getClientIP: updatedSecurityStore.getClientIP,

    // ロックアウト管理
    checkLockoutStatus: lockoutStore.checkLockoutStatus,
  }
})