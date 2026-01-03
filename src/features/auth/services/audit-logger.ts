import { AuditEventType } from './types'
import { SecurityReporting } from '../security'

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
