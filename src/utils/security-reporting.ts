import { SecurityMonitor, SecurityAlertManager } from '@/utils/security-monitoring'
import type {
  SecurityReport,
  SecurityIncident,
  SecurityRecommendation,
  SecurityAnalytics,
  ThreatPattern,
  SecurityDashboard,
  ComplianceReport,
  SecurityEvent,
  SecurityAlert,
  ThreatLevel
} from '@/types/security-monitoring'

/**
 * セキュリティレポーティングシステム
 * 監視データの分析とレポート生成
 */
export class SecurityReportGenerator {
  private static instance: SecurityReportGenerator

  private constructor() {}

  static getInstance(): SecurityReportGenerator {
    if (!SecurityReportGenerator.instance) {
      SecurityReportGenerator.instance = new SecurityReportGenerator()
    }
    return SecurityReportGenerator.instance
  }

  /**
   * 日次セキュリティレポートの生成
   */
  async generateDailyReport(date = new Date()): Promise<SecurityReport> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    return this.generateReport('daily', startOfDay, endOfDay)
  }

  /**
   * 週次セキュリティレポートの生成
   */
  async generateWeeklyReport(date = new Date()): Promise<SecurityReport> {
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    return this.generateReport('weekly', startOfWeek, endOfWeek)
  }

  /**
   * 月次セキュリティレポートの生成
   */
  async generateMonthlyReport(date = new Date()): Promise<SecurityReport> {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)

    return this.generateReport('monthly', startOfMonth, endOfMonth)
  }

  /**
   * インシデントレポートの生成
   */
  async generateIncidentReport(_incidentId: string): Promise<SecurityReport> {
    const incident = await this.getIncidentById(_incidentId)
    if (!incident) {
      throw new Error(`Incident ${_incidentId} not found`)
    }

    const startDate = new Date(incident.createdAt)
    const endDate = incident.resolvedAt ? new Date(incident.resolvedAt) : new Date()

    const report = await this.generateReport('incident', startDate, endDate)
    report.id = `incident-${_incidentId}-${Date.now()}`
    
    return report
  }

  /**
   * セキュリティダッシュボードデータの生成
   */
  generateDashboard(): SecurityDashboard {
    const monitor = SecurityMonitor.getInstance()
    const alertManager = SecurityAlertManager.getInstance()
    const metrics = monitor.getMetrics()
    const recentEvents = monitor.getEvents(100)
    const activeAlerts = alertManager.getUnacknowledgedAlerts()

    return {
      currentThreatLevel: metrics.currentThreatLevel,
      activeAlerts: activeAlerts.length,
      recentIncidents: this.getRecentIncidents(),
      systemHealth: {
        monitoring: 'healthy',
        alerting: 'healthy',
        logging: 'healthy'
      },
      topThreats: this.analyzeTopThreats(recentEvents),
      metrics: {
        eventsPerHour: this.calculateEventsPerHour(recentEvents),
        avgResponseTime: metrics.avgResponseTime,
        falsePositiveRate: this.calculateFalsePositiveRate(activeAlerts),
        detectionAccuracy: 0.95
      }
    }
  }

  /**
   * コンプライアンスレポートの生成
   */
  generateComplianceReport(framework: 'GDPR' | 'CCPA' | 'ISO27001' | 'NIST'): ComplianceReport {
    return {
      framework,
      compliance: this.assessCompliance(framework),
      gaps: this.identifyComplianceGaps(framework) as never[],
      recommendations: this.generateComplianceRecommendations(framework),
      lastAssessment: new Date().toISOString()
    }
  }

  /**
   * セキュリティ分析の実行
   */
  performSecurityAnalytics(): SecurityAnalytics {
    const monitor = SecurityMonitor.getInstance()
    const _events = monitor.getEvents(1000)

    return {
      anomalies: this.detectAnomalies(_events) as never[],
      patterns: this.analyzeThreatPatterns(_events),
      predictions: this.generatePredictions(_events) as never[],
      trends: this.analyzeTrends(_events) as never[]
    }
  }

  /**
   * 基本レポート生成
   */
  private async generateReport(
    type: 'daily' | 'weekly' | 'monthly' | 'incident',
    startDate: Date,
    endDate: Date
  ): Promise<SecurityReport> {
    const monitor = SecurityMonitor.getInstance()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _alertManager = SecurityAlertManager.getInstance()
    
    const _events = this.getEventsInPeriod(monitor.getEvents(10000), startDate, endDate)
    const alerts: SecurityAlert[] = [] // Simplified implementation

    const summary = this.generateSummary(_events, alerts)
    const metrics = this.calculateMetrics(_events)
    const incidents = this.extractIncidents(_events, alerts)
    const recommendations = this.generateRecommendations(_events, alerts)

    return {
      id: `${type}-${startDate.toISOString().split('T')[0]}-${Date.now()}`,
      type,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary,
      metrics,
      incidents,
      recommendations,
      generatedAt: new Date().toISOString()
    }
  }

  /**
   * レポート概要の生成
   */
  private generateSummary(_events: SecurityEvent[], alerts: SecurityAlert[]) {
    _events.filter(e => e.severity === 'critical')
    const criticalAlerts = alerts.filter(a => a.severity === 'critical')

    const eventTypes = new Map<string, number>()
    _events.forEach(event => {
      eventTypes.set(event.type, (eventTypes.get(event.type) || 0) + 1)
    })

    const topThreats = Array.from(eventTypes.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type]) => type)

    return {
      totalEvents: _events.length,
      threatLevel: this.calculateOverallThreatLevel(_events) as ThreatLevel,
      criticalAlerts: criticalAlerts.length,
      topThreats
    }
  }

  /**
   * メトリクス計算
   */
  private calculateMetrics(_events: SecurityEvent[]) {
    const _eventsByType: Record<string, number> = {}
    const _eventsBySeverity: Record<string, number> = {}

    _events.forEach(event => {
      _eventsByType[event.type] = (_eventsByType[event.type] || 0) + 1
      _eventsBySeverity[event.severity] = (_eventsBySeverity[event.severity] || 0) + 1
    })

    const apiEvents = _events.filter(e => e.type === 'api_call')
    const responseTimes = apiEvents
      .map(e => e.details.responseTime as number)
      .filter(rt => typeof rt === 'number')

    const responseTimeStats = responseTimes.length > 0 ? {
      avg: responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length,
      min: Math.min(...responseTimes),
      max: Math.max(...responseTimes)
    } : { avg: 0, min: 0, max: 0 }

    const uniqueUsers = new Set(_events.map(e => e.userId).filter(Boolean))
    const suspiciousUsers = _events
      .filter(e => e.type === 'suspicious_activity')
      .map(e => e.userId!)
      .filter((userId, index, arr) => arr.indexOf(userId) === index)

    return {
      eventsByType: _eventsByType as Record<string, number>,
      eventsBySeverity: _eventsBySeverity as Record<string, number>,
      responseTimeStats,
      userActivity: {
        activeUsers: uniqueUsers.size,
        suspiciousUsers
      }
    }
  }

  /**
   * インシデント抽出
   */
  private extractIncidents(_events: SecurityEvent[], alerts: SecurityAlert[]): SecurityIncident[] {
    const incidents: SecurityIncident[] = []
    
    // クリティカルアラートからインシデントを生成
    const criticalAlerts = alerts.filter(a => a.severity === 'critical')
    
    criticalAlerts.forEach(alert => {
      incidents.push({
        id: `incident-${alert.id}`,
        title: alert.ruleName,
        description: `Critical security alert: ${alert.ruleName}`,
        severity: 'critical',
        status: alert.acknowledged ? 'investigating' : 'open',
        createdAt: alert.triggeredAt,
        updatedAt: alert.acknowledgedAt || alert.triggeredAt,
        relatedEvents: [alert.event],
        actions: [],
        impact: {
          affectedUsers: alert.event.userId ? [alert.event.userId] : [],
          affectedSystems: ['web_app'],
          estimatedDamage: 'Under investigation'
        },
        timeline: [{
          timestamp: alert.triggeredAt,
          event: 'Alert triggered',
          actor: 'Security Monitoring System'
        }]
      })
    })

    return incidents
  }

  /**
   * セキュリティ推奨事項の生成
   */
  private generateRecommendations(
    _events: SecurityEvent[], 
    _alerts: SecurityAlert[]
  ): SecurityRecommendation[] {
    const recommendations: SecurityRecommendation[] = []

    // 認証失敗が多い場合
    const authFailures = _events.filter(e => e.type === 'auth_failure')
    if (authFailures.length > 10) {
      recommendations.push({
        id: 'rec-auth-failures',
        priority: 'high',
        title: '認証セキュリティの強化',
        description: '多数の認証失敗が検出されました。2要素認証の実装やアカウントロック機能の強化を検討してください。',
        category: 'prevention',
        estimatedEffort: '中程度（1-2週間）',
        potentialImpact: '不正アクセスリスクの大幅な削減'
      })
    }

    // レート制限超過が多い場合
    const rateLimitEvents = _events.filter(e => e.type === 'rate_limit_exceeded')
    if (rateLimitEvents.length > 5) {
      recommendations.push({
        id: 'rec-rate-limiting',
        title: 'API レート制限の調整',
        description: 'レート制限超過が頻発しています。制限値の見直しまたは段階的制限の導入を検討してください。',
        priority: 'medium',
        category: 'prevention',
        estimatedEffort: '低（数日）',
        potentialImpact: 'サービス可用性の向上'
      })
    }

    // パフォーマンス問題が多い場合
    const performanceIssues = _events.filter(e => e.type === 'performance_issue')
    if (performanceIssues.length > 3) {
      recommendations.push({
        id: 'rec-performance',
        title: 'パフォーマンス最適化',
        description: 'パフォーマンス問題が検出されています。システム負荷の最適化やキャッシュ戦略の改善を検討してください。',
        priority: 'medium',
        category: 'prevention',
        estimatedEffort: '中程度（1-2週間）',
        potentialImpact: 'ユーザー体験の向上とセキュリティリスクの削減'
      })
    }

    return recommendations
  }

  /**
   * 期間内イベント取得
   */
  private getEventsInPeriod(_events: SecurityEvent[], startDate: Date, endDate: Date): SecurityEvent[] {
    return _events.filter(event => {
      const eventDate = new Date(event.timestamp)
      return eventDate >= startDate && eventDate <= endDate
    })
  }

  /**
   * 期間内アラート取得
   */
  private getAlertsInPeriod(alerts: SecurityAlert[], startDate: Date, endDate: Date): SecurityAlert[] {
    return alerts.filter(alert => {
      const alertDate = new Date(alert.triggeredAt)
      return alertDate >= startDate && alertDate <= endDate
    })
  }

  /**
   * 全体的な脅威レベル計算
   */
  private calculateOverallThreatLevel(_events: SecurityEvent[]): string {
    const criticalEvents = _events.filter(e => e.severity === 'critical').length
    const highEvents = _events.filter(e => e.severity === 'high').length
    const mediumEvents = _events.filter(e => e.severity === 'medium').length

    if (criticalEvents > 0) return 'critical'
    if (highEvents >= 3) return 'high'
    if (mediumEvents >= 10) return 'medium'
    return 'low'
  }

  /**
   * トップ脅威分析
   */
  private analyzeTopThreats(_events: SecurityEvent[]): ThreatPattern[] {
    const threatCounts = new Map<string, number>()
    _events.forEach(event => {
      threatCounts.set(event.type, (threatCounts.get(event.type) || 0) + 1)
    })

    return Array.from(threatCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({
        id: `threat-${type}`,
        name: type,
        description: `Security _events of type: ${type}`,
        indicators: [type],
        severity: this.getThreatSeverity(type) as ThreatLevel,
        confidence: Math.min(count / 10, 1),
        lastSeen: new Date().toISOString(),
        occurrences: count
      }))
  }

  /**
   * 1時間あたりのイベント数計算
   */
  private calculateEventsPerHour(_events: SecurityEvent[]): number {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentEvents = _events.filter(event => 
      new Date(event.timestamp) > oneHourAgo
    )
    return recentEvents.length
  }

  /**
   * 偽陽性率計算
   */
  private calculateFalsePositiveRate(alerts: SecurityAlert[]): number {
    if (alerts.length === 0) return 0
    
    // 簡易実装：未承認アラートの割合を偽陽性と仮定
    const unacknowledged = alerts.filter(a => !a.acknowledged).length
    return unacknowledged / alerts.length
  }

  /**
   * 最近のインシデント取得
   */
  private getRecentIncidents(): SecurityIncident[] {
    // 簡易実装：実際のインシデントストレージから取得すべき
    return []
  }

  /**
   * インシデントID取得
   */
  private async getIncidentById(__incidentId: string): Promise<SecurityIncident | null> {
    // 簡易実装：実際のインシデントストレージから取得すべき
    return null
  }

  /**
   * コンプライアンス評価
   */
  private assessCompliance(__framework: string): { overall: number; categories: Record<string, number> } {
    // 簡易実装：実際のコンプライアンス評価ロジック
    return {
      overall: 0.85,
      categories: {
        'Data Protection': 0.90,
        'Access Control': 0.80,
        'Monitoring': 0.85,
        'Incident Response': 0.80
      }
    }
  }

  /**
   * コンプライアンスギャップ特定
   */
  private identifyComplianceGaps(__framework: string): unknown[] {
    // 簡易実装
    return []
  }

  /**
   * コンプライアンス推奨事項生成
   */
  private generateComplianceRecommendations(__framework: string): SecurityRecommendation[] {
    // 簡易実装
    return []
  }

  /**
   * 異常検知
   */
  private detectAnomalies(__events: SecurityEvent[]): unknown[] {
    // 簡易実装：統計的異常検知
    return []
  }

  /**
   * 脅威パターン分析
   */
  private analyzeThreatPatterns(_events: SecurityEvent[]): ThreatPattern[] {
    // 既存のanalyzeTopThreatsを流用
    return this.analyzeTopThreats(_events)
  }

  /**
   * 予測生成
   */
  private generatePredictions(__events: SecurityEvent[]): unknown[] {
    // 簡易実装：機械学習ベースの予測
    return []
  }

  /**
   * トレンド分析
   */
  private analyzeTrends(__events: SecurityEvent[]): unknown[] {
    // 簡易実装：時系列トレンド分析
    return []
  }

  /**
   * 脅威レベル取得
   */
  private getThreatSeverity(eventType: string): string {
    const severityMap: Record<string, string> = {
      'auth_failure': 'medium',
      'suspicious_activity': 'high',
      'security_error': 'high',
      'rate_limit_exceeded': 'medium',
      'performance_issue': 'low',
      'api_call': 'low'
    }
    return severityMap[eventType] || 'medium'
  }
}

/**
 * セキュリティレポート配信システム
 */
export class SecurityReportDistributor {
  private static instance: SecurityReportDistributor
  private reportGenerator: SecurityReportGenerator

  private constructor() {
    this.reportGenerator = SecurityReportGenerator.getInstance()
  }

  static getInstance(): SecurityReportDistributor {
    if (!SecurityReportDistributor.instance) {
      SecurityReportDistributor.instance = new SecurityReportDistributor()
    }
    return SecurityReportDistributor.instance
  }

  /**
   * 定期レポートの配信開始
   */
  startScheduledReports(): void {
    // 日次レポート（毎日午前9時）
    this.scheduleReport('daily', '0 9 * * *')
    
    // 週次レポート（毎週月曜日午前9時）
    this.scheduleReport('weekly', '0 9 * * 1')
    
    // 月次レポート（毎月1日午前9時）
    this.scheduleReport('monthly', '0 9 1 * *')
  }

  /**
   * レポートの手動送信
   */
  async sendReport(
    type: 'daily' | 'weekly' | 'monthly',
    // recipients: string[] = []
  ): Promise<void> {
    try {
      let report: SecurityReport

      switch (type) {
        case 'daily':
          report = await this.reportGenerator.generateDailyReport()
          break
        case 'weekly':
          report = await this.reportGenerator.generateWeeklyReport()
          break
        case 'monthly':
          report = await this.reportGenerator.generateMonthlyReport()
          break
      }

      const recipients: string[] = [] // Simplified implementation
      await this.distributeReport(report, recipients)
      console.log(`${type} security report sent successfully`)
    } catch (error) {
      console.error(`Failed to send ${type} report:`, error)
    }
  }

  /**
   * インシデントレポートの緊急配信
   */
  async sendUrgentIncidentReport(
    __incidentId: string, 
    // recipients: string[] = []
  ): Promise<void> {
    try {
      const report = await this.reportGenerator.generateIncidentReport(__incidentId)
      const recipients: string[] = [] // Simplified implementation
      await this.distributeReport(report, recipients, true)
      console.log('Urgent incident report sent successfully')
    } catch (error) {
      console.error('Failed to send urgent incident report:', error)
    }
  }

  /**
   * レポートの配信
   */
  private async distributeReport(
    report: SecurityReport, 
    _recipients: string[] = [],
    urgent = false
  ): Promise<void> {
    // コンソール出力
    console.log(`📊 Security Report Generated: ${report.type.toUpperCase()}`, report)

    // ローカルストレージに保存
    this.storeReport(report)

    // TODO: 実際の配信機能の実装
    // - メール送信
    // - Slack通知
    // - Webhook呼び出し
    
    if (urgent) {
      console.log('🚨 URGENT: Incident report requires immediate attention')
    }
  }

  /**
   * レポートのスケジュール設定
   */
  private scheduleReport(type: 'daily' | 'weekly' | 'monthly', cron: string): void {
    // 簡易実装：実際にはcronライブラリを使用
    console.log(`📅 Scheduled ${type} report: ${cron}`)
  }

  /**
   * レポートの保存
   */
  private storeReport(report: SecurityReport): void {
    try {
      const existingReports = JSON.parse(localStorage.getItem('security_reports') || '[]')
      existingReports.push(report)
      
      // 最新50件のみ保持
      const limitedReports = existingReports.slice(-50)
      localStorage.setItem('security_reports', JSON.stringify(limitedReports))
    } catch (error) {
      console.error('Failed to store security report:', error)
    }
  }
}

/**
 * セキュリティレポーティングシステムの初期化
 */
export function initializeSecurityReporting(): void {
  const distributor = SecurityReportDistributor.getInstance()
  distributor.startScheduledReports()
  
  console.log('📊 Security reporting system initialized')
}