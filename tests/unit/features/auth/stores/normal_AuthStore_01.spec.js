import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@features/auth'

// モックの設定
vi.mock('@core/lib/supabase', () => ({
  default: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      refreshSession: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn()
    }
  }
}))

vi.mock('@shared/utils/sanitization', () => ({
  performSecurityCheck: vi.fn(() => ({ isSecure: true, threats: [] })),
  sanitizeInputData: vi.fn((data) => data)
}))

vi.mock('@/features/auth/services/account-lockout', () => ({
  default: {
    checkLockoutStatus: vi.fn(() => ({ isLocked: false, failedAttempts: 0 })),
    recordLoginAttempt: vi.fn(),
    shouldLockAccount: vi.fn(() => false),
    lockAccount: vi.fn()
  }
}))

vi.mock('@/features/auth/services/audit-logger', () => ({
  default: {
    log: vi.fn()
  }
}))

vi.mock('@/features/auth/services/enhanced-session-management', () => ({
  default: {
    createSession: vi.fn(),
    terminateSession: vi.fn(),
    terminateAllUserSessions: vi.fn(),
    getActiveUserSessions: vi.fn(() => []),
    getUserDevices: vi.fn(() => []),
    getSecurityStats: vi.fn(() => null)
  }
}))

vi.mock('@/utils/two-factor-auth', () => ({
  default: {
    is2FAEnabled: vi.fn(() => false),
    setup2FA: vi.fn(),
    enable2FA: vi.fn(),
    disable2FA: vi.fn(),
    verify2FACode: vi.fn(),
    regenerateBackupCodes: vi.fn()
  }
}))

vi.mock('@/features/auth/services/password-policy', () => ({
  default: {
    validatePassword: vi.fn(() => ({ 
      isValid: true, 
      score: 4, 
      errors: [] 
    })),
    hashPassword: vi.fn((password) => `hashed_${password}`),
    getStrengthLabel: vi.fn(() => 'Strong')
  }
}))

describe('AuthStore - 正常系', () => {
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.clearAllMocks()
    // localStorageのモック
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      }
    })
  })

  describe('初期状態', () => {
    it('初期状態が正しく設定されている', () => {
      expect(authStore.user).toBeNull()
      expect(authStore.session).toBeNull()
      expect(authStore.loading).toBe(true)
      expect(authStore.error).toBeNull()
      expect(authStore.isAuthenticated).toBe(false)
    })

    it('初期のセキュリティ状態が正しく設定されている', () => {
      expect(authStore.lockoutStatus).toBeNull()
      expect(authStore.passwordValidationResult).toBeNull()
      expect(authStore.twoFactorRequired).toBe(false)
      expect(authStore.pendingTwoFactorSessionId).toBeNull()
      expect(authStore.isAccountLocked).toBe(false)
      expect(authStore.is2FAEnabled).toBe(false)
    })
  })

  describe('状態管理メソッド', () => {
    it('setUser メソッドが正しく動作する', () => {
      const mockUser = { 
        id: 'user-1', 
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
        last_sign_in_at: '2023-01-01T00:00:00Z'
      }
      
      authStore.setUser(mockUser)
      
      expect(authStore.user).toEqual(mockUser)
    })

    it('setSession メソッドが正しく動作する', () => {
      const mockSession = {
        access_token: 'token-123',
        expires_at: Date.now() / 1000 + 3600, // 1時間後
        user: {
          id: 'user-1',
          email: 'test@example.com'
        }
      }
      
      authStore.setSession(mockSession)
      
      expect(authStore.session).toEqual(mockSession)
      expect(authStore.user).toEqual(mockSession.user)
      expect(authStore.sessionExpiresAt).toBeDefined()
    })

    it('setLoading メソッドが正しく動作する', () => {
      authStore.setLoading(false)
      expect(authStore.loading).toBe(false)
      
      authStore.setLoading(true)
      expect(authStore.loading).toBe(true)
    })

    it('setError メソッドが正しく動作する', () => {
      const errorMessage = 'テストエラー'
      authStore.setError(errorMessage)
      expect(authStore.error).toBe(errorMessage)
    })

    it('clearError メソッドが正しく動作する', () => {
      authStore.setError('エラー')
      authStore.clearError()
      expect(authStore.error).toBeNull()
    })
  })

  describe('計算プロパティ', () => {
    it('userProfile が正しく計算される', () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        last_sign_in_at: '2023-01-01T00:00:00Z',
        created_at: '2023-01-01T00:00:00Z'
      }
      
      authStore.setUser(mockUser)
      
      const profile = authStore.userProfile
      expect(profile).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        lastSignIn: '2023-01-01T00:00:00Z',
        createdAt: '2023-01-01T00:00:00Z'
      })
    })

    it('userProfileがnullユーザーでnullを返す', () => {
      authStore.setUser(null)
      expect(authStore.userProfile).toBeNull()
    })

    it('isAuthenticated が正しく計算される - 認証済みの場合', () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockSession = {
        access_token: 'token-123',
        expires_at: Date.now() / 1000 + 3600, // 1時間後
        user: mockUser
      }
      
      authStore.setUser(mockUser)
      authStore.setSession(mockSession)
      
      expect(authStore.isAuthenticated).toBe(true)
    })

    it('isAuthenticated が正しく計算される - 未認証の場合', () => {
      authStore.setUser(null)
      authStore.setSession(null)
      
      expect(authStore.isAuthenticated).toBe(false)
    })

    it('isSessionExpired が正しく計算される', () => {
      // 期限切れセッション
      authStore.sessionExpiresAt = Date.now() - 1000 // 1秒前
      expect(authStore.isSessionExpired).toBe(true)
      
      // 有効セッション
      authStore.sessionExpiresAt = Date.now() + 3600000 // 1時間後
      expect(authStore.isSessionExpired).toBe(false)
    })

    it('timeUntilExpiry が正しく計算される', () => {
      const futureTime = Date.now() + 60000 // 1分後
      authStore.sessionExpiresAt = futureTime
      
      const timeUntil = authStore.timeUntilExpiry
      expect(timeUntil).toBeGreaterThan(50000) // 約50秒以上
      expect(timeUntil).toBeLessThanOrEqual(60000) // 60秒以下
    })
  })

  describe('ユーティリティメソッド', () => {
    it('updateLastActivity が正しく動作する', () => {
      const beforeTime = authStore.lastActivity
      
      // 少し待ってから実行
      setTimeout(() => {
        authStore.updateLastActivity()
        expect(authStore.lastActivity).toBeGreaterThan(beforeTime)
      }, 10)
    })

    it('setSessionTimeout が正しく動作する', () => {
      const newTimeout = 60 * 60 * 1000 // 1時間
      authStore.setSessionTimeout(newTimeout)
      expect(authStore.sessionTimeout).toBe(newTimeout)
    })

    it('getClientIP が正しく動作する', async () => {
      const ip = await authStore.getClientIP()
      expect(ip).toBe('127.0.0.1') // 開発環境用の固定IP
    })
  })

  describe('セッション検証', () => {
    it('validateSession - 有効なセッションの場合', async () => {
      // Supabaseクライアントのモック
      const { default: supabase } = await import('@core/lib/supabase')
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null
      })

      // セッションと最終活動時間を設定
      const mockSession = {
        access_token: 'token-123',
        expires_at: Date.now() / 1000 + 3600,
        user: { id: 'user-1', email: 'test@example.com' }
      }
      authStore.setSession(mockSession)
      authStore.updateLastActivity()

      const isValid = await authStore.validateSession()
      expect(isValid).toBe(true)
    })

    it('validateSession - セッションがnullの場合', async () => {
      authStore.setSession(null)
      const isValid = await authStore.validateSession()
      expect(isValid).toBe(false)
    })
  })

  describe('セッション管理', () => {
    it('regenerateSession が正しく動作する', async () => {
      const { default: supabase } = await import('@core/lib/supabase')
      const newSession = {
        access_token: 'new-token-456',
        expires_at: Date.now() / 1000 + 3600,
        user: { id: 'user-1', email: 'test@example.com' }
      }
      
      supabase.auth.refreshSession.mockResolvedValue({
        data: { session: newSession },
        error: null
      })

      // 既存セッションを設定
      authStore.setSession({
        access_token: 'old-token',
        expires_at: Date.now() / 1000 + 1800,
        user: { id: 'user-1', email: 'test@example.com' }
      })

      const result = await authStore.regenerateSession()
      
      expect(result.success).toBe(true)
      expect(authStore.session.access_token).toBe('new-token-456')
    })

    it('invalidateSession が正しく動作する', async () => {
      const { default: supabase } = await import('@core/lib/supabase')
      supabase.auth.signOut.mockResolvedValue({ error: null })

      authStore.setUser({ id: 'user-1', email: 'test@example.com' })
      authStore.setSession({ access_token: 'token-123' })

      await authStore.invalidateSession()

      expect(authStore.user).toBeNull()
      expect(authStore.session).toBeNull()
      expect(authStore.sessionExpiresAt).toBeNull()
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('user')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('lastActivity')
    })
  })

  describe('初期化プロセス', () => {
    it('initialize が正しく動作する - セッションあり', async () => {
      const { default: supabase } = await import('@core/lib/supabase')
      const mockSession = {
        access_token: 'token-123',
        expires_at: Date.now() / 1000 + 3600,
        user: { id: 'user-1', email: 'test@example.com' }
      }

      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })
      
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockSession.user },
        error: null
      })

      await authStore.initialize()

      expect(authStore.session).toEqual(mockSession)
      expect(authStore.user).toEqual(mockSession.user)
      expect(authStore.loading).toBe(false)
    })

    it('initialize が正しく動作する - セッションなし', async () => {
      const { default: supabase } = await import('@core/lib/supabase')
      
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      await authStore.initialize()

      expect(authStore.session).toBeNull()
      expect(authStore.user).toBeNull()
      expect(authStore.loading).toBe(false)
    })
  })
})