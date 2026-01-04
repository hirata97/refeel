import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SecurityMonitor, SecurityAlertManager, SecurityMetricsCollector } from '@/utils/security-monitoring'
import { SecurityIncidentReporter } from '@features/auth/security'
import type { SecurityEvent, SecurityAlert, ThreatLevel } from '@/types/security-monitoring'

// loggerのモック（グローバルモックを明示的に宣言）
// createLoggerが返すモックloggerインスタンスを保持
// vi.hoisted()を使用してホイスティング問題を回避
const mockLoggerInstance = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn(),
}))

vi.mock('@shared/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
  },
  createLogger: vi.fn(() => mockLoggerInstance),
}))

// SecurityIncidentReporterのモック
vi.mock('@/utils/security', () => ({
  SecurityIncidentReporter: {
    reportIncident: vi.fn()
  }
}))

// ブラウザAPIのモック
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123')
  }
})

Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Test Browser'
  }
})

Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  }
})

// PromiseRejectionEventのモック
global.PromiseRejectionEvent = class PromiseRejectionEvent extends Event {
  promise: Promise<unknown>
  reason: unknown

  constructor(type: string, eventInitDict: { promise: Promise<unknown>; reason: unknown }) {
    super(type)
    this.promise = eventInitDict.promise
    this.reason = eventInitDict.reason
  }
}

describe.skip('SecurityMonitor', () => {
  let securityMonitor: SecurityMonitor
  let mockIncidentReporter: MockedFunction<typeof SecurityIncidentReporter.reportIncident>

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()

    // mockLoggerInstanceのモックをクリア
    mockLoggerInstance.debug.mockClear()
    mockLoggerInstance.info.mockClear()
    mockLoggerInstance.warn.mockClear()
    mockLoggerInstance.error.mockClear()
    mockLoggerInstance.log.mockClear()

    // シングルトンのリセット
    ;(SecurityMonitor as unknown).instance = null
    securityMonitor = SecurityMonitor.getInstance()

    mockIncidentReporter = SecurityIncidentReporter.reportIncident as MockedFunction<typeof SecurityIncidentReporter.reportIncident>
  })

  afterEach(() => {
    vi.useRealTimers()
    securityMonitor.stopMonitoring()
  })

  describe('シングルトンパターン', () => {
    it('インスタンスが単一であることを確認', () => {
      const instance1 = SecurityMonitor.getInstance()
      const instance2 = SecurityMonitor.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('監視開始・停止', () => {
    it('監視を開始できる', () => {
      securityMonitor.startMonitoring()

      expect(mockLoggerInstance.debug).toHaveBeenCalledWith('🔍 Security monitoring started')
    })

    it('監視を停止できる', () => {
      securityMonitor.startMonitoring()
      securityMonitor.stopMonitoring()

      expect(mockLoggerInstance.debug).toHaveBeenCalledWith('🔍 Security monitoring stopped')
    })

    it('重複した監視開始をスキップする', () => {
      securityMonitor.startMonitoring()
      securityMonitor.startMonitoring()

      expect(mockLoggerInstance.debug).toHaveBeenCalledTimes(1)
    })
  })

  describe('セキュリティイベントの記録', () => {
    it('イベントを正しく記録する', () => {
      const event = {
        type: 'auth_failure' as const,
        severity: 'high' as ThreatLevel,
        userId: 'user123',
        action: 'login_attempt',
        details: { reason: 'invalid_password' }
      }

      securityMonitor.recordEvent(event)
      
      const events = securityMonitor.getEvents(1)
      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({
        ...event,
        id: 'test-uuid-123',
        timestamp: expect.any(String)
      })
    })

    it('古いイベントを自動でクリーンアップする', () => {
      // 1001件のイベントを追加
      for (let i = 0; i < 1001; i++) {
        securityMonitor.recordEvent({
          type: 'api_call',
          severity: 'low',
          action: `test_${i}`,
          details: {}
        })
      }

      const events = securityMonitor.getEvents(2000)
      expect(events).toHaveLength(1000)
    }, 10000)

    it('メトリクスが正しく更新される', () => {
      securityMonitor.recordEvent({
        type: 'auth_failure',
        severity: 'high',
        userId: 'user123',
        action: 'test',
        details: {}
      })

      const metrics = securityMonitor.getMetrics()
      expect(metrics.totalEvents).toBe(1)
      expect(metrics.eventsByType.get('auth_failure')).toBe(1)
      expect(metrics.eventsBySeverity.get('high')).toBe(1)
      expect(metrics.activeUsers.has('user123')).toBe(true)
    })
  })

  describe('不正アクセス検知', () => {
    it('複数回の認証失敗を検知する', () => {
      const userId = 'attacker123'
      
      // 5回の認証失敗を記録
      for (let i = 0; i < 5; i++) {
        securityMonitor.recordEvent({
          type: 'auth_failure',
          severity: 'medium',
          userId,
          action: 'login',
          details: {}
        })
      }

      // 6回目で不審なアクティビティとして検知されるべき
      securityMonitor.detectSuspiciousActivity(userId, 'login', {})

      expect(mockIncidentReporter).toHaveBeenCalledWith({
        type: 'suspicious_activity',
        severity: 'high',
        details: {
          userId,
          action: 'login',
          failedAttempts: 5,
          recentEvents: expect.any(Number)
        }
      })
    })

    it('閾値未満では検知しない', () => {
      const userId = 'user123'
      
      // 3回の認証失敗（閾値5未満）
      for (let i = 0; i < 3; i++) {
        securityMonitor.recordEvent({
          type: 'auth_failure',
          severity: 'medium',
          userId,
          action: 'login',
          details: {}
        })
      }

      securityMonitor.detectSuspiciousActivity(userId, 'login', {})

      expect(mockIncidentReporter).not.toHaveBeenCalled()
    })
  })

  describe('API使用量監視', () => {
    it('正常なAPI呼び出しを記録する', () => {
      securityMonitor.monitorAPIUsage('/api/goals', 'user123', 150, 200)

      const events = securityMonitor.getEvents(1)
      expect(events[0]).toMatchObject({
        type: 'api_call',
        severity: 'low',
        userId: 'user123',
        action: 'API: /api/goals',
        details: {
          endpoint: '/api/goals',
          responseTime: 150,
          statusCode: 200,
          userAgent: 'Test Browser'
        }
      })
    })

    it('レート制限超過を検知する', () => {
      const userId = 'user123'
      const endpoint = '/api/goals'

      // 101回のAPI呼び出し（制限100を超過）
      for (let i = 0; i < 101; i++) {
        securityMonitor.monitorAPIUsage(endpoint, userId, 100, 200)
      }

      const events = securityMonitor.getEvents(200)
      const rateLimitEvent = events.find(e => e.type === 'rate_limit_exceeded')
      
      expect(rateLimitEvent).toBeDefined()
      expect(rateLimitEvent?.details).toMatchObject({
        endpoint,
        callCount: expect.any(Number),
        timeWindow: '1 minute'
      })
    })

    it('異常に遅いレスポンスタイムを検知する', () => {
      securityMonitor.monitorAPIUsage('/api/goals', 'user123', 6000, 200)

      const events = securityMonitor.getEvents(10)
      const performanceEvent = events.find(e => e.type === 'performance_issue')
      
      expect(performanceEvent).toBeDefined()
      expect(performanceEvent?.details).toMatchObject({
        endpoint: '/api/goals',
        responseTime: 6000,
        threshold: 5000
      })
    })
  })

  describe('脅威レベル評価', () => {
    it('criticalイベントがある場合はcriticalを返す', () => {
      securityMonitor.recordEvent({
        type: 'data_breach_attempt',
        severity: 'critical',
        action: 'test',
        details: {}
      })

      const threatLevel = securityMonitor.assessThreatLevel()
      expect(threatLevel).toBe('critical')
    })

    it('highイベントが3個以上ある場合はhighを返す', () => {
      for (let i = 0; i < 3; i++) {
        securityMonitor.recordEvent({
          type: 'suspicious_activity',
          severity: 'high',
          action: `test_${i}`,
          details: {}
        })
      }

      const threatLevel = securityMonitor.assessThreatLevel()
      expect(threatLevel).toBe('high')
    })

    it('mediumイベントが10個以上ある場合はmediumを返す', () => {
      for (let i = 0; i < 10; i++) {
        securityMonitor.recordEvent({
          type: 'rate_limit_exceeded',
          severity: 'medium',
          action: `test_${i}`,
          details: {}
        })
      }

      const threatLevel = securityMonitor.assessThreatLevel()
      expect(threatLevel).toBe('medium')
    })

    it('条件に満たない場合はlowを返す', () => {
      securityMonitor.recordEvent({
        type: 'api_call',
        severity: 'low',
        action: 'test',
        details: {}
      })

      const threatLevel = securityMonitor.assessThreatLevel()
      expect(threatLevel).toBe('low')
    })
  })

  describe('アラートルール', () => {
    it('カスタムアラートルールを追加できる', () => {
      const customRule = {
        id: 'custom-rule',
        name: 'カスタムルール',
        condition: (event: SecurityEvent) => event.type === 'malicious_input',
        severity: 'high' as const,
        action: 'alert' as const
      }

      securityMonitor.addAlertRule(customRule)

      // ルールに一致するイベントを記録
      securityMonitor.recordEvent({
        type: 'malicious_input',
        severity: 'medium',
        action: 'test',
        details: {}
      })

      // アラートマネージャーでアラートが発火されることを確認
      // 実際のテストでは SecurityAlertManager のモックが必要
    })
  })

  describe('グローバルエラー監視', () => {
    it('セキュリティエラーを検知する', () => {
      securityMonitor.startMonitoring()

      const securityError = new Error('Security violation')
      securityError.name = 'SecurityError'

      // セキュリティエラーイベントをシミュレート
      const errorEvent = new ErrorEvent('error', {
        error: securityError,
        message: 'Security violation',
        filename: 'test.js',
        lineno: 10,
        colno: 5
      })

      window.dispatchEvent(errorEvent)

      const events = securityMonitor.getEvents(10)
      const securityErrorEvent = events.find(e => e.type === 'security_error')
      
      expect(securityErrorEvent).toBeDefined()
      expect(securityErrorEvent?.details).toMatchObject({
        message: 'Security violation',
        filename: 'test.js',
        lineno: 10,
        colno: 5
      })
    })

    it('ネットワークエラーを検知する', async () => {
      securityMonitor.startMonitoring()

      const networkError = new Error('Network failure')
      networkError.name = 'NetworkError'

      // Promise拒否をキャッチして処理
      const rejectedPromise = Promise.reject(networkError).catch(() => {
        // エラーを適切にキャッチして未処理エラーを防ぐ
      })

      // ネットワークエラーイベントをシミュレート
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise: rejectedPromise,
        reason: networkError
      })

      window.dispatchEvent(rejectionEvent)

      const events = securityMonitor.getEvents(10)
      const networkErrorEvent = events.find(e => e.type === 'network_error')

      expect(networkErrorEvent).toBeDefined()
      expect(networkErrorEvent?.details).toMatchObject({
        reason: 'Network failure'
      })
    })
  })
})

describe.skip('SecurityAlertManager', () => {
  let alertManager: SecurityAlertManager

  beforeEach(() => {
    vi.clearAllMocks()
    ;(SecurityAlertManager as unknown).instance = null
    alertManager = SecurityAlertManager.getInstance()
  })

  describe('シングルトンパターン', () => {
    it('インスタンスが単一であることを確認', () => {
      const instance1 = SecurityAlertManager.getInstance()
      const instance2 = SecurityAlertManager.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('アラート管理', () => {
    it('アラートをトリガーできる', () => {
      const mockAlert: SecurityAlert = {
        id: 'alert-123',
        ruleId: 'rule-123',
        ruleName: 'テストルール',
        severity: 'high',
        event: {
          id: 'event-123',
          type: 'suspicious_activity',
          severity: 'high',
          timestamp: new Date().toISOString(),
          action: 'test',
          details: {}
        },
        triggeredAt: new Date().toISOString(),
        acknowledged: false
      }

      alertManager.triggerAlert(mockAlert)

      const alerts = alertManager.getAlerts(1)
      expect(alerts[0]).toEqual(mockAlert)
      expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
        expect.stringContaining('Security Alert: テストルール'),
        mockAlert
      )
    })

    it('アラートを承認できる', () => {
      const mockAlert: SecurityAlert = {
        id: 'alert-123',
        ruleId: 'rule-123',
        ruleName: 'テストルール',
        severity: 'high',
        event: {
          id: 'event-123',
          type: 'suspicious_activity',
          severity: 'high',
          timestamp: new Date().toISOString(),
          action: 'test',
          details: {}
        },
        triggeredAt: new Date().toISOString(),
        acknowledged: false
      }

      alertManager.triggerAlert(mockAlert)
      alertManager.acknowledgeAlert('alert-123')

      const alerts = alertManager.getAlerts(1)
      expect(alerts[0].acknowledged).toBe(true)
      expect(alerts[0].acknowledgedAt).toBeDefined()
    })

    it('未承認アラートを取得できる', () => {
      const acknowledgedAlert: SecurityAlert = {
        id: 'alert-1',
        ruleId: 'rule-1',
        ruleName: 'ルール1',
        severity: 'medium',
        event: {
          id: 'event-1',
          type: 'auth_failure',
          severity: 'medium',
          timestamp: new Date().toISOString(),
          action: 'test',
          details: {}
        },
        triggeredAt: new Date().toISOString(),
        acknowledged: true
      }

      const unacknowledgedAlert: SecurityAlert = {
        id: 'alert-2',
        ruleId: 'rule-2',
        ruleName: 'ルール2',
        severity: 'high',
        event: {
          id: 'event-2',
          type: 'suspicious_activity',
          severity: 'high',
          timestamp: new Date().toISOString(),
          action: 'test',
          details: {}
        },
        triggeredAt: new Date().toISOString(),
        acknowledged: false
      }

      alertManager.triggerAlert(acknowledgedAlert)
      alertManager.triggerAlert(unacknowledgedAlert)

      const unacknowledged = alertManager.getUnacknowledgedAlerts()
      expect(unacknowledged).toHaveLength(1)
      expect(unacknowledged[0].id).toBe('alert-2')
    })

    it('アラートをクリアできる', () => {
      const mockAlert: SecurityAlert = {
        id: 'alert-123',
        ruleId: 'rule-123',
        ruleName: 'テストルール',
        severity: 'high',
        event: {
          id: 'event-123',
          type: 'suspicious_activity',
          severity: 'high',
          timestamp: new Date().toISOString(),
          action: 'test',
          details: {}
        },
        triggeredAt: new Date().toISOString(),
        acknowledged: false
      }

      alertManager.triggerAlert(mockAlert)
      expect(alertManager.getAlerts()).toHaveLength(1)

      alertManager.clearAlerts()
      expect(alertManager.getAlerts()).toHaveLength(0)
    })
  })

  describe('アラートハンドラー', () => {
    it('カスタムアラートハンドラーを追加できる', () => {
      const customHandler = vi.fn()
      alertManager.addAlertHandler('custom', customHandler)

      const mockAlert: SecurityAlert = {
        id: 'alert-123',
        ruleId: 'rule-123',
        ruleName: 'テストルール',
        severity: 'high',
        event: {
          id: 'event-123',
          type: 'suspicious_activity',
          severity: 'high',
          timestamp: new Date().toISOString(),
          action: 'test',
          details: {}
        },
        triggeredAt: new Date().toISOString(),
        acknowledged: false
      }

      alertManager.triggerAlert(mockAlert)
      expect(customHandler).toHaveBeenCalledWith(mockAlert)
    })

    it('アラートハンドラーを削除できる', () => {
      const customHandler = vi.fn()
      alertManager.addAlertHandler('custom', customHandler)
      alertManager.removeAlertHandler('custom')

      const mockAlert: SecurityAlert = {
        id: 'alert-123',
        ruleId: 'rule-123',
        ruleName: 'テストルール',
        severity: 'high',
        event: {
          id: 'event-123',
          type: 'suspicious_activity',
          severity: 'high',
          timestamp: new Date().toISOString(),
          action: 'test',
          details: {}
        },
        triggeredAt: new Date().toISOString(),
        acknowledged: false
      }

      alertManager.triggerAlert(mockAlert)
      expect(customHandler).not.toHaveBeenCalled()
    })

    it('ハンドラーエラーを適切に処理する', () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error')
      })
      alertManager.addAlertHandler('error', errorHandler)

      const mockAlert: SecurityAlert = {
        id: 'alert-123',
        ruleId: 'rule-123',
        ruleName: 'テストルール',
        severity: 'high',
        event: {
          id: 'event-123',
          type: 'suspicious_activity',
          severity: 'high',
          timestamp: new Date().toISOString(),
          action: 'test',
          details: {}
        },
        triggeredAt: new Date().toISOString(),
        acknowledged: false
      }

      alertManager.triggerAlert(mockAlert)

      expect(errorHandler).toHaveBeenCalled()
      expect(mockLoggerInstance.error).toHaveBeenCalledWith(
        'Alert handler error:',
        expect.any(Error)
      )
    })
  })

  describe('永続化', () => {
    it('アラートをローカルストレージに保存する', () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem')

      const mockAlert: SecurityAlert = {
        id: 'alert-123',
        ruleId: 'rule-123',
        ruleName: 'テストルール',
        severity: 'high',
        event: {
          id: 'event-123',
          type: 'suspicious_activity',
          severity: 'high',
          timestamp: new Date().toISOString(),
          action: 'test',
          details: {}
        },
        triggeredAt: new Date().toISOString(),
        acknowledged: false
      }

      alertManager.triggerAlert(mockAlert)

      expect(setItemSpy).toHaveBeenCalledWith(
        'security_alerts',
        expect.stringContaining('alert-123')
      )
    })

    it('最新100件のアラートのみ保持する', () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem')

      // 既存の99件のアラートをローカルストレージに設定
      const existingAlerts = Array.from({ length: 99 }, (_, i) => ({
        id: `alert-${i}`,
        ruleId: `rule-${i}`,
        ruleName: `アラート${i}`,
        severity: 'low' as const,
        event: {
          id: `event-${i}`,
          type: 'api_call' as const,
          severity: 'low' as const,
          timestamp: new Date().toISOString(),
          action: `test-${i}`,
          details: {}
        },
        triggeredAt: new Date().toISOString(),
        acknowledged: false
      }))

      // ローカルストレージに既存アラートを設定
      const getItemSpy = vi.spyOn(localStorage, 'getItem')
      getItemSpy.mockReturnValue(JSON.stringify(existingAlerts))

      // 新しいアラートを追加（100件目）
      const newAlert: SecurityAlert = {
        id: 'alert-new',
        ruleId: 'rule-new',
        ruleName: '新しいアラート',
        severity: 'high',
        event: {
          id: 'event-new',
          type: 'suspicious_activity',
          severity: 'high',
          timestamp: new Date().toISOString(),
          action: 'test',
          details: {}
        },
        triggeredAt: new Date().toISOString(),
        acknowledged: false
      }

      alertManager.triggerAlert(newAlert)

      // 永続化の確認
      expect(setItemSpy).toHaveBeenCalledWith(
        'security_alerts',
        expect.any(String)
      )

      const savedData = JSON.parse(setItemSpy.mock.calls[0][1])
      expect(savedData).toHaveLength(100)
      expect(savedData[99].id).toBe('alert-new')
    })
  })
})

describe.skip('SecurityMetricsCollector', () => {
  let metricsCollector: SecurityMetricsCollector

  beforeEach(() => {
    ;(SecurityMetricsCollector as unknown).instance = null
    metricsCollector = SecurityMetricsCollector.getInstance()
  })

  describe('シングルトンパターン', () => {
    it('インスタンスが単一であることを確認', () => {
      const instance1 = SecurityMetricsCollector.getInstance()
      const instance2 = SecurityMetricsCollector.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('パフォーマンスメトリクス', () => {
    it('メトリクスを記録できる', () => {
      metricsCollector.recordPerformance('response_time', 150)
      metricsCollector.recordPerformance('response_time', 200)
      metricsCollector.recordPerformance('response_time', 100)

      const stats = metricsCollector.getMetricStats('response_time')
      
      expect(stats).toEqual({
        avg: 150,
        min: 100,
        max: 200,
        count: 3
      })
    })

    it('存在しないメトリクスの統計取得でnullを返す', () => {
      const stats = metricsCollector.getMetricStats('nonexistent')
      expect(stats).toBeNull()
    })

    it('最新1000件のデータを保持する', () => {
      // 1001件のデータを追加
      for (let i = 0; i < 1001; i++) {
        metricsCollector.recordPerformance('test_metric', i)
      }

      const stats = metricsCollector.getMetricStats('test_metric')
      expect(stats?.count).toBe(1000)
      expect(stats?.min).toBe(1) // 最初の0は削除されている
    })

    it('全メトリクスを取得できる', () => {
      metricsCollector.recordPerformance('metric1', 100)
      metricsCollector.recordPerformance('metric2', 200)

      const allMetrics = metricsCollector.getAllMetrics()
      
      expect(allMetrics).toHaveProperty('metric1')
      expect(allMetrics).toHaveProperty('metric2')
      expect(allMetrics.metric1).toEqual([100])
      expect(allMetrics.metric2).toEqual([200])
    })
  })
})