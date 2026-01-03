/**
 * AuditLogger 正常系テスト
 * 
 * 監査ログシステムの基本機能をテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  AuditLogger, 
  AuditEventType, 
  AuditEventSeverity,
  auditLogger 
} from '@/utils/audit-logger'

describe('AuditLogger - 正常系', () => {
  let logger

  beforeEach(() => {
    // localStorage をクリア
    localStorage.clear()
    
    // ログインスタンスを取得
    logger = AuditLogger.getInstance()
    
    // コンソール出力をモック
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('シングルトンパターン', () => {
    it('同じインスタンスを返すこと', () => {
      const logger1 = AuditLogger.getInstance()
      const logger2 = AuditLogger.getInstance()
      
      expect(logger1).toBe(logger2)
    })

    it('auditLogger エクスポートが同じインスタンスであること', () => {
      const instance = AuditLogger.getInstance()
      
      expect(auditLogger).toBe(instance)
    })
  })

  describe('基本ログ記録', () => {
    it('ログエントリを正常に記録できること', async () => {
      await logger.log(
        AuditEventType.AUTH_SUCCESS,
        'ユーザーログイン成功',
        { userId: 'user123' }
      )

      const logs = logger.searchLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0]).toMatchObject({
        eventType: AuditEventType.AUTH_SUCCESS,
        message: 'ユーザーログイン成功',
        metadata: { userId: 'user123' },
        source: 'web_app'
      })
    })

    it('必須プロパティが正しく設定されること', async () => {
      await logger.log(AuditEventType.SYSTEM_INFO, 'システム情報')

      const logs = logger.searchLogs()
      const logEntry = logs[0]
      
      expect(logEntry.id).toBeTruthy()
      expect(logEntry.timestamp).toBeInstanceOf(Date)
      expect(logEntry.severity).toBe(AuditEventSeverity.LOW)
      expect(typeof logEntry.id).toBe('string')
      expect(logEntry.id).toMatch(/^log_\d+_[a-z0-9]+$/)
    })

    it('メタデータなしでもログ記録できること', async () => {
      await logger.log(AuditEventType.SYSTEM_INFO, 'システム開始')

      const logs = logger.searchLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].metadata).toBeUndefined()
    })
  })

  describe('重要度判定', () => {
    it('CRITICALイベントが正しく分類されること', async () => {
      await logger.log(AuditEventType.SECURITY_VIOLATION, 'セキュリティ違反検出')

      const logs = logger.searchLogs()
      expect(logs[0].severity).toBe(AuditEventSeverity.CRITICAL)
    })

    it('HIGHイベントが正しく分類されること', async () => {
      await logger.log(AuditEventType.SECURITY_LOCKOUT, 'アカウントロックアウト')

      const logs = logger.searchLogs()
      expect(logs[0].severity).toBe(AuditEventSeverity.HIGH)
    })

    it('MEDIUMイベントが正しく分類されること', async () => {
      await logger.log(AuditEventType.AUTH_FAILED_LOGIN, 'ログイン失敗')

      const logs = logger.searchLogs()
      expect(logs[0].severity).toBe(AuditEventSeverity.MEDIUM)
    })

    it('LOWイベントが正しく分類されること', async () => {
      await logger.log(AuditEventType.SYSTEM_INFO, 'システム情報')

      const logs = logger.searchLogs()
      expect(logs[0].severity).toBe(AuditEventSeverity.LOW)
    })
  })

  describe('ログ検索', () => {
    beforeEach(async () => {
      // テスト用ログデータを作成
      await logger.log(AuditEventType.AUTH_SUCCESS, 'ログイン成功1', { userId: 'user1' })
      await logger.log(AuditEventType.AUTH_FAILED_LOGIN, 'ログイン失敗1', { userId: 'user2' })
      await logger.log(AuditEventType.SECURITY_LOCKOUT, 'アカウントロック', { userId: 'user2' })
      await logger.log(AuditEventType.SYSTEM_INFO, 'システム情報', { userId: 'user1' })
    })

    it('フィルタなしで全ログが取得できること', () => {
      const logs = logger.searchLogs()
      expect(logs).toHaveLength(4)
    })

    it('イベントタイプでフィルタできること', () => {
      const logs = logger.searchLogs({
        eventTypes: [AuditEventType.AUTH_SUCCESS, AuditEventType.AUTH_FAILED_LOGIN]
      })
      expect(logs).toHaveLength(2)
    })

    it('重要度でフィルタできること', () => {
      const logs = logger.searchLogs({
        severities: [AuditEventSeverity.HIGH]
      })
      expect(logs).toHaveLength(1)
      expect(logs[0].eventType).toBe(AuditEventType.SECURITY_LOCKOUT)
    })

    it('ユーザーIDでフィルタできること', () => {
      const logs = logger.searchLogs({
        userId: 'user1'
      })
      expect(logs).toHaveLength(2)
    })

    it('制限数でフィルタできること', () => {
      const logs = logger.searchLogs({
        limit: 2
      })
      expect(logs).toHaveLength(2)
    })

    it('新しい順でソートされること', () => {
      const logs = logger.searchLogs()
      expect(logs[0].message).toBe('システム情報') // 最後に追加したログ
    })
  })

  describe('ユーザー別ログ取得', () => {
    beforeEach(async () => {
      await logger.log(AuditEventType.AUTH_SUCCESS, 'ログイン1', { userId: 'user1' })
      await logger.log(AuditEventType.AUTH_SUCCESS, 'ログイン2', { userId: 'user2' })
      await logger.log(AuditEventType.AUTH_SUCCESS, 'ログイン3', { userId: 'user1' })
    })

    it('指定ユーザーのログのみ取得できること', () => {
      const logs = logger.getUserLogs('user1')
      expect(logs).toHaveLength(2)
      logs.forEach(log => {
        expect(log.userId).toBe('user1')
      })
    })

    it('存在しないユーザーでは空配列が返ること', () => {
      const logs = logger.getUserLogs('nonexistent')
      expect(logs).toHaveLength(0)
    })

    it('制限数が適用されること', () => {
      const logs = logger.getUserLogs('user1', 1)
      expect(logs).toHaveLength(1)
    })
  })

  describe('セキュリティログ取得', () => {
    beforeEach(async () => {
      await logger.log(AuditEventType.AUTH_SUCCESS, 'ログイン成功')
      await logger.log(AuditEventType.AUTH_FAILED_LOGIN, 'ログイン失敗')
      await logger.log(AuditEventType.SECURITY_LOCKOUT, 'アカウントロック')
      await logger.log(AuditEventType.SECURITY_VIOLATION, 'セキュリティ違反')
      await logger.log(AuditEventType.SYSTEM_INFO, 'システム情報')
    })

    it('セキュリティ関連のログのみ取得できること', () => {
      const logs = logger.getSecurityLogs()
      expect(logs).toHaveLength(3) // 失敗ログイン、ロック、違反
      
      const eventTypes = logs.map(log => log.eventType)
      expect(eventTypes).toContain(AuditEventType.AUTH_FAILED_LOGIN)
      expect(eventTypes).toContain(AuditEventType.SECURITY_LOCKOUT)
      expect(eventTypes).toContain(AuditEventType.SECURITY_VIOLATION)
      expect(eventTypes).not.toContain(AuditEventType.AUTH_SUCCESS)
    })
  })

  describe('ログ統計', () => {
    beforeEach(async () => {
      // 異なる重要度のログを作成
      await logger.log(AuditEventType.SECURITY_VIOLATION, 'Critical') // CRITICAL
      await logger.log(AuditEventType.SECURITY_LOCKOUT, 'High') // HIGH
      await logger.log(AuditEventType.AUTH_FAILED_LOGIN, 'Failed1') // MEDIUM
      await logger.log(AuditEventType.AUTH_FAILED_LOGIN, 'Failed2') // MEDIUM
      await logger.log(AuditEventType.SYSTEM_INFO, 'Info') // LOW
    })

    it('統計情報が正しく計算されること', () => {
      const stats = logger.getLogStatistics()
      
      expect(stats.totalEvents).toBe(5)
      expect(stats.criticalEvents).toBe(1)
      expect(stats.failedLogins).toBe(2)
      expect(stats.eventTypeBreakdown[AuditEventType.AUTH_FAILED_LOGIN]).toBe(2)
      expect(stats.eventTypeBreakdown[AuditEventType.SECURITY_VIOLATION]).toBe(1)
    })

    it('時間範囲の統計が取得できること', () => {
      const stats = logger.getLogStatistics(24) // 24時間
      expect(stats.totalEvents).toBeGreaterThan(0)
    })
  })

  describe('ログエクスポート', () => {
    beforeEach(async () => {
      await logger.log(
        AuditEventType.AUTH_SUCCESS, 
        'テストログ',
        { userId: 'user123', action: 'test' }
      )
    })

    it('CSV形式でエクスポートできること', () => {
      const csv = logger.exportLogs()
      
      expect(csv).toContain('Timestamp,Event Type,Severity,Message')
      expect(csv).toContain(AuditEventType.AUTH_SUCCESS)
      expect(csv).toContain('テストログ')
      expect(csv).toContain('user123')
    })

    it('特殊文字が適切にエスケープされること', async () => {
      await logger.log(AuditEventType.SYSTEM_INFO, 'メッセージに"クォート"を含む')
      
      const csv = logger.exportLogs()
      expect(csv).toContain('""クォート""') // ダブルクォートのエスケープ
    })
  })

  describe('ログクリア', () => {
    beforeEach(async () => {
      await logger.log(AuditEventType.SYSTEM_INFO, 'テスト1')
      await logger.log(AuditEventType.SYSTEM_INFO, 'テスト2')
    })

    it('全ログをクリアできること', () => {
      logger.clearLogs()
      
      const logs = logger.searchLogs()
      // clearLogs自体のログが記録されるので1件存在
      expect(logs).toHaveLength(1)
      expect(logs[0].message).toContain('監査ログクリア実行')
    })

    it('日付指定でログをクリアできること', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      logger.clearLogs(tomorrow)
      
      const logs = logger.searchLogs()
      // 既存のログは残り、clearLogsのログが追加される
      expect(logs.length).toBeGreaterThan(2)
    })
  })
})