import { PasswordValidationResult } from './types'
import bcrypt from 'bcryptjs'

/**
 * パスワード検証機能
 */
export const passwordValidator = {
  validatePassword(password: string, email?: string, name?: string): PasswordValidationResult {
    const errors: string[] = []
    const feedback: string[] = []
    let score = 0

    // 基本的な長さチェック
    if (password.length < 8) {
      errors.push('パスワードは8文字以上である必要があります')
    } else {
      score += 1
      feedback.push('適切な長さです')
    }

    // 文字種チェック
    if (!/[a-z]/.test(password)) {
      errors.push('小文字を含む必要があります')
    } else {
      score += 1
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('大文字を含む必要があります')
    } else {
      score += 1
    }

    if (!/\d/.test(password)) {
      errors.push('数字を含む必要があります')
    } else {
      score += 1
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('特殊文字を含む必要があります')
    } else {
      score += 1
    }

    // 個人情報との類似性チェック
    if (email && password.toLowerCase().includes(email.split('@')[0].toLowerCase())) {
      errors.push('メールアドレスと類似しています')
      score = Math.max(0, score - 2)
    }

    if (name && password.toLowerCase().includes(name.toLowerCase())) {
      errors.push('名前と類似しています')
      score = Math.max(0, score - 2)
    }

    // 一般的なパスワードチェック
    const commonPasswords = ['password', 'password123', '123456789', 'qwerty']
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('一般的すぎるパスワードです')
      score = Math.max(0, score - 3)
    }

    const strength = this.getStrengthFromScore(score)
    const isValid = errors.length === 0 && score >= 3

    return {
      isValid,
      score,
      feedback,
      errors,
      strength,
    }
  },

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  },

  getStrengthLabel(score: number): string {
    if (score <= 1) return '非常に弱い'
    if (score <= 2) return '弱い'
    if (score <= 3) return '普通'
    if (score <= 4) return '良い'
    return '強い'
  },

  getStrengthFromScore(score: number): PasswordValidationResult['strength'] {
    if (score <= 1) return 'very-weak'
    if (score <= 2) return 'weak'
    if (score <= 3) return 'fair'
    if (score <= 4) return 'good'
    return 'strong'
  },
}

/**
 * パスワード履歴管理
 */
export const passwordHistoryManager = {
  async addToHistory(userId: string, passwordHash: string): Promise<void> {
    const key = `password_history_${userId}`
    const stored = localStorage.getItem(key)
    const history = stored ? JSON.parse(stored) : []

    history.unshift({
      hash: passwordHash,
      createdAt: new Date().toISOString(),
    })

    // 最新5個まで保持
    const trimmed = history.slice(0, 5)
    localStorage.setItem(key, JSON.stringify(trimmed))
  },

  async isPasswordReused(userId: string, passwordHash: string): Promise<boolean> {
    const key = `password_history_${userId}`
    const stored = localStorage.getItem(key)

    if (!stored) return false

    const history = JSON.parse(stored)
    return history.some((entry: { hash: string; createdAt: string }) => entry.hash === passwordHash)
  },
}
