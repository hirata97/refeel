import { describe, it, expect, beforeEach } from 'vitest'
import { 
  passwordValidator, 
  accountLockoutManager, 
  performSecurityCheck,
  AuditEventType 
} from '@/utils/auth'

describe('Security Utils', () => {
  describe('passwordValidator', () => {
    it('should validate strong password', () => {
      const result = passwordValidator.validatePassword('StrongP@ssw0rd123')
      expect(result.isValid).toBe(true)
      expect(result.strength).toBe('strong')
      expect(result.score).toBeGreaterThanOrEqual(4)
    })

    it('should reject weak password', () => {
      const result = passwordValidator.validatePassword('weak')
      expect(result.isValid).toBe(false)
      expect(result.strength).toBe('very-weak')
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should detect email similarity', () => {
      const result = passwordValidator.validatePassword('testuser123', 'testuser@example.com')
      expect(result.errors).toContain('メールアドレスと類似しています')
    })

    it('should generate strength labels correctly', () => {
      expect(passwordValidator.getStrengthLabel(1)).toBe('非常に弱い')
      expect(passwordValidator.getStrengthLabel(3)).toBe('普通')
      expect(passwordValidator.getStrengthLabel(5)).toBe('強い')
    })
  })

  describe('accountLockoutManager', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear()
    })

    it('should check lockout status for new user', async () => {
      const status = await accountLockoutManager.checkLockoutStatus('test@example.com')
      expect(status.isLocked).toBe(false)
      expect(status.attemptCount).toBe(0)
    })

    it('should determine if account should be locked after multiple failures', async () => {
      const email = 'test@example.com'
      
      // Record 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await accountLockoutManager.recordLoginAttempt(email, false, '127.0.0.1', 'test-agent')
      }
      
      const shouldLock = await accountLockoutManager.shouldLockAccount(email)
      expect(shouldLock).toBe(true)
    })
  })

  describe('performSecurityCheck', () => {
    it('should sanitize XSS attempts', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello'
      const result = performSecurityCheck(maliciousInput)
      expect(result).not.toContain('<script>')
      expect(result).toBe('Hello')
    })

    it('should remove SQL injection patterns', () => {
      const maliciousInput = "'; DROP TABLE users; --"
      const result = performSecurityCheck(maliciousInput)
      expect(result).not.toContain('DROP')
      expect(result).not.toContain('--')
    })

    it('should handle normal input', () => {
      const normalInput = 'This is normal text 123'
      const result = performSecurityCheck(normalInput)
      expect(result).toBe(normalInput)
    })
  })

  describe('AuditEventType', () => {
    it('should have required event types', () => {
      expect(AuditEventType.LOGIN_SUCCESS).toBe('login_success')
      expect(AuditEventType.LOGIN_FAILURE).toBe('login_failure')
      expect(AuditEventType.ACCOUNT_LOCKED).toBe('account_locked')
      expect(AuditEventType.PASSWORD_CHANGE).toBe('password_change')
    })
  })
})