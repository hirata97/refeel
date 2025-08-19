import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CSRFProtection } from '@/utils/security'

describe('CSRFProtection', () => {
  beforeEach(() => {
    // テスト前にトークンをクリア
    CSRFProtection.clearAllTokens()
  })

  afterEach(() => {
    // テスト後にトークンをクリア
    CSRFProtection.clearAllTokens()
    vi.restoreAllMocks()
  })

  describe('generateToken', () => {
    it('should generate a valid CSRF token', () => {
      const token = CSRFProtection.generateToken()
      
      expect(token).toHaveProperty('token')
      expect(token).toHaveProperty('timestamp')
      expect(token).toHaveProperty('expires')
      
      expect(typeof token.token).toBe('string')
      expect(token.token).toHaveLength(64) // 32 bytes * 2 (hex)
      expect(token.timestamp).toBeTypeOf('number')
      expect(token.expires).toBeTypeOf('number')
      expect(token.expires).toBeGreaterThan(token.timestamp)
    })

    it('should generate unique tokens', () => {
      const token1 = CSRFProtection.generateToken()
      const token2 = CSRFProtection.generateToken()
      
      expect(token1.token).not.toBe(token2.token)
    })

    it('should set appropriate expiration time', () => {
      const before = Date.now()
      const token = CSRFProtection.generateToken()
      const after = Date.now()
      
      // トークンは1時間後に期限切れ（3600000ms）
      const expectedMinExpiry = before + 3600000
      const expectedMaxExpiry = after + 3600000
      
      expect(token.expires).toBeGreaterThanOrEqual(expectedMinExpiry)
      expect(token.expires).toBeLessThanOrEqual(expectedMaxExpiry)
    })
  })

  describe('validateToken', () => {
    it('should validate a valid token', () => {
      const token = CSRFProtection.generateToken()
      const isValid = CSRFProtection.validateToken(token.token)
      
      expect(isValid).toBe(true)
    })

    it('should reject an invalid token', () => {
      const isValid = CSRFProtection.validateToken('invalid-token')
      
      expect(isValid).toBe(false)
    })

    it('should reject an expired token', () => {
      // 過去の時刻でモック
      const pastTime = Date.now() - 7200000 // 2時間前
      vi.spyOn(Date, 'now').mockReturnValue(pastTime)
      
      const token = CSRFProtection.generateToken()
      
      // 現在時刻に戻す
      vi.spyOn(Date, 'now').mockReturnValue(Date.now())
      
      const isValid = CSRFProtection.validateToken(token.token)
      expect(isValid).toBe(false)
    })

    it('should remove invalid tokens from storage', () => {
      const token = CSRFProtection.generateToken()
      
      // 時刻を進めてトークンを期限切れにする
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 7200000)
      
      const isValid1 = CSRFProtection.validateToken(token.token)
      expect(isValid1).toBe(false)
      
      // 元の時刻に戻しても、削除されたトークンは無効
      vi.spyOn(Date, 'now').mockReturnValue(Date.now())
      const isValid2 = CSRFProtection.validateToken(token.token)
      expect(isValid2).toBe(false)
    })
  })

  describe('addTokenToHeaders', () => {
    it('should add CSRF token to headers', () => {
      const headers = CSRFProtection.addTokenToHeaders()
      
      expect(headers).toHaveProperty('X-CSRF-Token')
      expect(typeof headers['X-CSRF-Token']).toBe('string')
      expect(headers['X-CSRF-Token']).toHaveLength(64)
    })

    it('should generate a new token each time', () => {
      const headers1 = CSRFProtection.addTokenToHeaders()
      const headers2 = CSRFProtection.addTokenToHeaders()
      
      expect(headers1['X-CSRF-Token']).not.toBe(headers2['X-CSRF-Token'])
    })
  })

  describe('cleanupExpiredTokens', () => {
    it('should remove expired tokens', () => {
      // 有効なトークンを生成
      const validToken = CSRFProtection.generateToken()
      
      // 期限切れのトークンを生成（過去の時刻でモック）
      const pastTime = Date.now() - 7200000
      vi.spyOn(Date, 'now').mockReturnValue(pastTime)
      const expiredToken = CSRFProtection.generateToken()
      
      // 現在時刻に戻す
      vi.spyOn(Date, 'now').mockReturnValue(Date.now())
      
      // クリーンアップ前は期限切れトークンも存在
      expect(CSRFProtection.validateToken(expiredToken.token)).toBe(false) // 既に期限切れなので無効
      expect(CSRFProtection.validateToken(validToken.token)).toBe(true)
      
      // クリーンアップ実行
      CSRFProtection.cleanupExpiredTokens()
      
      // 有効なトークンは残る
      expect(CSRFProtection.validateToken(validToken.token)).toBe(true)
    })

    it('should not affect valid tokens', () => {
      const token1 = CSRFProtection.generateToken()
      const token2 = CSRFProtection.generateToken()
      
      CSRFProtection.cleanupExpiredTokens()
      
      expect(CSRFProtection.validateToken(token1.token)).toBe(true)
      expect(CSRFProtection.validateToken(token2.token)).toBe(true)
    })
  })

  describe('clearAllTokens', () => {
    it('should clear all tokens', () => {
      const token1 = CSRFProtection.generateToken()
      const token2 = CSRFProtection.generateToken()
      
      // トークンが有効であることを確認
      expect(CSRFProtection.validateToken(token1.token)).toBe(true)
      expect(CSRFProtection.validateToken(token2.token)).toBe(true)
      
      // 全てクリア
      CSRFProtection.clearAllTokens()
      
      // 全てのトークンが無効になる
      expect(CSRFProtection.validateToken(token1.token)).toBe(false)
      expect(CSRFProtection.validateToken(token2.token)).toBe(false)
    })
  })
})