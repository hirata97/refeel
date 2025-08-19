/**
 * 2FA (多要素認証) 機能の実装
 * Issue #70: 認証・認可システムの強化実装
 */

import { AuditLogger, AuditEventType } from './audit-logger'

export interface TwoFactorConfig {
  secret: string
  backupCodes: string[]
  isEnabled: boolean
  setupAt: Date
  lastUsedAt?: Date
}

export interface TOTPOptions {
  window: number // 許容する時間窓（通常は1 = ±30秒）
  step: number   // 時間ステップ（秒、通常は30）
  digits: number // コード桁数（通常は6）
}

export interface BackupCode {
  code: string
  used: boolean
  usedAt?: Date
}

export interface TwoFactorSetupResult {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
  manualEntryKey: string
}

export interface TwoFactorVerificationResult {
  isValid: boolean
  method: 'totp' | 'backup' | null
  remainingBackupCodes?: number
}

// デフォルト設定
const DEFAULT_TOTP_OPTIONS: TOTPOptions = {
  window: 1,
  step: 30,
  digits: 6
}

/**
 * Base32エンコード/デコード（TOTP秘密鍵用）
 */
class Base32 {
  private static readonly ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

  static encode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let result = ''
    let bits = 0
    let value = 0

    for (let i = 0; i < bytes.length; i++) {
      value = (value << 8) | bytes[i]
      bits += 8

      while (bits >= 5) {
        result += this.ALPHABET[(value >>> (bits - 5)) & 31]
        bits -= 5
      }
    }

    if (bits > 0) {
      result += this.ALPHABET[(value << (5 - bits)) & 31]
    }

    return result
  }

  static decode(encoded: string): ArrayBuffer {
    const cleanInput = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '')
    const bytes: number[] = []
    let bits = 0
    let value = 0

    for (let i = 0; i < cleanInput.length; i++) {
      const char = cleanInput[i]
      const index = this.ALPHABET.indexOf(char)
      if (index === -1) continue

      value = (value << 5) | index
      bits += 5

      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255)
        bits -= 8
      }
    }

    return new Uint8Array(bytes).buffer
  }
}

/**
 * HMAC-SHA1実装（TOTP用）
 */
class HMAC {
  static async sha1(key: ArrayBuffer, data: ArrayBuffer): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    )
    return crypto.subtle.sign('HMAC', cryptoKey, data)
  }
}

/**
 * TOTP (Time-based One-Time Password) 実装
 */
class TOTPGenerator {
  private options: TOTPOptions

  constructor(options: Partial<TOTPOptions> = {}) {
    this.options = { ...DEFAULT_TOTP_OPTIONS, ...options }
  }

  /**
   * 秘密鍵の生成
   */
  generateSecret(): string {
    const bytes = new Uint8Array(20) // 160ビット
    crypto.getRandomValues(bytes)
    return Base32.encode(bytes.buffer)
  }

  /**
   * 現在のTOTPコードを生成
   */
  async generateTOTP(secret: string, timestamp?: number): Promise<string> {
    const time = timestamp || Date.now()
    const timeStep = Math.floor(time / 1000 / this.options.step)
    
    return this.generateTOTPForStep(secret, timeStep)
  }

  /**
   * 指定されたタイムステップでTOTPコードを生成
   */
  private async generateTOTPForStep(secret: string, timeStep: number): Promise<string> {
    // 秘密鍵をデコード
    const key = Base32.decode(secret)
    
    // タイムステップをバイト配列に変換（Big-endian 64bit）
    const timeBuffer = new ArrayBuffer(8)
    const timeView = new DataView(timeBuffer)
    timeView.setUint32(4, timeStep, false) // Big-endian
    
    // HMAC-SHA1計算
    const hmac = await HMAC.sha1(key, timeBuffer)
    const hmacArray = new Uint8Array(hmac)
    
    // Dynamic truncation
    const offset = hmacArray[hmacArray.length - 1] & 0x0f
    const code = (
      ((hmacArray[offset] & 0x7f) << 24) |
      ((hmacArray[offset + 1] & 0xff) << 16) |
      ((hmacArray[offset + 2] & 0xff) << 8) |
      (hmacArray[offset + 3] & 0xff)
    ) % Math.pow(10, this.options.digits)
    
    return code.toString().padStart(this.options.digits, '0')
  }

  /**
   * TOTPコードの検証
   */
  async verifyTOTP(secret: string, token: string, timestamp?: number): Promise<boolean> {
    const time = timestamp || Date.now()
    const currentStep = Math.floor(time / 1000 / this.options.step)
    
    // 時間窓内での検証
    for (let i = -this.options.window; i <= this.options.window; i++) {
      const stepToCheck = currentStep + i
      const expectedCode = await this.generateTOTPForStep(secret, stepToCheck)
      
      if (expectedCode === token) {
        return true
      }
    }
    
    return false
  }

  /**
   * QRコードURL生成
   */
  generateQRCodeUrl(secret: string, accountName: string, issuer: string): string {
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: 'SHA1',
      digits: this.options.digits.toString(),
      period: this.options.step.toString()
    })
    
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?${params}`
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`
  }
}

/**
 * 2FA管理クラス
 */
export class TwoFactorAuthManager {
  private totpGenerator: TOTPGenerator
  private auditLogger: AuditLogger

  constructor() {
    this.totpGenerator = new TOTPGenerator()
    this.auditLogger = AuditLogger.getInstance()
  }

  /**
   * 2FA設定の初期化
   */
  async setup2FA(userId: string, userEmail: string): Promise<TwoFactorSetupResult> {
    // 秘密鍵生成
    const secret = this.totpGenerator.generateSecret()
    
    // バックアップコード生成
    const backupCodes = this.generateBackupCodes()
    
    // QRコードURL生成
    const qrCodeUrl = this.totpGenerator.generateQRCodeUrl(
      secret,
      userEmail,
      'Goal Categorization Diary'
    )
    
    // 手動入力用フォーマット
    const manualEntryKey = secret.match(/.{1,4}/g)?.join(' ') || secret
    
    // 監査ログに記録
    await this.auditLogger.log(
      AuditEventType.SECURITY_2FA_SETUP,
      `2FA設定開始: ${userEmail}`,
      {
        userId,
        email: userEmail,
        timestamp: new Date().toISOString()
      }
    )

    return {
      secret,
      qrCodeUrl,
      backupCodes,
      manualEntryKey
    }
  }

  /**
   * 2FAの有効化
   */
  async enable2FA(
    userId: string,
    userEmail: string,
    secret: string,
    verificationCode: string,
    backupCodes: string[]
  ): Promise<boolean> {
    // 設定確認のためにコードを検証
    const isValid = await this.totpGenerator.verifyTOTP(secret, verificationCode)
    
    if (!isValid) {
      await this.auditLogger.log(
        AuditEventType.AUTH_FAILED_2FA,
        `2FA有効化失敗（無効なコード）: ${userEmail}`,
        { userId, email: userEmail }
      )
      return false
    }

    // 2FA設定を保存
    const config: TwoFactorConfig = {
      secret,
      backupCodes: backupCodes.map(code => code),
      isEnabled: true,
      setupAt: new Date()
    }

    this.save2FAConfig(userId, config)

    // 監査ログに記録
    await this.auditLogger.log(
      AuditEventType.SECURITY_2FA_ENABLED,
      `2FA有効化完了: ${userEmail}`,
      {
        userId,
        email: userEmail,
        backupCodesCount: backupCodes.length,
        timestamp: new Date().toISOString()
      }
    )

    return true
  }

  /**
   * 2FAの無効化
   */
  async disable2FA(userId: string, userEmail: string, verificationCode: string): Promise<boolean> {
    const config = this.get2FAConfig(userId)
    if (!config || !config.isEnabled) {
      return false
    }

    // 現在のTOTPコードまたはバックアップコードで検証
    const verificationResult = await this.verify2FACode(userId, verificationCode)
    
    if (!verificationResult.isValid) {
      await this.auditLogger.log(
        AuditEventType.AUTH_FAILED_2FA,
        `2FA無効化失敗（無効なコード）: ${userEmail}`,
        { userId, email: userEmail }
      )
      return false
    }

    // 2FA設定を削除
    this.remove2FAConfig(userId)

    // 監査ログに記録
    await this.auditLogger.log(
      AuditEventType.SECURITY_2FA_DISABLED,
      `2FA無効化完了: ${userEmail}`,
      {
        userId,
        email: userEmail,
        timestamp: new Date().toISOString()
      }
    )

    return true
  }

  /**
   * 2FAコードの検証
   */
  async verify2FACode(userId: string, code: string): Promise<TwoFactorVerificationResult> {
    const config = this.get2FAConfig(userId)
    
    if (!config || !config.isEnabled) {
      return { isValid: false, method: null }
    }

    // TOTPコードで検証
    const isTOTPValid = await this.totpGenerator.verifyTOTP(config.secret, code)
    
    if (isTOTPValid) {
      config.lastUsedAt = new Date()
      this.save2FAConfig(userId, config)
      
      return { 
        isValid: true, 
        method: 'totp',
        remainingBackupCodes: config.backupCodes.length
      }
    }

    // バックアップコードで検証
    const backupCodeIndex = config.backupCodes.findIndex(backupCode => backupCode === code)
    
    if (backupCodeIndex !== -1) {
      // バックアップコードを使用済みにマーク
      config.backupCodes.splice(backupCodeIndex, 1)
      config.lastUsedAt = new Date()
      this.save2FAConfig(userId, config)
      
      // 監査ログに記録
      await this.auditLogger.log(
        AuditEventType.SECURITY_BACKUP_CODE_USED,
        `バックアップコード使用: ユーザーID ${userId}`,
        {
          userId,
          remainingCodes: config.backupCodes.length,
          timestamp: new Date().toISOString()
        }
      )

      return { 
        isValid: true, 
        method: 'backup',
        remainingBackupCodes: config.backupCodes.length
      }
    }

    return { isValid: false, method: null }
  }

  /**
   * 2FA状態の確認
   */
  is2FAEnabled(userId: string): boolean {
    const config = this.get2FAConfig(userId)
    return config?.isEnabled || false
  }

  /**
   * 2FA設定情報の取得
   */
  get2FAStatus(userId: string): {
    isEnabled: boolean
    setupAt?: Date
    lastUsedAt?: Date
    backupCodesCount: number
  } {
    const config = this.get2FAConfig(userId)
    
    if (!config) {
      return { isEnabled: false, backupCodesCount: 0 }
    }

    return {
      isEnabled: config.isEnabled,
      setupAt: config.setupAt,
      lastUsedAt: config.lastUsedAt,
      backupCodesCount: config.backupCodes.length
    }
  }

  /**
   * 新しいバックアップコードの生成
   */
  async regenerateBackupCodes(userId: string, userEmail: string): Promise<string[] | null> {
    const config = this.get2FAConfig(userId)
    if (!config || !config.isEnabled) {
      return null
    }

    const newBackupCodes = this.generateBackupCodes()
    config.backupCodes = newBackupCodes
    this.save2FAConfig(userId, config)

    // 監査ログに記録
    await this.auditLogger.log(
      AuditEventType.SECURITY_BACKUP_CODES_REGENERATED,
      `バックアップコード再生成: ${userEmail}`,
      {
        userId,
        email: userEmail,
        codesCount: newBackupCodes.length,
        timestamp: new Date().toISOString()
      }
    )

    return newBackupCodes
  }

  // プライベートメソッド

  /**
   * バックアップコードの生成
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = []
    
    for (let i = 0; i < 8; i++) {
      const bytes = new Uint8Array(5)
      crypto.getRandomValues(bytes)
      
      // 読みやすい形式で生成（8文字の英数字）
      const code = Array.from(bytes)
        .map(byte => byte.toString(36))
        .join('')
        .substring(0, 8)
        .toUpperCase()
      
      codes.push(code)
    }
    
    return codes
  }

  /**
   * 2FA設定の保存
   */
  private save2FAConfig(userId: string, config: TwoFactorConfig): void {
    try {
      // 実際の実装では暗号化して保存することを推奨
      localStorage.setItem(`2fa_config_${userId}`, JSON.stringify(config))
    } catch (error) {
      console.error('2FA設定の保存に失敗:', error)
    }
  }

  /**
   * 2FA設定の取得
   */
  private get2FAConfig(userId: string): TwoFactorConfig | null {
    try {
      const stored = localStorage.getItem(`2fa_config_${userId}`)
      if (!stored) return null
      
      const config = JSON.parse(stored)
      return {
        ...config,
        setupAt: new Date(config.setupAt),
        lastUsedAt: config.lastUsedAt ? new Date(config.lastUsedAt) : undefined
      }
    } catch (error) {
      console.error('2FA設定の取得に失敗:', error)
      return null
    }
  }

  /**
   * 2FA設定の削除
   */
  private remove2FAConfig(userId: string): void {
    try {
      localStorage.removeItem(`2fa_config_${userId}`)
    } catch (error) {
      console.error('2FA設定の削除に失敗:', error)
    }
  }
}

// エクスポート用インスタンス
export const twoFactorAuthManager = new TwoFactorAuthManager()