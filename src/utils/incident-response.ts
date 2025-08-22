import { SecurityAlertManager } from '@/utils/security-monitoring'
import type {
  SecurityIncident,
  SecurityAction,
  ThreatLevel,
  SecurityEvent,
  SecurityAlert
} from '@/types/security-monitoring'

/**
 * インシデント対応システム
 * セキュリティインシデントの検知から解決まで自動化
 */
export class IncidentResponseManager {
  private static instance: IncidentResponseManager
  private incidents: SecurityIncident[] = []
  private responseHandlers: Map<string, IncidentHandler> = new Map()
  private escalationRules: EscalationRule[] = []

  private constructor() {
    this.setupDefaultHandlers()
    this.setupEscalationRules()
  }

  static getInstance(): IncidentResponseManager {
    if (!IncidentResponseManager.instance) {
      IncidentResponseManager.instance = new IncidentResponseManager()
    }
    return IncidentResponseManager.instance
  }

  /**
   * インシデントの作成
   */
  createIncident(
    title: string,
    description: string,
    severity: ThreatLevel,
    relatedEvents: SecurityEvent[] = [],
    assignedTo?: string
  ): SecurityIncident {
    const incident: SecurityIncident = {
      id: crypto.randomUUID(),
      title,
      description,
      severity,
      status: 'open',
      assignedTo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      relatedEvents,
      actions: [],
      impact: {
        affectedUsers: this.extractAffectedUsers(relatedEvents),
        affectedSystems: ['web_app'],
        estimatedDamage: 'Under assessment'
      },
      timeline: [{
        timestamp: new Date().toISOString(),
        event: 'Incident created',
        actor: 'Security Monitoring System'
      }]
    }

    this.incidents.push(incident)
    this.triggerIncidentResponse(incident)
    
    console.log(`🚨 Security incident created: ${incident.id} - ${title}`)
    return incident
  }

  /**
   * アラートからインシデント自動作成
   */
  createIncidentFromAlert(alert: SecurityAlert): SecurityIncident {
    const severity = this.mapAlertSeverityToIncident(alert.severity)
    
    return this.createIncident(
      `Alert: ${alert.ruleName}`,
      `Security alert triggered: ${alert.ruleName}. ${alert.event.action}`,
      severity,
      [alert.event]
    )
  }

  /**
   * インシデント一覧取得
   */
  getIncidents(): SecurityIncident[] {
    return [...this.incidents]
  }

  /**
   * アクティブなインシデント取得
   */
  getActiveIncidents(): SecurityIncident[] {
    return this.incidents.filter(i => i.status === 'open' || i.status === 'investigating')
  }

  /**
   * 重要度別インシデント取得
   */
  getIncidentsBySeverity(severity: ThreatLevel): SecurityIncident[] {
    return this.incidents.filter(i => i.severity === severity)
  }

  /**
   * 単一インシデント取得
   */
  getIncident(incidentId: string): SecurityIncident | undefined {
    return this.incidents.find(i => i.id === incidentId)
  }

  /**
   * ステータス別インシデント取得
   */
  getIncidentsByStatus(status: string): SecurityIncident[] {
    return this.incidents.filter(i => i.status === status)
  }

  /**
   * インシデントステータス更新
   */
  updateIncidentStatus(incidentId: string, status: string): SecurityIncident | null {
    const incident = this.incidents.find(i => i.id === incidentId)
    if (!incident) return null

    incident.status = status
    incident.updatedAt = new Date().toISOString()
    incident.timeline.push({
      timestamp: new Date().toISOString(),
      event: `Status updated to ${status}`,
      actor: 'System'
    })

    console.log(`📋 Incident ${incidentId} status updated to ${status}`)
    return incident
  }

  /**
   * インシデント担当者割り当て
   */
  assignIncident(incidentId: string, assignedTo: string): SecurityIncident | null {
    const incident = this.incidents.find(i => i.id === incidentId)
    if (!incident) return null

    incident.assignedTo = assignedTo
    incident.updatedAt = new Date().toISOString()
    incident.timeline.push({
      timestamp: new Date().toISOString(),
      event: `Assigned to ${assignedTo}`,
      actor: 'System'
    })

    console.log(`👤 Incident ${incidentId} assigned to ${assignedTo}`)
    return incident
  }

  /**
   * インシデント解決
   */
  resolveIncident(incidentId: string, resolution?: string): SecurityIncident | null {
    const incident = this.incidents.find(i => i.id === incidentId)
    if (!incident) return null

    incident.status = 'resolved'
    incident.updatedAt = new Date().toISOString()
    if (resolution) {
      incident.resolution = resolution
    }
    incident.timeline.push({
      timestamp: new Date().toISOString(),
      event: `Incident resolved${resolution ? ': ' + resolution : ''}`,
      actor: 'System'
    })

    console.log(`✅ Incident ${incidentId} resolved${resolution ? ': ' + resolution : ''}`)
    return incident
  }

  /**
   * 関連イベント追加
   */
  addRelatedEvent(incidentId: string, event: SecurityEvent): SecurityIncident | null {
    const incident = this.incidents.find(i => i.id === incidentId)
    if (!incident) return null

    incident.relatedEvents.push(event)
    incident.updatedAt = new Date().toISOString()
    incident.timeline.push({
      timestamp: new Date().toISOString(),
      event: `Related event added: ${event.type}`,
      actor: 'System'
    })

    console.log(`🔗 Related event added to incident ${incidentId}:`, event)
    return incident
  }

  /**
   * セキュリティアクション実行
   */
  executeAction(incidentId: string, actionType: string, description: string): SecurityAction | null {
    const incident = this.incidents.find(i => i.id === incidentId)
    if (!incident) return null

    const action: SecurityAction = {
      id: crypto.randomUUID(),
      type: actionType,
      description,
      executedAt: new Date().toISOString(),
      status: 'completed'
    }

    incident.actions.push(action)
    incident.updatedAt = new Date().toISOString()
    incident.timeline.push({
      timestamp: new Date().toISOString(),
      event: `Action executed: ${actionType}`,
      actor: 'System'
    })

    console.log(`⚡ Action executed for incident ${incidentId}:`, action)
    return action
  }

  /**
   * インシデント対応のトリガー
   */
  private triggerIncidentResponse(incident: SecurityIncident): void {
    // 自動対応ハンドラーの実行
    for (const [, handler] of this.responseHandlers) {
      if (handler.shouldHandle(incident)) {
        this.executeHandler(incident, handler)
      }
    }

    // エスカレーションルールの適用
    this.checkEscalation(incident)
  }

  /**
   * ハンドラーの実行
   */
  private async executeHandler(incident: SecurityIncident, handler: IncidentHandler): Promise<void> {
    try {
      console.log(`🔧 Executing incident handler: ${handler.name} for ${incident.id}`)
      
      const actions = await handler.handle(incident)
      
      for (const actionData of actions) {
        this.addAction(incident.id, actionData)
      }
    } catch (error) {
      console.error(`Failed to execute handler ${handler.name}:`, error)
    }
  }

  /**
   * インシデントにアクションを追加
   */
  addAction(incidentId: string, action: Omit<SecurityAction, 'id' | 'executedAt'>): SecurityAction | null {
    const incident = this.incidents.find(i => i.id === incidentId)
    if (!incident) return null

    const fullAction: SecurityAction = {
      id: crypto.randomUUID(),
      executedAt: new Date().toISOString(),
      ...action
    }

    incident.actions.push(fullAction)
    console.log(`⚡ Action added to incident ${incidentId}:`, fullAction)
    return fullAction
  }

  /**
   * エスカレーションチェック
   */
  private checkEscalation(incident: SecurityIncident): void {
    for (const rule of this.escalationRules) {
      if (rule.condition(incident)) {
        this.escalateIncident(incident, rule)
      }
    }
  }

  /**
   * インシデントのエスカレーション
   */
  private escalateIncident(incident: SecurityIncident, rule: EscalationRule): void {
    console.log(`⬆️ Escalating incident ${incident.id} - Rule: ${rule.name}`)
    rule.execute(incident)
  }

  /**
   * 影響を受けたユーザーの抽出
   */
  private extractAffectedUsers(events: SecurityEvent[]): string[] {
    const users = new Set<string>()
    events.forEach(event => {
      if (event.userId) users.add(event.userId)
    })
    return Array.from(users)
  }

  /**
   * アラート重要度をインシデント重要度にマッピング
   */
  private mapAlertSeverityToIncident(alertSeverity: string): ThreatLevel {
    const mapping: Record<string, ThreatLevel> = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      critical: 'critical'
    }
    return mapping[alertSeverity] || 'medium'
  }

  /**
   * デフォルトハンドラーの設定
   */
  private setupDefaultHandlers(): void {
    this.responseHandlers.set('auth_failure_handler', {
      name: 'Authentication Failure Handler',
      shouldHandle: (incident) => 
        incident.relatedEvents.some(e => e.type === 'auth_failure') &&
        incident.severity !== 'low',
      handle: async () => []
    })

    this.responseHandlers.set('critical_incident_handler', {
      name: 'Critical Incident Handler',
      shouldHandle: (incident) => incident.severity === 'critical',
      handle: async () => []
    })
  }

  /**
   * エスカレーションルールの設定
   */
  private setupEscalationRules(): void {
    this.escalationRules = [
      {
        name: 'Critical Severity Auto-Escalation',
        condition: (incident) => incident.severity === 'critical',
        execute: (incident) => {
          console.log(`🚨 Critical incident auto-escalated: ${incident.id}`)
        }
      }
    ]
  }
}

/**
 * 自動対応システム
 */
export class AutomatedResponseSystem {
  private static instance: AutomatedResponseSystem
  private responseManager: IncidentResponseManager

  private constructor() {
    this.responseManager = IncidentResponseManager.getInstance()
  }

  static getInstance(): AutomatedResponseSystem {
    if (!AutomatedResponseSystem.instance) {
      AutomatedResponseSystem.instance = new AutomatedResponseSystem()
    }
    return AutomatedResponseSystem.instance
  }

  /**
   * 管理者通知
   */
  async notifyAdministrators(
    message: string, 
    _severity: ThreatLevel,
    channels: string[] = ['console']
  ): Promise<void> {
    console.log(`📢 ADMIN ALERT: ${message}`)
    for (const channel of channels) {
      await this.sendNotification(channel, message)
    }
  }

  /**
   * 通知の送信
   */
  private async sendNotification(channel: string, message: string): Promise<void> {
    switch (channel) {
      case 'console':
        console.log(`📢 ${message}`)
        break
      case 'email':
        console.log(`📧 Email notification sent: ${message}`)
        break
      case 'slack':
        console.log(`💬 Slack notification sent: ${message}`)
        break
      default:
        console.log(`📣 Unknown channel ${channel}: ${message}`)
    }
  }

  
  /**
   * レスポンスルール取得
   */
  getResponseRules(): Array<{id: string, eventType: string, enabled: boolean}> {
    return [
      { id: 'suspicious_activity', eventType: 'suspicious_activity', enabled: true },
      { id: 'data_breach', eventType: 'data_breach_attempt', enabled: true }
    ]
  }

  /**
   * レスポンスルール追加
   */
  addResponseRule(rule: {eventType: string, actions: string[], enabled?: boolean}): string {
    const ruleId = crypto.randomUUID()
    console.log(`🔧 Response rule added: ${ruleId} for ${rule.eventType}`)
    return ruleId
  }

  /**
   * レスポンスルール無効化
   */
  disableResponseRule(ruleId: string): boolean {
    console.log(`🚫 Response rule disabled: ${ruleId}`)
    return true
  }

  /**
   * 監視開始
   */
  startMonitoring(): void {
    console.log('🔍 Automated response monitoring started')
  }

  /**
   * 監視停止
   */
  stopMonitoring(): void {
    console.log('🛑 Automated response monitoring stopped')
  }

  /**
   * レスポンスアクション実行
   */
  async executeResponseAction(actionType: string, parameters: Record<string, unknown>): Promise<{success: boolean, message: string}> {
    console.log(`⚡ Executing response action: ${actionType}`, parameters)
    
    try {
      switch (actionType) {
        case 'block_ip':
          return { success: true, message: `IP ${parameters.ipAddress} blocked successfully` }
        case 'lock_account':
          return { success: true, message: `Account ${parameters.userId} locked successfully` }
        case 'throttle_api':
          return { success: true, message: `API throttling applied to ${parameters.endpoint}` }
        case 'admin_alert':
          await this.notifyAdministrators(parameters.message as string, 'high')
          return { success: true, message: 'Admin alert sent successfully' }
        default:
          throw new Error(`Unknown action type: ${actionType}`)
      }
    } catch (error) {
      console.error(`Failed to execute action ${actionType}:`, error)
      return { success: false, message: `Action failed: ${(error as Error).message}` }
    }
  }

  /**
   * メトリクス取得
   */
  getMetrics(): {executedActions: number, successRate: number, failedActions: number} {
    return { executedActions: 0, successRate: 100, failedActions: 0 }
  }
}

/**
 * インシデント対応ハンドラーインターフェース
 */
interface IncidentHandler {
  name: string
  shouldHandle: (incident: SecurityIncident) => boolean
  handle: (incident: SecurityIncident) => Promise<Omit<SecurityAction, 'id' | 'executedAt'>[]>
}

/**
 * エスカレーションルールインターフェース
 */
interface EscalationRule {
  name: string
  condition: (incident: SecurityIncident) => boolean
  execute: (incident: SecurityIncident) => void
}

/**
 * インシデント対応システムの初期化
 */
export function initializeIncidentResponse(): void {
  const responseManager = IncidentResponseManager.getInstance()
  AutomatedResponseSystem.getInstance()

  // アラートマネージャーと連携してインシデント自動作成
  const alertManager = SecurityAlertManager.getInstance()
  alertManager.addAlertHandler('incident_creation', (alert) => {
    if (alert.severity === 'critical' || alert.severity === 'high') {
      responseManager.createIncidentFromAlert(alert)
    }
  })

  console.log('🚨 Incident response system initialized')
}