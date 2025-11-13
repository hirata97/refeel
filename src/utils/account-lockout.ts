/**
 * アカウントロックアウト機能の実装
 * Issue #70: 認証・認可システムの強化実装
 */

import { AuditLogger, AuditEventType } from './audit-logger'

export interface LockoutPolicy {
  maxFailedAttempts: number
  lockoutDuration: number // minutes
  attemptWindow: number // minutes - この時間内の失敗回数を計測
  progressiveLockout: boolean // 連続ロックアウト時の時間延長
}

export interface LoginAttempt {
  email: string
  timestamp: Date
  success: boolean
  ipAddress?: string
  userAgent?: string
}

export interface LockoutStatus {
  isLocked: boolean
  lockoutEnd?: Date
  failedAttempts: number
  remainingAttempts: number
  nextAttemptAllowed?: Date
}

export interface LockoutInfo {
  email: string
  lockoutStart: Date
  lockoutEnd: Date
  attemptCount: number
  lockoutLevel: number
}

// デフォルトポリシー設定
export const DEFAULT_LOCKOUT_POLICY: LockoutPolicy = {
  maxFailedAttempts: 5,
  lockoutDuration: 15, // 15分
  attemptWindow: 30, // 30分以内の失敗回数をカウント
  progressiveLockout: true,
}

/**
 * アカウントロックアウト管理クラス
 */
export class AccountLockoutManager {
  private policy: LockoutPolicy
  private auditLogger: AuditLogger

  constructor(policy: LockoutPolicy = DEFAULT_LOCKOUT_POLICY) {
    this.policy = policy
    this.auditLogger = AuditLogger.getInstance()
  }

  /**
   * ログイン試行の記録
   */
  async recordLoginAttempt(
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const attempt: LoginAttempt = {
      email: email.toLowerCase(),
      timestamp: new Date(),
      success,
      ipAddress,
      userAgent,
    }

    // ローカルストレージに記録
    this.saveLoginAttempt(attempt)

    // 監査ログに記録
    await this.auditLogger.log(
      success ? AuditEventType.AUTH_LOGIN : AuditEventType.AUTH_FAILED_LOGIN,
      `ログイン${success ? '成功' : '失敗'}: ${email}`,
      {
        email,
        ipAddress,
        userAgent,
        timestamp: attempt.timestamp.toISOString(),
      },
    )

    // 成功した場合は失敗カウントをリセット
    if (success) {
      this.clearFailedAttempts(email)
    }
  }

  /**
   * アカウントのロックアウト状態チェック
   */
  async checkLockoutStatus(email: string): Promise<LockoutStatus> {
    const normalizedEmail = email.toLowerCase()

    // 現在のロックアウト情報を取得
    const lockoutInfo = this.getLockoutInfo(normalizedEmail)

    if (lockoutInfo && new Date() < lockoutInfo.lockoutEnd) {
      // まだロックアウト期間中
      return {
        isLocked: true,
        lockoutEnd: lockoutInfo.lockoutEnd,
        failedAttempts: lockoutInfo.attemptCount,
        remainingAttempts: 0,
        nextAttemptAllowed: lockoutInfo.lockoutEnd,
      }
    }

    // ロックアウト期間が終了している場合はクリア
    if (lockoutInfo && new Date() >= lockoutInfo.lockoutEnd) {
      this.clearLockout(normalizedEmail)
    }

    // 失敗回数をチェック
    const failedAttempts = this.getRecentFailedAttempts(normalizedEmail)
    const remainingAttempts = Math.max(0, this.policy.maxFailedAttempts - failedAttempts.length)

    return {
      isLocked: false,
      failedAttempts: failedAttempts.length,
      remainingAttempts,
      nextAttemptAllowed: undefined,
    }
  }

  /**
   * アカウントをロックアウト
   */
  async lockAccount(email: string, attemptCount: number): Promise<LockoutInfo> {
    const normalizedEmail = email.toLowerCase()

    // 前回のロックアウト情報を取得
    const previousLockout = this.getLockoutInfo(normalizedEmail)
    let lockoutLevel = 1

    if (previousLockout && this.policy.progressiveLockout) {
      lockoutLevel = previousLockout.lockoutLevel + 1
    }

    // 段階的ロックアウト時間の計算
    const baseDuration = this.policy.lockoutDuration
    const actualDuration = this.policy.progressiveLockout
      ? baseDuration * Math.pow(2, lockoutLevel - 1) // 指数的増加
      : baseDuration

    const lockoutStart = new Date()
    const lockoutEnd = new Date(lockoutStart.getTime() + actualDuration * 60 * 1000)

    const lockoutInfo: LockoutInfo = {
      email: normalizedEmail,
      lockoutStart,
      lockoutEnd,
      attemptCount,
      lockoutLevel,
    }

    // ロックアウト情報を保存
    this.saveLockoutInfo(lockoutInfo)

    // 監査ログに記録
    await this.auditLogger.log(
      AuditEventType.SECURITY_LOCKOUT,
      `アカウントロックアウト: ${email}`,
      {
        email: normalizedEmail,
        lockoutDuration: actualDuration,
        lockoutLevel,
        attemptCount,
        lockoutEnd: lockoutEnd.toISOString(),
      },
    )

    logger.warn(`アカウント ${email} が${actualDuration}分間ロックアウトされました`)

    return lockoutInfo
  }

  /**
   * 手動でのアカウントロック解除
   */
  async unlockAccount(email: string, adminUserId?: string): Promise<void> {
    const normalizedEmail = email.toLowerCase()

    this.clearLockout(normalizedEmail)
    this.clearFailedAttempts(normalizedEmail)

    // 監査ログに記録
    await this.auditLogger.log(AuditEventType.SECURITY_UNLOCK, `アカウントロック解除: ${email}`, {
      email: normalizedEmail,
      adminUserId: adminUserId || 'system',
      timestamp: new Date().toISOString(),
    })

    logger.info(`アカウント ${email} のロックが解除されました`)
  }

  /**
   * 失敗回数が上限に達しているかチェック
   */
  async shouldLockAccount(email: string): Promise<boolean> {
    const failedAttempts = this.getRecentFailedAttempts(email.toLowerCase())
    return failedAttempts.length >= this.policy.maxFailedAttempts
  }

  /**
   * 不正アクセス検知
   */
  async detectSuspiciousActivity(email: string): Promise<{
    isSuspicious: boolean
    reasons: string[]
  }> {
    const normalizedEmail = email.toLowerCase()
    const attempts = this.getAllAttempts(normalizedEmail)
    const reasons: string[] = []
    let isSuspicious = false

    if (attempts.length === 0) {
      return { isSuspicious: false, reasons: [] }
    }

    // 短時間での大量アクセス
    const recentAttempts = attempts.filter(
      (attempt) => new Date().getTime() - attempt.timestamp.getTime() < 5 * 60 * 1000, // 5分以内
    )

    if (recentAttempts.length >= 10) {
      isSuspicious = true
      reasons.push('短時間での大量ログイン試行')
    }

    // 複数IPアドレスからのアクセス
    const uniqueIPs = new Set(
      recentAttempts.filter((attempt) => attempt.ipAddress).map((attempt) => attempt.ipAddress),
    )

    if (uniqueIPs.size >= 3) {
      isSuspicious = true
      reasons.push('複数のIPアドレスからの同時アクセス')
    }

    // 異常な失敗パターン
    const failedAttempts = attempts.filter((attempt) => !attempt.success)
    if (failedAttempts.length >= 15) {
      isSuspicious = true
      reasons.push('異常に多い失敗回数')
    }

    if (isSuspicious) {
      // 不正アクセス検知を監査ログに記録
      await this.auditLogger.log(AuditEventType.SECURITY_VIOLATION, `不正アクセス検知: ${email}`, {
        email: normalizedEmail,
        reasons,
        recentAttemptCount: recentAttempts.length,
        uniqueIPCount: uniqueIPs.size,
        totalFailedAttempts: failedAttempts.length,
      })
    }

    return { isSuspicious, reasons }
  }

  /**
   * 統計情報の取得
   */
  getSecurityStats(): {
    totalLockedAccounts: number
    totalFailedAttempts: number
    suspiciousActivities: number
  } {
    const allLockouts = this.getAllLockouts()
    const currentTime = new Date()

    const activeLockedAccounts = allLockouts.filter(
      (lockout) => currentTime < lockout.lockoutEnd,
    ).length

    // 失敗試行の総数を計算（過去24時間）
    const yesterday = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000)
    let totalFailed = 0

    try {
      const allAttempts = localStorage.getItem('login_attempts')
      if (allAttempts) {
        const parsed = JSON.parse(allAttempts)
        totalFailed = Object.values(parsed as Record<string, LoginAttempt[]>)
          .flat()
          .filter((attempt: LoginAttempt) => {
            return !attempt.success && new Date(attempt.timestamp) > yesterday
          }).length
      }
    } catch (error) {
      logger.warn('統計情報の取得に失敗:', error)
    }

    return {
      totalLockedAccounts: activeLockedAccounts,
      totalFailedAttempts: totalFailed,
      suspiciousActivities: 0, // 実装に応じて追加
    }
  }

  // プライベートメソッド

  private saveLoginAttempt(attempt: LoginAttempt): void {
    try {
      const key = 'login_attempts'
      const stored = localStorage.getItem(key)
      const attempts = stored ? JSON.parse(stored) : {}

      if (!attempts[attempt.email]) {
        attempts[attempt.email] = []
      }

      attempts[attempt.email].push(attempt)

      // 古いエントリを削除（30日以上前）
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      attempts[attempt.email] = attempts[attempt.email].filter(
        (a: LoginAttempt) => new Date(a.timestamp) > thirtyDaysAgo,
      )

      localStorage.setItem(key, JSON.stringify(attempts))
    } catch (error) {
      logger.warn('ログイン試行の保存に失敗:', error)
    }
  }

  private getRecentFailedAttempts(email: string): LoginAttempt[] {
    const windowStart = new Date(Date.now() - this.policy.attemptWindow * 60 * 1000)
    return this.getAllAttempts(email).filter(
      (attempt) => !attempt.success && attempt.timestamp > windowStart,
    )
  }

  private getAllAttempts(email: string): LoginAttempt[] {
    try {
      const stored = localStorage.getItem('login_attempts')
      if (!stored) return []

      const attempts = JSON.parse(stored)
      const userAttempts = attempts[email] || []

      return userAttempts.map((attempt: Partial<LoginAttempt> & { timestamp: string }) => ({
        ...attempt,
        timestamp: new Date(attempt.timestamp),
      }))
    } catch (error) {
      logger.warn('ログイン試行履歴の取得に失敗:', error)
      return []
    }
  }

  private clearFailedAttempts(email: string): void {
    try {
      const stored = localStorage.getItem('login_attempts')
      if (!stored) return

      const attempts = JSON.parse(stored)
      if (attempts[email]) {
        // 失敗した試行のみを削除し、成功した試行は保持
        attempts[email] = attempts[email].filter((attempt: LoginAttempt) => attempt.success)
        localStorage.setItem('login_attempts', JSON.stringify(attempts))
      }
    } catch (error) {
      logger.warn('失敗試行のクリアに失敗:', error)
    }
  }

  private saveLockoutInfo(lockoutInfo: LockoutInfo): void {
    try {
      const key = 'account_lockouts'
      const stored = localStorage.getItem(key)
      const lockouts = stored ? JSON.parse(stored) : {}

      lockouts[lockoutInfo.email] = lockoutInfo
      localStorage.setItem(key, JSON.stringify(lockouts))
    } catch (error) {
      logger.warn('ロックアウト情報の保存に失敗:', error)
    }
  }

  private getLockoutInfo(email: string): LockoutInfo | null {
    try {
      const stored = localStorage.getItem('account_lockouts')
      if (!stored) return null

      const lockouts = JSON.parse(stored)
      const lockoutData = lockouts[email]

      if (!lockoutData) return null

      return {
        ...lockoutData,
        lockoutStart: new Date(lockoutData.lockoutStart),
        lockoutEnd: new Date(lockoutData.lockoutEnd),
      }
    } catch (error) {
      logger.warn('ロックアウト情報の取得に失敗:', error)
      return null
    }
  }

  private getAllLockouts(): LockoutInfo[] {
    try {
      const stored = localStorage.getItem('account_lockouts')
      if (!stored) return []

      const lockouts = JSON.parse(stored)
      return Object.values(
        lockouts as Record<string, LockoutInfo & { lockoutStart: string; lockoutEnd: string }>,
      ).map((lockout) => ({
        ...lockout,
        lockoutStart: new Date(lockout.lockoutStart),
        lockoutEnd: new Date(lockout.lockoutEnd),
      }))
    } catch (error) {
      logger.warn('全ロックアウト情報の取得に失敗:', error)
      return []
    }
  }

  private clearLockout(email: string): void {
    try {
      const stored = localStorage.getItem('account_lockouts')
      if (!stored) return

      const lockouts = JSON.parse(stored)
      delete lockouts[email]
      localStorage.setItem('account_lockouts', JSON.stringify(lockouts))
    } catch (error) {
      logger.warn('ロックアウト情報のクリアに失敗:', error)
    }
  }
}

// エクスポート用インスタンス
export const accountLockoutManager = new AccountLockoutManager()
