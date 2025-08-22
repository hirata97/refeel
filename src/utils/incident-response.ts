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