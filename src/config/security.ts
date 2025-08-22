import type { SecurityConfig, SecurityHeaders, CSRFToken } from '@/types/security'

export type Environment = 'development' | 'production' | 'test'

export class SecurityConfigManager {
  private static instance: SecurityConfigManager
  private config: SecurityConfig
  private environment: Environment

  private constructor() {
    this.environment = this.determineEnvironment()
    this.config = this.loadConfig()
  }

  public static getInstance(): SecurityConfigManager {
    if (!SecurityConfigManager.instance) {
      SecurityConfigManager.instance = new SecurityConfigManager()
    }
    return SecurityConfigManager.instance
  }

  private determineEnvironment(): Environment {
    if (import.meta.env.NODE_ENV === 'production') return 'production'
    if (import.meta.env.NODE_ENV === 'test') return 'test'
    return 'development'
  }

  private loadConfig(): SecurityConfig {
    const baseConfig: SecurityConfig = {
      csp: {
        enabled: true,
        reportOnly: this.environment === 'development',
        directives: {
          'default-src': ["'self'"],
          'script-src': [
            "'self'",
            "'unsafe-inline'", // Vue.js requires inline scripts
            'https://cdn.jsdelivr.net',
          ],
          'style-src': [
            "'self'",
            "'unsafe-inline'", // Vuetify requires inline styles
            'https://cdn.jsdelivr.net',
            'https://fonts.googleapis.com',
          ],
          'font-src': ["'self'", 'https://cdn.jsdelivr.net', 'https://fonts.gstatic.com'],
          'img-src': ["'self'", 'data:', 'https:'],
          'connect-src': [
            "'self'",
            'https://*.supabase.co',
            ...(this.environment === 'development'
              ? ['ws://localhost:*', 'http://localhost:*']
              : []),
          ],
          'frame-ancestors': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
        },
      },
      csrf: {
        enabled: true,
        tokenName: 'X-CSRF-Token',
        timeout: 3600000, // 1 hour
      },
      rateLimit: {
        enabled: this.environment === 'production',
        maxRequests: this.environment === 'production' ? 100 : 1000,
        windowMs: 900000, // 15 minutes
      },
      monitoring: {
        enabled: true,
        alertThreshold: this.environment === 'production' ? 5 : 50,
        reportingInterval: this.environment === 'production' ? 300000 : 60000, // 5 min / 1 min
      },
    }

    return baseConfig
  }

  public getConfig(): SecurityConfig {
    return { ...this.config }
  }

  public getCSPHeader(): string {
    if (!this.config.csp.enabled) return ''

    const directives = Object.entries(this.config.csp.directives)
      .map(([key, values]) => `${key} ${values.join(' ')}`)
      .join('; ')

    return directives
  }

  public getSecurityHeaders(): SecurityHeaders {
    const headers: SecurityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'X-Requested-With': 'XMLHttpRequest',
    }

    if (this.config.csp.enabled) {
      const cspHeaderName = this.config.csp.reportOnly
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy'
      headers[cspHeaderName as keyof SecurityHeaders] = this.getCSPHeader()
    }

    if (this.environment === 'production') {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
    }

    return headers
  }

  public generateCSRFToken(): CSRFToken {
    const timestamp = Date.now()
    const randomBytes = new Uint8Array(32)
    crypto.getRandomValues(randomBytes)
    const token = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('')

    return {
      token,
      timestamp,
      expires: timestamp + this.config.csrf.timeout,
    }
  }

  public validateCSRFToken(token: CSRFToken): boolean {
    const now = Date.now()
    return now < token.expires && token.token.length === 64
  }

  public updateConfig(updates: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  public validateConfig(config: SecurityConfig): boolean {
    try {
      // 基本的な設定検証
      if (!config.csp || !config.csrf || !config.rateLimit || !config.monitoring) {
        return false
      }

      // CSP設定の検証
      if (!config.csp.directives || typeof config.csp.directives !== 'object') {
        return false
      }

      // 必須ディレクティブの存在確認
      const requiredDirectives = ['default-src', 'script-src', 'style-src']
      for (const directive of requiredDirectives) {
        if (!config.csp.directives[directive] || !Array.isArray(config.csp.directives[directive])) {
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Security config validation error:', error)
      return false
    }
  }

  public getCurrentEnvironment(): Environment {
    return this.environment
  }

  public isDevelopment(): boolean {
    return this.environment === 'development'
  }

  public isProduction(): boolean {
    return this.environment === 'production'
  }

  public isTest(): boolean {
    return this.environment === 'test'
  }
}

// シングルトンインスタンスをエクスポート
export const securityConfig = SecurityConfigManager.getInstance()
