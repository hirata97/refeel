/**
 * セキュリティユーティリティ
 * XSS対策、CSRF対策、入力値検証などのセキュリティ機能を提供
 */

import DOMPurify from 'dompurify'

/**
 * XSS対策: HTMLコンテンツのサニタイゼーション
 */
export class XSSProtection {
  /**
   * HTMLコンテンツをサニタイズ
   * @param content サニタイズ対象のHTMLコンテンツ
   * @returns サニタイズされたHTMLコンテンツ
   */
  static sanitizeHTML(content: string): string {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: [],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style', 'img', 'video', 'audio'],
    })
  }

  /**
   * ユーザー入力テキストの基本的なサニタイゼーション
   * @param input ユーザー入力テキスト
   * @returns サニタイズされたテキスト
   */
  static sanitizeText(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  /**
   * URLの検証とサニタイゼーション
   * @param url 検証対象のURL
   * @returns 安全なURLまたはnull
   */
  static sanitizeURL(url: string): string | null {
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
}

/**
 * CSRF対策
 */
export class CSRFProtection {
  private static readonly TOKEN_KEY = 'csrf_token'
  private static readonly HEADER_NAME = 'X-CSRF-Token'

  /**
   * CSRFトークンを生成
   * @returns 生成されたCSRFトークン
   */
  static generateToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * CSRFトークンをセッションストレージに保存
   * @param token CSRFトークン
   */
  static storeToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token)
  }

  /**
   * セッションストレージからCSRFトークンを取得
   * @returns CSRFトークンまたはnull
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
   * @param headers 既存のヘッダーオブジェクト
   * @returns CSRFトークン付きヘッダー
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
   * @returns CSRFトークンを含む隠しフィールドのHTML
   */
  static createHiddenField(): string {
    const token = this.getToken()
    if (!token) return ''
    
    return `<input type="hidden" name="${this.TOKEN_KEY}" value="${token}">`
  }
}

/**
 * 入力値検証
 */
export class InputValidation {
  /**
   * メールアドレス形式の検証
   * @param email 検証対象のメールアドレス
   * @returns 有効な場合true
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  }

  /**
   * パスワード強度の検証
   * @param password 検証対象のパスワード
   * @returns 検証結果オブジェクト
   */
  static validatePassword(password: string): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('パスワードは8文字以上である必要があります')
    }

    if (password.length > 128) {
      errors.push('パスワードは128文字以下である必要があります')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('パスワードには小文字を含める必要があります')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('パスワードには大文字を含める必要があります')
    }

    if (!/[0-9]/.test(password)) {
      errors.push('パスワードには数字を含める必要があります')
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('パスワードには特殊文字を含める必要があります')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 文字列の長さ制限チェック
   * @param value 検証対象の文字列
   * @param maxLength 最大長
   * @param minLength 最小長（デフォルト: 0）
   * @returns 有効な場合true
   */
  static validateLength(value: string, maxLength: number, minLength: number = 0): boolean {
    return value.length >= minLength && value.length <= maxLength
  }

  /**
   * SQLインジェクション対策のための基本的な文字列チェック
   * @param input 検証対象の文字列
   * @returns 危険な文字列が含まれている場合false
   */
  static checkForSQLInjection(input: string): boolean {
    const dangerousPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /('|''|--|;|\|)/,
      /(\b(OR|AND)\b.*=)/i
    ]

    return !dangerousPatterns.some(pattern => pattern.test(input))
  }
}

/**
 * セキュリティレポート
 */
export class SecurityReporting {
  private static readonly REPORT_ENDPOINT = '/api/security-report'

  /**
   * CSP違反レポートを送信
   * @param violationReport CSP違反レポート
   */
  static async reportCSPViolation(violationReport: Record<string, unknown>): Promise<void> {
    try {
      await fetch(this.REPORT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...CSRFProtection.addTokenToHeaders()
        },
        body: JSON.stringify({
          type: 'csp_violation',
          report: violationReport,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      })
    } catch (error) {
      console.error('CSP違反レポートの送信に失敗しました:', error)
    }
  }

  /**
   * セキュリティインシデントレポートを送信
   * @param incidentType インシデントタイプ
   * @param details 詳細情報
   */
  static async reportSecurityIncident(
    incidentType: string,
    details: Record<string, unknown>
  ): Promise<void> {
    try {
      await fetch(this.REPORT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...CSRFProtection.addTokenToHeaders()
        },
        body: JSON.stringify({
          type: 'security_incident',
          incidentType,
          details,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      })
    } catch (error) {
      console.error('セキュリティインシデントレポートの送信に失敗しました:', error)
    }
  }
}

/**
 * セキュリティ設定の初期化
 */
export function initializeSecurity(): void {
  // CSRFトークンの生成と保存
  if (!CSRFProtection.getToken()) {
    const token = CSRFProtection.generateToken()
    CSRFProtection.storeToken(token)
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
      statusCode: event.statusCode
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
        stack: event.error.stack
      })
    }
  })
}