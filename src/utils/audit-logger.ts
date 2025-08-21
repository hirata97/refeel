/**
 * 監査ログ機能の実装
 * Issue #70: 認証・認可システムの強化実装
 */

export enum AuditEventType {
  // 認証関連
  AUTH_LOGIN = 'auth_login',
  AUTH_LOGOUT = 'auth_logout',
  AUTH_FAILED_LOGIN = 'auth_failed_login',
  AUTH_SESSION_CREATED = 'auth_session_created',
  AUTH_SESSION_TERMINATED = 'auth_session_terminated',
  AUTH_MASS_LOGOUT = 'auth_mass_logout',
  AUTH_FAILED_2FA = 'auth_failed_2fa',

  // セキュリティ関連
  SECURITY_LOCKOUT = 'security_lockout',
  SECURITY_UNLOCK = 'security_unlock',
  SECURITY_2FA_SETUP = 'security_2fa_setup',
  SECURITY_2FA_ENABLED = 'security_2fa_enabled',
  SECURITY_2FA_DISABLED = 'security_2fa_disabled',
  SECURITY_BACKUP_CODE_USED = 'security_backup_code_used',
  SECURITY_BACKUP_CODES_REGENERATED = 'security_backup_codes_regenerated',
  SECURITY_DEVICE_TRUST_CHANGED = 'security_device_trust_changed',
  SECURITY_VIOLATION = 'security_violation',
  SECURITY_ALERT = 'security_alert',

  // パスワード関連
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
  PASSWORD_POLICY_VIOLATION = 'password_policy_violation',

  // システム関連
  SYSTEM_ERROR = 'system_error',
  SYSTEM_WARNING = 'system_warning',
  SYSTEM_INFO = 'system_info'
}

export enum AuditEventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AuditLogEntry {
  id: string
  timestamp: Date
  eventType: AuditEventType
  severity: AuditEventSeverity
  message: string
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
  source: string
}

export interface AuditLogFilter {
  eventTypes?: AuditEventType[]
  severities?: AuditEventSeverity[]
  userId?: string
  dateFrom?: Date
  dateTo?: Date
  limit?: number
}

/**
 * 監査ログ管理クラス
 */
export class AuditLogger {
  private static instance: AuditLogger
  private readonly maxLogEntries = 10000 // 最大保存ログ数
  private readonly storageKey = 'audit_logs'

  private constructor() {}

  /**
   * シングルトンインスタンスを取得
   */
  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  /**
   * 監査ログの記録
   */
  async log(
    eventType: AuditEventType,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const entry: AuditLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      eventType,
      severity: this.determineSeverity(eventType),
      message,
      metadata,
      source: 'web_app',
      // 実際の実装ではセッション情報から取得
      userId: metadata?.userId as string | undefined,
      sessionId: metadata?.sessionId as string | undefined,
      ipAddress: metadata?.ipAddress as string | undefined,
      userAgent: metadata?.userAgent as string | undefined
    }

    // ログエントリを保存
    this.saveLogEntry(entry)

    // 重要度が高い場合はコンソールにも出力
    if (entry.severity === AuditEventSeverity.HIGH || entry.severity === AuditEventSeverity.CRITICAL) {
      console.warn(`[AUDIT] ${entry.severity.toUpperCase()}: ${message}`, metadata)
    } else {
      console.log(`[AUDIT] ${eventType}: ${message}`)
    }

    // 実際の実装では、重要なイベントをサーバーに送信
    if (entry.severity === AuditEventSeverity.CRITICAL) {
      await this.sendToServer(entry)
    }
  }

  /**
   * 監査ログの検索
   */
  searchLogs(filter: AuditLogFilter = {}): AuditLogEntry[] {
    const logs = this.getAllLogs()
    
    return logs
      .filter(log => {
        // イベントタイプフィルター
        if (filter.eventTypes && !filter.eventTypes.includes(log.eventType)) {
          return false
        }

        // 重要度フィルター
        if (filter.severities && !filter.severities.includes(log.severity)) {
          return false
        }

        // ユーザーIDフィルター
        if (filter.userId && log.userId !== filter.userId) {
          return false
        }

        // 日付範囲フィルター
        if (filter.dateFrom && log.timestamp < filter.dateFrom) {
          return false
        }
        if (filter.dateTo && log.timestamp > filter.dateTo) {
          return false
        }

        return true
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) // 新しい順
      .slice(0, filter.limit || 1000)
  }

  /**
   * 指定ユーザーの監査ログを取得
   */
  getUserLogs(userId: string, limit: number = 100): AuditLogEntry[] {
    return this.searchLogs({
      userId,
      limit
    })
  }

  /**
   * 重要なセキュリティイベントのログを取得
   */
  getSecurityLogs(limit: number = 500): AuditLogEntry[] {
    const securityEventTypes = [
      AuditEventType.AUTH_FAILED_LOGIN,
      AuditEventType.AUTH_FAILED_2FA,
      AuditEventType.SECURITY_LOCKOUT,
      AuditEventType.SECURITY_VIOLATION,
      AuditEventType.SECURITY_ALERT
    ]

    return this.searchLogs({
      eventTypes: securityEventTypes,
      limit
    })
  }

  /**
   * ログ統計の取得
   */
  getLogStatistics(hours: number = 24): {
    totalEvents: number
    criticalEvents: number
    securityEvents: number
    failedLogins: number
    eventTypeBreakdown: Record<string, number>
  } {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000)
    const recentLogs = this.getAllLogs().filter(log => log.timestamp > cutoffTime)

    const stats = {
      totalEvents: recentLogs.length,
      criticalEvents: 0,
      securityEvents: 0,
      failedLogins: 0,
      eventTypeBreakdown: {} as Record<string, number>
    }

    recentLogs.forEach(log => {
      // 重要度別カウント
      if (log.severity === AuditEventSeverity.CRITICAL) {
        stats.criticalEvents++
      }

      // セキュリティイベントカウント
      if (log.eventType.startsWith('security_')) {
        stats.securityEvents++
      }

      // ログイン失敗カウント
      if (log.eventType === AuditEventType.AUTH_FAILED_LOGIN) {
        stats.failedLogins++
      }

      // イベントタイプ別カウント
      stats.eventTypeBreakdown[log.eventType] = (stats.eventTypeBreakdown[log.eventType] || 0) + 1
    })

    return stats
  }

  /**
   * ログのエクスポート（CSV形式）
   */
  exportLogs(filter: AuditLogFilter = {}): string {
    const logs = this.searchLogs(filter)
    const headers = [
      'Timestamp', 'Event Type', 'Severity', 'Message', 
      'User ID', 'IP Address', 'Source', 'Metadata'
    ].join(',')

    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      log.eventType,
      log.severity,
      `"${log.message.replace(/"/g, '""')}"`, // CSV形式でエスケープ
      log.userId || '',
      log.ipAddress || '',
      log.source,
      `"${JSON.stringify(log.metadata || {})}"`
    ].join(','))

    return [headers, ...rows].join('\n')
  }

  /**
   * ログのクリア（管理者機能）
   */
  clearLogs(olderThan?: Date): void {
    if (olderThan) {
      // 指定日時より古いログを削除
      const logs = this.getAllLogs().filter(log => log.timestamp >= olderThan)
      this.saveLogs(logs)
    } else {
      // 全ログをクリア
      localStorage.removeItem(this.storageKey)
    }

    // クリア操作自体をログに記録
    this.log(
      AuditEventType.SYSTEM_INFO,
      `監査ログクリア実行${olderThan ? ` (${olderThan.toISOString()}より古いログ)` : ' (全ログ)'}`,
      { clearTimestamp: new Date().toISOString() }
    )
  }

  // プライベートメソッド

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private determineSeverity(eventType: AuditEventType): AuditEventSeverity {
    const criticalEvents = [
      AuditEventType.SECURITY_VIOLATION,
      AuditEventType.SYSTEM_ERROR
    ]

    const highEvents = [
      AuditEventType.AUTH_FAILED_2FA,
      AuditEventType.SECURITY_LOCKOUT,
      AuditEventType.SECURITY_ALERT,
      AuditEventType.PASSWORD_POLICY_VIOLATION
    ]

    const mediumEvents = [
      AuditEventType.AUTH_FAILED_LOGIN,
      AuditEventType.SECURITY_2FA_DISABLED,
      AuditEventType.SECURITY_BACKUP_CODE_USED,
      AuditEventType.AUTH_MASS_LOGOUT
    ]

    if (criticalEvents.includes(eventType)) {
      return AuditEventSeverity.CRITICAL
    } else if (highEvents.includes(eventType)) {
      return AuditEventSeverity.HIGH
    } else if (mediumEvents.includes(eventType)) {
      return AuditEventSeverity.MEDIUM
    } else {
      return AuditEventSeverity.LOW
    }
  }

  private saveLogEntry(entry: AuditLogEntry): void {
    try {
      const logs = this.getAllLogs()
      logs.push(entry)

      // ログ数制限
      if (logs.length > this.maxLogEntries) {
        logs.splice(0, logs.length - this.maxLogEntries)
      }

      this.saveLogs(logs)
    } catch (error) {
      console.error('監査ログの保存に失敗:', error)
    }
  }

  private getAllLogs(): AuditLogEntry[] {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return []

      const logs = JSON.parse(stored)
      return logs.map((log: Partial<AuditLogEntry> & { timestamp: string }) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }))
    } catch (error) {
      console.error('監査ログの取得に失敗:', error)
      return []
    }
  }

  private saveLogs(logs: AuditLogEntry[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(logs))
    } catch (error) {
      console.error('監査ログの保存に失敗:', error)
    }
  }

  private async sendToServer(entry: AuditLogEntry): Promise<void> {
    // 実際の実装では、重要なログをサーバーに送信
    try {
      // fetch('/api/audit-logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // })
      
      console.log('重要なログをサーバーに送信（実装待ち）:', entry)
    } catch (error) {
      console.error('サーバーへのログ送信に失敗:', error)
    }
  }
}

// エクスポート用インスタンス
export const auditLogger = AuditLogger.getInstance()