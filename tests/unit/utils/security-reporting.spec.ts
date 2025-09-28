import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SecurityReportGenerator, SecurityReportDistributor } from '@/utils/security-reporting'
import type {
  SecurityReport,
  SecurityEvent,
  SecurityConfiguration,
  NotificationChannel
} from '@/types/security-monitoring'

// モック
const mockEvents: SecurityEvent[] = [
  {
    id: 'event-1',
    type: 'auth_failure',
    severity: 'medium',
    timestamp: '2024-01-01T00:00:00.000Z',
    action: 'login_failed',
    details: { reason: 'invalid_password' },
    userId: 'user1'
  },
  {
    id: 'event-2',
    type: 'suspicious_activity',
    severity: 'high',
    timestamp: '2024-01-01T01:00:00.000Z',
    action: 'multiple_failures',
    details: { attempts: 5 },
    userId: 'user2'
  },
  {
    id: 'event-3',
    type: 'api_call',
    severity: 'low',
    timestamp: '2024-01-01T02:00:00.000Z',
    action: 'GET /api/goals',
    details: { responseTime: 150 },
    userId: 'user1'
  }
]

// Fetch APIのモック
global.fetch = vi.fn()

// ブラウザAPIのモック
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123')
  }
})

// Console.errorのモック
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('SecurityReportGenerator', () => {
  let reportGenerator: SecurityReportGenerator

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T12:00:00.000Z'))
    vi.clearAllMocks()
    
    ;(SecurityReportGenerator as unknown).instance = null
    reportGenerator = SecurityReportGenerator.getInstance()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('シングルトンパターン', () => {
    it('インスタンスが単一であることを確認', () => {
      const instance1 = SecurityReportGenerator.getInstance()
      const instance2 = SecurityReportGenerator.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('日次レポート生成', () => {
    it('日次レポートを生成できる', async () => {
      const report = await reportGenerator.generateDailyReport(mockEvents)

      expect(report).toMatchObject({
        id: 'test-uuid-123',
        type: 'daily',
        period: {
          start: expect.any(String),
          end: expect.any(String)
        },
        summary: {
          totalEvents: 3,
          threatLevel: expect.any(String),
          criticalAlerts: 0,
          topThreats: expect.any(Array)
        },
        metrics: {
          eventsByType: {
            auth_failure: 1,
            suspicious_activity: 1,
            api_call: 1
          },
          eventsBySeverity: {
            low: 1,
            medium: 1,
            high: 1,
            critical: 0
          },
          responseTimeStats: {
            avg: 150,
            min: 150,
            max: 150
          },
          userActivity: {
            activeUsers: 2,
            suspiciousUsers: ['user2']
          }
        },
        incidents: expect.any(Array),
        recommendations: expect.any(Array),
        generatedAt: expect.any(String)
      })
    })

    it('空のイベントリストで日次レポートを生成する', async () => {
      const report = await reportGenerator.generateDailyReport([])

      expect(report.summary.totalEvents).toBe(0)
      expect(report.summary.threatLevel).toBe('low')
      expect(report.metrics.eventsByType).toEqual({})
      expect(report.metrics.userActivity.activeUsers).toBe(0)
    })

    it('脅威レベルを正しく評価する', async () => {
      const criticalEvents: SecurityEvent[] = [
        {
          id: 'critical-1',
          type: 'data_breach_attempt',
          severity: 'critical',
          timestamp: '2024-01-01T00:00:00.000Z',
          action: 'unauthorized_access',
          details: {}
        }
      ]

      const report = await reportGenerator.generateDailyReport(criticalEvents)
      expect(report.summary.threatLevel).toBe('critical')
    })
  })

  describe('週次レポート生成', () => {
    it('週次レポートを生成できる', async () => {
      const report = await reportGenerator.generateWeeklyReport(mockEvents)

      expect(report.type).toBe('weekly')
      expect(report.summary.totalEvents).toBe(3)
      expect(report.trends).toBeDefined()
      expect(report.trends.length).toBeGreaterThan(0)
    })

    it('週次レポートにトレンド分析を含む', async () => {
      const report = await reportGenerator.generateWeeklyReport(mockEvents)

      expect(report.trends).toEqual([
        {
          metric: 'authentication_failures',
          direction: 'stable',
          change: 0,
          period: 'week',
          significance: 'low'
        },
        {
          metric: 'api_calls',
          direction: 'stable',
          change: 0,
          period: 'week',
          significance: 'low'
        },
        {
          metric: 'security_incidents',
          direction: 'stable',
          change: 0,
          period: 'week',
          significance: 'low'
        }
      ])
    })
  })

  describe('月次レポート生成', () => {
    it('月次レポートを生成できる', async () => {
      const report = await reportGenerator.generateMonthlyReport(mockEvents)

      expect(report.type).toBe('monthly')
      expect(report.summary.totalEvents).toBe(3)
      expect(report.compliance).toBeDefined()
    })

    it('月次レポートにコンプライアンス状況を含む', async () => {
      const report = await reportGenerator.generateMonthlyReport(mockEvents)

      expect(report.compliance).toBeDefined()
      expect(report.compliance.standard).toBe('ISO27001')
      expect(report.compliance.score).toBeGreaterThanOrEqual(0)
      expect(report.compliance.gaps).toEqual(expect.any(Array))
    })
  })

  describe('インシデントレポート生成', () => {
    it('インシデントレポートを生成できる', async () => {
      const report = await reportGenerator.generateIncidentReport('incident-123')

      expect(report).toMatchObject({
        id: 'test-uuid-123',
        type: 'incident',
        summary: {
          totalEvents: 3,
          threatLevel: 'high',
          criticalAlerts: 0
        },
        incidents: [incident]
      })
    })
  })

  describe('自動レポート生成', () => {
    it('レポート生成を開始できる', () => {
      const eventProvider = vi.fn().mockResolvedValue(mockEvents)
      reportGenerator.startAutomaticReporting(eventProvider)

      expect(reportGenerator.isRunning).toBe(true)
    })

    it('レポート生成を停止できる', () => {
      const eventProvider = vi.fn().mockResolvedValue(mockEvents)
      reportGenerator.startAutomaticReporting(eventProvider)
      reportGenerator.stopAutomaticReporting()

      expect(reportGenerator.isRunning).toBe(false)
    })

    it('設定された間隔でレポートを生成する', async () => {
      const eventProvider = vi.fn().mockResolvedValue(mockEvents)
      const generateDailySpy = vi.spyOn(reportGenerator, 'generateDailyReport')

      reportGenerator.startAutomaticReporting(eventProvider, 1000) // 1秒間隔

      // 1秒経過
      vi.advanceTimersByTime(1000)
      await vi.runOnlyPendingTimersAsync()

      expect(generateDailySpy).toHaveBeenCalled()
    })
  })

  describe('セキュリティダッシュボード', () => {
    it('ダッシュボードデータを生成できる', async () => {
      const dashboard = await reportGenerator.generateSecurityDashboard(mockEvents)

      expect(dashboard).toMatchObject({
        currentThreatLevel: expect.any(String),
        activeAlerts: 0,
        recentIncidents: [],
        systemHealth: {
          monitoring: 'healthy',
          alerting: 'healthy',
          logging: 'healthy'
        },
        topThreats: [],
        metrics: {
          eventsPerHour: expect.any(Number),
          avgResponseTime: 150,
          falsePositiveRate: expect.any(Number),
          detectionAccuracy: expect.any(Number)
        }
      })
    })

    it('システムヘルス状態を正しく評価する', async () => {
      const healthyEvents = mockEvents
      const dashboard = await reportGenerator.generateSecurityDashboard(healthyEvents)

      expect(dashboard.systemHealth).toEqual({
        monitoring: 'healthy',
        alerting: 'healthy',
        logging: 'healthy'
      })
    })
  })

  describe('エラー処理', () => {
    it('レポート生成エラーを適切に処理する', async () => {
      const eventProvider = vi.fn().mockRejectedValue(new Error('データ取得エラー'))
      
      reportGenerator.startAutomaticReporting(eventProvider)
      
      vi.advanceTimersByTime(1000)
      await vi.runOnlyPendingTimersAsync()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Automatic report generation failed:',
        expect.any(Error)
      )
    })
  })
})

describe('SecurityReportDistributor', () => {
  let distributor: SecurityReportDistributor
  let mockConfig: SecurityConfiguration
  let mockReport: SecurityReport

  beforeEach(() => {
    vi.clearAllMocks()
    ;(SecurityReportDistributor as unknown).instance = null
    distributor = SecurityReportDistributor.getInstance()

    mockConfig = {
      monitoring: {
        enabled: true,
        monitoringInterval: 30000,
        retentionPeriod: 604800000,
        thresholds: {
          maxFailedAttempts: 5,
          maxAPICallsPerMinute: 100,
          maxResponseTime: 5000,
          suspiciousPatternThreshold: 3
        },
        alerting: {
          enabled: true,
          channels: ['email', 'slack'],
          severityLevels: ['high', 'critical']
        }
      },
      alerting: {
        enabled: true,
        channels: ['email'],
        severityLevels: ['high']
      },
      reporting: {
        enabled: true,
        frequency: 'daily',
        recipients: ['admin@example.com']
      },
      retention: {
        events: 30,
        alerts: 7,
        reports: 90
      },
      integrations: {
        email: {
          smtp: 'smtp.example.com',
          from: 'security@example.com',
          to: ['admin@example.com']
        },
        slack: {
          webhook: 'https://hooks.slack.com/test',
          channel: '#security'
        }
      }
    }

    mockReport = {
      id: 'report-123',
      type: 'daily',
      period: {
        start: '2024-01-01T00:00:00.000Z',
        end: '2024-01-01T23:59:59.999Z'
      },
      summary: {
        totalEvents: 10,
        threatLevel: 'medium',
        criticalAlerts: 1,
        topThreats: ['auth_failure', 'suspicious_activity']
      },
      metrics: {
        eventsByType: {
          auth_failure: 5,
          suspicious_activity: 3,
          api_call: 2
        },
        eventsBySeverity: {
          low: 2,
          medium: 6,
          high: 2,
          critical: 0
        },
        responseTimeStats: {
          avg: 200,
          min: 100,
          max: 500
        },
        userActivity: {
          activeUsers: 15,
          suspiciousUsers: ['user1', 'user2']
        }
      },
      incidents: [],
      recommendations: [],
      generatedAt: '2024-01-01T12:00:00.000Z'
    }
  })

  describe('シングルトンパターン', () => {
    it('インスタンスが単一であることを確認', () => {
      const instance1 = SecurityReportDistributor.getInstance()
      const instance2 = SecurityReportDistributor.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('設定管理', () => {
    it('設定を更新できる', () => {
      distributor.updateConfig(mockConfig)
      expect(distributor.getConfig()).toEqual(mockConfig)
    })
  })

  describe('通知チャネル管理', () => {
    it('通知チャネルを追加できる', () => {
      const channel: NotificationChannel = {
        id: 'webhook-1',
        name: 'Custom Webhook',
        type: 'webhook',
        enabled: true,
        config: {
          url: 'https://api.example.com/webhook',
          method: 'POST'
        },
        severityFilter: ['high', 'critical']
      }

      distributor.addNotificationChannel(channel)
      const channels = distributor.getNotificationChannels()
      
      expect(channels.find(c => c.id === 'webhook-1')).toEqual(channel)
    })

    it('通知チャネルを削除できる', () => {
      const channel: NotificationChannel = {
        id: 'test-channel',
        name: 'Test Channel',
        type: 'email',
        enabled: true,
        config: {},
        severityFilter: ['medium']
      }

      distributor.addNotificationChannel(channel)
      expect(distributor.getNotificationChannels()).toHaveLength(1)

      distributor.removeNotificationChannel('test-channel')
      expect(distributor.getNotificationChannels()).toHaveLength(0)
    })
  })

  describe('レポート配信', () => {
    beforeEach(() => {
      distributor.updateConfig(mockConfig)
    })

    it('メール配信を実行できる', async () => {
      const fetchMock = vi.mocked(fetch)
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response)

      const result = await distributor.distributeReport(mockReport)

      expect(result.success).toBe(true)
      expect(result.channels).toContain('email')
    })

    it('Slack配信を実行できる', async () => {
      const fetchMock = vi.mocked(fetch)
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response)

      const result = await distributor.distributeReport(mockReport)

      expect(result.success).toBe(true)
      expect(result.channels).toContain('slack')
    })

    it('Webhook配信を実行できる', async () => {
      const webhookChannel: NotificationChannel = {
        id: 'webhook-1',
        name: 'Security Webhook',
        type: 'webhook',
        enabled: true,
        config: {
          url: 'https://api.example.com/security',
          method: 'POST',
          headers: {
            'Authorization': 'Bearer token123',
            'Content-Type': 'application/json'
          }
        },
        severityFilter: ['medium', 'high', 'critical']
      }

      distributor.addNotificationChannel(webhookChannel)

      const fetchMock = vi.mocked(fetch)
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response)

      const result = await distributor.distributeReport(mockReport)

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/security',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer token123',
            'Content-Type': 'application/json'
          },
          body: expect.any(String)
        })
      )
      expect(result.success).toBe(true)
    })

    it('配信失敗を適切に処理する', async () => {
      const fetchMock = vi.mocked(fetch)
      fetchMock.mockRejectedValue(new Error('Network error'))

      const result = await distributor.distributeReport(mockReport)

      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(2) // email と slack の両方で失敗
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('設定が無効化されている場合は配信をスキップする', async () => {
      const disabledConfig = {
        ...mockConfig,
        reporting: {
          ...mockConfig.reporting,
          enabled: false
        }
      }
      distributor.updateConfig(disabledConfig)

      const result = await distributor.distributeReport(mockReport)

      expect(result.success).toBe(true)
      expect(result.channels).toHaveLength(0)
    })
  })

  describe('自動配信スケジュール', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      distributor.updateConfig(mockConfig)
    })

    afterEach(() => {
      vi.useRealTimers()
      distributor.stopScheduledDistribution()
    })

    it('定期配信を開始できる', () => {
      const reportProvider = vi.fn().mockResolvedValue(mockReport)
      distributor.startScheduledDistribution(reportProvider, 'daily')

      expect(distributor.isScheduleActive).toBe(true)
    })

    it('定期配信を停止できる', () => {
      const reportProvider = vi.fn().mockResolvedValue(mockReport)
      distributor.startScheduledDistribution(reportProvider, 'daily')
      distributor.stopScheduledDistribution()

      expect(distributor.isScheduleActive).toBe(false)
    })

    it('設定された頻度で配信を実行する', async () => {
      const reportProvider = vi.fn().mockResolvedValue(mockReport)
      const distributeSpy = vi.spyOn(distributor, 'distributeReport').mockResolvedValue({
        success: true,
        channels: ['email'],
        timestamp: new Date().toISOString(),
        errors: []
      })

      distributor.startScheduledDistribution(reportProvider, 'hourly')

      // 1時間経過
      vi.advanceTimersByTime(60 * 60 * 1000)
      await vi.runOnlyPendingTimersAsync()

      expect(distributeSpy).toHaveBeenCalledWith(mockReport)
    })
  })

  describe('レポート履歴管理', () => {
    it('配信履歴を記録できる', async () => {
      const fetchMock = vi.mocked(fetch)
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200
      } as Response)

      await distributor.distributeReport(mockReport)
      
      const history = distributor.getDistributionHistory()
      expect(history).toHaveLength(1)
      expect(history[0].reportId).toBe(mockReport.id)
    })

    it('履歴の制限数を超えた場合古いものを削除する', async () => {
      const fetchMock = vi.mocked(fetch)
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200
      } as Response)

      // 101回の配信を実行
      for (let i = 0; i < 101; i++) {
        const report = { ...mockReport, id: `report-${i}` }
        await distributor.distributeReport(report)
      }

      const history = distributor.getDistributionHistory()
      expect(history).toHaveLength(100)
      expect(history[0].reportId).toBe('report-1') // 最初のreport-0は削除されている
    })
  })

  describe('エラーハンドリング', () => {
    it('無効な設定でも適切に動作する', async () => {
      const invalidConfig = {
        ...mockConfig,
        integrations: {}
      }
      distributor.updateConfig(invalidConfig)

      const result = await distributor.distributeReport(mockReport)
      expect(result.success).toBe(true)
      expect(result.channels).toHaveLength(0)
    })

    it('部分的な配信失敗でも成功した配信を記録する', async () => {
      const fetchMock = vi.mocked(fetch)
      // email成功、slack失敗
      fetchMock
        .mockResolvedValueOnce({ ok: true, status: 200 } as Response)
        .mockRejectedValueOnce(new Error('Slack error'))

      const result = await distributor.distributeReport(mockReport)

      expect(result.success).toBe(false)
      expect(result.channels).toContain('email')
      expect(result.errors).toHaveLength(1)
    })
  })
})