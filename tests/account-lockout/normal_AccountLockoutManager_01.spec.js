/**
 * テストファイル: account-lockout/normal_AccountLockoutManager_01.spec.js
 * テスト対象: AccountLockoutManager クラス - 正常系テスト
 * 作成日: 2025-08-19
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AccountLockoutManager, DEFAULT_LOCKOUT_POLICY } from '../../src/utils/account-lockout.ts'
import { AuditLogger } from '../../src/utils/audit-logger.ts'

// localStorage のモック
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// console のモック
const consoleSpy = {
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  info: vi.spyOn(console, 'info').mockImplementation(() => {}),
}

describe('AccountLockoutManager - 正常系テスト', () => {
  let lockoutManager: AccountLockoutManager
  let mockAuditLogger: Partial<AuditLogger>

  beforeEach(() => {
    // localStorage をクリア
    vi.clearAllMocks()
    localStorage.clear()
    
    // AuditLogger のモック
    mockAuditLogger = {
      log: vi.fn().mockResolvedValue(undefined),
    }
    vi.spyOn(AuditLogger, 'getInstance').mockReturnValue(mockAuditLogger)
    
    // AccountLockoutManager インスタンス作成
    lockoutManager = new AccountLockoutManager()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('デフォルトポリシーで正常に初期化される', () => {
      const manager = new AccountLockoutManager()
      expect(manager).toBeInstanceOf(AccountLockoutManager)
    })

    it('カスタムポリシーで正常に初期化される', () => {
      const customPolicy = {
        ...DEFAULT_LOCKOUT_POLICY,
        maxFailedAttempts: 10,
      }
      const manager = new AccountLockoutManager(customPolicy)
      expect(manager).toBeInstanceOf(AccountLockoutManager)
    })
  })

  describe('recordLoginAttempt', () => {
    it('成功したログイン試行を正常に記録する', async () => {
      const email = 'test@example.com'
      const ipAddress = '192.168.1.1'
      const userAgent = 'Mozilla/5.0'

      localStorage.getItem = vi.fn().mockReturnValue(null)
      localStorage.setItem = vi.fn()

      await lockoutManager.recordLoginAttempt(email, true, ipAddress, userAgent)

      // localStorage への保存を確認
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'login_attempts',
        expect.stringContaining(email.toLowerCase())
      )

      // 監査ログへの記録を確認
      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        'AUTH_LOGIN',
        expect.stringContaining('ログイン成功'),
        expect.objectContaining({
          email,
          ipAddress,
          userAgent,
        })
      )
    })

    it('失敗したログイン試行を正常に記録する', async () => {
      const email = 'test@example.com'
      const ipAddress = '192.168.1.1'

      localStorage.getItem = vi.fn().mockReturnValue(null)
      localStorage.setItem = vi.fn()

      await lockoutManager.recordLoginAttempt(email, false, ipAddress)

      // localStorage への保存を確認
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'login_attempts',
        expect.stringContaining(email.toLowerCase())
      )

      // 監査ログへの記録を確認
      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        'AUTH_FAILED_LOGIN',
        expect.stringContaining('ログイン失敗'),
        expect.objectContaining({
          email,
          ipAddress,
        })
      )
    })

    it('メールアドレスが正規化されて記録される', async () => {
      const email = 'Test@EXAMPLE.COM'
      localStorage.getItem = vi.fn().mockReturnValue(null)
      localStorage.setItem = vi.fn()

      await lockoutManager.recordLoginAttempt(email, true)

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'login_attempts',
        expect.stringContaining('test@example.com')
      )
    })
  })

  describe('checkLockoutStatus', () => {
    it('ロックアウトされていないアカウントの正常なステータス取得', async () => {
      const email = 'test@example.com'
      localStorage.getItem = vi.fn().mockReturnValue(null)

      const status = await lockoutManager.checkLockoutStatus(email)

      expect(status).toEqual({
        isLocked: false,
        failedAttempts: 0,
        remainingAttempts: DEFAULT_LOCKOUT_POLICY.maxFailedAttempts,
        nextAttemptAllowed: undefined,
      })
    })

    it('失敗回数がある場合の正常なステータス取得', async () => {
      const email = 'test@example.com'
      const failedAttempts = [
        {
          email: email.toLowerCase(),
          success: false,
          timestamp: new Date().toISOString(),
        }
      ]

      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === 'login_attempts') {
          return JSON.stringify({ [email.toLowerCase()]: failedAttempts })
        }
        return null
      })

      const status = await lockoutManager.checkLockoutStatus(email)

      expect(status.isLocked).toBe(false)
      expect(status.failedAttempts).toBe(1)
      expect(status.remainingAttempts).toBe(DEFAULT_LOCKOUT_POLICY.maxFailedAttempts - 1)
    })

    it('ロックアウト中のアカウントの正常なステータス取得', async () => {
      const email = 'test@example.com'
      const lockoutEnd = new Date(Date.now() + 30 * 60 * 1000) // 30分後

      const lockoutInfo = {
        email: email.toLowerCase(),
        lockoutStart: new Date().toISOString(),
        lockoutEnd: lockoutEnd.toISOString(),
        attemptCount: 5,
        lockoutLevel: 1,
      }

      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === 'account_lockouts') {
          return JSON.stringify({ [email.toLowerCase()]: lockoutInfo })
        }
        return null
      })

      const status = await lockoutManager.checkLockoutStatus(email)

      expect(status.isLocked).toBe(true)
      expect(status.failedAttempts).toBe(5)
      expect(status.remainingAttempts).toBe(0)
      expect(status.nextAttemptAllowed).toEqual(lockoutEnd)
    })
  })

  describe('shouldLockAccount', () => {
    it('失敗回数が上限未満の場合はfalseを返す', async () => {
      const email = 'test@example.com'
      localStorage.getItem = vi.fn().mockReturnValue(null)

      const shouldLock = await lockoutManager.shouldLockAccount(email)
      expect(shouldLock).toBe(false)
    })

    it('失敗回数が上限に達した場合はtrueを返す', async () => {
      const email = 'test@example.com'
      const failedAttempts = Array(DEFAULT_LOCKOUT_POLICY.maxFailedAttempts).fill({
        email: email.toLowerCase(),
        success: false,
        timestamp: new Date().toISOString(),
      })

      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === 'login_attempts') {
          return JSON.stringify({ [email.toLowerCase()]: failedAttempts })
        }
        return null
      })

      const shouldLock = await lockoutManager.shouldLockAccount(email)
      expect(shouldLock).toBe(true)
    })
  })

  describe('lockAccount', () => {
    it('アカウントを正常にロックアウトする', async () => {
      const email = 'test@example.com'
      const attemptCount = 5

      localStorage.getItem = vi.fn().mockReturnValue(null)
      localStorage.setItem = vi.fn()

      const lockoutInfo = await lockoutManager.lockAccount(email, attemptCount)

      expect(lockoutInfo).toMatchObject({
        email: email.toLowerCase(),
        attemptCount,
        lockoutLevel: 1,
      })

      expect(lockoutInfo.lockoutStart).toBeInstanceOf(Date)
      expect(lockoutInfo.lockoutEnd).toBeInstanceOf(Date)
      expect(lockoutInfo.lockoutEnd.getTime()).toBeGreaterThan(lockoutInfo.lockoutStart.getTime())

      // localStorage への保存確認
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'account_lockouts',
        expect.stringContaining(email.toLowerCase())
      )

      // 監査ログ記録確認
      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        'SECURITY_LOCKOUT',
        expect.stringContaining('アカウントロックアウト'),
        expect.objectContaining({
          email: email.toLowerCase(),
          attemptCount,
          lockoutLevel: 1,
        })
      )

      // 警告メッセージ確認
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining(`アカウント ${email} が`)
      )
    })

    it('段階的ロックアウトが正常に機能する', async () => {
      const email = 'test@example.com'
      const previousLockout = {
        email: email.toLowerCase(),
        lockoutStart: new Date(Date.now() - 60 * 60 * 1000), // 1時間前
        lockoutEnd: new Date(Date.now() - 30 * 60 * 1000), // 30分前（期限切れ）
        attemptCount: 3,
        lockoutLevel: 1,
      }

      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === 'account_lockouts') {
          return JSON.stringify({ [email.toLowerCase()]: previousLockout })
        }
        return null
      })
      localStorage.setItem = vi.fn()

      const lockoutInfo = await lockoutManager.lockAccount(email, 5)

      expect(lockoutInfo.lockoutLevel).toBe(2) // 段階的に増加
      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        'SECURITY_LOCKOUT',
        expect.stringContaining('アカウントロックアウト'),
        expect.objectContaining({
          lockoutLevel: 2,
        })
      )
    })
  })

  describe('unlockAccount', () => {
    it('手動でアカウントロックを解除できる', async () => {
      const email = 'test@example.com'
      const adminUserId = 'admin123'

      localStorage.getItem = vi.fn().mockReturnValue('{}')
      localStorage.setItem = vi.fn()

      await lockoutManager.unlockAccount(email, adminUserId)

      // 監査ログ記録確認
      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        'SECURITY_UNLOCK',
        expect.stringContaining('アカウントロック解除'),
        expect.objectContaining({
          email: email.toLowerCase(),
          adminUserId,
        })
      )

      // 情報メッセージ確認
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining(`アカウント ${email} のロックが解除されました`)
      )
    })

    it('システムによる自動解除も正常に動作する', async () => {
      const email = 'test@example.com'

      localStorage.getItem = vi.fn().mockReturnValue('{}')
      localStorage.setItem = vi.fn()

      await lockoutManager.unlockAccount(email)

      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        'SECURITY_UNLOCK',
        expect.stringContaining('アカウントロック解除'),
        expect.objectContaining({
          email: email.toLowerCase(),
          adminUserId: 'system',
        })
      )
    })
  })

  describe('detectSuspiciousActivity', () => {
    it('通常のアクセスパターンでは疑わしい活動を検出しない', async () => {
      const email = 'test@example.com'
      const attempts = [
        {
          email: email.toLowerCase(),
          success: true,
          timestamp: new Date().toISOString(),
          ipAddress: '192.168.1.1',
        }
      ]

      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === 'login_attempts') {
          return JSON.stringify({ [email.toLowerCase()]: attempts })
        }
        return null
      })

      const result = await lockoutManager.detectSuspiciousActivity(email)

      expect(result.isSuspicious).toBe(false)
      expect(result.reasons).toEqual([])
    })

    it('短時間での大量アクセスを疑わしい活動として検出する', async () => {
      const email = 'test@example.com'
      const recentTime = new Date()
      const attempts = Array(12).fill(null).map(() => ({
        email: email.toLowerCase(),
        success: false,
        timestamp: recentTime.toISOString(),
        ipAddress: '192.168.1.1',
      }))

      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === 'login_attempts') {
          return JSON.stringify({ [email.toLowerCase()]: attempts })
        }
        return null
      })

      const result = await lockoutManager.detectSuspiciousActivity(email)

      expect(result.isSuspicious).toBe(true)
      expect(result.reasons).toContain('短時間での大量ログイン試行')
      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        'SECURITY_VIOLATION',
        expect.stringContaining('不正アクセス検知'),
        expect.objectContaining({
          email: email.toLowerCase(),
          reasons: result.reasons,
        })
      )
    })

    it('複数IPアドレスからのアクセスを疑わしい活動として検出する', async () => {
      const email = 'test@example.com'
      const recentTime = new Date()
      const attempts = [
        { email: email.toLowerCase(), success: false, timestamp: recentTime.toISOString(), ipAddress: '192.168.1.1' },
        { email: email.toLowerCase(), success: false, timestamp: recentTime.toISOString(), ipAddress: '192.168.1.2' },
        { email: email.toLowerCase(), success: false, timestamp: recentTime.toISOString(), ipAddress: '192.168.1.3' },
        { email: email.toLowerCase(), success: false, timestamp: recentTime.toISOString(), ipAddress: '192.168.1.4' },
      ]

      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === 'login_attempts') {
          return JSON.stringify({ [email.toLowerCase()]: attempts })
        }
        return null
      })

      const result = await lockoutManager.detectSuspiciousActivity(email)

      expect(result.isSuspicious).toBe(true)
      expect(result.reasons).toContain('複数のIPアドレスからの同時アクセス')
    })
  })

  describe('getSecurityStats', () => {
    it('セキュリティ統計情報を正常に取得する', () => {
      const currentTime = new Date()
      const activeLockout = {
        email: 'locked@example.com',
        lockoutStart: new Date(currentTime.getTime() - 10 * 60 * 1000).toISOString(), // 10分前
        lockoutEnd: new Date(currentTime.getTime() + 20 * 60 * 1000).toISOString(), // 20分後
        attemptCount: 5,
        lockoutLevel: 1,
      }

      const expiredLockout = {
        email: 'expired@example.com',
        lockoutStart: new Date(currentTime.getTime() - 60 * 60 * 1000).toISOString(), // 1時間前
        lockoutEnd: new Date(currentTime.getTime() - 30 * 60 * 1000).toISOString(), // 30分前
        attemptCount: 3,
        lockoutLevel: 1,
      }

      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === 'account_lockouts') {
          return JSON.stringify({
            'locked@example.com': activeLockout,
            'expired@example.com': expiredLockout,
          })
        }
        if (key === 'login_attempts') {
          return JSON.stringify({
            'user1@example.com': [
              { success: false, timestamp: new Date(currentTime.getTime() - 2 * 60 * 60 * 1000).toISOString() },
              { success: false, timestamp: new Date(currentTime.getTime() - 1 * 60 * 60 * 1000).toISOString() },
            ]
          })
        }
        return null
      })

      const stats = lockoutManager.getSecurityStats()

      expect(stats.totalLockedAccounts).toBe(1) // アクティブなロックアウトのみ
      expect(stats.totalFailedAttempts).toBe(2) // 24時間以内の失敗試行
      expect(stats.suspiciousActivities).toBe(0)
    })

    it('localStorage エラー時も適切に処理する', () => {
      localStorage.getItem = vi.fn().mockImplementation(() => {
        throw new Error('localStorage error')
      })

      const stats = lockoutManager.getSecurityStats()

      expect(stats).toEqual({
        totalLockedAccounts: 0,
        totalFailedAttempts: 0,
        suspiciousActivities: 0,
      })
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '統計情報の取得に失敗:',
        expect.any(Error)
      )
    })
  })
})