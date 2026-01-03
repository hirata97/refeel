import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@features/auth'

// モックの設定
vi.mock('@/lib/supabase', () => ({
  default: {
    auth: {
      signInWithPassword: vi.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
      signUp: vi.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      refreshSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      updateUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    }
  },
  supabase: {
    auth: {
      signInWithPassword: vi.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
      signUp: vi.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      refreshSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      updateUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    }
  }
}))

vi.mock('@/utils/sanitization', () => ({
  performSecurityCheck: vi.fn(() => ({ isSecure: true, sanitizedValue: '' })),
  sanitizeInputData: vi.fn((data) => data)
}))

vi.mock('@/utils/account-lockout', () => ({
  default: {
    checkLockoutStatus: vi.fn().mockResolvedValue({ isLocked: false }),
    recordLoginAttempt: vi.fn().mockResolvedValue(undefined),
    shouldLockAccount: vi.fn().mockResolvedValue(false),
    lockAccount: vi.fn().mockResolvedValue(undefined)
  },
  accountLockoutManager: {
    checkLockoutStatus: vi.fn().mockResolvedValue({ isLocked: false }),
    recordLoginAttempt: vi.fn().mockResolvedValue(undefined),
    shouldLockAccount: vi.fn().mockResolvedValue(false),
    lockAccount: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('@/utils/audit-logger', () => ({
  default: {
    log: vi.fn()
  },
  auditLogger: {
    log: vi.fn()
  },
  AuditEventType: {
    AUTH_LOGIN: 'auth_login',
    AUTH_LOGOUT: 'auth_logout',
    AUTH_FAILED_LOGIN: 'auth_failed_login',
    PASSWORD_CHANGED: 'password_changed'
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
  },
  enhancedSessionManager: {
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
    validatePassword: vi.fn(() => ({ isValid: true, errors: [] })),
    hashPassword: vi.fn((pwd) => pwd),
    getStrengthLabel: vi.fn(() => 'strong')
  },
  passwordValidator: {
    validatePassword: vi.fn(() => ({ isValid: true, errors: [] })),
    hashPassword: vi.fn((pwd) => pwd),
    getStrengthLabel: vi.fn(() => 'strong')
  },
  passwordHistoryManager: {
    addToHistory: vi.fn().mockResolvedValue(undefined),
    isPasswordReused: vi.fn().mockResolvedValue(false),
    clearHistory: vi.fn().mockResolvedValue(undefined)
  }
}))

describe('AuthStore - 異常系・エラーハンドリング', () => {
  let authStore
  let accountLockoutManager
  let performSecurityCheck
  let passwordValidator
  let passwordHistoryManager
  let supabase

  beforeEach(async () => {
    setActivePinia(createPinia())
    authStore = useAuthStore()

    // モックをインポート
    const lockoutModule = await import('@/utils/account-lockout')
    accountLockoutManager = lockoutModule.accountLockoutManager

    const sanitizationModule = await import('@/utils/sanitization')
    performSecurityCheck = sanitizationModule.performSecurityCheck

    const passwordModule = await import('@/utils/password-policy')
    passwordValidator = passwordModule.passwordValidator
    passwordHistoryManager = passwordModule.passwordHistoryManager

    const supabaseModule = await import('@/lib/supabase')
    supabase = supabaseModule.supabase

    vi.clearAllMocks()

    // デフォルト値を再設定
    accountLockoutManager.checkLockoutStatus.mockResolvedValue({ isLocked: false, failedAttempts: 0 })
    accountLockoutManager.recordLoginAttempt.mockResolvedValue(undefined)
    accountLockoutManager.shouldLockAccount.mockResolvedValue(false)
    accountLockoutManager.lockAccount.mockResolvedValue(undefined)

    performSecurityCheck.mockReturnValue({ isSecure: true, sanitizedValue: '' })

    passwordValidator.validatePassword.mockReturnValue({ isValid: true, errors: [], score: 4 })
    passwordValidator.hashPassword.mockResolvedValue('hashed_password')

    passwordHistoryManager.isPasswordReused.mockResolvedValue(false)
    passwordHistoryManager.addToHistory.mockResolvedValue(undefined)

    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: null })
    supabase.auth.signUp.mockResolvedValue({ data: { user: null, session: null }, error: null })
    supabase.auth.signOut.mockResolvedValue({ error: null })
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    supabase.auth.updateUser.mockResolvedValue({ data: { user: null }, error: null })

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
      supabase.auth.getSession.mockRejectedValue(new Error('Connection failed'))

      await authStore.initialize()

      expect(authStore.loading).toBe(false)
      expect(authStore.error).toBe('Connection failed')
    })

    it('initialize - 無効なlastActivityデータでもエラーが発生しない', async () => {
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
      authStore.user = {
        id: 'user-1',
        email: 'test@example.com'
      }

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
      authStore.user = {
        id: 'user-1',
        email: 'test@example.com'
      }

      passwordValidator.validatePassword.mockReturnValue({
        isValid: true,
        score: 4,
        errors: []
      })
      passwordValidator.hashPassword.mockResolvedValue('hashed_password')
      passwordHistoryManager.isPasswordReused.mockResolvedValue(true)

      const result = await authStore.changePassword('current', 'reusedPassword123!')

      expect(result.success).toBe(false)
      expect(result.error).toBe('過去に使用したパスワードは使用できません')
    })
  })

  describe('2要素認証のエラーハンドリング', () => {
    it.skip('setup2FA - 未認証ユーザーでエラーを投げる', async () => {
      authStore.user =(null)

      await expect(authStore.setup2FA()).rejects.toThrow('ユーザーが認証されていません')
    })

    it.skip('enable2FA - 未認証ユーザーでエラーを投げる', async () => {
      authStore.user =(null)

      await expect(
        authStore.enable2FA('123456', 'secret', ['backup1', 'backup2'])
      ).rejects.toThrow('ユーザーが認証されていません')
    })

    it.skip('disable2FA - 未認証ユーザーでエラーを投げる', async () => {
      authStore.user =(null)

      await expect(authStore.disable2FA('123456')).rejects.toThrow('ユーザーが認証されていません')
    })
  })

  describe('セッション終了のエラーハンドリング', () => {
    it('signOut - Supabaseエラーでもローカル状態をクリアする', async () => {
      authStore.user = { id: 'user-1', email: 'test@example.com' }
      authStore.setSession({ access_token: 'token-123' })

      supabase.auth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed' }
      })

      const result = await authStore.signOut()

      expect(result.success).toBe(false)
      // Supabaseエラーオブジェクトは Error インスタンスではないため、
      // デフォルトメッセージが使用される
      expect(result.error).toBe('ログアウトに失敗しました')
      expect(authStore.loading).toBe(false)
    })

    it('invalidateSession - Supabaseエラー時はローカル状態がクリアされない', async () => {
      authStore.user = { id: 'user-1', email: 'test@example.com' }
      authStore.setSession({ access_token: 'token-123' })

      supabase.auth.signOut.mockRejectedValue(new Error('Network error'))

      await authStore.invalidateSession()

      // エラーが発生した場合、invalidateSessionのcatch節では
      // 状態をクリアしないため、ユーザーとセッションは残る
      expect(authStore.user).not.toBeNull()
      expect(authStore.session).not.toBeNull()
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