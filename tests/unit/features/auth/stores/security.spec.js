import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSecurityStore } from '@features/auth/stores/security'

// Auth utilsをモック
vi.mock('@features/auth', () => ({
  accountLockoutManager: {
    checkLockoutStatus: vi.fn(),
    recordLoginAttempt: vi.fn(),
    shouldLockAccount: vi.fn(),
    lockAccount: vi.fn(),
  },
  twoFactorAuthManager: {
    is2FAEnabled: vi.fn(),
    setup2FA: vi.fn(),
    enable2FA: vi.fn(),
    disable2FA: vi.fn(),
    verify2FACode: vi.fn(),
    regenerateBackupCodes: vi.fn(),
  },
  passwordValidator: {
    validatePassword: vi.fn(),
    hashPassword: vi.fn(),
    getStrengthLabel: vi.fn(),
  },
  passwordHistoryManager: {
    addToHistory: vi.fn(),
    isPasswordReused: vi.fn(),
  },
  enhancedSessionManager: {
    createSession: vi.fn(),
    terminateSession: vi.fn(),
    getActiveUserSessions: vi.fn(),
    getUserDevices: vi.fn(),
    terminateAllUserSessions: vi.fn(),
    getSecurityStats: vi.fn(),
  },
  auditLogger: {
    log: vi.fn(),
  },
  performSecurityCheck: vi.fn(),
  AuditEventType: {
    AUTH_LOGIN: 'auth_login',
    AUTH_LOGOUT: 'auth_logout',
    PASSWORD_CHANGED: 'password_changed',
  }
}))

describe.skip('SecurityStore', () => {
  let securityStore

  beforeEach(() => {
    setActivePinia(createPinia())
    securityStore = useSecurityStore()
  })

  describe('initialization', () => {
    it('should initialize with default state', () => {
      expect(securityStore.lockoutStatus).toBe(null)
      expect(securityStore.passwordValidationResult).toBe(null)
      expect(securityStore.twoFactorRequired).toBe(false)
      expect(securityStore.pendingTwoFactorSessionId).toBe(null)
    })

    it('should have computed properties', () => {
      expect(securityStore.isAccountLocked).toBe(false)
      expect(typeof securityStore.is2FAEnabled).toBe('function')
      expect(typeof securityStore.securityStats).toBe('function')
    })
  })

  describe('security checks', () => {
    it('should perform input security check', () => {
      const { performSecurityCheck } = vi.requireMocked('@features/auth')
      const mockResult = { isSecure: true, threats: [] }
      performSecurityCheck.mockReturnValue(mockResult)

      const result = securityStore.performInputSecurityCheck('test input')
      
      expect(performSecurityCheck).toHaveBeenCalledWith('test input')
      expect(result).toEqual(mockResult)
    })
  })

  describe('account lockout management', () => {
    it('should check lockout status', async () => {
      const { accountLockoutManager } = vi.requireMocked('@features/auth')
      const mockStatus = { isLocked: false, failedAttempts: 0 }
      accountLockoutManager.checkLockoutStatus.mockResolvedValue(mockStatus)

      const result = await securityStore.checkLockoutStatus('test@example.com')

      expect(accountLockoutManager.checkLockoutStatus).toHaveBeenCalledWith('test@example.com')
      expect(securityStore.lockoutStatus).toEqual(mockStatus)
      expect(result).toEqual(mockStatus)
    })

    it('should record login attempt', async () => {
      const { accountLockoutManager } = vi.requireMocked('@features/auth')
      
      await securityStore.recordLoginAttempt('test@example.com', true, '127.0.0.1', 'Test Agent')

      expect(accountLockoutManager.recordLoginAttempt).toHaveBeenCalledWith(
        'test@example.com',
        true,
        '127.0.0.1',
        'Test Agent'
      )
    })
  })

  describe('password management', () => {
    it('should validate password', () => {
      const { passwordValidator } = vi.requireMocked('@features/auth')
      const mockResult = { 
        isValid: true, 
        score: 4, 
        errors: [], 
        suggestions: [] 
      }
      passwordValidator.validatePassword.mockReturnValue(mockResult)

      const result = securityStore.validatePassword('test123', 'test@example.com')

      expect(passwordValidator.validatePassword).toHaveBeenCalledWith('test123', 'test@example.com', undefined)
      expect(securityStore.passwordValidationResult).toEqual(mockResult)
      expect(result).toEqual(mockResult)
    })

    it('should hash password', async () => {
      const { passwordValidator } = vi.requireMocked('@features/auth')
      passwordValidator.hashPassword.mockResolvedValue('hashed_password')

      const result = await securityStore.hashPassword('test123')

      expect(passwordValidator.hashPassword).toHaveBeenCalledWith('test123')
      expect(result).toBe('hashed_password')
    })
  })

  describe('2FA management', () => {
    it('should setup 2FA', async () => {
      const { twoFactorAuthManager } = vi.requireMocked('@features/auth')
      const mockSetupResult = { 
        secret: 'SECRET123',
        qrCode: 'data:image/png;base64,abc123',
        backupCodes: ['code1', 'code2'] 
      }
      twoFactorAuthManager.setup2FA.mockResolvedValue(mockSetupResult)

      const result = await securityStore.setup2FA('user123', 'test@example.com')

      expect(twoFactorAuthManager.setup2FA).toHaveBeenCalledWith('user123', 'test@example.com')
      expect(result).toEqual(mockSetupResult)
    })

    it('should enable 2FA and clear pending state on success', async () => {
      const { twoFactorAuthManager } = vi.requireMocked('@features/auth')
      securityStore.setTwoFactorRequired(true)
      securityStore.setPendingTwoFactorSessionId('session123')

      twoFactorAuthManager.enable2FA.mockResolvedValue({ success: true })

      const result = await securityStore.enable2FA(
        'user123', 
        'test@example.com', 
        'secret', 
        '123456', 
        ['code1', 'code2']
      )

      expect(twoFactorAuthManager.enable2FA).toHaveBeenCalledWith(
        'user123',
        'test@example.com',
        'secret',
        '123456',
        ['code1', 'code2']
      )
      expect(securityStore.twoFactorRequired).toBe(false)
      expect(securityStore.pendingTwoFactorSessionId).toBe(null)
      expect(result).toEqual({ success: true })
    })

    it('should verify 2FA code', async () => {
      const { twoFactorAuthManager } = vi.requireMocked('@features/auth')
      securityStore.setTwoFactorRequired(true)
      
      twoFactorAuthManager.verify2FACode.mockResolvedValue({ 
        isValid: true, 
        method: 'app' 
      })

      const result = await securityStore.verify2FACode('user123', '123456')

      expect(twoFactorAuthManager.verify2FACode).toHaveBeenCalledWith('user123', '123456')
      expect(securityStore.twoFactorRequired).toBe(false)
      expect(securityStore.pendingTwoFactorSessionId).toBe(null)
      expect(result).toEqual({ isValid: true, method: 'app' })
    })
  })

  describe('session management', () => {
    it('should create session', async () => {
      const { enhancedSessionManager } = vi.requireMocked('@features/auth')
      
      await securityStore.createSession('user123', 'session123', 'Test Agent', '127.0.0.1')

      expect(enhancedSessionManager.createSession).toHaveBeenCalledWith(
        'user123',
        'session123',
        'Test Agent',
        '127.0.0.1'
      )
    })

    it('should terminate session', async () => {
      const { enhancedSessionManager } = vi.requireMocked('@features/auth')
      
      await securityStore.terminateSession('session123', 'user_logout')

      expect(enhancedSessionManager.terminateSession).toHaveBeenCalledWith('session123', 'user_logout')
    })

    it('should get active user sessions', () => {
      const { enhancedSessionManager } = vi.requireMocked('@features/auth')
      const mockSessions = [{ id: 'session1' }, { id: 'session2' }]
      enhancedSessionManager.getActiveUserSessions.mockReturnValue(mockSessions)

      const result = securityStore.getActiveUserSessions('user123')

      expect(enhancedSessionManager.getActiveUserSessions).toHaveBeenCalledWith('user123')
      expect(result).toEqual(mockSessions)
    })
  })

  describe('state management', () => {
    it('should set two factor required', () => {
      securityStore.setTwoFactorRequired(true)
      expect(securityStore.twoFactorRequired).toBe(true)

      securityStore.setTwoFactorRequired(false)
      expect(securityStore.twoFactorRequired).toBe(false)
    })

    it('should set pending two factor session ID', () => {
      securityStore.setPendingTwoFactorSessionId('session123')
      expect(securityStore.pendingTwoFactorSessionId).toBe('session123')

      securityStore.setPendingTwoFactorSessionId(null)
      expect(securityStore.pendingTwoFactorSessionId).toBe(null)
    })

    it('should clear security state', () => {
      // Set some state
      securityStore.lockoutStatus = { isLocked: true, failedAttempts: 3 }
      securityStore.passwordValidationResult = { isValid: false, score: 1, errors: [], suggestions: [] }
      securityStore.setTwoFactorRequired(true)
      securityStore.setPendingTwoFactorSessionId('session123')

      // Clear state
      securityStore.clearSecurityState()

      // Verify state is cleared
      expect(securityStore.lockoutStatus).toBe(null)
      expect(securityStore.passwordValidationResult).toBe(null)
      expect(securityStore.twoFactorRequired).toBe(false)
      expect(securityStore.pendingTwoFactorSessionId).toBe(null)
    })
  })

  describe('audit logging', () => {
    it('should log security events', async () => {
      const { auditLogger, AuditEventType } = vi.requireMocked('@features/auth')
      
      await securityStore.logSecurityEvent(
        AuditEventType.AUTH_LOGIN,
        'User logged in',
        { userId: 'user123' }
      )

      expect(auditLogger.log).toHaveBeenCalledWith(
        AuditEventType.AUTH_LOGIN,
        'User logged in',
        { userId: 'user123' }
      )
    })
  })

  describe('computed properties', () => {
    it('should compute isAccountLocked correctly', () => {
      expect(securityStore.isAccountLocked).toBe(false)

      securityStore.lockoutStatus = { isLocked: true, failedAttempts: 3 }
      expect(securityStore.isAccountLocked).toBe(true)
    })
  })
})