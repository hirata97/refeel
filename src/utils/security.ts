import DOMPurify from 'dompurify'
import { securityConfig } from '@/config/security'
import type {
  SecurityIncidentData,
  SecurityValidationResult,
  SecurityHeaders as SecurityHeadersType,
  CSRFToken,
  SecurityThreatLevel,
} from '@/types/security'

/**
 * XSS Protection Utility
 * PRレビューで指摘された一貫性問題を解決
 */
export class XSSProtection {
  private static config = DOMPurify

  static {
    // DOMPurifyの設定を強化
    this.config.setConfig({
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: false,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      SANITIZE_DOM: true,
      SANITIZE_NAMED_PROPS: true,
      FORCE_BODY: false,
    })
  }

  /**
   * HTMLコンテンツのサニタイゼーション（表示用）
   */
  static sanitizeHTML(input: string): string {
    if (!input || typeof input !== 'string') return ''
    return this.config.sanitize(input, { RETURN_TRUSTED_TYPE: false })
  }

  /**
   * プレーンテキストのサニタイゼーション（入力用）
   */
  static sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') return ''

    // HTMLエンティティのエスケープ
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  /**
   * URLの検証とサニタイゼーション
   */
  static sanitizeURL(url: string): string | null {
    if (!url || typeof url !== 'string') return null

    try {
      const urlObj = new URL(url)
      // 許可されたプロトコルのみ
      const allowedProtocols = ['http:', 'https:', 'mailto:']

      if (!allowedProtocols.includes(urlObj.protocol)) {
        return null
      }

      // javascript:やdata:などの危険なプロトコルを除外
      if (urlObj.protocol === 'javascript:' || urlObj.protocol === 'data:') {
        return null
      }

      return urlObj.toString()
    } catch {
      return null
    }
  }

  /**
   * 表示時の統一的なXSS対策
   * PRレビューで指摘された一貫性問題を解決
   */
  static secureDisplay(content: string, allowHTML = false): string {
    if (!content || typeof content !== 'string') return ''

    if (allowHTML) {
      // HTML許可時は制限付きサニタイゼーション
      return this.sanitizeHTML(content)
    } else {
      // プレーンテキスト時は完全エスケープ
      return this.sanitizeText(content)
    }
  }

  /**
   * フォーム入力値の統一的なXSS対策
   */
  static secureInput(input: string): string {
    return this.sanitizeText(input)
  }

  /**
   * XSS攻撃試行の検出
   */
  static detectXSSAttempt(input: string): boolean {
    if (!input || typeof input !== 'string') return false

    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
      /onclick\s*=/gi,
      /onmouseover\s*=/gi,
      /<iframe\b/gi,
      /<object\b/gi,
      /<embed\b/gi,
      /<form\b/gi,
    ]

    return xssPatterns.some((pattern) => pattern.test(input))
  }
}

/**
 * CSRF Protection Utility
 */
export class CSRFProtection {
  private static tokenStorage = new Map<string, CSRFToken>()
  private static readonly TOKEN_KEY = 'csrf_token'
  private static readonly HEADER_NAME = 'X-CSRF-Token'

  /**
   * CSRFトークンの生成
   */
  static generateToken(): CSRFToken {
    const token = securityConfig.generateCSRFToken()
    this.tokenStorage.set(token.token, token)
    return token
  }

  /**
   * CSRFトークンの検証
   */
  static validateToken(tokenString: string): boolean {
    const token = this.tokenStorage.get(tokenString)
    if (!token) return false

    const isValid = securityConfig.validateCSRFToken(token)

    // 無効なトークンは削除
    if (!isValid) {
      this.tokenStorage.delete(tokenString)
    }

    return isValid
  }

  /**
   * CSRFトークンをセッションストレージに保存
   */
  static storeToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token)
  }

  /**
   * セッションストレージからCSRFトークンを取得
   */
  static getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY)
  }

  /**
   * CSRFトークンを削除
   */
  static removeToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY)
  }

  /**
   * HTTPリクエストヘッダーにCSRFトークンを設定
   */
  static addTokenToHeaders(headers: Record<string, string> = {}): Record<string, string> {
    const token = this.getToken()
    if (token) {
      headers[this.HEADER_NAME] = token
    }
    return headers
  }

  /**
   * フォーム送信時のCSRFトークン検証用の隠しフィールドを作成
   */
  static createHiddenField(): string {
    const token = this.getToken()
    if (!token) return ''

    return `<input type="hidden" name="${this.TOKEN_KEY}" value="${token}">`
  }

  /**
   * 期限切れトークンのクリーンアップ
   */
  static cleanupExpiredTokens(): void {
    const now = Date.now()
    for (const [tokenString, token] of this.tokenStorage.entries()) {
      if (now >= token.expires) {
        this.tokenStorage.delete(tokenString)
      }
    }
  }

  /**
   * すべてのトークンをクリア
   */
  static clearAllTokens(): void {
    this.tokenStorage.clear()
  }
}

/**
 * Input Validation Utility
 */
export class InputValidation {
  /**
   * 包括的な入力値検証
   */
  static validateInput(
    input: string,
    options: {
      maxLength?: number
      minLength?: number
      allowHTML?: boolean
      allowSpecialChars?: boolean
    } = {},
  ): SecurityValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    let riskLevel: SecurityThreatLevel = 'low'

    // 基本的な検証
    if (!input || typeof input !== 'string') {
      errors.push('Invalid input type')
      riskLevel = 'medium'
    } else {
      // 長さチェック
      if (options.maxLength && input.length > options.maxLength) {
        errors.push(`Input exceeds maximum length of ${options.maxLength}`)
        riskLevel = 'medium'
      }

      if (options.minLength && input.length < options.minLength) {
        errors.push(`Input is shorter than minimum length of ${options.minLength}`)
      }

      // XSS検出
      if (XSSProtection.detectXSSAttempt(input)) {
        errors.push('Potential XSS attack detected')
        riskLevel = 'critical'
      }

      // 特殊文字チェック
      if (!options.allowSpecialChars) {
        const hasSpecialChars = /[<>\"'&]/.test(input)
        if (hasSpecialChars && !options.allowHTML) {
          warnings.push('Input contains special characters')
          if (riskLevel === 'low') riskLevel = 'medium'
        }
      }

      // HTML許可設定との整合性チェック
      if (!options.allowHTML && /<[^>]*>/.test(input)) {
        errors.push('HTML tags not allowed')
        riskLevel = 'high'
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      riskLevel,
    }
  }

  /**
   * メールアドレス形式の検証
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  }

  /**
   * メールアドレスの検証
   */
  static validateEmail(email: string): SecurityValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const errors: string[] = []

    if (!emailRegex.test(email)) {
      errors.push('Invalid email format')
    }

    // XSS検出
    if (XSSProtection.detectXSSAttempt(email)) {
      errors.push('Potential XSS attack in email')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      riskLevel: errors.length > 0 ? 'medium' : 'low',
    }
  }

  /**
   * パスワード強度の検証
   */
  static validatePassword(password: string): SecurityValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    let riskLevel: SecurityThreatLevel = 'low'

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
      riskLevel = 'medium'
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    if (password.length > 128) {
      errors.push('Password is too long')
      riskLevel = 'medium'
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      riskLevel,
    }
  }

  /**
   * 文字列の長さ制限チェック
   */
  static validateLength(value: string, maxLength: number, minLength: number = 0): boolean {
    return value.length >= minLength && value.length <= maxLength
  }

  /**
   * SQLインジェクション対策のための基本的な文字列チェック
   */
  static checkForSQLInjection(input: string): boolean {
    const dangerousPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /('|''|--|;|\|)/,
      /(\b(OR|AND)\b.*=)/i,
    ]

    return !dangerousPatterns.some((pattern) => pattern.test(input))
  }
}

/**
 * Security Headers Utility
 */
export class SecurityHeadersUtil {
  /**
   * セキュリティヘッダーの取得
   */
  static getHeaders(): SecurityHeadersType {
    return securityConfig.getSecurityHeaders()
  }

  /**
   * CSPヘッダーの取得
   */
  static getCSPHeader(): string {
    return securityConfig.getCSPHeader()
  }

  /**
   * レスポンスヘッダーにセキュリティヘッダーを追加
   */
  static addSecurityHeaders(headers: Record<string, string>): Record<string, string> {
    const secHeaders = this.getHeaders()
    return { ...headers, ...secHeaders }
  }
}

/**
 * Security Incident Reporter
 */
export class SecurityIncidentReporter {
  private static incidents: SecurityIncidentData[] = []

  /**
   * セキュリティインシデントの報告
   */
  static reportIncident(incident: Omit<SecurityIncidentData, 'timestamp'>): void {
    const fullIncident: SecurityIncidentData = {
      ...incident,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId(),
    }

    this.incidents.push(fullIncident)

    // 重要度が高い場合は即座にアラート
    if (incident.severity === 'critical' || incident.severity === 'high') {
      this.sendImmediateAlert(fullIncident)
    }

    // ローカルストレージに保存（一時的）
    this.persistIncident(fullIncident)
  }

  /**
   * インシデントの取得
   */
  static getIncidents(): SecurityIncidentData[] {
    return [...this.incidents]
  }

  /**
   * インシデントのクリア
   */
  static clearIncidents(): void {
    this.incidents = []
    localStorage.removeItem('security_incidents')
  }

  private static getSessionId(): string {
    let sessionId = sessionStorage.getItem('security_session_id')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem('security_session_id', sessionId)
    }
    return sessionId
  }

  private static sendImmediateAlert(incident: SecurityIncidentData): void {
    // 開発環境では console.warn で表示
    if (securityConfig.isDevelopment()) {
      console.warn('🚨 Security Alert:', incident)
    }

    // プロダクション環境では外部サービスに送信
    // TODO: 実際の監視サービスとの連携を実装
  }

  private static persistIncident(incident: SecurityIncidentData): void {
    try {
      const existingIncidents = JSON.parse(localStorage.getItem('security_incidents') || '[]')
      existingIncidents.push(incident)

      // 最新50件のみ保持
      const limitedIncidents = existingIncidents.slice(-50)
      localStorage.setItem('security_incidents', JSON.stringify(limitedIncidents))
    } catch (error) {
      console.error('Failed to persist security incident:', error)
    }
  }
}

/**
 * セキュリティレポート
 */
export class SecurityReporting {
  private static readonly REPORT_ENDPOINT = '/api/security-report'

  /**
   * CSP違反レポートを送信
   */
  static async reportCSPViolation(violationReport: Record<string, unknown>): Promise<void> {
    try {
      await fetch(this.REPORT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...CSRFProtection.addTokenToHeaders(),
        },
        body: JSON.stringify({
          type: 'csp_violation',
          report: violationReport,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
      })
    } catch (error) {
      console.error('CSP違反レポートの送信に失敗しました:', error)
    }
  }

  /**
   * セキュリティインシデントレポートを送信
   */
  static async reportSecurityIncident(
    incidentType: string,
    details: Record<string, unknown>,
  ): Promise<void> {
    try {
      await fetch(this.REPORT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...CSRFProtection.addTokenToHeaders(),
        },
        body: JSON.stringify({
          type: 'security_incident',
          incidentType,
          details,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      })
    } catch (error) {
      console.error('セキュリティインシデントレポートの送信に失敗しました:', error)
    }
  }
}

/**
 * セキュリティ機能の初期化
 */
export function initializeSecurity(): void {
  // CSRFトークンの生成と保存
  if (!CSRFProtection.getToken()) {
    const token = CSRFProtection.generateToken()
    CSRFProtection.storeToken(token.token)
  }

  // CSRFトークンのクリーンアップを定期実行
  setInterval(() => {
    CSRFProtection.cleanupExpiredTokens()
  }, 300000) // 5分間隔

  // セキュリティヘッダーの設定
  const headers = SecurityHeadersUtil.getHeaders()

  // CSP違反の監視
  if ('securitypolicyviolation' in window) {
    window.addEventListener('securitypolicyviolation', (event) => {
      SecurityIncidentReporter.reportIncident({
        type: 'csrf_violation',
        severity: 'medium',
        details: {
          blockedURI: event.blockedURI,
          violatedDirective: event.violatedDirective,
          originalPolicy: event.originalPolicy,
          documentURI: event.documentURI,
        },
      })
    })
  }

  // CSP違反レポートのリスナー設定
  document.addEventListener('securitypolicyviolation', (event) => {
    SecurityReporting.reportCSPViolation({
      documentURI: event.documentURI,
      referrer: event.referrer,
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      effectiveDirective: event.effectiveDirective,
      originalPolicy: event.originalPolicy,
      disposition: event.disposition,
      statusCode: event.statusCode,
    })
  })

  // グローバルエラーハンドラー
  window.addEventListener('error', (event) => {
    if (event.error && event.error.name === 'SecurityError') {
      SecurityReporting.reportSecurityIncident('javascript_security_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error.stack,
      })
    }
  })

  // 開発環境でのデバッグ情報表示
  if (securityConfig.isDevelopment()) {
    console.log('🔒 Security initialized:', {
      environment: securityConfig.getCurrentEnvironment(),
      config: securityConfig.getConfig(),
      headers,
    })
  }
}

// デフォルトエクスポート
export { securityConfig, SecurityConfigManager } from '@/config/security'
