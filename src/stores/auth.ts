import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { performSecurityCheck } from '@/utils/sanitization'
import { passwordValidator, passwordHistoryManager } from '@/utils/password-policy'
import { twoFactorAuthManager } from '@/utils/two-factor-auth'
import { accountLockoutManager } from '@/utils/account-lockout'
import { enhancedSessionManager } from '@/utils/enhanced-session-management'
import { auditLogger, AuditEventType } from '@/utils/audit-logger'
import type { PasswordValidationResult } from '@/utils/password-policy'
import type { LockoutStatus } from '@/utils/account-lockout'

export const useAuthStore = defineStore('auth', () => {
  // 状態
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  const sessionExpiresAt = ref<number | null>(null)
  const lastActivity = ref<number>(Date.now())
  const sessionTimeout = ref<number>(30 * 60 * 1000) // 30分のタイムアウト

  // セキュリティ状態
  const lockoutStatus = ref<LockoutStatus | null>(null)
  const passwordValidationResult = ref<PasswordValidationResult | null>(null)
  const twoFactorRequired = ref<boolean>(false)
  const pendingTwoFactorSessionId = ref<string | null>(null)

  // 計算プロパティ
  const isAuthenticated = computed(() => {
    return (
      !!user.value &&
      !!session.value &&
      !isSessionExpired.value &&
      !twoFactorRequired.value &&
      !lockoutStatus.value?.isLocked
    )
  })

  const userProfile = computed(() => {
    if (!user.value) return null
    return {
      id: user.value.id,
      email: user.value.email,
      lastSignIn: user.value.last_sign_in_at,
      createdAt: user.value.created_at,
    }
  })

  const isSessionExpired = computed(() => {
    if (!sessionExpiresAt.value) return false
    return Date.now() > sessionExpiresAt.value
  })

  const timeUntilExpiry = computed(() => {
    if (!sessionExpiresAt.value) return 0
    return Math.max(0, sessionExpiresAt.value - Date.now())
  })

  // セキュリティ関連の計算プロパティ
  const isAccountLocked = computed(() => lockoutStatus.value?.isLocked || false)

  const is2FAEnabled = computed(() => {
    if (!user.value?.id) return false
    return twoFactorAuthManager.is2FAEnabled(user.value.id)
  })

  const securityStats = computed(() => {
    if (!user.value?.id) return null
    return enhancedSessionManager.getSecurityStats(user.value.id)
  })

  // ユーティリティ関数
  const getClientIP = async (): Promise<string> => {
    try {
      // 実際の実装では、IPを取得するサービスを使用
      return '127.0.0.1' // 開発環境用のダミーIP
    } catch {
      return 'unknown'
    }
  }

  // セッション活動時間の更新
  const updateLastActivity = () => {
    lastActivity.value = Date.now()
  }

  // セッションタイムアウトの設定
  const setSessionTimeout = (timeout: number) => {
    sessionTimeout.value = timeout
  }

  // アクション
  const setUser = (newUser: User | null) => {
    user.value = newUser
    updateLastActivity()
  }

  const setSession = (newSession: Session | null) => {
    session.value = newSession
    if (newSession?.user) {
      user.value = newSession.user
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

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  const clearError = () => {
    error.value = null
  }

  // セッションの強制無効化
  const invalidateSession = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      sessionExpiresAt.value = null
      localStorage.removeItem('user')
      localStorage.removeItem('lastActivity')
      console.log('セッションを強制無効化しました')
    } catch (err) {
      console.error('セッション無効化エラー:', err)
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
        console.log('セッションIDを再生成しました')
        return { success: true }
      }

      throw new Error('セッション再生成に失敗しました')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'セッション再生成に失敗しました'
      setError(errorMessage)
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
        console.log('セッションがタイムアウトしました')
        await invalidateSession()
        return false
      }

      // セッション有効期限チェック
      if (isSessionExpired.value) {
        console.log('セッションの有効期限が切れました')
        await invalidateSession()
        return false
      }

      // Supabaseセッションの有効性確認
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        console.log('Supabaseセッションが無効です')
        await invalidateSession()
        return false
      }

      updateLastActivity()
      return true
    } catch (err) {
      console.error('セッション検証エラー:', err)
      await invalidateSession()
      return false
    }
  }

  // 認証状態の初期化
  const initialize = async () => {
    try {
      setLoading(true)
      clearError()

      // 保存された最終活動時間を復元
      const savedActivity = localStorage.getItem('lastActivity')
      if (savedActivity) {
        lastActivity.value = parseInt(savedActivity, 10)
      }

      // 現在のセッションを取得
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        throw sessionError
      }

      if (session) {
        setSession(session)
        // セッションの有効性を検証
        const isValid = await validateSession()
        if (!isValid) {
          setUser(null)
          setSession(null)
        }
      } else {
        setUser(null)
        setSession(null)
      }
    } catch (err) {
      console.error('認証状態の初期化エラー:', err)
      setError(err instanceof Error ? err.message : '認証状態の初期化に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // ログイン
  const signIn = async (email: string, password: string, twoFactorCode?: string) => {
    try {
      setLoading(true)
      clearError()

      const clientIP = await getClientIP()
      const userAgent = navigator.userAgent

      // アカウントロックアウト状態をチェック
      const lockStatus = await accountLockoutManager.checkLockoutStatus(email)
      lockoutStatus.value = lockStatus

      if (lockStatus.isLocked) {
        await auditLogger.log(
          AuditEventType.AUTH_FAILED_LOGIN,
          `ロックアウト中のアカウントによるログイン試行: ${email}`,
          { email, ipAddress: clientIP, userAgent },
        )
        throw new Error(
          `アカウントがロックされています。${lockStatus.lockoutEnd ? `解除まで残り時間: ${Math.ceil((lockStatus.lockoutEnd.getTime() - Date.now()) / 60000)}分` : ''}`,
        )
      }

      // セキュリティチェックを実行
      const emailCheck = performSecurityCheck(email)
      const passwordCheck = performSecurityCheck(password)

      if (!emailCheck.isSecure) {
        throw new Error(
          `メールアドレスに不正な内容が含まれています: ${emailCheck.threats.join(', ')}`,
        )
      }

      if (!passwordCheck.isSecure) {
        throw new Error(
          `パスワードに不正な内容が含まれています: ${passwordCheck.threats.join(', ')}`,
        )
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        // ログイン失敗を記録
        await accountLockoutManager.recordLoginAttempt(email, false, clientIP, userAgent)

        // ロックアウトが必要かチェック
        if (await accountLockoutManager.shouldLockAccount(email)) {
          const newLockStatus = await accountLockoutManager.checkLockoutStatus(email)
          const attemptCount = newLockStatus.failedAttempts
          await accountLockoutManager.lockAccount(email, attemptCount)
        }

        throw signInError
      }

      if (data.session && data.user) {
        // ログイン成功を記録
        await accountLockoutManager.recordLoginAttempt(email, true, clientIP, userAgent)

        // 2FA確認が必要かチェック
        const requires2FA = twoFactorAuthManager.is2FAEnabled(data.user.id)

        if (requires2FA && !twoFactorCode) {
          // 2FAが有効で、コードが提供されていない場合
          twoFactorRequired.value = true
          pendingTwoFactorSessionId.value = data.session.access_token
          return {
            success: false,
            requires2FA: true,
            message: '2要素認証が必要です',
          }
        }

        if (requires2FA && twoFactorCode) {
          // 2FAコードの検証
          const verificationResult = await twoFactorAuthManager.verify2FACode(
            data.user.id,
            twoFactorCode,
          )

          if (!verificationResult.isValid) {
            await auditLogger.log(AuditEventType.AUTH_FAILED_2FA, `2FA認証失敗: ${email}`, {
              email,
              userId: data.user.id,
              ipAddress: clientIP,
            })
            throw new Error('2要素認証コードが正しくありません')
          }

          await auditLogger.log(AuditEventType.AUTH_LOGIN, `2FA認証成功: ${email}`, {
            email,
            userId: data.user.id,
            ipAddress: clientIP,
            method: verificationResult.method,
          })
        }

        // セッション作成と管理
        setSession(data.session)
        await enhancedSessionManager.createSession(
          data.user.id,
          data.session.access_token,
          userAgent,
          clientIP,
        )

        // セッションIDを再生成（セキュリティ強化）
        await regenerateSession()

        // 最終活動時間を保存
        localStorage.setItem('lastActivity', lastActivity.value.toString())

        // 2FA状態をクリア
        twoFactorRequired.value = false
        pendingTwoFactorSessionId.value = null

        await auditLogger.log(AuditEventType.AUTH_LOGIN, `ログイン成功: ${email}`, {
          email,
          userId: data.user.id,
          ipAddress: clientIP,
          userAgent,
          sessionId: data.session.access_token,
        })

        console.log('ログイン成功、セッションを作成しました')
        return { success: true, user: data.user }
      }

      throw new Error('ログインに失敗しました')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ログインに失敗しました'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // ユーザー登録
  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true)
      clearError()

      const clientIP = await getClientIP()
      const userAgent = navigator.userAgent

      // セキュリティチェックを実行
      const emailCheck = performSecurityCheck(email)
      const passwordCheck = performSecurityCheck(password)

      if (!emailCheck.isSecure) {
        throw new Error(
          `メールアドレスに不正な内容が含まれています: ${emailCheck.threats.join(', ')}`,
        )
      }

      if (!passwordCheck.isSecure) {
        throw new Error(
          `パスワードに不正な内容が含まれています: ${passwordCheck.threats.join(', ')}`,
        )
      }

      // パスワードポリシーの検証
      const passwordValidation = passwordValidator.validatePassword(password, email)
      passwordValidationResult.value = passwordValidation

      if (!passwordValidation.isValid) {
        throw new Error(`パスワードポリシー違反: ${passwordValidation.errors.join(', ')}`)
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        await auditLogger.log(AuditEventType.AUTH_FAILED_LOGIN, `ユーザー登録失敗: ${email}`, {
          email,
          ipAddress: clientIP,
          userAgent,
          error: signUpError.message,
        })
        throw signUpError
      }

      if (data.user) {
        // パスワード履歴への追加
        if (data.user.id) {
          const passwordHash = await passwordValidator.hashPassword(password)
          await passwordHistoryManager.addToHistory(data.user.id, passwordHash)
        }

        // サインアップ時は確認メールが送信される場合があるため、
        // セッションがない場合もある
        if (data.session) {
          setSession(data.session)
          await enhancedSessionManager.createSession(
            data.user.id,
            data.session.access_token,
            userAgent,
            clientIP,
          )
          localStorage.setItem('lastActivity', lastActivity.value.toString())
        }

        await auditLogger.log(AuditEventType.AUTH_LOGIN, `ユーザー登録成功: ${email}`, {
          email,
          userId: data.user.id,
          ipAddress: clientIP,
          userAgent,
          needsConfirmation: !data.session,
        })

        return {
          success: true,
          user: data.user,
          needsConfirmation: !data.session,
          passwordStrength: {
            score: passwordValidation.score,
            label: passwordValidator.getStrengthLabel(passwordValidation.score),
          },
        }
      }

      throw new Error('ユーザー登録に失敗しました')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ユーザー登録に失敗しました'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // ログアウト
  const signOut = async (terminateAllSessions: boolean = false) => {
    try {
      setLoading(true)
      clearError()

      const userId = user.value?.id
      const sessionId = session.value?.access_token
      const clientIP = await getClientIP()

      if (userId && sessionId) {
        // セッション終了
        await enhancedSessionManager.terminateSession(sessionId, 'user_logout')

        // 全セッション終了の場合
        if (terminateAllSessions) {
          await enhancedSessionManager.terminateAllUserSessions(userId)
        }

        await auditLogger.log(
          AuditEventType.AUTH_LOGOUT,
          `ログアウト${terminateAllSessions ? '（全セッション終了）' : ''}: ${user.value?.email}`,
          {
            userId,
            sessionId,
            ipAddress: clientIP,
            terminateAll: terminateAllSessions,
          },
        )
      }

      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) {
        throw signOutError
      }

      // 状態をクリア
      setUser(null)
      setSession(null)
      sessionExpiresAt.value = null
      lockoutStatus.value = null
      passwordValidationResult.value = null
      twoFactorRequired.value = false
      pendingTwoFactorSessionId.value = null

      // ローカルストレージもクリア
      localStorage.removeItem('user')
      localStorage.removeItem('lastActivity')

      console.log('ログアウトしました')
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ログアウトに失敗しました'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
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
        console.log('セッションを更新しました')
        return true
      }

      // セッションが無効な場合は状態をクリア
      await invalidateSession()
      return false
    } catch (err) {
      console.error('セッション更新エラー:', err)
      setError(err instanceof Error ? err.message : 'セッションの更新に失敗しました')

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
      console.log('認証状態変更:', event, session)

      switch (event) {
        case 'SIGNED_IN':
          if (session) {
            setSession(session)
            localStorage.setItem('lastActivity', lastActivity.value.toString())
          }
          break
        case 'SIGNED_OUT':
          setUser(null)
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
            setUser(session.user)
            updateLastActivity()
          }
          break
      }

      setLoading(false)
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

  // セキュリティ関連のメソッド

  // パスワード変更
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true)
      clearError()

      if (!user.value) {
        throw new Error('ユーザーが認証されていません')
      }

      // パスワードポリシーの検証
      const passwordValidation = passwordValidator.validatePassword(
        newPassword,
        user.value.email,
        user.value.user_metadata?.name,
      )

      if (!passwordValidation.isValid) {
        throw new Error(`パスワードポリシー違反: ${passwordValidation.errors.join(', ')}`)
      }

      // パスワード再利用チェック
      const newPasswordHash = await passwordValidator.hashPassword(newPassword)
      const isReused = await passwordHistoryManager.isPasswordReused(user.value.id, newPasswordHash)

      if (isReused) {
        throw new Error('過去に使用したパスワードは使用できません')
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw error
      }

      // パスワード履歴に追加
      await passwordHistoryManager.addToHistory(user.value.id, newPasswordHash)

      await auditLogger.log(
        AuditEventType.PASSWORD_CHANGED,
        `パスワード変更: ${user.value.email}`,
        { userId: user.value.id, email: user.value.email },
      )

      return {
        success: true,
        passwordStrength: {
          score: passwordValidation.score,
          label: passwordValidator.getStrengthLabel(passwordValidation.score),
        },
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'パスワード変更に失敗しました'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // 2FA関連メソッド
  const setup2FA = async () => {
    if (!user.value) {
      throw new Error('ユーザーが認証されていません')
    }

    return await twoFactorAuthManager.setup2FA(user.value.id, user.value.email!)
  }

  const enable2FA = async (verificationCode: string, secret: string, backupCodes: string[]) => {
    if (!user.value) {
      throw new Error('ユーザーが認証されていません')
    }

    return await twoFactorAuthManager.enable2FA(
      user.value.id,
      user.value.email!,
      secret,
      verificationCode,
      backupCodes,
    )
  }

  const disable2FA = async (verificationCode: string) => {
    if (!user.value) {
      throw new Error('ユーザーが認証されていません')
    }

    return await twoFactorAuthManager.disable2FA(user.value.id, user.value.email!, verificationCode)
  }

  const regenerateBackupCodes = async () => {
    if (!user.value) {
      throw new Error('ユーザーが認証されていません')
    }

    return await twoFactorAuthManager.regenerateBackupCodes(user.value.id, user.value.email!)
  }

  // セッション管理メソッド
  const getActiveSessions = () => {
    if (!user.value) return []
    return enhancedSessionManager.getActiveUserSessions(user.value.id)
  }

  const getUserDevices = () => {
    if (!user.value) return []
    return enhancedSessionManager.getUserDevices(user.value.id)
  }

  const terminateUserSession = async (sessionId: string) => {
    if (!user.value) return
    await enhancedSessionManager.terminateSession(sessionId, 'user_terminated')
  }

  const terminateAllUserSessions = async () => {
    if (!user.value) return 0
    return await enhancedSessionManager.terminateAllUserSessions(
      user.value.id,
      session.value?.access_token,
    )
  }

  return {
    // 状態
    user,
    session,
    loading,
    error,
    sessionExpiresAt,
    lastActivity,
    sessionTimeout,

    // セキュリティ状態
    lockoutStatus,
    passwordValidationResult,
    twoFactorRequired,
    pendingTwoFactorSessionId,

    // 計算プロパティ
    isAuthenticated,
    userProfile,
    isSessionExpired,
    timeUntilExpiry,
    isAccountLocked,
    is2FAEnabled,
    securityStats,

    // 基本認証アクション
    initialize,
    signIn,
    signUp,
    signOut,
    refreshSession,
    setupAuthListener,
    setError,
    clearError,
    updateLastActivity,
    setSessionTimeout,
    invalidateSession,
    regenerateSession,
    validateSession,
    startSessionMonitoring,

    // セキュリティアクション
    changePassword,
    setup2FA,
    enable2FA,
    disable2FA,
    regenerateBackupCodes,
    getActiveSessions,
    getUserDevices,
    terminateUserSession,
    terminateAllUserSessions,

    // セキュリティ
    checkLockoutStatus: async (email: string) => {
      try {
        const status = await accountLockoutManager.checkLockoutStatus(email)
        lockoutStatus.value = status
        return status
      } catch (err) {
        console.error('ロックアウトステータス確認エラー:', err)
        return null
      }
    },

    // ユーティリティ
    getClientIP,
  }
})
