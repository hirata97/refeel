/**
 * パスワードセキュリティポリシーの実装
 * Issue #70: 認証・認可システムの強化実装
 */

export interface PasswordPolicy {
  minLength: number
  maxLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  prohibitCommonPasswords: boolean
  prohibitUserInfo: boolean
  maxAttempts: number
  lockoutDuration: number // minutes
}

export interface PasswordValidationResult {
  isValid: boolean
  score: number // 0-100 (strength score)
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

export interface PasswordHistoryEntry {
  userId: string
  passwordHash: string
  createdAt: Date
}

// デフォルトポリシー設定
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  prohibitCommonPasswords: true,
  prohibitUserInfo: true,
  maxAttempts: 5,
  lockoutDuration: 15 // 15分
}

// よく使われる危険なパスワードのリスト（一部）
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123',
  'password123', 'admin', 'letmein', 'welcome', '123123',
  'Password1', 'password1', 'Password@1', 'qwerty123'
]

// 特殊文字の定義
export const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?'

/**
 * パスワード強度チェッククラス
 */
export class PasswordValidator {
  private policy: PasswordPolicy

  constructor(policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY) {
    this.policy = policy
  }

  /**
   * パスワードの包括的な検証
   */
  validatePassword(
    password: string, 
    userEmail?: string,
    userName?: string
  ): PasswordValidationResult {
    const result: PasswordValidationResult = {
      isValid: false,
      score: 0,
      errors: [],
      warnings: [],
      suggestions: []
    }

    // 基本的なバリデーション
    this.validateBasicRequirements(password, result)
    
    // ユーザー情報との関連チェック
    if (userEmail || userName) {
      this.validateUserInfoProhibition(password, result, userEmail, userName)
    }

    // 一般的なパスワードチェック
    this.validateCommonPasswords(password, result)

    // パスワード強度スコア計算
    result.score = this.calculateStrengthScore(password)

    // 総合判定
    result.isValid = result.errors.length === 0

    // 改善提案の生成
    this.generateSuggestions(password, result)

    return result
  }

  /**
   * 基本要件の検証
   */
  private validateBasicRequirements(
    password: string, 
    result: PasswordValidationResult
  ): void {
    // 長さチェック
    if (password.length < this.policy.minLength) {
      result.errors.push(`パスワードは${this.policy.minLength}文字以上である必要があります`)
    }
    if (password.length > this.policy.maxLength) {
      result.errors.push(`パスワードは${this.policy.maxLength}文字以下である必要があります`)
    }

    // 大文字チェック
    if (this.policy.requireUppercase && !/[A-Z]/.test(password)) {
      result.errors.push('大文字を1文字以上含む必要があります')
    }

    // 小文字チェック
    if (this.policy.requireLowercase && !/[a-z]/.test(password)) {
      result.errors.push('小文字を1文字以上含む必要があります')
    }

    // 数字チェック
    if (this.policy.requireNumbers && !/\d/.test(password)) {
      result.errors.push('数字を1文字以上含む必要があります')
    }

    // 特殊文字チェック
    if (this.policy.requireSpecialChars && !new RegExp(`[${SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(password)) {
      result.errors.push(`特殊文字（${SPECIAL_CHARS}）を1文字以上含む必要があります`)
    }
  }

  /**
   * ユーザー情報禁止チェック
   */
  private validateUserInfoProhibition(
    password: string,
    result: PasswordValidationResult,
    userEmail?: string,
    userName?: string
  ): void {
    if (!this.policy.prohibitUserInfo) return

    const lowerPassword = password.toLowerCase()

    if (userEmail) {
      const emailParts = userEmail.toLowerCase().split('@')
      const localPart = emailParts[0]
      
      if (lowerPassword.includes(localPart) && localPart.length > 3) {
        result.errors.push('パスワードにメールアドレスの一部を含めることはできません')
      }
    }

    if (userName) {
      const lowerUserName = userName.toLowerCase()
      if (lowerPassword.includes(lowerUserName) && lowerUserName.length > 3) {
        result.errors.push('パスワードにユーザー名を含めることはできません')
      }
    }
  }

  /**
   * 一般的なパスワード禁止チェック
   */
  private validateCommonPasswords(
    password: string,
    result: PasswordValidationResult
  ): void {
    if (!this.policy.prohibitCommonPasswords) return

    const lowerPassword = password.toLowerCase()
    
    // 完全一致または長い一般的パスワードが含まれる場合のみ拒否
    if (COMMON_PASSWORDS.some(common => {
      const lowerCommon = common.toLowerCase()
      return lowerPassword === lowerCommon || 
             (lowerCommon.length >= 6 && lowerPassword.includes(lowerCommon))
    })) {
      result.errors.push('このパスワードは一般的すぎるため使用できません')
    }

    // 連続する文字や数字のチェック
    if (/(.)\1{2,}/.test(password)) {
      result.warnings.push('同じ文字の連続は避けることをお勧めします')
    }

    // 連続する数字のチェック
    if (/123|234|345|456|567|678|789|890/.test(password)) {
      result.warnings.push('連続する数字は避けることをお勧めします')
    }

    // キーボード配列のチェック
    if (/qwerty|asdf|zxcv/.test(lowerPassword)) {
      result.warnings.push('キーボード配列のパターンは避けることをお勧めします')
    }
  }

  /**
   * パスワード強度スコア計算（0-100）
   */
  private calculateStrengthScore(password: string): number {
    let score = 0

    // 基本長さスコア（最大25点）
    if (password.length >= 8) score += 10
    if (password.length >= 12) score += 5
    if (password.length >= 16) score += 5
    if (password.length >= 20) score += 5

    // 文字種類による加点
    if (/[a-z]/.test(password)) score += 10
    if (/[A-Z]/.test(password)) score += 10
    if (/\d/.test(password)) score += 10
    if (new RegExp(`[${SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(password)) score += 15

    // 多様性による加点（最大20点）
    const uniqueChars = new Set(password).size
    score += Math.min(uniqueChars * 1.5, 20)

    // 長さボーナス（12文字以上で追加点）
    if (password.length >= 12) {
      score += Math.min((password.length - 12) * 2, 10)
    }

    // パターン分析による減点
    if (/(.)\1{2,}/.test(password)) score -= 10
    if (/123|234|345|456|567|678|789|890/.test(password)) score -= 15
    if (/qwerty|asdf|zxcv/i.test(password)) score -= 15

    // 短いパスワードへの追加ペナルティ
    if (password.length < 8) score -= 20
    if (password.length < 6) score -= 30

    return Math.max(0, Math.min(100, score))
  }

  /**
   * 改善提案の生成
   */
  private generateSuggestions(
    password: string,
    result: PasswordValidationResult
  ): void {
    if (result.score < 50) {
      result.suggestions.push('パスワードをより長く、複雑にすることをお勧めします')
    }

    if (password.length < 12) {
      result.suggestions.push('12文字以上のパスワードを使用することをお勧めします')
    }

    if (!/[A-Z]/.test(password)) {
      result.suggestions.push('大文字を追加してください')
    }

    if (!/[a-z]/.test(password)) {
      result.suggestions.push('小文字を追加してください')
    }

    if (!/\d/.test(password)) {
      result.suggestions.push('数字を追加してください')
    }

    if (!new RegExp(`[${SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(password)) {
      result.suggestions.push('特殊文字を追加してください')
    }

    if (result.score >= 80) {
      result.suggestions.push('優秀なパスワード強度です！')
    }
  }

  /**
   * パスワード強度の文字列表現
   */
  getStrengthLabel(score: number): string {
    if (score >= 80) return '非常に強い'
    if (score >= 60) return '強い'
    if (score >= 40) return '普通'
    if (score >= 20) return '弱い'
    return '非常に弱い'
  }

  /**
   * パスワードハッシュ化（bcrypt使用）
   * 注意: 実際のハッシュ化はSupabaseが行うため、これは検証用
   */
  async hashPassword(password: string): Promise<string> {
    // bcryptライブラリが必要な場合のプレースホルダー
    // 実際の実装では適切なハッシュライブラリを使用
    const encoder = new TextEncoder()
    const data = encoder.encode(password + 'salt')
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
}

/**
 * パスワード履歴管理クラス
 */
export class PasswordHistoryManager {
  private readonly maxHistorySize = 5 // 過去5つのパスワードを保持

  /**
   * パスワード履歴への追加
   */
  async addToHistory(userId: string, passwordHash: string): Promise<void> {
    const history = this.getHistory(userId)
    
    // 新しいエントリを追加
    history.unshift({
      userId,
      passwordHash,
      createdAt: new Date()
    })

    // 履歴サイズ制限
    if (history.length > this.maxHistorySize) {
      history.splice(this.maxHistorySize)
    }

    // ローカルストレージに保存（実際の実装では暗号化が必要）
    this.saveHistory(userId, history)
  }

  /**
   * パスワード再利用チェック
   */
  async isPasswordReused(userId: string, passwordHash: string): Promise<boolean> {
    const history = this.getHistory(userId)
    return history.some(entry => entry.passwordHash === passwordHash)
  }

  /**
   * 履歴の取得
   */
  private getHistory(userId: string): PasswordHistoryEntry[] {
    try {
      const stored = localStorage.getItem(`pwd_history_${userId}`)
      if (!stored) return []
      
      const history = JSON.parse(stored)
      return history.map((entry: Partial<PasswordHistoryEntry> & { createdAt: string }) => ({
        ...entry,
        createdAt: new Date(entry.createdAt)
      }))
    } catch (error) {
      console.warn('パスワード履歴の取得に失敗:', error)
      return []
    }
  }

  /**
   * 履歴の保存
   */
  private saveHistory(userId: string, history: PasswordHistoryEntry[]): void {
    try {
      localStorage.setItem(`pwd_history_${userId}`, JSON.stringify(history))
    } catch (error) {
      console.warn('パスワード履歴の保存に失敗:', error)
    }
  }

  /**
   * 履歴のクリア
   */
  clearHistory(userId: string): void {
    localStorage.removeItem(`pwd_history_${userId}`)
  }
}

// エクスポート用インスタンス
export const passwordValidator = new PasswordValidator()
export const passwordHistoryManager = new PasswordHistoryManager()