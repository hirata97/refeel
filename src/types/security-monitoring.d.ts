/**
 * セキュリティ監視関連の型定義
 */

export type SecurityEventType =
  | 'auth_failure'
  | 'auth_success'
  | 'api_call'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'security_error'
  | 'network_error'
  | 'performance_issue'
  | 'access_denied'
  | 'data_breach_attempt'
  | 'malicious_input'
  | 'session_anomaly'

export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical'

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'

export type AlertAction = 'alert' | 'block' | 'throttle' | 'log'

export interface SecurityEvent {
  id: string
  type: SecurityEventType
  severity: ThreatLevel
  timestamp: string
  userId?: string
  action: string
  details: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  location?: string
}

export interface MonitoringThreshold {
  maxFailedAttempts: number
  maxAPICallsPerMinute: number
  maxResponseTime: number
  suspiciousPatternThreshold: number
}

export interface AlertingConfig {
  enabled: boolean
  channels: string[]
  severityLevels: AlertSeverity[]
}

export interface SecurityMonitoringConfig {
  enabled: boolean
  monitoringInterval: number
  retentionPeriod: number
  thresholds: MonitoringThreshold
  alerting: AlertingConfig
}

export interface MonitoringMetrics {
  totalEvents: number
  eventsByType: Map<SecurityEventType, number>
  eventsBySeverity: Map<ThreatLevel, number>
  activeUsers: Set<string>
  avgResponseTime: number
  currentThreatLevel: ThreatLevel
  lastUpdated: string
}

export interface AlertRule {
  id: string
  name: string
  condition: (event: SecurityEvent) => boolean
  severity: AlertSeverity
  action: AlertAction
  enabled?: boolean
  cooldown?: number
}

export interface SecurityAlert {
  id: string
  ruleId: string
  ruleName: string
  severity: AlertSeverity
  event: SecurityEvent
  triggeredAt: string
  acknowledged: boolean
  acknowledgedAt?: string
  acknowledgedBy?: string
  resolvedAt?: string
  notes?: string
}

export interface SecurityReport {
  id: string
  type: 'daily' | 'weekly' | 'monthly' | 'incident'
  period: {
    start: string
    end: string
  }
  summary: {
    totalEvents: number
    threatLevel: ThreatLevel
    criticalAlerts: number
    topThreats: string[]
  }
  metrics: {
    eventsByType: Record<SecurityEventType, number>
    eventsBySeverity: Record<ThreatLevel, number>
    responseTimeStats: {
      avg: number
      min: number
      max: number
    }
    userActivity: {
      activeUsers: number
      suspiciousUsers: string[]
    }
  }
  incidents: SecurityIncident[]
  recommendations: SecurityRecommendation[]
  generatedAt: string
}

export interface SecurityIncident {
  id: string
  title: string
  description: string
  severity: ThreatLevel
  status: 'open' | 'investigating' | 'resolved' | 'closed'
  assignedTo?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  relatedEvents: SecurityEvent[]
  actions: SecurityAction[]
  impact: {
    affectedUsers: string[]
    affectedSystems: string[]
    estimatedDamage: string
  }
  timeline: SecurityTimelineEntry[]
}

export interface SecurityAction {
  id: string
  type: 'block_ip' | 'lock_account' | 'throttle_api' | 'alert_admin' | 'log_event'
  description: string
  executedAt: string
  executedBy: string
  parameters: Record<string, unknown>
  result: 'success' | 'failed' | 'pending'
}

export interface SecurityTimelineEntry {
  timestamp: string
  event: string
  actor: string
  details?: Record<string, unknown>
}

export interface SecurityRecommendation {
  id: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  category: 'prevention' | 'detection' | 'response' | 'recovery'
  estimatedEffort: string
  potentialImpact: string
}

export interface ThreatPattern {
  id: string
  name: string
  description: string
  indicators: string[]
  severity: ThreatLevel
  confidence: number
  lastSeen: string
  occurrences: number
}

export interface SecurityDashboard {
  currentThreatLevel: ThreatLevel
  activeAlerts: number
  recentIncidents: SecurityIncident[]
  systemHealth: {
    monitoring: 'healthy' | 'degraded' | 'critical'
    alerting: 'healthy' | 'degraded' | 'critical'
    logging: 'healthy' | 'degraded' | 'critical'
  }
  topThreats: ThreatPattern[]
  metrics: {
    eventsPerHour: number
    avgResponseTime: number
    falsePositiveRate: number
    detectionAccuracy: number
  }
}

export interface NotificationChannel {
  id: string
  name: string
  type: 'email' | 'slack' | 'webhook' | 'console' | 'storage'
  enabled: boolean
  config: Record<string, unknown>
  severityFilter: AlertSeverity[]
}

export interface SecurityAnalytics {
  anomalies: SecurityAnomaly[]
  patterns: ThreatPattern[]
  predictions: SecurityPrediction[]
  trends: SecurityTrend[]
}

export interface SecurityAnomaly {
  id: string
  type: 'behavioral' | 'statistical' | 'temporal'
  description: string
  severity: ThreatLevel
  confidence: number
  detectedAt: string
  relatedEvents: string[]
  possibleCauses: string[]
}

export interface SecurityPrediction {
  id: string
  type: 'threat' | 'attack' | 'anomaly'
  description: string
  probability: number
  timeframe: string
  recommendedActions: string[]
}

export interface SecurityTrend {
  metric: string
  direction: 'increasing' | 'decreasing' | 'stable'
  change: number
  period: string
  significance: 'low' | 'medium' | 'high'
}

export interface ComplianceReport {
  framework: 'GDPR' | 'CCPA' | 'ISO27001' | 'NIST'
  compliance: {
    overall: number
    categories: Record<string, number>
  }
  gaps: ComplianceGap[]
  recommendations: SecurityRecommendation[]
  lastAssessment: string
}

export interface ComplianceGap {
  requirement: string
  currentState: string
  requiredState: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  remediation: string
}

export interface SecurityConfiguration {
  monitoring: SecurityMonitoringConfig
  alerting: AlertingConfig
  reporting: {
    enabled: boolean
    frequency: 'hourly' | 'daily' | 'weekly'
    recipients: string[]
  }
  retention: {
    events: number // days
    alerts: number // days
    reports: number // days
  }
  integrations: {
    slack?: {
      webhook: string
      channel: string
    }
    email?: {
      smtp: string
      from: string
      to: string[]
    }
    webhook?: {
      url: string
      method: 'POST' | 'PUT'
      headers: Record<string, string>
    }
  }
}