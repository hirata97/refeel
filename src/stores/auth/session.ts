import { ref, computed } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { enhancedSessionManager } from '../../utils/enhanced-session-management'
import { createLogger } from '../../utils/logger'

const logger = createLogger('AUTH-SESSION')

export const createSessionStore = () => {
  // セッション関連の状態
  const session = ref<Session | null>(null)
  const sessionExpiresAt = ref<number | null>(null)
  const lastActivity = ref<number>(Date.now())
  const sessionTimeout = ref<number>(30 * 60 * 1000) // 30分のタイムアウト

  // 計算プロパティ
  const isSessionExpired = computed(() => {
    if (!sessionExpiresAt.value) return false
    return Date.now() > sessionExpiresAt.value
  })

  const timeUntilExpiry = computed(() => {
    if (!sessionExpiresAt.value) return 0
    return Math.max(0, sessionExpiresAt.value - Date.now())
  })

  // セッション管理アクション
  const setSession = (newSession: Session | null) => {
    session.value = newSession
    if (newSession?.user) {
      // セッション有効期限を設定（Supabaseのexpires_atを使用、またはデフォルト値）
      const expiresAt = newSession.expires_at
        ? newSession.expires_at * 1000
        : Date.now() + sessionTimeout.value
      sessionExpiresAt.value = expiresAt
    } else {
      sessionExpiresAt.value = null
    }
    updateLastActivity()
  }

  const updateLastActivity = () => {
    lastActivity.value = Date.now()
  }

  const setSessionTimeout = (timeout: number) => {
    sessionTimeout.value = timeout
  }

  // セッションの強制無効化
  const invalidateSession = async () => {
    try {
      await supabase.auth.signOut()
      setSession(null)
      sessionExpiresAt.value = null
      localStorage.removeItem('user')
      localStorage.removeItem('lastActivity')
      logger.debug('セッションを強制無効化しました')
    } catch (err) {
      logger.error('セッション無効化エラー:', err)
    }
  }

  // セッションIDの再生成
  const regenerateSession = async () => {
    try {
      if (!session.value) {
        throw new Error('セッションが存在しません')
      }

      // 新しいセッションを要求
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        throw error
      }

      if (data.session) {
        setSession(data.session)
        logger.debug('セッションIDを再生成しました')
        return { success: true }
      }

      throw new Error('セッション再生成に失敗しました')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'セッション再生成に失敗しました'
      return { success: false, error: errorMessage }
    }
  }

  // セッションの有効性を確認し、期限切れの場合は無効化
  const validateSession = async () => {
    if (!session.value) return false

    try {
      // アクティビティタイムアウトチェック
      const inactiveTime = Date.now() - lastActivity.value
      if (inactiveTime > sessionTimeout.value) {
        logger.debug('セッションがタイムアウトしました')
        await invalidateSession()
        return false
      }

      // セッション有効期限チェック
      if (isSessionExpired.value) {
        logger.debug('セッションの有効期限が切れました')
        await invalidateSession()
        return false
      }

      // Supabaseセッションの有効性確認
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        logger.debug('Supabaseセッションが無効です')
        await invalidateSession()
        return false
      }

      updateLastActivity()
      return true
    } catch (err) {
      logger.error('セッション検証エラー:', err)
      await invalidateSession()
      return false
    }
  }

  // セッションの有効性確認
  const refreshSession = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession()

      if (error) {
        throw error
      }

      if (session) {
        setSession(session)
        localStorage.setItem('lastActivity', lastActivity.value.toString())
        logger.debug('セッションを更新しました')
        return true
      }

      // セッションが無効な場合は状態をクリア
      await invalidateSession()
      return false
    } catch (err) {
      logger.error('セッション更新エラー:', err)
      // エラーの場合も状態をクリア
      await invalidateSession()
      return false
    }
  }

  // 認証状態変更リスナーの設定
  const setupAuthListener = () => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.debug('認証状態変更:', event, session)

      switch (event) {
        case 'SIGNED_IN':
          if (session) {
            setSession(session)
            localStorage.setItem('lastActivity', lastActivity.value.toString())
          }
          break
        case 'SIGNED_OUT':
          setSession(null)
          sessionExpiresAt.value = null
          localStorage.removeItem('user')
          localStorage.removeItem('lastActivity')
          break
        case 'TOKEN_REFRESHED':
          if (session) {
            setSession(session)
            localStorage.setItem('lastActivity', lastActivity.value.toString())
          }
          break
        case 'USER_UPDATED':
          if (session?.user) {
            updateLastActivity()
          }
          break
      }
    })

    return subscription
  }

  // セッション監視の開始
  const startSessionMonitoring = () => {
    // 1分ごとにセッションの有効性をチェック
    const interval = setInterval(async () => {
      if (session.value) {
        await validateSession()
      }
    }, 60000) // 1分

    return () => clearInterval(interval)
  }

  // セッション管理メソッド
  const getActiveSessions = () => {
    // user.value が必要だが、ここでは session から取得
    if (!session.value?.user) return []
    return enhancedSessionManager.getActiveUserSessions(session.value.user.id)
  }

  const getUserDevices = () => {
    if (!session.value?.user) return []
    return enhancedSessionManager.getUserDevices(session.value.user.id)
  }

  const terminateUserSession = async (sessionId: string) => {
    if (!session.value?.user) return
    await enhancedSessionManager.terminateSession(sessionId, 'user_terminated')
  }

  const terminateAllUserSessions = async () => {
    if (!session.value?.user) return 0
    return await enhancedSessionManager.terminateAllUserSessions(
      session.value.user.id,
      session.value?.access_token,
    )
  }

  return {
    // 状態
    session,
    sessionExpiresAt,
    lastActivity,
    sessionTimeout,

    // 計算プロパティ
    isSessionExpired,
    timeUntilExpiry,

    // アクション
    setSession,
    updateLastActivity,
    setSessionTimeout,
    invalidateSession,
    regenerateSession,
    validateSession,
    refreshSession,
    setupAuthListener,
    startSessionMonitoring,
    getActiveSessions,
    getUserDevices,
    terminateUserSession,
    terminateAllUserSessions,
  }
}
