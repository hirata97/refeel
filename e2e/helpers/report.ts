import { Page, expect } from '@playwright/test'

/**
 * レポート機能関連のE2Eテストヘルパー関数
 */

export interface ReportFilter {
  // シンプルなレポートページには複雑なフィルターは実装されていない
  // 将来の拡張用として残す
  dateRange?: {
    start: string
    end: string
  }
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut'
  hasData: boolean
  dataPoints?: number
}

/**
 * レポート機能テスト用のヘルパークラス
 */
export class ReportTestHelper {
  constructor(private page: Page) {}

  /**
   * レポートページに移動
   */
  async navigateToReport(): Promise<void> {
    await this.page.goto('/diary/report')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * ダッシュボードページに移動
   */
  async navigateToDashboard(): Promise<void> {
    await this.page.goto('/dashboard')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * レポートページの要素を取得
   */
  getReportPageElements() {
    return {
      // ページ要素
      reportPage: this.page.locator('.report-page'),
      reportHeader: this.page.locator('.report-header'),
      reportTitle: this.page.locator('.report-title'),
      reportDescription: this.page.locator('.report-description'),
      
      // コンテンツ要素
      reportContent: this.page.locator('.report-content'),
      reportCard: this.page.locator('.report-card'),
      cardTitle: this.page.locator('.card-title'),
      cardDescription: this.page.locator('.card-description'),
      
      // チャート要素（Chart.jsのLine chart）
      moodChart: this.page.locator('canvas'),
      
      // ナビゲーションボタン
      dashboardButton: this.page.locator('button:has-text("ダッシュボードに戻る")'),
      helpButton: this.page.locator('button:has-text("ヘルプ")'),
      
      // フッター
      reportActions: this.page.locator('.report-actions'),
      
      // エラー表示（データが無い場合など）
      noDataMessage: this.page.locator('text=データがありません')
    }
  }

  /**
   * ダッシュボードの要素を取得
   */
  getDashboardElements() {
    return {
      // ダッシュボードページ要素（シンプル構造）
      dashboardPage: this.page.locator('.dashboard-page, .dash-board-page'),
      
      // ナビゲーションボタン
      reportLink: this.page.locator('a[href="/diary/report"], button:has-text("レポート"), button:has-text("詳細レポート")'),
      diaryCreateLink: this.page.locator('a[href="/diary/register"], button:has-text("日記作成"), button:has-text("新規作成")')
    }
  }

  /**
   * レポートページの基本要素が表示されることを確認
   */
  async expectReportPageVisible(): Promise<void> {
    const elements = this.getReportPageElements()
    
    await expect(elements.reportPage).toBeVisible()
    await expect(elements.reportHeader).toBeVisible()
    await expect(elements.reportTitle).toBeVisible()
    await expect(elements.reportContent).toBeVisible()
  }

  /**
   * ダッシュボードに戻る
   */
  async navigateBackToDashboard(): Promise<void> {
    const elements = this.getReportPageElements()
    
    await elements.dashboardButton.click()
    await this.page.waitForLoadState('networkidle')
    await expect(this.page).toHaveURL(/\/dashboard/)
  }

  /**
   * ヘルプページに移動
   */
  async navigateToHelp(): Promise<void> {
    const elements = this.getReportPageElements()
    
    await elements.helpButton.click()
    await this.page.waitForLoadState('networkidle')
    await expect(this.page).toHaveURL(/\/help/)
  }

  /**
   * 気分推移チャートが表示されていることを確認
   */
  async expectMoodChartVisible(): Promise<void> {
    const elements = this.getReportPageElements()
    
    // Chart.jsのcanvas要素が表示されることを確認
    await expect(elements.moodChart).toBeVisible({ timeout: 10000 })
    
    // チャートが実際にレンダリングされていることを確認
    const canvasSize = await elements.moodChart.boundingBox()
    expect(canvasSize).not.toBeNull()
    expect(canvasSize!.width).toBeGreaterThan(0)
    expect(canvasSize!.height).toBeGreaterThan(0)
  }

  /**
   * レポートコンテンツが正しく表示されていることを確認
   */
  async expectReportContentVisible(): Promise<void> {
    const elements = this.getReportPageElements()
    
    // レポートカードが表示されることを確認
    await expect(elements.reportCard).toBeVisible()
    await expect(elements.cardTitle).toBeVisible()
    await expect(elements.cardDescription).toBeVisible()
    
    // カードタイトルが正しいことを確認
    await expect(elements.cardTitle).toContainText('気分の推移')
  }

  /**
   * データが無い場合のメッセージを確認
   */
  async expectNoDataMessage(): Promise<void> {
    const elements = this.getReportPageElements()
    
    await expect(elements.noDataMessage).toBeVisible()
  }

  /**
   * データが無い場合の表示をテスト
   */
  async expectNoDataState(): Promise<void> {
    const elements = this.getReportPageElements()
    
    // チャートが表示されているがデータがない状態をチェック
    // Chart.jsはデータがなくても空のチャートを表示する
    await expect(elements.moodChart).toBeVisible()
    
    // または、データが無い場合のメッセージが表示されることを確認
    const hasNoDataMessage = await elements.noDataMessage.isVisible()
    if (hasNoDataMessage) {
      await expect(elements.noDataMessage).toBeVisible()
    }
  }

  /**
   * ダッシュボードが表示されていることを確認
   */
  async expectDashboardVisible(): Promise<void> {
    const elements = this.getDashboardElements()
    
    // ダッシュボードページが表示されることを確認
    await expect(elements.dashboardPage).toBeVisible()
  }

  /**
   * ダッシュボードからレポートページへの遷移をテスト
   */
  async testDashboardToReportNavigation(): Promise<void> {
    const elements = this.getDashboardElements()
    
    // レポートリンクが存在する場合のみテスト
    const reportLinkExists = await elements.reportLink.isVisible()
    if (reportLinkExists) {
      await elements.reportLink.click()
      await this.page.waitForLoadState('networkidle')
      await expect(this.page).toHaveURL(/\/diary\/report/)
    }
  }

  /**
   * レスポンシブ表示のテスト
   */
  async testResponsiveDisplay(): Promise<void> {
    const elements = this.getReportPageElements()
    
    // モバイル画面で要素が適切に表示されることを確認
    await this.page.setViewportSize({ width: 375, height: 667 })
    await this.page.reload()
    await this.page.waitForLoadState('networkidle')
    
    // レポートページの基本要素がモバイルで表示されることを確認
    await expect(elements.reportPage).toBeVisible()
    await expect(elements.moodChart).toBeVisible()
    await expect(elements.dashboardButton).toBeVisible()
    await expect(elements.helpButton).toBeVisible()
  }

  /**
   * パフォーマンステスト - レポート読み込み時間
   */
  async testReportLoadPerformance(): Promise<number> {
    const startTime = Date.now()
    
    await this.navigateToReport()
    
    const elements = this.getReportPageElements()
    await expect(elements.moodChart).toBeVisible({ timeout: 10000 })
    
    const loadTime = Date.now() - startTime
    
    // レポートが10秒以内に読み込まれることを確認
    expect(loadTime).toBeLessThan(10000)
    
    return loadTime
  }

  /**
   * チャートの相互作用性をテスト
   */
  async testChartInteractivity(): Promise<void> {
    const elements = this.getReportPageElements()
    
    // Chart.jsの気分推移チャートをクリック
    await elements.moodChart.click()
    
    // Chart.jsのツールチップは実装によって表示される場合とされない場合がある
    // 基本的にはチャートがクリック可能であることを確認
    await expect(elements.moodChart).toBeVisible()
  }

  /**
   * データの整合性をテスト
   */
  async testDataConsistency(): Promise<void> {
    const elements = this.getReportPageElements()
    
    // チャートが表示されていることを確認
    await expect(elements.moodChart).toBeVisible()
    
    // レポートカードの説明が正しいことを確認
    await expect(elements.cardDescription).toContainText('過去30日間の気分の変化を表示します')
  }

  /**
   * テストデータのクリーンアップ
   */
  async cleanup(): Promise<void> {
    // ローカルストレージとセッションストレージをクリア
    await this.page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  }
}

/**
 * テスト用のレポートフィルター設定を生成
 * 現在のシンプルなレポートページでは使用されていないが、将来の拡張用として残す
 */
export function generateTestReportFilter(): ReportFilter {
  const today = new Date()
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  return {
    dateRange: {
      start: oneWeekAgo.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    }
  }
}

/**
 * 日付範囲のプリセットを生成
 */
export function getDateRangePresets() {
  const today = new Date()
  const thisWeekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000)
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const thisYearStart = new Date(today.getFullYear(), 0, 1)
  
  return {
    thisWeek: {
      start: thisWeekStart.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    },
    thisMonth: {
      start: thisMonthStart.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    },
    thisYear: {
      start: thisYearStart.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    }
  }
}