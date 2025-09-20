import { ref } from 'vue'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { enhancedSessionManager } from '../../utils/enhanced-session-management'
import { auditLogger, AuditEventType } from '../../utils/audit-logger'
import { performSecurityCheck } from '../../utils/sanitization'
import { passwordValidator, passwordHistoryManager } from '../../utils/password-policy'
import type { PasswordValidationResult } from '../../utils/password-policy'
import type { LockoutStatus } from '../../utils/account-lockout'

export const createAuthenticationStore = (
  setSessionFn: (session: Session | null) => void,
  setLoadingFn: (loading: boolean) => void,
  setErrorFn: (error: string | null) => void,
  clearErrorFn: () => void,
  getClientIPFn: () => Promise<string>,
  updateLastActivityFn: () => void,
) => {
  // 認証関連の状態
  const user = ref<User | null>(null)
  const passwordValidationResult = ref<PasswordValidationResult | null>(null)

  // ユーザー設定
  const setUser = (newUser: User | null) => {
    user.value = newUser
    updateLastActivityFn()
  }

  // 認証状態の初期化
  const initialize = async () => {
    try {
      setLoadingFn(true)
      clearErrorFn()

      // 保存された最終活動時間を復元
      const savedActivity = localStorage.getItem('lastActivity')
      if (savedActivity) {
        // lastActivity.value = parseInt(savedActivity, 10)
        // セッションストアで管理されるため、ここでは復元のみ
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
        setSessionFn(session)
        setUser(session.user)
        // セッションの有効性を検証は呼び出し側で実行
      } else {
        setUser(null)
        setSessionFn(null)
      }
    } catch (err) {
      console.error('認証状態の初期化エラー:', err)
      setErrorFn(err instanceof Error ? err.message : '認証状態の初期化に失敗しました')
    } finally {
      setLoadingFn(false)
    }
  }

  // ログイン
  const signIn = async (
    email: string,
    password: string,
    lockoutStatus: LockoutStatus | null,
    accountLockoutManager: {
      recordLoginAttempt: (
        email: string,
        success: boolean,
        clientIP: string,
        userAgent: string,
      ) => Promise<void>
      shouldLockAccount: (email: string) => Promise<boolean>
      checkLockoutStatus: (email: string) => Promise<LockoutStatus>
      lockAccount: (email: string, attemptCount: number) => Promise<unknown>
    },
    regenerateSessionFn: () => Promise<{ success: boolean; error?: string }>,
  ) => {
    try {
      setLoadingFn(true)
      clearErrorFn()

      const clientIP = await getClientIPFn()
      const userAgent = navigator.userAgent

      if (lockoutStatus?.isLocked) {
        await auditLogger.log(
          AuditEventType.AUTH_FAILED_LOGIN,
          `ロックアウト中のアカウントによるログイン試行: ${email}`,
          { email, ipAddress: clientIP, userAgent },
        )
        throw new Error(
          `アカウントがロックされています。${lockoutStatus.lockoutEnd ? `解除まで残り時間: ${Math.ceil((lockoutStatus.lockoutEnd.getTime() - Date.now()) / 60000)}分` : ''}`,
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
        // ログイン成功時にエラー状態をクリア
        clearErrorFn()

        // ログイン成功を記録
        await accountLockoutManager.recordLoginAttempt(email, true, clientIP, userAgent)

        // セッション作成と管理
        setSessionFn(data.session)
        setUser(data.user)
        await enhancedSessionManager.createSession(
          data.user.id,
          data.session.access_token,
          userAgent,
          clientIP,
        )

        // セッションIDを再生成（セキュリティ強化）
        await regenerateSessionFn()

        // 最終活動時間を保存
        localStorage.setItem('lastActivity', Date.now().toString())

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
      setErrorFn(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoadingFn(false)
    }
  }

  // ユーザー登録
  const signUp = async (email: string, password: string) => {
    try {
      setLoadingFn(true)
      clearErrorFn()

      const clientIP = await getClientIPFn()
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
          setSessionFn(data.session)
          setUser(data.user)
          await enhancedSessionManager.createSession(
            data.user.id,
            data.session.access_token,
            userAgent,
            clientIP,
          )
          localStorage.setItem('lastActivity', Date.now().toString())
        } else {
          setUser(data.user)
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
      setErrorFn(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoadingFn(false)
    }
  }

  // ログアウト
  const signOut = async (terminateAllSessions: boolean = false) => {
    try {
      setLoadingFn(true)
      clearErrorFn()

      const userId = user.value?.id
      const sessionId = ref() // session.value?.access_token からアクセスできない
      const clientIP = await getClientIPFn()

      if (userId) {
        // 全セッション終了の場合
        if (terminateAllSessions) {
          await enhancedSessionManager.terminateAllUserSessions(userId)
        }

        await auditLogger.log(
          AuditEventType.AUTH_LOGOUT,
          `ログアウト${terminateAllSessions ? '（全セッション終了）' : ''}: ${user.value?.email}`,
          {
            userId,
            sessionId: sessionId,
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
      setSessionFn(null)
      passwordValidationResult.value = null

      // ローカルストレージもクリア
      localStorage.removeItem('user')
      localStorage.removeItem('lastActivity')

      console.log('ログアウトしました')
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ログアウトに失敗しました'
      setErrorFn(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoadingFn(false)
    }
  }

  // パスワード変更
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoadingFn(true)
      clearErrorFn()

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
      setErrorFn(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoadingFn(false)
    }
  }

  return {
    // 状態
    user,
    passwordValidationResult,

    // アクション
    setUser,
    initialize,
    signIn,
    signUp,
    signOut,
    changePassword,
  }
}
