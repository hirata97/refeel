import { useAuthStore } from '@features/auth'
import { SessionInfo, SecurityStats, AuditEventType } from './types'
import { auditLogger } from './audit-logger'
import { SecurityReporting } from '../security'

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
