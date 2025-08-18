// セキュリティ関連の型定義
export type SecurityEventType = 
  | 'auth_failure'
  | 'xss_attempt' 
  | 'csrf_violation'
  | 'suspicious_activity'
  | 'input_validation_error'
  | 'session_anomaly'

export type SecurityThreatLevel = 'low' | 'medium' | 'high' | 'critical'

export type SecurityActionType = 
  | 'alert' 
  | 'block' 
  | 'monitor' 
  | 'log'

export interface SecurityIncidentData {
  type: SecurityEventType
  severity: SecurityThreatLevel
  details: Record<string, string | number | boolean>
  timestamp: string
  userAgent?: string
  ipAddress?: string
  userId?: string
  sessionId?: string
}

export interface SecurityMetrics {
  cspViolations: CSPViolationData[]
  authFailures: AuthFailureData[]
  securityIncidents: SecurityIncidentData[]
  threatLevel: SecurityThreatLevel
  lastUpdated: string
}

export interface CSPViolationData {
  blockedURI: string
  violatedDirective: string
  originalPolicy: string
  documentURI: string
  timestamp: string
  userAgent: string
  sourceFile?: string
  lineNumber?: number
}

export interface AuthFailureData {
  type: 'invalid_credentials' | 'account_locked' | 'too_many_attempts' | 'session_expired'
  userId?: string
  email?: string
  ipAddress: string
  userAgent: string
  timestamp: string
  attemptCount: number
}

export interface SecurityConfig {
  csp: {
    enabled: boolean
    reportOnly: boolean
    directives: Record<string, string[]>
  }
  csrf: {
    enabled: boolean
    tokenName: string
    timeout: number
  }
  rateLimit: {
    enabled: boolean
    maxRequests: number
    windowMs: number
  }
  monitoring: {
    enabled: boolean
    alertThreshold: number
    reportingInterval: number
  }
}

export interface SecurityHeaders {
  'Content-Security-Policy'?: string
  'X-Content-Type-Options'?: string
  'X-Frame-Options'?: string
  'X-XSS-Protection'?: string
  'Strict-Transport-Security'?: string
  'Referrer-Policy'?: string
  'Permissions-Policy'?: string
  'X-CSRF-Token'?: string
  'X-Requested-With'?: string
}

export interface CSRFToken {
  token: string
  timestamp: number
  expires: number
}

export interface SecurityValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  riskLevel: SecurityThreatLevel
}

export interface SecurityTestCase {
  id: string
  name: string
  description: string
  type: SecurityEventType
  payload: unknown
  expectedResult: 'block' | 'allow' | 'sanitize'
  severity: SecurityThreatLevel
}