/**
 * テストファイル: account-lockout/exception_AccountLockoutManager_01.spec.js
 * テスト対象: AccountLockoutManager クラス - 異常系・エラーハンドリングテスト
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

describe('AccountLockoutManager - 異常系・エラーハンドリングテスト', () => {
  let lockoutManager
  let mockAuditLogger

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    
    mockAuditLogger = {
      log: vi.fn().mockResolvedValue(undefined),
    }
    vi.spyOn(AuditLogger, 'getInstance').mockReturnValue(mockAuditLogger)
    
    lockoutManager = new AccountLockoutManager()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('localStorage エラー処理', () => {
    it('localStorage.getItem でエラーが発生した場合の処理', async () => {
      const email = 'test@example.com'
      
      localStorage.getItem = vi.fn().mockImplementation(() => {
        throw new Error('localStorage access denied')
      })

      const status = await lockoutManager.checkLockoutStatus(email)

      expect(status).toEqual({
        isLocked: false,
        failedAttempts: 0,
        remainingAttempts: DEFAULT_LOCKOUT_POLICY.maxFailedAttempts,
        nextAttemptAllowed: undefined,
      })

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'ログイン試行履歴の取得に失敗:',
        expect.any(Error)
      )
    })

    it('localStorage.setItem でエラーが発生した場合の処理', async () => {
      const email = 'test@example.com'
      
      localStorage.getItem = vi.fn().mockReturnValue(null)
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('localStorage write failed')
      })

      // エラーが発生してもメソッドは正常に完了する
      await expect(lockoutManager.recordLoginAttempt(email, true)).resolves.not.toThrow()

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'ログイン試行の保存に失敗:',
        expect.any(Error)
      )
    })

    it('不正なJSONデータでエラーが発生した場合の処理', async () => {
      const email = 'test@example.com'
      
      localStorage.getItem = vi.fn().mockReturnValue('invalid json data')

      const status = await lockoutManager.checkLockoutStatus(email)

      expect(status).toEqual({
        isLocked: false,
        failedAttempts: 0,
        remainingAttempts: DEFAULT_LOCKOUT_POLICY.maxFailedAttempts,
        nextAttemptAllowed: undefined,
      })

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'ログイン試行履歴の取得に失敗:',
        expect.any(Error)
      )
    })
  })

  describe('AuditLogger エラー処理', () => {
    it('AuditLogger.log でエラーが発生しても処理は継続される', async () => {
      const email = 'test@example.com'
      
      mockAuditLogger.log = vi.fn().mockRejectedValue(new Error('Audit log failed'))
      localStorage.getItem = vi.fn().mockReturnValue(null)
      localStorage.setItem = vi.fn()

      // エラーが発生してもメソッドは正常に完了する
      await expect(lockoutManager.recordLoginAttempt(email, true)).resolves.not.toThrow()

      expect(localStorage.setItem).toHaveBeenCalled() // ローカルストレージへの保存は実行される
    })

    it('ロックアウト時のAuditLoggerエラーも適切に処理される', async () => {
      const email = 'test@example.com'
      const attemptCount = 5
      
      mockAuditLogger.log = vi.fn().mockRejectedValue(new Error('Audit log service unavailable'))
      localStorage.getItem = vi.fn().mockReturnValue(null)
      localStorage.setItem = vi.fn()

      const lockoutInfo = await lockoutManager.lockAccount(email, attemptCount)

      expect(lockoutInfo).toBeDefined()
      expect(lockoutInfo.email).toBe(email.toLowerCase())
      expect(localStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('不正な入力値のハンドリング', () => {
    it('空文字のメールアドレスでも正常に処理される', async () => {
      const email = ''
      
      localStorage.getItem = vi.fn().mockReturnValue(null)
      localStorage.setItem = vi.fn()

      await expect(lockoutManager.recordLoginAttempt(email, true)).resolves.not.toThrow()
      
      const status = await lockoutManager.checkLockoutStatus(email)
      expect(status).toBeDefined()
      expect(status.isLocked).toBe(false)
    })

    it('nullやundefinedのIPアドレス・UserAgentでも正常に処理される', async () => {
      const email = 'test@example.com'
      
      localStorage.getItem = vi.fn().mockReturnValue(null)
      localStorage.setItem = vi.fn()

      await expect(
        lockoutManager.recordLoginAttempt(email, true, undefined, undefined)
      ).resolves.not.toThrow()

      await expect(
        lockoutManager.recordLoginAttempt(email, true, undefined, undefined)
      ).resolves.not.toThrow()
    })

    it('特殊文字を含むメールアドレスでも正常に処理される', async () => {
      const email = 'test+special.chars@example.com'
      
      localStorage.getItem = vi.fn().mockReturnValue(null)
      localStorage.setItem = vi.fn()

      await expect(lockoutManager.recordLoginAttempt(email, true)).resolves.not.toThrow()
      
      const status = await lockoutManager.checkLockoutStatus(email)
      expect(status.isLocked).toBe(false)
    })
  })

  describe('データ整合性エラー処理', () => {
    it('破損したログイン試行データでもエラーなく処理される', async () => {
      const email = 'test@example.com'
      
      // 不完全なデータ構造
      const corruptedData = {
        [email.toLowerCase()]: [
          { email: email.toLowerCase() }, // timestampやsuccessが欠落
          { success: true }, // emailやtimestampが欠落
          null, // null値
          'invalid data', // 文字列
        ]
      }

      localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(corruptedData))

      const status = await lockoutManager.checkLockoutStatus(email)
      expect(status).toBeDefined()
      expect(typeof status.isLocked).toBe('boolean')
    })

    it('破損したロックアウトデータでもエラーなく処理される', async () => {
      const email = 'test@example.com'
      
      // 不完全なロックアウト情報
      const corruptedLockout = {
        [email.toLowerCase()]: {
          email: email.toLowerCase(),
          // lockoutStart, lockoutEndが欠落
          attemptCount: 'invalid', // 数値でない
        }
      }

      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === 'account_lockouts') {
          return JSON.stringify(corruptedLockout)
        }
        return null
      })

      const status = await lockoutManager.checkLockoutStatus(email)
      expect(status).toBeDefined()
      expect(status.isLocked).toBe(false) // 不正データは無視される
    })
  })

  describe('メモリ不足・リソース制限エラー', () => {
    it('非常に大きなデータセットでもメモリエラーを回避する', async () => {
      const email = 'test@example.com'
      
      // 大量の試行データ（通常は30日で自動削除されるが、テスト用に大量生成）
      const largeAttemptData = Array(10000).fill(null).map(() => ({
        email: email.toLowerCase(),
        success: false,
        timestamp: new Date().toISOString(),
        ipAddress: '192.168.1.1',
      }))

      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === 'login_attempts') {
          return JSON.stringify({ [email.toLowerCase()]: largeAttemptData })
        }
        return null
      })

      // メモリエラーが発生しないことを確認
      await expect(lockoutManager.detectSuspiciousActivity(email)).resolves.not.toThrow()
      
      const status = await lockoutManager.checkLockoutStatus(email)
      expect(status).toBeDefined()
    })

    it('localStorage容量制限でsetItemが失敗した場合の処理', async () => {
      const email = 'test@example.com'
      
      localStorage.getItem = vi.fn().mockReturnValue(null)
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError')
      })

      // エラーが発生してもメソッドは正常に完了する
      await expect(lockoutManager.recordLoginAttempt(email, true)).resolves.not.toThrow()

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'ログイン試行の保存に失敗:',
        expect.any(Error)
      )
    })
  })

  describe('日時関連エラー処理', () => {
    it('不正な日時文字列でもエラーなく処理される', async () => {
      const email = 'test@example.com'
      
      const invalidTimestampData = {
        [email.toLowerCase()]: [
          {
            email: email.toLowerCase(),
            success: false,
            timestamp: 'invalid date string',
          },
          {
            email: email.toLowerCase(),
            success: false,
            timestamp: null,
          },
          {
            email: email.toLowerCase(),
            success: false,
            timestamp: undefined,
          }
        ]
      }

      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === 'login_attempts') {
          return JSON.stringify(invalidTimestampData)
        }
        return null
      })

      const status = await lockoutManager.checkLockoutStatus(email)
      expect(status).toBeDefined()
      expect(typeof status.failedAttempts).toBe('number')
    })

    it('システム時計が変更された場合の処理', async () => {
      const email = 'test@example.com'
      
      // 未来の日時のロックアウト情報
      const futureLockout = {
        email: email.toLowerCase(),
        lockoutStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明日
        lockoutEnd: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // 明日+1時間
        attemptCount: 5,
        lockoutLevel: 1,
      }

      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === 'account_lockouts') {
          return JSON.stringify({ [email.toLowerCase()]: futureLockout })
        }
        return null
      })

      // 未来の日時でも適切に処理される
      const status = await lockoutManager.checkLockoutStatus(email)
      expect(status).toBeDefined()
      expect(status.isLocked).toBe(true) // 未来の終了時刻なのでロック中として扱われる
    })
  })

  describe('並行処理・競合状態エラー', () => {
    it('同時に複数のログイン試行記録が実行されてもデータ整合性を保つ', async () => {
      const email = 'test@example.com'
      
      localStorage.getItem = vi.fn().mockReturnValue(null)
      
      // setItemが呼ばれるたびに異なるデータが返される状況をシミュレート
      let callCount = 0
      localStorage.setItem = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount > 1) {
          // 2回目以降は競合状態をシミュレート
          throw new Error('Concurrent modification')
        }
      })

      // 最初の呼び出しは成功し、2回目以降はエラーになる
      await expect(lockoutManager.recordLoginAttempt(email, true)).resolves.not.toThrow()
      await expect(lockoutManager.recordLoginAttempt(email, false)).resolves.not.toThrow()

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'ログイン試行の保存に失敗:',
        expect.any(Error)
      )
    })
  })

  describe('境界値・エッジケース', () => {
    it('ロックアウト期限がちょうど現在時刻の場合の処理', async () => {
      const email = 'test@example.com'
      const now = new Date()
      
      const lockoutInfo = {
        email: email.toLowerCase(),
        lockoutStart: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30分前
        lockoutEnd: now.toISOString(), // 現在時刻
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
      expect(status.isLocked).toBe(false) // 期限切れとして扱われる
    })

    it('段階的ロックアウトレベルが異常に高い場合の処理', async () => {
      const email = 'test@example.com'
      
      const previousLockout = {
        email: email.toLowerCase(),
        lockoutStart: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        lockoutEnd: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        attemptCount: 3,
        lockoutLevel: 100, // 異常に高いレベル
      }

      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === 'account_lockouts') {
          return JSON.stringify({ [email.toLowerCase()]: previousLockout })
        }
        return null
      })
      localStorage.setItem = vi.fn()

      // 高レベルでもオーバーフローせずに処理される
      const lockoutInfo = await lockoutManager.lockAccount(email, 5)
      expect(lockoutInfo.lockoutLevel).toBe(101)
      expect(lockoutInfo.lockoutEnd).toBeInstanceOf(Date)
      expect(lockoutInfo.lockoutEnd.getTime()).toBeGreaterThan(Date.now())
    })
  })
})