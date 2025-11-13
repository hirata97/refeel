import { useAuthStore } from '@/stores/auth'
import { createLogger } from '@/utils/logger'

const logger = createLogger('AUTH')
import { SecurityReporting } from './security'
import DOMPurify from 'isomorphic-dompurify'
import bcrypt from 'bcryptjs'

/**
 * 認証関連のユーティリティ関数とセキュリティ機能
 *
 * 注意: ルートガードやコンポーネントでは直接 useAuthStore() を使用することを推奨します。
 * このファイルは後方互換性と共通ロジックのために提供されています。
 */

// ===== 型定義 =====

export interface LockoutStatus {
  isLocked: boolean
  lockoutUntil: Date | null
  attemptCount: number
  remainingTime?: number
}

export interface PasswordValidationResult {
  isValid: boolean
  score: number
  feedback: string[]
  errors: string[]
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong'
}

export interface SessionInfo {
  id: string
  userId: string
  userAgent: string
  clientIP: string
  createdAt: Date
  lastAccessed: Date
  isActive: boolean
}

export interface SecurityStats {
  activeSessions: number
  lastLogin: Date | null
  loginAttempts: number
  devicesCount: number
}

export enum AuditEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  ACCOUNT_LOCKED = 'account_locked',
  SESSION_CREATED = 'session_created',
  SESSION_TERMINATED = 'session_terminated',
  SECURITY_VIOLATION = 'security_violation',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
}

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

// ===== セキュリティ機能マネージャー =====

/**
 * アカウントロックアウト管理
 */
export const accountLockoutManager = {
  async checkLockoutStatus(email: string): Promise<LockoutStatus> {
    const key = `lockout_${email.toLowerCase()}`
    const stored = localStorage.getItem(key)

    if (!stored) {
      return { isLocked: false, lockoutUntil: null, attemptCount: 0 }
    }

    const data = JSON.parse(stored)
    const lockoutUntil = data.lockoutUntil ? new Date(data.lockoutUntil) : null

    if (lockoutUntil && new Date() > lockoutUntil) {
      localStorage.removeItem(key)
      return { isLocked: false, lockoutUntil: null, attemptCount: 0 }
    }

    const remainingTime = lockoutUntil
      ? Math.max(0, lockoutUntil.getTime() - Date.now())
      : undefined

    return {
      isLocked: data.isLocked || false,
      lockoutUntil,
      attemptCount: data.attemptCount || 0,
      remainingTime,
    }
  },

  async recordLoginAttempt(
    email: string,
    success: boolean,
    clientIP: string,
    userAgent: string,
  ): Promise<void> {
    const normalizedEmail = email.toLowerCase()

    if (success) {
      const key = `lockout_${normalizedEmail}`
      localStorage.removeItem(key)
      await auditLogger.log(
        AuditEventType.LOGIN_SUCCESS,
        `Login successful for ${normalizedEmail}`,
        {
          email: normalizedEmail,
          clientIP,
          userAgent,
        },
      )
    } else {
      const status = await this.checkLockoutStatus(normalizedEmail)
      const newAttemptCount = status.attemptCount + 1

      const key = `lockout_${normalizedEmail}`
      localStorage.setItem(
        key,
        JSON.stringify({
          attemptCount: newAttemptCount,
          lastAttempt: new Date().toISOString(),
          isLocked: false,
          lockoutUntil: null,
        }),
      )

      await auditLogger.log(AuditEventType.LOGIN_FAILURE, `Login failed for ${normalizedEmail}`, {
        email: normalizedEmail,
        attemptCount: newAttemptCount,
        clientIP,
        userAgent,
      })
    }
  },

  async shouldLockAccount(email: string): Promise<boolean> {
    const status = await this.checkLockoutStatus(email)
    return status.attemptCount >= 5
  },

  async lockAccount(email: string, attemptCount: number): Promise<void> {
    const normalizedEmail = email.toLowerCase()
    const lockoutUntil = new Date(Date.now() + 30 * 60 * 1000) // 30分

    const key = `lockout_${normalizedEmail}`
    localStorage.setItem(
      key,
      JSON.stringify({
        attemptCount,
        isLocked: true,
        lockoutUntil: lockoutUntil.toISOString(),
        lockedAt: new Date().toISOString(),
      }),
    )

    await auditLogger.log(AuditEventType.ACCOUNT_LOCKED, `Account locked for ${normalizedEmail}`, {
      email: normalizedEmail,
      attemptCount,
      lockoutUntil: lockoutUntil.toISOString(),
    })
  },
}

/**
 * パスワード検証機能
 */
export const passwordValidator = {
  validatePassword(password: string, email?: string, name?: string): PasswordValidationResult {
    const errors: string[] = []
    const feedback: string[] = []
    let score = 0

    // 基本的な長さチェック
    if (password.length < 8) {
      errors.push('パスワードは8文字以上である必要があります')
    } else {
      score += 1
      feedback.push('適切な長さです')
    }

    // 文字種チェック
    if (!/[a-z]/.test(password)) {
      errors.push('小文字を含む必要があります')
    } else {
      score += 1
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('大文字を含む必要があります')
    } else {
      score += 1
    }

    if (!/\d/.test(password)) {
      errors.push('数字を含む必要があります')
    } else {
      score += 1
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('特殊文字を含む必要があります')
    } else {
      score += 1
    }

    // 個人情報との類似性チェック
    if (email && password.toLowerCase().includes(email.split('@')[0].toLowerCase())) {
      errors.push('メールアドレスと類似しています')
      score = Math.max(0, score - 2)
    }

    if (name && password.toLowerCase().includes(name.toLowerCase())) {
      errors.push('名前と類似しています')
      score = Math.max(0, score - 2)
    }

    // 一般的なパスワードチェック
    const commonPasswords = ['password', 'password123', '123456789', 'qwerty']
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('一般的すぎるパスワードです')
      score = Math.max(0, score - 3)
    }

    const strength = this.getStrengthFromScore(score)
    const isValid = errors.length === 0 && score >= 3

    return {
      isValid,
      score,
      feedback,
      errors,
      strength,
    }
  },

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  },

  getStrengthLabel(score: number): string {
    if (score <= 1) return '非常に弱い'
    if (score <= 2) return '弱い'
    if (score <= 3) return '普通'
    if (score <= 4) return '良い'
    return '強い'
  },

  getStrengthFromScore(score: number): PasswordValidationResult['strength'] {
    if (score <= 1) return 'very-weak'
    if (score <= 2) return 'weak'
    if (score <= 3) return 'fair'
    if (score <= 4) return 'good'
    return 'strong'
  },
}

/**
 * パスワード履歴管理
 */
export const passwordHistoryManager = {
  async addToHistory(userId: string, passwordHash: string): Promise<void> {
    const key = `password_history_${userId}`
    const stored = localStorage.getItem(key)
    const history = stored ? JSON.parse(stored) : []

    history.unshift({
      hash: passwordHash,
      createdAt: new Date().toISOString(),
    })

    // 最新5個まで保持
    const trimmed = history.slice(0, 5)
    localStorage.setItem(key, JSON.stringify(trimmed))
  },

  async isPasswordReused(userId: string, passwordHash: string): Promise<boolean> {
    const key = `password_history_${userId}`
    const stored = localStorage.getItem(key)

    if (!stored) return false

    const history = JSON.parse(stored)
    return history.some((entry: { hash: string; createdAt: string }) => entry.hash === passwordHash)
  },
}

/**
 * セッション管理機能
 */
export const enhancedSessionManager = {
  async createSession(
    userId: string,
    sessionId: string,
    userAgent: string,
    clientIP: string,
  ): Promise<void> {
    const session: SessionInfo = {
      id: sessionId,
      userId,
      userAgent,
      clientIP,
      createdAt: new Date(),
      lastAccessed: new Date(),
      isActive: true,
    }

    const key = `sessions_${userId}`
    const stored = localStorage.getItem(key)
    const sessions = stored ? JSON.parse(stored) : []

    sessions.push(session)
    localStorage.setItem(key, JSON.stringify(sessions))

    await auditLogger.log(AuditEventType.SESSION_CREATED, `Session created for user ${userId}`, {
      sessionId,
      userAgent,
      clientIP,
    })
  },

  async terminateSession(sessionId: string, reason: string): Promise<void> {
    // 全ユーザーのセッションから対象を探して削除
    const keys = Object.keys(localStorage).filter((key) => key.startsWith('sessions_'))

    for (const key of keys) {
      const stored = localStorage.getItem(key)
      if (!stored) continue

      const sessions = JSON.parse(stored)
      const sessionIndex = sessions.findIndex((s: SessionInfo) => s.id === sessionId)

      if (sessionIndex >= 0) {
        const session = sessions[sessionIndex]
        sessions.splice(sessionIndex, 1)
        localStorage.setItem(key, JSON.stringify(sessions))

        await auditLogger.log(AuditEventType.SESSION_TERMINATED, `Session terminated: ${reason}`, {
          sessionId,
          userId: session.userId,
          reason,
        })
        break
      }
    }
  },

  getActiveUserSessions(userId: string): SessionInfo[] {
    const key = `sessions_${userId}`
    const stored = localStorage.getItem(key)

    if (!stored) return []

    const sessions = JSON.parse(stored)
    return sessions.filter((s: SessionInfo) => s.isActive)
  },

  getUserDevices(userId: string): string[] {
    const sessions = this.getActiveUserSessions(userId)
    const devices = new Set<string>()

    sessions.forEach((session) => {
      devices.add(session.userAgent)
    })

    return Array.from(devices)
  },

  async terminateAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
    const key = `sessions_${userId}`
    const stored = localStorage.getItem(key)

    if (!stored) return

    const sessions = JSON.parse(stored)
    const terminatedSessions = sessions.filter((s: SessionInfo) => s.id !== exceptSessionId)

    for (const session of terminatedSessions) {
      await auditLogger.log(AuditEventType.SESSION_TERMINATED, 'All sessions terminated', {
        sessionId: session.id,
        userId,
      })
    }

    const remainingSessions = exceptSessionId
      ? sessions.filter((s: SessionInfo) => s.id === exceptSessionId)
      : []

    localStorage.setItem(key, JSON.stringify(remainingSessions))
  },

  getSecurityStats(userId: string): SecurityStats {
    const sessions = this.getActiveUserSessions(userId)
    const devices = this.getUserDevices(userId)

    const lastLogin =
      sessions.length > 0
        ? new Date(Math.max(...sessions.map((s) => new Date(s.lastAccessed).getTime())))
        : null

    return {
      activeSessions: sessions.length,
      lastLogin,
      loginAttempts: 0, // 実装に応じて追加
      devicesCount: devices.length,
    }
  },
}

/**
 * 監査ログ機能
 */
export const auditLogger = {
  async log(
    eventType: AuditEventType,
    description: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const logEntry = {
      eventType,
      description,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    // ローカルストレージに保存（実際の実装ではサーバーに送信）
    const key = 'audit_logs'
    const stored = localStorage.getItem(key)
    const logs = stored ? JSON.parse(stored) : []

    logs.push(logEntry)

    // 最新100件まで保持
    const trimmed = logs.slice(-100)
    localStorage.setItem(key, JSON.stringify(trimmed))

    // セキュリティレポートにも送信
    if (
      [
        AuditEventType.LOGIN_FAILURE,
        AuditEventType.ACCOUNT_LOCKED,
        AuditEventType.SECURITY_VIOLATION,
      ].includes(eventType)
    ) {
      await SecurityReporting.reportSecurityIncident(eventType, logEntry)
    }
  },
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
