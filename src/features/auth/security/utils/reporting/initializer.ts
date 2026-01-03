import { SecurityReportDistributor } from './distributor'

/**
 * セキュリティレポーティングシステムの初期化
 */
export function initializeSecurityReporting(): void {
  const distributor = SecurityReportDistributor.getInstance()
  distributor.startScheduledReports()

  // logger.debug('📊 Security reporting system initialized')
}
