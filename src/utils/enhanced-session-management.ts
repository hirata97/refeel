/**
 * 拡張セッション管理機能の実装
 * Issue #70: 認証・認可システムの強化実装
 */

import { AuditLogger, AuditEventType } from './audit-logger'

export interface DeviceInfo {
  id: string
  name: string
  userAgent: string
  ipAddress: string
  location?: string
  firstSeen: Date
  lastSeen: Date
  isCurrentDevice: boolean
}

export interface SessionInfo {
  id: string
  userId: string
  deviceId: string
  createdAt: Date
  lastActivity: Date
  expiresAt: Date
  ipAddress: string
  userAgent: string
  isActive: boolean
}

export interface SessionSecuritySettings {
  maxConcurrentSessions: number
  sessionTimeout: number // minutes
  absoluteTimeout: number // minutes (maximum session duration)
  requireReauthForSensitive: boolean
  trackDevices: boolean
  notifyNewDevice: boolean
}

export interface SecurityAlert {
  id: string
  type: 'new_device' | 'suspicious_location' | 'concurrent_sessions' | 'session_hijacking'
  message: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  resolved: boolean
}

// デフォルト設定
const DEFAULT_SESSION_SETTINGS: SessionSecuritySettings = {
  maxConcurrentSessions: 3,
  sessionTimeout: 30, // 30分
  absoluteTimeout: 24 * 60, // 24時間
  requireReauthForSensitive: true,
  trackDevices: true,
  notifyNewDevice: true,
}

/**
 * 拡張セッション管理クラス
 */
export class EnhancedSessionManager {
  private settings: SessionSecuritySettings
  private auditLogger: AuditLogger

  constructor(settings: Partial<SessionSecuritySettings> = {}) {
    this.settings = { ...DEFAULT_SESSION_SETTINGS, ...settings }
    this.auditLogger = AuditLogger.getInstance()
  }

  /**
   * 新しいセッションの作成
   */
  async createSession(
    userId: string,
    sessionId: string,
    userAgent: string,
    ipAddress: string,
  ): Promise<SessionInfo> {
    const deviceId = this.generateDeviceFingerprint(userAgent, ipAddress)
    const now = new Date()

    const sessionInfo: SessionInfo = {
      id: sessionId,
      userId,
      deviceId,
      createdAt: now,
      lastActivity: now,
      expiresAt: new Date(now.getTime() + this.settings.sessionTimeout * 60 * 1000),
      ipAddress,
      userAgent,
      isActive: true,
    }

    // デバイス情報の更新
    await this.updateDeviceInfo(userId, deviceId, userAgent, ipAddress)

    // 同時セッション数チェック
    await this.enforceSessionLimits(userId, sessionId)

    // セッション情報を保存
    this.saveSessionInfo(sessionInfo)

    // 監査ログに記録
    await this.auditLogger.log(
      AuditEventType.AUTH_SESSION_CREATED,
      `新しいセッション作成: ${userId}`,
      {
        userId,
        sessionId,
        deviceId,
        ipAddress,
        userAgent: this.sanitizeUserAgent(userAgent),
        timestamp: now.toISOString(),
      },
    )

    return sessionInfo
  }

  /**
   * セッションの更新
   */
  async updateSession(sessionId: string): Promise<boolean> {
    const sessionInfo = this.getSessionInfo(sessionId)
    if (!sessionInfo || !sessionInfo.isActive) {
      return false
    }

    const now = new Date()

    // 絶対的タイムアウトチェック
    const absoluteExpiry = new Date(
      sessionInfo.createdAt.getTime() + this.settings.absoluteTimeout * 60 * 1000,
    )

    if (now > absoluteExpiry) {
      await this.terminateSession(sessionId, 'absolute_timeout')
      return false
    }

    // セッションを更新
    sessionInfo.lastActivity = now
    sessionInfo.expiresAt = new Date(now.getTime() + this.settings.sessionTimeout * 60 * 1000)

    this.saveSessionInfo(sessionInfo)

    // デバイス情報も更新
    await this.updateDeviceLastSeen(sessionInfo.userId, sessionInfo.deviceId)

    return true
  }

  /**
   * セッションの検証
   */
  async validateSession(sessionId: string): Promise<boolean> {
    const sessionInfo = this.getSessionInfo(sessionId)
    if (!sessionInfo || !sessionInfo.isActive) {
      return false
    }

    const now = new Date()

    // 有効期限チェック
    if (now > sessionInfo.expiresAt) {
      await this.terminateSession(sessionId, 'timeout')
      return false
    }

    // 絶対的タイムアウトチェック
    const absoluteExpiry = new Date(
      sessionInfo.createdAt.getTime() + this.settings.absoluteTimeout * 60 * 1000,
    )

    if (now > absoluteExpiry) {
      await this.terminateSession(sessionId, 'absolute_timeout')
      return false
    }

    // 異常なアクセスパターンの検出
    if (await this.detectSuspiciousActivity(sessionInfo)) {
      await this.terminateSession(sessionId, 'suspicious_activity')
      return false
    }

    return true
  }

  /**
   * セッションの終了
   */
  async terminateSession(sessionId: string, reason: string): Promise<void> {
    const sessionInfo = this.getSessionInfo(sessionId)
    if (!sessionInfo) return

    sessionInfo.isActive = false
    this.saveSessionInfo(sessionInfo)

    // 監査ログに記録
    await this.auditLogger.log(
      AuditEventType.AUTH_SESSION_TERMINATED,
      `セッション終了: ${sessionInfo.userId}`,
      {
        userId: sessionInfo.userId,
        sessionId,
        reason,
        duration: Date.now() - sessionInfo.createdAt.getTime(),
        timestamp: new Date().toISOString(),
      },
    )
  }

  /**
   * ユーザーのすべてのセッションを終了
   */
  async terminateAllUserSessions(userId: string, excludeSessionId?: string): Promise<number> {
    const userSessions = this.getUserSessions(userId)
    let terminatedCount = 0

    for (const session of userSessions) {
      if (session.isActive && session.id !== excludeSessionId) {
        await this.terminateSession(session.id, 'admin_logout')
        terminatedCount++
      }
    }

    if (terminatedCount > 0) {
      await this.auditLogger.log(AuditEventType.AUTH_MASS_LOGOUT, `全セッション終了: ${userId}`, {
        userId,
        terminatedCount,
        excludedSession: excludeSessionId,
        timestamp: new Date().toISOString(),
      })
    }

    return terminatedCount
  }

  /**
   * アクティブセッション一覧の取得
   */
  getActiveUserSessions(userId: string): SessionInfo[] {
    return this.getUserSessions(userId).filter((session) => session.isActive)
  }

  /**
   * デバイス一覧の取得
   */
  getUserDevices(userId: string): DeviceInfo[] {
    try {
      const stored = localStorage.getItem(`devices_${userId}`)
      if (!stored) return []

      const devices = JSON.parse(stored)
      return devices.map(
        (device: Partial<DeviceInfo> & { firstSeen: string; lastSeen: string }) => ({
          ...device,
          firstSeen: new Date(device.firstSeen),
          lastSeen: new Date(device.lastSeen),
        }),
      )
    } catch (error) {
      logger.error('デバイス情報の取得に失敗:', error)
      return []
    }
  }

  /**
   * デバイスの信頼設定
   */
  async setDeviceTrust(userId: string, deviceId: string, trusted: boolean): Promise<void> {
    // デバイス信頼情報を保存
    const trustKey = `device_trust_${userId}_${deviceId}`
    localStorage.setItem(trustKey, JSON.stringify({ trusted, updatedAt: new Date() }))

    // 監査ログに記録
    await this.auditLogger.log(
      AuditEventType.SECURITY_DEVICE_TRUST_CHANGED,
      `デバイス信頼度変更: ${userId}`,
      {
        userId,
        deviceId,
        trusted,
        timestamp: new Date().toISOString(),
      },
    )
  }

  /**
   * 未認証デバイスの検出
   */
  async detectNewDevice(userId: string, deviceId: string): Promise<boolean> {
    const devices = this.getUserDevices(userId)
    const existingDevice = devices.find((device) => device.id === deviceId)

    if (!existingDevice && this.settings.notifyNewDevice) {
      // 新しいデバイスを検出
      await this.createSecurityAlert(userId, {
        type: 'new_device',
        message: '新しいデバイスからのアクセスが検出されました',
        severity: 'medium',
      })

      return true
    }

    return false
  }

  /**
   * セキュリティアラートの作成
   */
  async createSecurityAlert(
    userId: string,
    alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'resolved'>,
  ): Promise<void> {
    const securityAlert: SecurityAlert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      resolved: false,
      ...alert,
    }

    // アラートを保存
    this.saveSecurityAlert(userId, securityAlert)

    // 重要度が高い場合は監査ログにも記録
    if (alert.severity === 'high' || alert.severity === 'critical') {
      await this.auditLogger.log(
        AuditEventType.SECURITY_ALERT,
        `セキュリティアラート: ${alert.message}`,
        {
          userId,
          alertId: securityAlert.id,
          type: alert.type,
          severity: alert.severity,
          timestamp: securityAlert.timestamp.toISOString(),
        },
      )
    }
  }

  /**
   * セキュリティ統計の取得
   */
  getSecurityStats(userId: string): {
    activeSessions: number
    totalDevices: number
    pendingAlerts: number
    lastActivity: Date | null
  } {
    const activeSessions = this.getActiveUserSessions(userId).length
    const devices = this.getUserDevices(userId)
    const alerts = this.getSecurityAlerts(userId).filter((alert) => !alert.resolved)

    const lastActivity =
      devices.length > 0
        ? devices.reduce(
            (latest, device) => (device.lastSeen > latest ? device.lastSeen : latest),
            devices[0].lastSeen,
          )
        : null

    return {
      activeSessions,
      totalDevices: devices.length,
      pendingAlerts: alerts.length,
      lastActivity,
    }
  }

  // プライベートメソッド

  private generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
    const data = `${userAgent}:${ipAddress}:${navigator.language}:${screen.width}x${screen.height}`
    return this.simpleHash(data)
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // 32bit整数に変換
    }
    return Math.abs(hash).toString(16)
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private sanitizeUserAgent(userAgent: string): string {
    // ユーザーエージェントから個人識別可能な情報を削除
    return userAgent.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]').substring(0, 200) // 長さ制限
  }

  private async updateDeviceInfo(
    userId: string,
    deviceId: string,
    userAgent: string,
    ipAddress: string,
  ): Promise<void> {
    const devices = this.getUserDevices(userId)
    const existingIndex = devices.findIndex((device) => device.id === deviceId)

    const now = new Date()
    const deviceName = this.extractDeviceName(userAgent)

    if (existingIndex >= 0) {
      // 既存デバイスの更新
      devices[existingIndex].lastSeen = now
      devices[existingIndex].userAgent = userAgent
      devices[existingIndex].ipAddress = ipAddress
    } else {
      // 新しいデバイスの追加
      const newDevice: DeviceInfo = {
        id: deviceId,
        name: deviceName,
        userAgent,
        ipAddress,
        firstSeen: now,
        lastSeen: now,
        isCurrentDevice: true,
      }

      devices.push(newDevice)

      // 新しいデバイスを検出
      await this.detectNewDevice(userId, deviceId)
    }

    // すべてのデバイスをcurrentではないに設定してから、現在のデバイスのみtrueに
    devices.forEach((device) => {
      device.isCurrentDevice = device.id === deviceId
    })

    // デバイス情報を保存
    localStorage.setItem(`devices_${userId}`, JSON.stringify(devices))
  }

  private async updateDeviceLastSeen(userId: string, deviceId: string): Promise<void> {
    const devices = this.getUserDevices(userId)
    const device = devices.find((d) => d.id === deviceId)

    if (device) {
      device.lastSeen = new Date()
      localStorage.setItem(`devices_${userId}`, JSON.stringify(devices))
    }
  }

  private extractDeviceName(userAgent: string): string {
    // 簡易的なデバイス名抽出
    if (userAgent.includes('Mobile')) return 'Mobile Device'
    if (userAgent.includes('Tablet')) return 'Tablet'
    if (userAgent.includes('Windows')) return 'Windows PC'
    if (userAgent.includes('Mac')) return 'Mac'
    if (userAgent.includes('Linux')) return 'Linux PC'
    return 'Unknown Device'
  }

  private async enforceSessionLimits(userId: string, newSessionId: string): Promise<void> {
    const activeSessions = this.getActiveUserSessions(userId)

    if (activeSessions.length >= this.settings.maxConcurrentSessions) {
      // 最も古いセッションを終了
      const oldestSession = activeSessions
        .filter((session) => session.id !== newSessionId)
        .sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime())[0]

      if (oldestSession) {
        await this.terminateSession(oldestSession.id, 'session_limit_exceeded')

        await this.createSecurityAlert(userId, {
          type: 'concurrent_sessions',
          message: 'セッション上限により古いセッションが終了されました',
          severity: 'low',
        })
      }
    }
  }

  private async detectSuspiciousActivity(sessionInfo: SessionInfo): Promise<boolean> {
    // IP アドレスの変更チェック（簡易版）
    const previousSessions = this.getUserSessions(sessionInfo.userId)
      .filter(
        (session) => session.id !== sessionInfo.id && session.deviceId === sessionInfo.deviceId,
      )
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())

    if (previousSessions.length > 0) {
      const lastSession = previousSessions[0]
      if (lastSession.ipAddress !== sessionInfo.ipAddress) {
        // IP アドレスが変更された
        await this.createSecurityAlert(sessionInfo.userId, {
          type: 'suspicious_location',
          message: '異なる場所からのアクセスが検出されました',
          severity: 'medium',
        })

        return false // すぐには無効にしない、アラートのみ
      }
    }

    return false
  }

  private saveSessionInfo(sessionInfo: SessionInfo): void {
    try {
      localStorage.setItem(`session_${sessionInfo.id}`, JSON.stringify(sessionInfo))

      // ユーザー別セッションインデックスも更新
      const userSessionsKey = `user_sessions_${sessionInfo.userId}`
      const userSessions = this.getUserSessions(sessionInfo.userId)
      const existingIndex = userSessions.findIndex((session) => session.id === sessionInfo.id)

      if (existingIndex >= 0) {
        userSessions[existingIndex] = sessionInfo
      } else {
        userSessions.push(sessionInfo)
      }

      localStorage.setItem(userSessionsKey, JSON.stringify(userSessions))
    } catch (error) {
      logger.error('セッション情報の保存に失敗:', error)
    }
  }

  private getSessionInfo(sessionId: string): SessionInfo | null {
    try {
      const stored = localStorage.getItem(`session_${sessionId}`)
      if (!stored) return null

      const session = JSON.parse(stored)
      return {
        ...session,
        createdAt: new Date(session.createdAt),
        lastActivity: new Date(session.lastActivity),
        expiresAt: new Date(session.expiresAt),
      }
    } catch (error) {
      logger.error('セッション情報の取得に失敗:', error)
      return null
    }
  }

  private getUserSessions(userId: string): SessionInfo[] {
    try {
      const stored = localStorage.getItem(`user_sessions_${userId}`)
      if (!stored) return []

      const sessions = JSON.parse(stored)
      return sessions.map(
        (
          session: Partial<SessionInfo> & {
            createdAt: string
            lastActivity: string
            expiresAt: string
          },
        ) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          lastActivity: new Date(session.lastActivity),
          expiresAt: new Date(session.expiresAt),
        }),
      )
    } catch (error) {
      logger.error('ユーザーセッション一覧の取得に失敗:', error)
      return []
    }
  }

  private saveSecurityAlert(userId: string, alert: SecurityAlert): void {
    try {
      const alerts = this.getSecurityAlerts(userId)
      alerts.push(alert)
      localStorage.setItem(`security_alerts_${userId}`, JSON.stringify(alerts))
    } catch (error) {
      logger.error('セキュリティアラートの保存に失敗:', error)
    }
  }

  private getSecurityAlerts(userId: string): SecurityAlert[] {
    try {
      const stored = localStorage.getItem(`security_alerts_${userId}`)
      if (!stored) return []

      const alerts = JSON.parse(stored)
      return alerts.map((alert: Partial<SecurityAlert> & { timestamp: string }) => ({
        ...alert,
        timestamp: new Date(alert.timestamp),
      }))
    } catch (error) {
      logger.error('セキュリティアラートの取得に失敗:', error)
      return []
    }
  }
}

// エクスポート用インスタンス
export const enhancedSessionManager = new EnhancedSessionManager()
