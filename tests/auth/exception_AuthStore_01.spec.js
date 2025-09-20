import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

// モックの設定
vi.mock('@/lib/supabase', () => ({
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
  },
  supabase: {
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

vi.mock('@/utils/sanitization', () => ({
  performSecurityCheck: vi.fn(),
  sanitizeInputData: vi.fn((data) => data)
}))

vi.mock('@/utils/account-lockout', () => ({
  default: {
    checkLockoutStatus: vi.fn(),
    recordLoginAttempt: vi.fn(),
    shouldLockAccount: vi.fn(),
    lockAccount: vi.fn()
  },
  accountLockoutManager: {
    checkLockoutStatus: vi.fn(),
    recordLoginAttempt: vi.fn(),
    shouldLockAccount: vi.fn(),
    lockAccount: vi.fn()
  }
}))

vi.mock('@/utils/audit-logger', () => ({
  default: {
    log: vi.fn()
  }
}))

vi.mock('@/utils/enhanced-session-management', () => ({
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

vi.mock('@/utils/password-policy', () => ({
  default: {
    validatePassword: vi.fn(),
    hashPassword: vi.fn(),
    getStrengthLabel: vi.fn()
  },
  passwordValidator: {
    validatePassword: vi.fn(),
    hashPassword: vi.fn(),
    getStrengthLabel: vi.fn()
  }
}))

describe('AuthStore - 異常系・エラーハンドリング', () => {
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

  describe('ログイン処理のエラーハンドリング', () => {
    it('signIn - アカウントロックアウト状態でエラーを返す', async () => {
      const { default: accountLockoutManager } = await import('@/utils/account-lockout')
      accountLockoutManager.checkLockoutStatus.mockResolvedValue({
        isLocked: true,
        failedAttempts: 5,
        lockoutEnd: new Date(Date.now() + 300000) // 5分後
      })

      const result = await authStore.signIn('test@example.com', 'password')

      expect(result.success).toBe(false)
      expect(result.error).toContain('アカウントがロックされています')
      expect(authStore.error).toContain('アカウントがロックされています')
    })

    it('signIn - セキュリティチェック失敗でエラーを返す', async () => {
      const { performSecurityCheck } = await import('@/utils/sanitization')
      const { default: accountLockoutManager } = await import('@/utils/account-lockout')
      
      // アカウントロックアウトは通常状態
      accountLockoutManager.checkLockoutStatus.mockResolvedValue({
        isLocked: false,
        failedAttempts: 0
      })

      // セキュリティチェックで脅威を検出
      performSecurityCheck.mockReturnValue({
        isSecure: false,
        threats: ['XSS', 'SQL Injection']
      })

      const result = await authStore.signIn('test@example.com', 'password')

      expect(result.success).toBe(false)
      expect(result.error).toContain('不正な内容が含まれています')
      expect(result.error).toContain('XSS')
    })

    it('signIn - Supabase認証エラーでエラーを返す', async () => {
      const { default: supabase } = await import('@/lib/supabase')
      const { performSecurityCheck } = await import('@/utils/sanitization')
      const { default: accountLockoutManager } = await import('@/utils/account-lockout')

      // 正常な前提条件を設定
      accountLockoutManager.checkLockoutStatus.mockResolvedValue({
        isLocked: false,
        failedAttempts: 0
      })
      performSecurityCheck.mockReturnValue({
        isSecure: true,
        threats: []
      })

      // Supabase認証エラー
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      })

      const result = await authStore.signIn('test@example.com', 'wrong-password')

      expect(result.success).toBe(false)
      expect(authStore.error).toBeDefined()
      expect(accountLockoutManager.recordLoginAttempt).toHaveBeenCalledWith(
        'test@example.com', 
        false, 
        expect.any(String), 
        expect.any(String)
      )
    })

    it('signIn - ネットワークエラーでエラーを返す', async () => {
      const { default: supabase } = await import('@/lib/supabase')
      const { performSecurityCheck } = await import('@/utils/sanitization')
      const { default: accountLockoutManager } = await import('@/utils/account-lockout')

      accountLockoutManager.checkLockoutStatus.mockResolvedValue({
        isLocked: false,
        failedAttempts: 0
      })
      performSecurityCheck.mockReturnValue({
        isSecure: true,
        threats: []
      })

      // ネットワークエラーをシミュレート
      supabase.auth.signInWithPassword.mockRejectedValue(new Error('Network error'))

      const result = await authStore.signIn('test@example.com', 'password')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
      expect(authStore.loading).toBe(false)
    })
  })

  describe('ユーザー登録処理のエラーハンドリング', () => {
    it('signUp - パスワードポリシー違反でエラーを返す', async () => {
      const { performSecurityCheck } = await import('@/utils/sanitization')
      const { default: passwordValidator } = await import('@/utils/password-policy')

      performSecurityCheck.mockReturnValue({
        isSecure: true,
        threats: []
      })

      passwordValidator.validatePassword.mockReturnValue({
        isValid: false,
        score: 1,
        errors: ['パスワードが短すぎます', '数字が含まれていません']
      })

      const result = await authStore.signUp('test@example.com', 'weak')

      expect(result.success).toBe(false)
      expect(result.error).toContain('パスワードポリシー違反')
      expect(result.error).toContain('パスワードが短すぎます')
    })

    it('signUp - Supabase登録エラーでエラーを返す', async () => {
      const { default: supabase } = await import('@/lib/supabase')
      const { performSecurityCheck } = await import('@/utils/sanitization')
      const { default: passwordValidator } = await import('@/utils/password-policy')

      performSecurityCheck.mockReturnValue({
        isSecure: true,
        threats: []
      })
      passwordValidator.validatePassword.mockReturnValue({
        isValid: true,
        score: 4,
        errors: []
      })

      supabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already registered' }
      })

      const result = await authStore.signUp('existing@example.com', 'ValidPassword123!')

      expect(result.success).toBe(false)
      expect(authStore.error).toBeDefined()
    })
  })

  describe('セッション管理のエラーハンドリング', () => {
    it('validateSession - タイムアウトしたセッションを無効化する', async () => {
      const { default: supabase } = await import('@/lib/supabase')
      
      // タイムアウトした最終活動時間を設定
      authStore.lastActivity = Date.now() - (35 * 60 * 1000) // 35分前
      authStore.setSession({
        access_token: 'token-123',
        expires_at: Date.now() / 1000 + 3600,
        user: { id: 'user-1', email: 'test@example.com' }
      })

      supabase.auth.signOut.mockResolvedValue({ error: null })

      const isValid = await authStore.validateSession()

      expect(isValid).toBe(false)
      expect(authStore.session).toBeNull()
      expect(authStore.user).toBeNull()
    })

    it('validateSession - 期限切れセッションを無効化する', async () => {
      const { default: supabase } = await import('@/lib/supabase')
      
      // 期限切れのセッションを設定
      authStore.sessionExpiresAt = Date.now() - 1000 // 1秒前
      authStore.setSession({
        access_token: 'token-123',
        expires_at: Date.now() / 1000 - 60, // 1分前
        user: { id: 'user-1', email: 'test@example.com' }
      })
      authStore.updateLastActivity()

      supabase.auth.signOut.mockResolvedValue({ error: null })

      const isValid = await authStore.validateSession()

      expect(isValid).toBe(false)
      expect(authStore.session).toBeNull()
    })

    it('validateSession - Supabaseエラーでセッションを無効化する', async () => {
      const { default: supabase } = await import('@/lib/supabase')
      
      authStore.setSession({
        access_token: 'token-123',
        expires_at: Date.now() / 1000 + 3600,
        user: { id: 'user-1', email: 'test@example.com' }
      })
      authStore.updateLastActivity()

      // Supabase認証エラー
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid JWT' }
      })
      supabase.auth.signOut.mockResolvedValue({ error: null })

      const isValid = await authStore.validateSession()

      expect(isValid).toBe(false)
      expect(authStore.session).toBeNull()
    })

    it('refreshSession - リフレッシュ失敗でfalseを返す', async () => {
      const { default: supabase } = await import('@/lib/supabase')
      
      supabase.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Refresh token expired' }
      })
      supabase.auth.signOut.mockResolvedValue({ error: null })

      const result = await authStore.refreshSession()

      expect(result).toBe(false)
      expect(authStore.session).toBeNull()
      expect(authStore.error).toBeDefined()
    })

    it('regenerateSession - セッションなしでエラーを返す', async () => {
      authStore.setSession(null)

      const result = await authStore.regenerateSession()

      expect(result.success).toBe(false)
      expect(result.error).toBe('セッションが存在しません')
    })
  })

  describe('初期化プロセスのエラーハンドリング', () => {
    it('initialize - Supabaseエラーでもloadingをfalseにする', async () => {
      const { default: supabase } = await import('@/lib/supabase')
      
      supabase.auth.getSession.mockRejectedValue(new Error('Connection failed'))

      await authStore.initialize()

      expect(authStore.loading).toBe(false)
      expect(authStore.error).toBe('Connection failed')
    })

    it('initialize - 無効なlastActivityデータでもエラーが発生しない', async () => {
      const { default: supabase } = await import('@/lib/supabase')
      
      window.localStorage.getItem.mockReturnValue('invalid-number')
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      await authStore.initialize()

      expect(authStore.loading).toBe(false)
      // 無効な値の場合でも、エラーが発生せずに処理が完了すること
    })
  })

  describe('パスワード変更のエラーハンドリング', () => {
    it('changePassword - 未認証ユーザーでエラーを返す', async () => {
      // ユーザーが認証されていない状態をテスト
      authStore.user = null

      const result = await authStore.changePassword('current', 'newPassword123!')

      expect(result.success).toBe(false)
      expect(result.error).toBe('ユーザーが認証されていません')
    })

    it('changePassword - パスワードポリシー違反でエラーを返す', async () => {
      const { default: passwordValidator } = await import('@/utils/password-policy')
      
      authStore.user =({
        id: 'user-1',
        email: 'test@example.com'
      })

      passwordValidator.validatePassword.mockReturnValue({
        isValid: false,
        score: 1,
        errors: ['パスワードが弱すぎます']
      })

      const result = await authStore.changePassword('current', 'weak')

      expect(result.success).toBe(false)
      expect(result.error).toContain('パスワードポリシー違反')
    })

    it('changePassword - パスワード再利用でエラーを返す', async () => {
      const { default: passwordValidator } = await import('@/utils/password-policy')
      
      authStore.user =({
        id: 'user-1',
        email: 'test@example.com'
      })

      passwordValidator.validatePassword.mockReturnValue({
        isValid: true,
        score: 4,
        errors: []
      })
      passwordValidator.hashPassword.mockResolvedValue('hashed_password')

      // パスワード履歴マネージャーのモック
      const passwordHistoryManager = {
        isPasswordReused: vi.fn().mockResolvedValue(true),
        addToHistory: vi.fn()
      }
      vi.doMock('@/utils/password-policy', () => ({
        default: passwordValidator,
        passwordHistoryManager
      }))

      const result = await authStore.changePassword('current', 'reusedPassword123!')

      expect(result.success).toBe(false)
      expect(result.error).toBe('過去に使用したパスワードは使用できません')
    })
  })

  describe('2要素認証のエラーハンドリング', () => {
    it('setup2FA - 未認証ユーザーでエラーを投げる', async () => {
      authStore.user =(null)

      await expect(authStore.setup2FA()).rejects.toThrow('ユーザーが認証されていません')
    })

    it('enable2FA - 未認証ユーザーでエラーを投げる', async () => {
      authStore.user =(null)

      await expect(
        authStore.enable2FA('123456', 'secret', ['backup1', 'backup2'])
      ).rejects.toThrow('ユーザーが認証されていません')
    })

    it('disable2FA - 未認証ユーザーでエラーを投げる', async () => {
      authStore.user =(null)

      await expect(authStore.disable2FA('123456')).rejects.toThrow('ユーザーが認証されていません')
    })
  })

  describe('セッション終了のエラーハンドリング', () => {
    it('signOut - Supabaseエラーでもローカル状態をクリアする', async () => {
      const { default: supabase } = await import('@/lib/supabase')
      
      authStore.user =({ id: 'user-1', email: 'test@example.com' })
      authStore.setSession({ access_token: 'token-123' })

      supabase.auth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed' }
      })

      const result = await authStore.signOut()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Sign out failed')
      expect(authStore.loading).toBe(false)
    })

    it('invalidateSession - Supabaseエラーでもローカル状態をクリアする', async () => {
      const { default: supabase } = await import('@/lib/supabase')
      
      authStore.user =({ id: 'user-1', email: 'test@example.com' })
      authStore.setSession({ access_token: 'token-123' })

      supabase.auth.signOut.mockRejectedValue(new Error('Network error'))

      await authStore.invalidateSession()

      // エラーが発生してもローカル状態はクリアされることを確認
      expect(authStore.user).toBeNull()
      expect(authStore.session).toBeNull()
    })
  })

  describe('エッジケースのテスト', () => {
    it('setSession - null値でも適切に処理される', () => {
      authStore.setSession(null)
      
      expect(authStore.session).toBeNull()
      expect(authStore.sessionExpiresAt).toBeNull()
    })

    it('setSession - expires_atがないセッションでもデフォルト値が設定される', () => {
      const sessionWithoutExpiry = {
        access_token: 'token-123',
        user: { id: 'user-1', email: 'test@example.com' }
        // expires_at なし
      }
      
      authStore.setSession(sessionWithoutExpiry)
      
      expect(authStore.session).toEqual(sessionWithoutExpiry)
      expect(authStore.sessionExpiresAt).toBeGreaterThan(Date.now())
    })

    it('timeUntilExpiry - sessionExpiresAtがnullの場合0を返す', () => {
      authStore.sessionExpiresAt = null
      expect(authStore.timeUntilExpiry).toBe(0)
    })

    it('timeUntilExpiry - 期限切れの場合0を返す', () => {
      authStore.sessionExpiresAt = Date.now() - 1000 // 1秒前
      expect(authStore.timeUntilExpiry).toBe(0)
    })
  })
})