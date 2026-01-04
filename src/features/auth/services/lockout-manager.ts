import { LockoutStatus, AuditEventType } from '@features/auth/types'
import { auditLogger } from './audit-logger'
import { SecurityReporting } from '@features/auth/security'

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
