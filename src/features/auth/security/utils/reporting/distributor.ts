import { SecurityReportGenerator } from './generator'
import { createLogger } from '@shared/utils'
import type { SecurityReport, NotificationChannel } from '@/types/security-monitoring'

const logger = createLogger('SECURITY-REPORTING')

/**
 * セキュリティレポート配信システム
 */
export class SecurityReportDistributor {
  private static instance: SecurityReportDistributor
  private reportGenerator: SecurityReportGenerator
  private config: {
    enabled: boolean
    defaultRecipients: string[]
    notificationChannels: NotificationChannel[]
    [key: string]: unknown
  } = {
    enabled: true,
    defaultRecipients: [],
    notificationChannels: [],
  }
  private distributionHistory: Array<{
    reportId: string
    type: string
    timestamp: string
    recipients: string[]
    status: 'success' | 'failed'
  }> = []
  private scheduledDistribution: {
    active: boolean
    interval?: NodeJS.Timeout
  } = {
    active: false,
  }

  private constructor() {
    this.reportGenerator = SecurityReportGenerator.getInstance()
  }

  static getInstance(): SecurityReportDistributor {
    if (!SecurityReportDistributor.instance) {
      SecurityReportDistributor.instance = new SecurityReportDistributor()
    }
    return SecurityReportDistributor.instance
  }

  /**
   * 定期レポートの配信開始
   */
  startScheduledReports(): void {
    // 日次レポート（毎日午前9時）
    this.scheduleReport('daily', '0 9 * * *')

    // 週次レポート（毎週月曜日午前9時）
    this.scheduleReport('weekly', '0 9 * * 1')

    // 月次レポート（毎月1日午前9時）
    this.scheduleReport('monthly', '0 9 1 * *')
  }

  /**
   * レポートの手動送信
   */
  async sendReport(
    type: 'daily' | 'weekly' | 'monthly',
    // recipients: string[] = []
  ): Promise<void> {
    try {
      let report: SecurityReport

      switch (type) {
        case 'daily':
          report = await this.reportGenerator.generateDailyReport()
          break
        case 'weekly':
          report = await this.reportGenerator.generateWeeklyReport()
          break
        case 'monthly':
          report = await this.reportGenerator.generateMonthlyReport()
          break
      }

      const recipients: string[] = [] // Simplified implementation
      await this.distributeReport(report, recipients)
      // logger.debug(`${type} security report sent successfully`)
    } catch (error) {
      logger.error(`Failed to send ${type} report:`, error)
    }
  }

  /**
   * インシデントレポートの緊急配信
   */
  async sendUrgentIncidentReport(
    __incidentId: string,
    // recipients: string[] = []
  ): Promise<void> {
    try {
      const report = await this.reportGenerator.generateIncidentReport(__incidentId)
      const recipients: string[] = [] // Simplified implementation
      await this.distributeReport(report, recipients, true)
      // logger.debug('Urgent incident report sent successfully')
    } catch (error) {
      logger.error('Failed to send urgent incident report:', error)
    }
  }

  /**
   * レポートの配信
   */
  async distributeReport(
    report: SecurityReport,
    _recipients: string[] = [],
    urgent = false,
  ): Promise<{ success: boolean; channels: string[]; errors?: string[] }> {
    // コンソール出力
    // logger.debug(`📊 Security Report Generated: ${report.type.toUpperCase()}`, report)

    // ローカルストレージに保存
    this.storeReport(report)

    const result = {
      success: true,
      channels: [] as string[],
      errors: [] as string[],
    }

    // 通知チャネルの処理
    if (this.config.notificationChannels) {
      for (const channel of this.config.notificationChannels) {
        if (channel.enabled) {
          try {
            // 各チャネルタイプに応じた配信処理
            if (channel.type === 'email') {
              // メール配信の模擬実装
              await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ report, channel: channel.config }),
              })
              result.channels.push('email')
            } else if (channel.type === 'slack') {
              // Slack配信の模擬実装
              await fetch('/api/send-slack', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ report, channel: channel.config }),
              })
              result.channels.push('slack')
            } else if (channel.type === 'webhook') {
              // Webhook配信の模擬実装
              await fetch(channel.config.url as string, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(report),
              })
              result.channels.push('webhook')
            }
          } catch (error) {
            result.errors.push(`Failed to send to ${channel.type}: ${error}`)
            result.success = false
          }
        }
      }
    }

    if (urgent) {
      // logger.debug('🚨 URGENT: Incident report requires immediate attention')
    }

    return result
  }

  /**
   * レポートのスケジュール設定
   */
  private scheduleReport(_type: 'daily' | 'weekly' | 'monthly', _cron: string): void {
    // 簡易実装：実際にはcronライブラリを使用
    // logger.debug(`📅 Scheduled ${type} report: ${cron}`)
  }

  /**
   * レポートの保存
   */
  private storeReport(report: SecurityReport): void {
    try {
      const existingReports = JSON.parse(localStorage.getItem('security_reports') || '[]')
      existingReports.push(report)

      // 最新50件のみ保持
      const limitedReports = existingReports.slice(-50)
      localStorage.setItem('security_reports', JSON.stringify(limitedReports))

      // 配信履歴に記録
      this.distributionHistory.push({
        reportId: report.id,
        type: report.type,
        timestamp: new Date().toISOString(),
        recipients: this.config.defaultRecipients || [],
        status: 'success',
      })

      // 履歴は最新100件まで保持
      if (this.distributionHistory.length > 100) {
        this.distributionHistory = this.distributionHistory.slice(-100)
      }
    } catch (error) {
      logger.error('Failed to store security report:', error)
      // 失敗も履歴に記録
      this.distributionHistory.push({
        reportId: 'unknown',
        type: 'unknown',
        timestamp: new Date().toISOString(),
        recipients: [],
        status: 'failed',
      })
    }
  }

  /**
   * 設定の更新
   */
  updateConfig(newConfig: Record<string, unknown>): void {
    if (typeof newConfig === 'object' && newConfig !== null) {
      this.config = { ...this.config, ...newConfig }
      // logger.debug('📊 Distribution config updated:', this.config)
    } else {
      throw new Error('Invalid config object')
    }
  }

  /**
   * 通知チャネルの追加
   */
  addNotificationChannel(channel: NotificationChannel): void {
    if (!this.config.notificationChannels) {
      this.config.notificationChannels = []
    }

    if (channel && typeof channel === 'object') {
      this.config.notificationChannels.push(channel)
      // logger.debug('📊 Notification channel added:', channel)
    } else {
      throw new Error('Invalid notification channel')
    }
  }

  /**
   * 通知チャネルの削除
   */
  removeNotificationChannel(channelId: string): void {
    if (!this.config.notificationChannels) {
      return
    }

    const index = this.config.notificationChannels.findIndex((channel) => channel.id === channelId)
    if (index > -1) {
      this.config.notificationChannels.splice(index, 1)
      // logger.debug('📊 Notification channel removed:', channelId)
    }
  }

  /**
   * 配信履歴の取得
   */
  getDistributionHistory(): Array<{
    reportId: string
    type: string
    timestamp: string
    recipients: string[]
    status: 'success' | 'failed'
  }> {
    return [...this.distributionHistory]
  }

  /**
   * 設定の取得
   */
  getConfig(): typeof this.config {
    return { ...this.config }
  }

  /**
   * 通知チャネルの取得
   */
  getNotificationChannels(): NotificationChannel[] {
    return [...(this.config.notificationChannels || [])]
  }

  /**
   * 定期配信の開始
   */
  startScheduledDistribution(): boolean {
    if (this.scheduledDistribution.active) {
      return true // 既に開始済み
    }

    this.scheduledDistribution.active = true
    this.scheduledDistribution.interval = setInterval(async () => {
      // テスト用の簡易実装
      const report = await this.reportGenerator.generateDailyReport()
      await this.distributeReport(report)
    }, 86400000) // 24時間間隔

    this.startScheduledReports()
    // logger.debug('📊 Scheduled distribution started')
    return true
  }

  /**
   * 定期配信の停止
   */
  stopScheduledDistribution(): boolean {
    if (!this.scheduledDistribution.active) {
      return false // 既に停止済み
    }

    this.scheduledDistribution.active = false
    if (this.scheduledDistribution.interval) {
      clearInterval(this.scheduledDistribution.interval)
      this.scheduledDistribution.interval = undefined
    }

    // logger.debug('📊 Scheduled distribution stopped')
    return false
  }

  /**
   * 定期配信の状態確認
   */
  isScheduledDistributionActive(): boolean {
    return this.scheduledDistribution.active
  }
}
