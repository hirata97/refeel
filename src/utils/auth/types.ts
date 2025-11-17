/**
 * 認証関連の型定義
 */

export interface LockoutStatus {
  isLocked: boolean
  lockoutUntil: Date | null
  attemptCount: number
  remainingTime?: number
}

export interface PasswordValidationResult {
  isValid: boolean
  score: number
  feedback: string[]
  errors: string[]
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong'
}

export interface SessionInfo {
  id: string
  userId: string
  userAgent: string
  clientIP: string
  createdAt: Date
  lastAccessed: Date
  isActive: boolean
}

export interface SecurityStats {
  activeSessions: number
  lastLogin: Date | null
  loginAttempts: number
  devicesCount: number
}

export enum AuditEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  ACCOUNT_LOCKED = 'account_locked',
  SESSION_CREATED = 'session_created',
  SESSION_TERMINATED = 'session_terminated',
  SECURITY_VIOLATION = 'security_violation',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
}
