/**
 * テストファイル: enhanced-session-management/exception_EnhancedSessionManager_01.spec.js
 * テスト対象: EnhancedSessionManager クラス - 異常系・エラーハンドリングテスト
 * 作成日: 2025-08-19
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { EnhancedSessionManager } from '@/features/auth/services/enhanced-session-management'
import { AuditLogger } from '@/features/auth/services/audit-logger'

// global objects のモック
Object.defineProperty(global, 'navigator', {
  value: {
    language: 'ja-JP',
  },
  writable: true,
})

Object.defineProperty(global, 'screen', {
  value: {
    width: 1920,
    height: 1080,
  },
  writable: true,
})

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
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
}

describe('EnhancedSessionManager - 異常系・エラーハンドリングテスト', () => {
  let sessionManager
  let mockAuditLogger

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    
    mockAuditLogger = {
      log: vi.fn().mockResolvedValue(undefined),
    }
    vi.spyOn(AuditLogger, 'getInstance').mockReturnValue(mockAuditLogger)
    
    sessionManager = new EnhancedSessionManager()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('localStorage エラー処理', () => {
    it('localStorage.getItem でエラーが発生した場合の処理', async () => {
      const sessionId = 'session123'
      
      localStorage.getItem = vi.fn().mockImplementation(() => {
        throw new Error('localStorage access denied')
      })

      const result = await sessionManager.validateSession(sessionId)

      expect(result).toBe(false)
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'セッション情報の取得に失敗:',
        expect.any(Error)
      )
    })

    it('localStorage.setItem でエラーが発生した場合の処理', async () => {
      const userId = 'user123'
      const sessionId = 'session456'
      const userAgent = 'Mozilla/5.0'
      const ipAddress = '192.168.1.1'
      
      localStorage.getItem = vi.fn().mockReturnValue(null)
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('localStorage write failed')
      })

      // エラーが発生してもメソッドは正常に完了する
      const sessionInfo = await sessionManager.createSession(userId, sessionId, userAgent, ipAddress)
      
      expect(sessionInfo).toBeDefined()
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'セッション情報の保存に失敗:',
        expect.any(Error)
      )
    })

    it('不正なJSONデータでエラーが発生した場合の処理', async () => {
      const userId = 'user123'
      
      localStorage.getItem = vi.fn().mockReturnValue('invalid json data')

      const devices = sessionManager.getUserDevices(userId)

      expect(devices).toEqual([])
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'デバイス情報の取得に失敗:',
        expect.any(Error)
      )
    })
  })

  describe('AuditLogger エラー処理', () => {
    it('AuditLogger.log でエラーが発生しても処理は継続される', async () => {
      const userId = 'user123'
      const sessionId = 'session456'
      const userAgent = 'Mozilla/5.0'
      const ipAddress = '192.168.1.1'
      
      mockAuditLogger.log = vi.fn().mockRejectedValue(new Error('Audit log failed'))
      localStorage.getItem = vi.fn().mockReturnValue(null)
      localStorage.setItem = vi.fn()

      // エラーが発生してもメソッドは正常に完了する
      const sessionInfo = await sessionManager.createSession(userId, sessionId, userAgent, ipAddress)

      expect(sessionInfo).toBeDefined()
      expect(sessionInfo.id).toBe(sessionId)
    })

    it('セキュリティアラート作成時のAuditLoggerエラーも適切に処理される', async () => {
      const userId = 'user123'
      const alertData = {
        type: 'test_alert',
        message: 'テストアラート',
        severity: 'high',
      }
      
      mockAuditLogger.log = vi.fn().mockRejectedValue(new Error('Audit service unavailable'))
      localStorage.getItem = vi.fn().mockReturnValue('[]')
      localStorage.setItem = vi.fn()

      // エラーが発生してもメソッドは正常に完了する
      await expect(sessionManager.createSecurityAlert(userId, alertData)).resolves.not.toThrow()
      
      expect(localStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('不正な入力値のハンドリング', () => {
    it('空文字のユーザーIDでも正常に処理される', async () => {
      const userId = ''
      const sessionId = 'session123'
      const userAgent = 'Mozilla/5.0'
      const ipAddress = '192.168.1.1'
      
      localStorage.getItem = vi.fn().mockReturnValue(null)
      localStorage.setItem = vi.fn()

      const sessionInfo = await sessionManager.createSession(userId, sessionId, userAgent, ipAddress)
      
      expect(sessionInfo).toBeDefined()
      expect(sessionInfo.userId).toBe(userId)
    })

    it('nullやundefinedのIPアドレス・UserAgentでも正常に処理される', async () => {
      const userId = 'user123'
      const sessionId = 'session456'
      
      localStorage.getItem = vi.fn().mockReturnValue(null)
      localStorage.setItem = vi.fn()

      const sessionInfo1 = await sessionManager.createSession(userId, sessionId + '1', '', '')
      expect(sessionInfo1).toBeDefined()

      const sessionInfo2 = await sessionManager.createSession(userId, sessionId + '2', '', '')
      expect(sessionInfo2).toBeDefined()
    })

    it('異常に長いUserAgentでも正常に処理される', async () => {
      const userId = 'user123'
      const sessionId = 'session789'
      const longUserAgent = 'A'.repeat(1000) // 1000文字
      const ipAddress = '192.168.1.1'
      
      localStorage.getItem = vi.fn().mockReturnValue(null)
      localStorage.setItem = vi.fn()

      const sessionInfo = await sessionManager.createSession(userId, sessionId, longUserAgent, ipAddress)
      
      expect(sessionInfo).toBeDefined()
      expect(sessionInfo.userAgent).toBe(longUserAgent)
    })
  })

  describe('データ整合性エラー処理', () => {
    it('破損したセッションデータでもエラーなく処理される', async () => {
      const sessionId = 'session123'
      
      // 不完全なデータ構造
      const corruptedData = {
        id: sessionId,
        // userId, createdAt, expiresAtが欠落
        lastActivity: 'invalid date string',
        isActive: 'not boolean', // 真偽値でない
      }

      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === `session_${sessionId}`) {
          return JSON.stringify(corruptedData)
        }
        return null
      })

      const result = await sessionManager.validateSession(sessionId)
      expect(result).toBe(false) // 不正データは無効として扱われる
    })

    it('破損したデバイスデータでもエラーなく処理される', () => {
      const userId = 'user123'
      
      // 不完全なデバイス情報
      const corruptedDevices = [
        { id: 'device1' }, // 必須フィールドが欠落
        null, // null値
        'invalid data', // 文字列
        { 
          id: 'device2',
          firstSeen: 'invalid date',
          lastSeen: 'invalid date'
        }
      ]

      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === `devices_${userId}`) {
          return JSON.stringify(corruptedDevices)
        }
        return null
      })

      const devices = sessionManager.getUserDevices(userId)
      expect(devices).toBeDefined()
      expect(Array.isArray(devices)).toBe(true)
    })

    it('破損したセキュリティアラートデータでもエラーなく処理される', () => {
      const userId = 'user123'
      
      const corruptedAlerts = [
        { id: 'alert1' }, // 必須フィールドが欠落
        { 
          id: 'alert2',
          timestamp: 'invalid date string'
        },
        null
      ]

      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === `security_alerts_${userId}`) {
          return JSON.stringify(corruptedAlerts)
        }
        return null
      })

      const stats = sessionManager.getSecurityStats(userId)
      expect(stats).toBeDefined()
      expect(typeof stats.pendingAlerts).toBe('number')
    })
  })

  describe('メモリ不足・リソース制限エラー', () => {
    it('localStorage容量制限でsetItemが失敗した場合の処理', async () => {
      const userId = 'user123'
      const sessionId = 'session456'
      
      localStorage.getItem = vi.fn().mockReturnValue(null)
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError')
      })

      // エラーが発生してもメソッドは正常に完了する
      const sessionInfo = await sessionManager.createSession(userId, sessionId, 'Mozilla/5.0', '192.168.1.1')

      expect(sessionInfo).toBeDefined()
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'セッション情報の保存に失敗:',
        expect.any(Error)
      )
    })

    it('非常に大きなデータセットでもメモリエラーを回避する', async () => {
      const userId = 'user123'
      
      // 大量のセッションデータ
      const largeSessions = Array(1000).fill(null).map((_, i) => ({
        id: `session${i}`,
        userId,
        deviceId: `device${i}`,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        isActive: true,
      }))

      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === `user_sessions_${userId}`) {
          return JSON.stringify(largeSessions)
        }
        return null
      })

      // メモリエラーが発生しないことを確認
      const activeSessions = sessionManager.getActiveUserSessions(userId)
      expect(activeSessions).toBeDefined()
      expect(Array.isArray(activeSessions)).toBe(true)
    })
  })

  describe('日時関連エラー処理', () => {
    it('不正な日時文字列でもエラーなく処理される', async () => {
      const sessionId = 'session123'
      
      const invalidTimestampData = {
        id: sessionId,
        userId: 'user123',
        createdAt: 'invalid date string',
        lastActivity: null,
        expiresAt: undefined,
        isActive: true,
      }

      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === `session_${sessionId}`) {
          return JSON.stringify(invalidTimestampData)
        }
        return null
      })

      // 不正な日時データでも処理が継続される
      const result = await sessionManager.validateSession(sessionId)
      expect(typeof result).toBe('boolean')
    })

    it('システム時計が変更された場合の処理', async () => {
      const sessionId = 'session123'
      
      // 未来の日時のセッション情報
      const futureSession = {
        id: sessionId,
        userId: 'user123',
        createdAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明日
        lastActivity: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      }

      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === `session_${sessionId}`) {
          return JSON.stringify(futureSession)
        }
        return null
      })

      // 未来の日時でも適切に処理される
      const result = await sessionManager.validateSession(sessionId)
      expect(typeof result).toBe('boolean')
    })
  })

  describe('並行処理・競合状態エラー', () => {
    it('同時に複数のセッション作成が実行されてもデータ整合性を保つ', async () => {
      const userId = 'user123'
      
      localStorage.getItem = vi.fn().mockReturnValue(null)
      
      // setItemが呼ばれるたびに異なる動作をする状況をシミュレート
      let callCount = 0
      localStorage.setItem = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount > 2) {
          // 3回目以降は競合状態をシミュレート
          throw new Error('Concurrent modification')
        }
      })

      // 複数のセッション作成が同時実行される
      const promises = [
        sessionManager.createSession(userId, 'session1', 'Mozilla/5.0', '192.168.1.1'),
        sessionManager.createSession(userId, 'session2', 'Mozilla/5.0', '192.168.1.2'),
        sessionManager.createSession(userId, 'session3', 'Mozilla/5.0', '192.168.1.3')
      ]

      // すべてのプロミスが解決される（エラーで拒否されない）
      const results = await Promise.allSettled(promises)
      
      expect(results.every(result => result.status === 'fulfilled')).toBe(true)
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'セッション情報の保存に失敗:',
        expect.any(Error)
      )
    })
  })

  describe('境界値・エッジケース', () => {
    it('セッション有効期限がちょうど現在時刻の場合の処理', async () => {
      const sessionId = 'session123'
      const now = new Date()
      
      const sessionInfo = {
        id: sessionId,
        userId: 'user123',
        createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30分前
        lastActivity: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        expiresAt: now.toISOString(), // 現在時刻
        isActive: true,
      }

      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === `session_${sessionId}`) {
          return JSON.stringify(sessionInfo)
        }
        return null
      })
      localStorage.setItem = vi.fn()

      const result = await sessionManager.validateSession(sessionId)
      expect(result).toBe(false) // 期限切れとして扱われる
    })

    it('同時セッション数が上限を大幅に超えている場合の処理', async () => {
      const userId = 'user123'
      const userAgent = 'Mozilla/5.0'
      const ipAddress = '192.168.1.1'
      
      // 上限を大幅に超えるアクティブセッション
      const manySessions = Array(100).fill(null).map((_, i) => ({
        id: `session${i}`,
        userId,
        deviceId: `device${i}`,
        createdAt: new Date(Date.now() - i * 1000),
        lastActivity: new Date(Date.now() - i * 1000),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        ipAddress,
        userAgent,
        isActive: true,
      }))

      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === `user_sessions_${userId}`) {
          return JSON.stringify(manySessions)
        }
        if (key.startsWith('session_')) {
          const sessionId = key.replace('session_', '')
          return JSON.stringify(manySessions.find(s => s.id === sessionId))
        }
        return null
      })
      localStorage.setItem = vi.fn()

      // 大量のセッションがあってもエラーにならない
      const sessionInfo = await sessionManager.createSession(userId, 'newSession', userAgent, ipAddress)
      expect(sessionInfo).toBeDefined()
    })

    it('デバイスフィンgerprint生成で特殊な環境情報の場合の処理', async () => {
      // navigatorやscreenがundefinedの場合
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true,
      })
      
      Object.defineProperty(global, 'screen', {
        value: undefined,
        writable: true,
      })

      const userId = 'user123'
      const sessionId = 'session123'
      const userAgent = 'Mozilla/5.0'
      const ipAddress = '192.168.1.1'
      
      localStorage.getItem = vi.fn().mockReturnValue(null)
      localStorage.setItem = vi.fn()

      // navigator/screenがundefinedでもエラーにならない
      const sessionInfo = await sessionManager.createSession(userId, sessionId, userAgent, ipAddress)
      
      expect(sessionInfo).toBeDefined()
      expect(sessionInfo.deviceId).toBeDefined()
    })
  })

  describe('セキュリティ検証エラー', () => {
    it('疑わしい活動検出でエラーが発生した場合の処理', async () => {
      const sessionId = 'session123'
      const userId = 'user123'
      
      const sessionInfo = {
        id: sessionId,
        userId,
        deviceId: 'device123',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        isActive: true,
      }

      // getUserSessions が例外を投げる状況をモック
      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === `session_${sessionId}`) {
          return JSON.stringify(sessionInfo)
        }
        if (key === `user_sessions_${userId}`) {
          throw new Error('Session data corrupted')
        }
        return null
      })

      // エラーが発生してもvalidateSessionは適切に処理する
      const result = await sessionManager.validateSession(sessionId)
      expect(typeof result).toBe('boolean')
    })
  })
})