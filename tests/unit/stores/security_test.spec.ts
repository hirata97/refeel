import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSecurityStore } from '@/stores/security'

describe('useSecurityStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('should initialize correctly without 2FA dependencies', () => {
    const securityStore = useSecurityStore()
    
    expect(securityStore).toBeDefined()
    expect(securityStore.lockoutStatus).toBe(null)
    expect(securityStore.passwordValidationResult).toBe(null)
    expect(securityStore.isAccountLocked).toBe(false)
    
    // 2FA関連のプロパティが存在しないことを確認
    expect('twoFactorRequired' in securityStore).toBe(false)
    expect('pendingTwoFactorSessionId' in securityStore).toBe(false)
    expect('setup2FA' in securityStore).toBe(false)
    expect('enable2FA' in securityStore).toBe(false)
  })

  it('should have all expected security methods', () => {
    const securityStore = useSecurityStore()
    
    // セキュリティ機能メソッドが存在することを確認
    expect(typeof securityStore.performInputSecurityCheck).toBe('function')
    expect(typeof securityStore.validatePassword).toBe('function')
    expect(typeof securityStore.checkLockoutStatus).toBe('function')
    expect(typeof securityStore.recordLoginAttempt).toBe('function')
    expect(typeof securityStore.shouldLockAccount).toBe('function')
    expect(typeof securityStore.lockAccount).toBe('function')
    expect(typeof securityStore.addToPasswordHistory).toBe('function')
    expect(typeof securityStore.isPasswordReused).toBe('function')
    expect(typeof securityStore.createSession).toBe('function')
    expect(typeof securityStore.terminateSession).toBe('function')
    expect(typeof securityStore.logSecurityEvent).toBe('function')
  })

  it('should validate password correctly', () => {
    const securityStore = useSecurityStore()
    
    const result = securityStore.validatePassword('StrongP@ssw0rd123')
    expect(result.isValid).toBe(true)
    expect(result.strength).toBe('strong')
    
    const weakResult = securityStore.validatePassword('weak')
    expect(weakResult.isValid).toBe(false)
    expect(weakResult.strength).toBe('very-weak')
  })

  it('should perform security check on input', () => {
    const securityStore = useSecurityStore()
    
    const maliciousInput = '<script>alert("xss")</script>Hello'
    const result = securityStore.performInputSecurityCheck(maliciousInput)
    expect(result).not.toContain('<script>')
    expect(result).toBe('Hello')
  })
})