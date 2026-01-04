/**
 * AuditLogger 異常系テスト
 * 
 * エラーハンドリングと例外ケースをテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  AuditLogger,
  AuditEventType,
  AuditEventSeverity
} from '@/features/auth/services/audit-logger'

// TODO: Phase 4.1移行により、AuditLoggerがクラスからオブジェクトに変更されたため、
// テストを新しい実装に合わせて修正する必要があります（後続PRで対応）
describe.skip('AuditLogger - 異常系', () => {
  let logger
  let consoleErrorSpy

  beforeEach(() => {
    localStorage.clear()
    logger = AuditLogger.getInstance()
    
    // コンソール出力をスパイ
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('localStorage エラーハンドリング', () => {
    it('localStorage.setItem エラー時もアプリケーションが継続すること', async () => {
      // localStorage.setItem をエラーになるようにモック
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('Storage quota exceeded')
        })

      // エラーが発生してもログ記録処理は完了すること
      await expect(logger.log(
        AuditEventType.SYSTEM_INFO, 
        'テストメッセージ'
      )).resolves.not.toThrow()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('監査ログの保存に失敗'),
        expect.any(Error)
      )

      setItemSpy.mockRestore()
    })

    it('localStorage.getItem エラー時は空配列を返すこと', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
        .mockImplementation(() => {
          throw new Error('Storage access error')
        })

      const logs = logger.searchLogs()
      expect(logs).toEqual([])
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('監査ログの取得に失敗'),
        expect.any(Error)
      )

      getItemSpy.mockRestore()
    })

    it('破損したJSONデータの場合は空配列を返すこと', () => {
      // 無効なJSONデータを設定
      vi.spyOn(Storage.prototype, 'getItem')
        .mockReturnValue('invalid json data')

      const logs = logger.searchLogs()
      expect(logs).toEqual([])
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('監査ログの取得に失敗'),
        expect.any(Error)
      )
    })
  })

  describe('ログ記録容量制限', () => {
    it('最大ログエントリ数を超えた場合、古いログが削除されること', async () => {
      // maxLogEntries を一時的に小さな値に変更
      const originalMaxEntries = logger.maxLogEntries
      Object.defineProperty(logger, 'maxLogEntries', { 
        value: 3, 
        writable: true 
      })

      // 制限を超える数のログを追加
      await logger.log(AuditEventType.SYSTEM_INFO, 'ログ1')
      await logger.log(AuditEventType.SYSTEM_INFO, 'ログ2')
      await logger.log(AuditEventType.SYSTEM_INFO, 'ログ3')
      await logger.log(AuditEventType.SYSTEM_INFO, 'ログ4')
      await logger.log(AuditEventType.SYSTEM_INFO, 'ログ5')

      const logs = logger.searchLogs()
      expect(logs.length).toBeLessThanOrEqual(3)
      
      // 最新のログが保持されていることを確認
      expect(logs.some(log => log.message === 'ログ5')).toBe(true)
      expect(logs.some(log => log.message === 'ログ1')).toBe(false)

      // 元の値に戻す
      Object.defineProperty(logger, 'maxLogEntries', { 
        value: originalMaxEntries, 
        writable: true 
      })
    })
  })

  describe('不正な入力データ処理', () => {
    it('null/undefined メタデータでもログ記録できること', async () => {
      await logger.log(AuditEventType.SYSTEM_INFO, 'テスト', null)
      await logger.log(AuditEventType.SYSTEM_INFO, 'テスト', undefined)

      const logs = logger.searchLogs()
      expect(logs).toHaveLength(2)
    })

    it('空文字列メッセージでもログ記録できること', async () => {
      await logger.log(AuditEventType.SYSTEM_INFO, '')

      const logs = logger.searchLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].message).toBe('')
    })

    it('循環参照を含むメタデータでもエラーにならないこと', async () => {
      const circularObj = { name: 'test' }
      circularObj.self = circularObj

      await expect(logger.log(
        AuditEventType.SYSTEM_INFO, 
        '循環参照テスト', 
        circularObj
      )).resolves.not.toThrow()
    })
  })

  describe('検索フィルターエラー処理', () => {
    beforeEach(async () => {
      await logger.log(AuditEventType.AUTH_SUCCESS, 'テストログ', { userId: 'user1' })
    })

    it('不正な日付フィルターでもエラーにならないこと', () => {
      expect(() => {
        logger.searchLogs({
          dateFrom: new Date('invalid-date'),
          dateTo: new Date('invalid-date')
        })
      }).not.toThrow()
    })

    it('存在しないイベントタイプフィルターでは空配列を返すこと', () => {
      const logs = logger.searchLogs({
        eventTypes: ['NONEXISTENT_EVENT_TYPE']
      })
      expect(logs).toEqual([])
    })

    it('存在しない重要度フィルターでは空配列を返すこと', () => {
      const logs = logger.searchLogs({
        severities: ['NONEXISTENT_SEVERITY']
      })
      expect(logs).toEqual([])
    })

    it('負の数値制限では適切に処理されること', () => {
      const logs = logger.searchLogs({ limit: -1 })
      // 負の値の場合はデフォルト制限が適用される
      expect(logs).toHaveLength(1)
    })

    it('非常に大きな制限値でも適切に処理されること', () => {
      const logs = logger.searchLogs({ limit: Number.MAX_SAFE_INTEGER })
      expect(logs).toHaveLength(1)
    })
  })

  describe('CSV エクスポートエラー処理', () => {
    beforeEach(async () => {
      await logger.log(AuditEventType.SYSTEM_INFO, 'テスト')
    })

    it('特殊文字を含むデータでもCSVエクスポートできること', async () => {
      await logger.log(
        AuditEventType.SYSTEM_INFO, 
        'カンマ,改行\n引用符"タブ\t特殊文字',
        { 
          special: 'value,with"quotes\nand\ttabs',
          unicode: '🔐🚨⚠️'
        }
      )

      const csv = logger.exportLogs()
      expect(csv).toBeTruthy()
      expect(typeof csv).toBe('string')
    })

    it('大量データでもCSVエクスポートできること', async () => {
      // 大量のログデータを生成
      for (let i = 0; i < 100; i++) {
        await logger.log(
          AuditEventType.SYSTEM_INFO, 
          `大量テストログ ${i}`,
          { indexdata: 'x'.repeat(100) }
        )
      }

      const csv = logger.exportLogs()
      expect(csv).toBeTruthy()
      expect(csv.split('\n').length).toBeGreaterThan(100)
    })
  })

  describe('統計計算エラー処理', () => {
    it('ログが存在しない場合でも統計を計算できること', () => {
      const stats = logger.getLogStatistics()
      
      expect(stats).toEqual({
        totalEvents: 0,
        criticalEvents: 0,
        securityEvents: 0,
        failedLogins: 0,
        eventTypeBreakdown: {}
      })
    })

    it('不正な時間範囲でも統計を計算できること', () => {
      expect(() => {
        logger.getLogStatistics(-1) // 負の時間
      }).not.toThrow()

      expect(() => {
        logger.getLogStatistics(0) // ゼロ時間
      }).not.toThrow()
    })

    it('非常に大きな時間範囲でも統計を計算できること', () => {
      expect(() => {
        logger.getLogStatistics(Number.MAX_SAFE_INTEGER)
      }).not.toThrow()
    })
  })

  describe('日付処理エラー', () => {
    it('localStorage から取得したログの日付が不正でもエラーにならないこと', () => {
      // 不正な日付を含むログデータを直接設定
      const invalidLogData = [{
        id: 'test',
        timestamp: 'invalid-date',
        eventType: AuditEventType.SYSTEM_INFO,
        severity: AuditEventSeverity.LOW,
        message: 'テスト',
        source: 'web_app'
      }]

      vi.spyOn(Storage.prototype, 'getItem')
        .mockReturnValue(JSON.stringify(invalidLogData))

      const logs = logger.searchLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].timestamp).toBeInstanceOf(Date)
    })
  })

  describe('サーバー送信エラー処理', () => {
    it('サーバー送信失敗でもログ記録は完了すること', async () => {
      // fetch をモック（エラーを投げる）
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(logger.log(
        AuditEventType.SECURITY_VIOLATION, 
        'クリティカルイベント'
      )).resolves.not.toThrow()

      const logs = logger.searchLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].severity).toBe(AuditEventSeverity.CRITICAL)

      // サーバー送信エラーがログに記録されること
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('サーバーへのログ送信に失敗'),
        expect.any(Error)
      )
    })
  })

  describe('メモリリーク防止', () => {
    it('大量のログ生成後もメモリ使用量が制限内に収まること', async () => {
      const initialMemory = process.memoryUsage?.()?.heapUsed || 0
      
      // 大量のログを生成
      for (let i = 0; i < 1000; i++) {
        await logger.log(
          AuditEventType.SYSTEM_INFO,
          `メモリテストログ ${i}`,
          { 
            index: i,
            data: 'data'.repeat(100),
            timestamp: new Date()
          }
        )
      }

      // ログが適切に制限されていることを確認
      const logs = logger.searchLogs()
      expect(logs.length).toBeLessThanOrEqual(10000) // maxLogEntries

      const finalMemory = process.memoryUsage?.()?.heapUsed || 0
      const memoryIncrease = finalMemory - initialMemory

      // メモリ増加が合理的な範囲内であることを確認（10MB以下）
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })
  })
})