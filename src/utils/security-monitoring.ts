import { SecurityIncidentReporter } from '@/utils/security'
import type {
  SecurityMonitoringConfig,
  SecurityEvent,
  MonitoringMetrics,
  AlertRule,
  SecurityAlert,
  ThreatLevel,
} from '@/types/security-monitoring'

/**
 * セキュリティ監視システム
 * 不正アクセスや異常な動作パターンを検知
 */
export class SecurityMonitor {
  private static instance: SecurityMonitor
  private config: SecurityMonitoringConfig
  private events: SecurityEvent[] = []
  private metrics: MonitoringMetrics
  private alertRules: AlertRule[] = []
  private isMonitoring = false

  private constructor() {
    this.config = this.getDefaultConfig()
    this.metrics = this.initializeMetrics()
    this.setupDefaultAlertRules()
  }

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor()
    }
    return SecurityMonitor.instance
  }

  /**
   * 監視開始
   */
  startMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.setupEventListeners()
    this.startMetricsCollection()

    console.log('🔍 Security monitoring started')
  }

  /**
   * 監視停止
   */
  stopMonitoring(): void {
    this.isMonitoring = false
    console.log('🔍 Security monitoring stopped')
  }

  /**
   * セキュリティイベントの記録
   */
  recordEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...event,
    }

    this.events.push(fullEvent)
    this.updateMetrics(fullEvent)
    this.checkAlertRules(fullEvent)

    // 古いイベントをクリーンアップ（最新1000件を保持）
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000)
    }
  }

  /**
   * 不正アクセス試行の検知
   */
  detectSuspiciousActivity(userId: string, action: string, details: Record<string, unknown>): void {
    const recentEvents = this.getRecentEventsByUser(userId, 5 * 60 * 1000) // 5分間
    const failedAttempts = recentEvents.filter(
      (e) => e.type === 'auth_failure' || e.type === 'access_denied',
    ).length

    if (failedAttempts >= this.config.thresholds.maxFailedAttempts) {
      this.recordEvent({
        type: 'suspicious_activity',
        severity: 'high',
        userId,
        action,
        details: {
          ...details,
          failedAttempts,
          pattern: 'repeated_failures',
        },
      })

      // インシデントレポートに記録
      SecurityIncidentReporter.reportIncident({
        type: 'suspicious_activity',
        severity: 'high',
        details: {
          userId,
          action,
          failedAttempts,
          recentEvents: recentEvents.length,
        },
      })
    }
  }

  /**
   * API呼び出し頻度の監視
   */
  monitorAPIUsage(
    endpoint: string,
    userId: string,
    responseTime: number,
    statusCode: number,
  ): void {
    this.recordEvent({
      type: 'api_call',
      severity: 'low',
      userId,
      action: `API: ${endpoint}`,
      details: {
        endpoint,
        responseTime,
        statusCode,
        userAgent: navigator.userAgent,
      },
    })

    // 異常な頻度チェック
    const recentCalls = this.getRecentEventsByUser(userId, 60 * 1000) // 1分間
      .filter((e) => e.type === 'api_call' && e.details?.endpoint === endpoint)

    if (recentCalls.length > this.config.thresholds.maxAPICallsPerMinute) {
      this.recordEvent({
        type: 'rate_limit_exceeded',
        severity: 'medium',
        userId,
        action: `Rate limit exceeded for ${endpoint}`,
        details: {
          endpoint,
          callCount: recentCalls.length,
          timeWindow: '1 minute',
        },
      })
    }

    // 異常に遅いレスポンスタイム
    if (responseTime > this.config.thresholds.maxResponseTime) {
      this.recordEvent({
        type: 'performance_issue',
        severity: 'medium',
        userId,
        action: `Slow response: ${endpoint}`,
        details: {
          endpoint,
          responseTime,
          threshold: this.config.thresholds.maxResponseTime,
        },
      })
    }
  }

  /**
   * セキュリティ脅威レベルの評価
   */
  assessThreatLevel(): ThreatLevel {
    const recentEvents = this.getRecentEvents(60 * 60 * 1000) // 1時間
    const criticalEvents = recentEvents.filter((e) => e.severity === 'critical').length
    const highEvents = recentEvents.filter((e) => e.severity === 'high').length
    const mediumEvents = recentEvents.filter((e) => e.severity === 'medium').length

    if (criticalEvents > 0) return 'critical'
    if (highEvents >= 3) return 'high'
    if (mediumEvents >= 10) return 'medium'
    return 'low'
  }

  /**
   * 監視メトリクスの取得
   */
  getMetrics(): MonitoringMetrics {
    return { ...this.metrics }
  }

  /**
   * イベント履歴の取得
   */
  getEvents(limit = 100): SecurityEvent[] {
    return this.events.slice(-limit)
  }

  /**
   * アラートルールの追加
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule)
  }

  /**
   * デフォルト設定の取得
   */
  private getDefaultConfig(): SecurityMonitoringConfig {
    return {
      enabled: true,
      monitoringInterval: 30000, // 30秒
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7日間
      thresholds: {
        maxFailedAttempts: 5,
        maxAPICallsPerMinute: 100,
        maxResponseTime: 5000,
        suspiciousPatternThreshold: 3,
      },
      alerting: {
        enabled: true,
        channels: ['console', 'storage'],
        severityLevels: ['high', 'critical'],
      },
    }
  }

  /**
   * メトリクス初期化
   */
  private initializeMetrics(): MonitoringMetrics {
    return {
      totalEvents: 0,
      eventsByType: new Map(),
      eventsBySeverity: new Map(),
      activeUsers: new Set(),
      avgResponseTime: 0,
      currentThreatLevel: 'low',
      lastUpdated: new Date().toISOString(),
    }
  }

  /**
   * デフォルトアラートルールの設定
   */
  private setupDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'multiple-auth-failures',
        name: '複数認証失敗',
        condition: (event) =>
          event.type === 'auth_failure' &&
          this.getRecentEventsByUser(event.userId || '', 5 * 60 * 1000).filter(
            (e) => e.type === 'auth_failure',
          ).length >= 3,
        severity: 'high',
        action: 'alert',
      },
      {
        id: 'suspicious-activity',
        name: '不審なアクティビティ',
        condition: (event) => event.type === 'suspicious_activity',
        severity: 'critical',
        action: 'alert',
      },
      {
        id: 'rate-limit-exceeded',
        name: 'レート制限超過',
        condition: (event) => event.type === 'rate_limit_exceeded',
        severity: 'medium',
        action: 'alert',
      },
    ]
  }

  /**
   * イベントリスナーの設定
   */
  private setupEventListeners(): void {
    // グローバルエラーの監視
    window.addEventListener('error', (event) => {
      if (event.error?.name === 'SecurityError') {
        this.recordEvent({
          type: 'security_error',
          severity: 'high',
          action: 'JavaScript Security Error',
          details: {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        })
      }
    })

    // ネットワークエラーの監視
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.name === 'NetworkError') {
        this.recordEvent({
          type: 'network_error',
          severity: 'medium',
          action: 'Network Error',
          details: {
            reason: event.reason.message,
          },
        })
      }
    })
  }

  /**
   * メトリクス収集の開始
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateAggregateMetrics()
    }, this.config.monitoringInterval)
  }

  /**
   * メトリクスの更新
   */
  private updateMetrics(event: SecurityEvent): void {
    this.metrics.totalEvents++

    // イベントタイプ別カウント
    const typeCount = this.metrics.eventsByType.get(event.type) || 0
    this.metrics.eventsByType.set(event.type, typeCount + 1)

    // 重要度別カウント
    const severityCount = this.metrics.eventsBySeverity.get(event.severity) || 0
    this.metrics.eventsBySeverity.set(event.severity, severityCount + 1)

    // アクティブユーザー
    if (event.userId) {
      this.metrics.activeUsers.add(event.userId)
    }

    this.metrics.lastUpdated = new Date().toISOString()
    this.metrics.currentThreatLevel = this.assessThreatLevel()
  }

  /**
   * 集計メトリクスの更新
   */
  private updateAggregateMetrics(): void {
    const recentEvents = this.getRecentEvents(60 * 60 * 1000) // 1時間
    const apiEvents = recentEvents.filter((e) => e.type === 'api_call')

    if (apiEvents.length > 0) {
      const totalResponseTime = apiEvents.reduce(
        (sum, event) => sum + ((event.details?.responseTime as number) || 0),
        0,
      )
      this.metrics.avgResponseTime = totalResponseTime / apiEvents.length
    }
  }

  /**
   * 最近のイベント取得
   */
  private getRecentEvents(timeWindow: number): SecurityEvent[] {
    const cutoff = Date.now() - timeWindow
    return this.events.filter((event) => new Date(event.timestamp).getTime() > cutoff)
  }

  /**
   * ユーザー別最近のイベント取得
   */
  private getRecentEventsByUser(userId: string, timeWindow: number): SecurityEvent[] {
    return this.getRecentEvents(timeWindow).filter((event) => event.userId === userId)
  }

  /**
   * アラートルールのチェック
   */
  private checkAlertRules(event: SecurityEvent): void {
    for (const rule of this.alertRules) {
      if (rule.condition(event)) {
        SecurityAlertManager.getInstance().triggerAlert({
          id: crypto.randomUUID(),
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          event,
          triggeredAt: new Date().toISOString(),
          acknowledged: false,
        })
      }
    }
  }
}

/**
 * セキュリティアラート管理システム
 */
export class SecurityAlertManager {
  private static instance: SecurityAlertManager
  private alerts: SecurityAlert[] = []
  private alertHandlers: Map<string, (alert: SecurityAlert) => void> = new Map()

  private constructor() {}

  static getInstance(): SecurityAlertManager {
    if (!SecurityAlertManager.instance) {
      SecurityAlertManager.instance = new SecurityAlertManager()
    }
    return SecurityAlertManager.instance
  }

  /**
   * アラートのトリガー
   */
  triggerAlert(alert: SecurityAlert): void {
    this.alerts.push(alert)

    // アラートハンドラーの実行
    for (const [, handler] of this.alertHandlers) {
      try {
        handler(alert)
      } catch (error) {
        console.error('Alert handler error:', error)
      }
    }

    // コンソールログ出力
    const emoji = this.getSeverityEmoji(alert.severity)
    console.warn(`${emoji} Security Alert: ${alert.ruleName}`, alert)

    // ローカルストレージに保存
    this.persistAlert(alert)
  }

  /**
   * アラートハンドラーの登録
   */
  addAlertHandler(name: string, handler: (alert: SecurityAlert) => void): void {
    this.alertHandlers.set(name, handler)
  }

  /**
   * アラートハンドラーの削除
   */
  removeAlertHandler(name: string): void {
    this.alertHandlers.delete(name)
  }

  /**
   * アラートの承認
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      alert.acknowledgedAt = new Date().toISOString()
    }
  }

  /**
   * アラート一覧取得
   */
  getAlerts(limit = 100): SecurityAlert[] {
    return this.alerts.slice(-limit)
  }

  /**
   * 未承認アラート取得
   */
  getUnacknowledgedAlerts(): SecurityAlert[] {
    return this.alerts.filter((alert) => !alert.acknowledged)
  }

  /**
   * アラートのクリア
   */
  clearAlerts(): void {
    this.alerts = []
    localStorage.removeItem('security_alerts')
  }

  /**
   * 重要度絵文字取得
   */
  private getSeverityEmoji(severity: string): string {
    const emojis: Record<string, string> = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴',
    }
    return emojis[severity] || '⚪'
  }

  /**
   * アラートの永続化
   */
  private persistAlert(alert: SecurityAlert): void {
    try {
      const existingAlerts = JSON.parse(localStorage.getItem('security_alerts') || '[]')
      existingAlerts.push(alert)

      // 最新100件のみ保持
      const limitedAlerts = existingAlerts.slice(-100)
      localStorage.setItem('security_alerts', JSON.stringify(limitedAlerts))
    } catch (error) {
      console.error('Failed to persist security alert:', error)
    }
  }
}

/**
 * セキュリティメトリクス収集システム
 */
export class SecurityMetricsCollector {
  private static instance: SecurityMetricsCollector
  private performanceData: Record<string, number[]> = {}

  private constructor() {}

  static getInstance(): SecurityMetricsCollector {
    if (!SecurityMetricsCollector.instance) {
      SecurityMetricsCollector.instance = new SecurityMetricsCollector()
    }
    return SecurityMetricsCollector.instance
  }

  /**
   * パフォーマンスメトリクスの記録
   */
  recordPerformance(metric: string, value: number): void {
    if (!this.performanceData[metric]) {
      this.performanceData[metric] = []
    }

    this.performanceData[metric].push(value)

    // 最新1000件を保持
    if (this.performanceData[metric].length > 1000) {
      this.performanceData[metric] = this.performanceData[metric].slice(-1000)
    }
  }

  /**
   * メトリクスの統計取得
   */
  getMetricStats(metric: string): {
    avg: number
    min: number
    max: number
    count: number
  } | null {
    const data = this.performanceData[metric]
    if (!data || data.length === 0) return null

    return {
      avg: data.reduce((sum, val) => sum + val, 0) / data.length,
      min: Math.min(...data),
      max: Math.max(...data),
      count: data.length,
    }
  }

  /**
   * 全メトリクスの取得
   */
  getAllMetrics(): Record<string, number[]> {
    return { ...this.performanceData }
  }
}

/**
 * セキュリティ監視システムの初期化
 */
export function initializeSecurityMonitoring(): void {
  const monitor = SecurityMonitor.getInstance()
  const alertManager = SecurityAlertManager.getInstance()

  // デフォルトアラートハンドラーの設定
  alertManager.addAlertHandler('console', (alert) => {
    const emoji = alert.severity === 'critical' ? '🚨' : '⚠️'
    console.warn(`${emoji} Security Alert: ${alert.ruleName}`, alert.event)
  })

  // 監視開始
  monitor.startMonitoring()

  console.log('🔒 Security monitoring system initialized')
}
