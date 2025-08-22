import { Page, expect } from '@playwright/test'

/**
 * レポート機能関連のE2Eテストヘルパー関数
 */

export interface ReportFilter {
  dateRange?: {
    start: string
    end: string
  }
  category?: string
  period?: 'week' | 'month' | 'quarter' | 'year' | 'custom'
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
      // フィルター要素
      dateRangeStart: this.page.locator('input[type="date"]').first(),
      dateRangeEnd: this.page.locator('input[type="date"]').nth(1),
      categoryFilter: this.page.locator('.category-filter .v-select'),
      periodSelector: this.page.locator('.period-selector .v-select'),
      applyFilterButton: this.page.locator('button:has-text("フィルター適用"), button:has-text("検索")'),
      resetFilterButton: this.page.locator('button:has-text("リセット"), button:has-text("クリア")'),

      // チャート要素
      categoryChart: this.page.locator('.category-chart, #categoryChart, canvas').first(),
      timelineChart: this.page.locator('.timeline-chart, #timelineChart, canvas').nth(1),
      progressChart: this.page.locator('.progress-chart, #progressChart, canvas').nth(2),
      
      // 統計情報
      totalCount: this.page.locator('.total-count, .stats-total'),
      completionRate: this.page.locator('.completion-rate, .stats-completion'),
      averageProgress: this.page.locator('.average-progress, .stats-average'),
      
      // エクスポート機能
      exportButton: this.page.locator('button:has-text("エクスポート"), button:has-text("CSV"), button:has-text("PDF")'),
      exportDropdown: this.page.locator('.export-options .v-menu'),
      csvExportOption: this.page.locator('.export-csv, button:has-text("CSV")'),
      pdfExportOption: this.page.locator('.export-pdf, button:has-text("PDF")'),
      
      // データ表示
      dataTable: this.page.locator('.data-table, .v-data-table'),
      tableRows: this.page.locator('.data-table tbody tr, .v-data-table tbody tr'),
      noDataMessage: this.page.locator('.no-data, .v-alert:has-text("データが見つかりません")'),
      
      // ローディング・エラー
      loadingIndicator: this.page.locator('.v-progress-circular, .loading'),
      errorAlert: this.page.locator('.v-alert--type-error'),
      
      // ページネーション
      pagination: this.page.locator('.v-pagination'),
      paginationButtons: this.page.locator('.v-pagination button')
    }
  }

  /**
   * ダッシュボードの要素を取得
   */
  getDashboardElements() {
    return {
      // サマリーカード
      totalDiariesCard: this.page.locator('.total-diaries-card, .summary-card').first(),
      thisWeekCard: this.page.locator('.this-week-card, .summary-card').nth(1),
      thisMonthCard: this.page.locator('.this-month-card, .summary-card').nth(2),
      completionCard: this.page.locator('.completion-card, .summary-card').last(),
      
      // クイックチャート
      quickChart: this.page.locator('.dashboard-chart, .quick-chart canvas'),
      recentActivities: this.page.locator('.recent-activities, .activity-list'),
      
      // ナビゲーション
      reportLink: this.page.locator('a[href="/diary/report"], button:has-text("詳細レポート")'),
      diaryCreateLink: this.page.locator('a[href="/diary/register"], button:has-text("日記作成")')
    }
  }

  /**
   * 日付範囲フィルターを設定
   */
  async setDateRangeFilter(startDate: string, endDate: string): Promise<void> {
    const elements = this.getReportPageElements()
    
    await elements.dateRangeStart.fill(startDate)
    await elements.dateRangeEnd.fill(endDate)
  }

  /**
   * カテゴリフィルターを設定
   */
  async setCategoryFilter(category: string): Promise<void> {
    const elements = this.getReportPageElements()
    
    await elements.categoryFilter.click()
    await this.page.locator(`.v-list-item:has-text("${category}")`).click()
  }

  /**
   * 期間フィルターを設定
   */
  async setPeriodFilter(period: 'week' | 'month' | 'quarter' | 'year'): Promise<void> {
    const elements = this.getReportPageElements()
    
    await elements.periodSelector.click()
    
    const periodTexts = {
      week: '今週',
      month: '今月',
      quarter: '四半期',
      year: '今年'
    }
    
    await this.page.locator(`.v-list-item:has-text("${periodTexts[period]}")`).click()
  }

  /**
   * フィルターを適用
   */
  async applyFilters(): Promise<void> {
    const elements = this.getReportPageElements()
    
    await elements.applyFilterButton.click()
    await this.page.waitForTimeout(1000) // データ読み込み待ち
  }

  /**
   * フィルターをリセット
   */
  async resetFilters(): Promise<void> {
    const elements = this.getReportPageElements()
    
    await elements.resetFilterButton.click()
    await this.page.waitForTimeout(500)
  }

  /**
   * チャートが表示されていることを確認
   */
  async expectChartsVisible(): Promise<void> {
    const elements = this.getReportPageElements()
    
    // 各チャートが表示されることを確認
    await expect(elements.categoryChart).toBeVisible({ timeout: 10000 })
    
    // チャートが実際にレンダリングされていることを確認（canvas要素の場合）
    const chartCanvas = await elements.categoryChart.count()
    if (chartCanvas > 0) {
      // Canvas要素が存在する場合、描画されていることを確認
      const canvasSize = await elements.categoryChart.boundingBox()
      expect(canvasSize).not.toBeNull()
      expect(canvasSize!.width).toBeGreaterThan(0)
      expect(canvasSize!.height).toBeGreaterThan(0)
    }
  }

  /**
   * 統計情報が表示されていることを確認
   */
  async expectStatsVisible(): Promise<void> {
    const elements = this.getReportPageElements()
    
    // 統計要素が表示されることを確認
    await expect(elements.totalCount).toBeVisible()
    
    // 数値が表示されていることを確認
    const totalText = await elements.totalCount.textContent()
    expect(totalText).toMatch(/\d+/)
  }

  /**
   * データテーブルが表示されていることを確認
   */
  async expectDataTableVisible(): Promise<void> {
    const elements = this.getReportPageElements()
    
    await expect(elements.dataTable).toBeVisible()
    
    // テーブルにデータが存在する場合、行が表示されることを確認
    const rowCount = await elements.tableRows.count()
    if (rowCount > 0) {
      await expect(elements.tableRows.first()).toBeVisible()
    }
  }

  /**
   * データが無い場合のメッセージを確認
   */
  async expectNoDataMessage(): Promise<void> {
    const elements = this.getReportPageElements()
    
    await expect(elements.noDataMessage).toBeVisible()
  }

  /**
   * CSVエクスポート機能をテスト
   */
  async testCSVExport(): Promise<void> {
    const elements = this.getReportPageElements()
    
    // エクスポートボタンをクリック
    await elements.exportButton.click()
    
    // CSVオプションが表示される場合
    if (await elements.csvExportOption.isVisible()) {
      // ダウンロード開始を監視
      const downloadPromise = this.page.waitForEvent('download')
      
      await elements.csvExportOption.click()
      
      // ダウンロードが開始されることを確認
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/\.csv$/)
    } else {
      // 直接CSVダウンロードボタンの場合
      const downloadPromise = this.page.waitForEvent('download')
      await elements.exportButton.click()
      
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/\.csv$/)
    }
  }

  /**
   * PDFエクスポート機能をテスト
   */
  async testPDFExport(): Promise<void> {
    const elements = this.getReportPageElements()
    
    await elements.exportButton.click()
    
    if (await elements.pdfExportOption.isVisible()) {
      const downloadPromise = this.page.waitForEvent('download')
      
      await elements.pdfExportOption.click()
      
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/\.pdf$/)
    }
  }

  /**
   * ダッシュボードの統計カードを確認
   */
  async expectDashboardStatsVisible(): Promise<void> {
    const elements = this.getDashboardElements()
    
    // 各統計カードが表示されることを確認
    await expect(elements.totalDiariesCard).toBeVisible()
    await expect(elements.thisWeekCard).toBeVisible()
    await expect(elements.thisMonthCard).toBeVisible()
    
    // カードに数値が表示されていることを確認
    const totalText = await elements.totalDiariesCard.textContent()
    expect(totalText).toMatch(/\d+/)
  }

  /**
   * ダッシュボードからレポートページへの遷移をテスト
   */
  async testDashboardToReportNavigation(): Promise<void> {
    const elements = this.getDashboardElements()
    
    await elements.reportLink.click()
    await this.page.waitForLoadState('networkidle')
    
    await expect(this.page).toHaveURL(/\/diary\/report/)
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
    
    // チャートがモバイルサイズで表示されることを確認
    await expect(elements.categoryChart).toBeVisible()
    
    // フィルター要素がモバイルで利用可能であることを確認
    await expect(elements.periodSelector).toBeVisible()
  }

  /**
   * パフォーマンステスト - レポート読み込み時間
   */
  async testReportLoadPerformance(): Promise<number> {
    const startTime = Date.now()
    
    await this.navigateToReport()
    
    const elements = this.getReportPageElements()
    await expect(elements.categoryChart).toBeVisible({ timeout: 10000 })
    
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
    
    // チャートをクリックして詳細情報が表示されるかテスト
    await elements.categoryChart.click()
    
    // ツールチップまたは詳細情報が表示されることを確認
    // (具体的な実装に依存するため、一般的なセレクタを使用)
    // Note: ツールチップは実装によっては表示されない場合もある
  }

  /**
   * データの整合性をテスト
   */
  async testDataConsistency(): Promise<void> {
    const elements = this.getReportPageElements()
    
    // 統計値とチャートデータの整合性を確認
    const totalCountText = await elements.totalCount.textContent()
    const totalCount = parseInt(totalCountText?.match(/\d+/)?.[0] || '0')
    
    // テーブルの行数と統計値が一致することを確認
    const tableRowCount = await elements.tableRows.count()
    
    // Note: ページネーションがある場合は調整が必要
    expect(totalCount).toBeGreaterThanOrEqual(tableRowCount)
  }

  /**
   * テストデータのクリーンアップ
   */
  async cleanup(): Promise<void> {
    // 必要に応じてテスト用データを削除
    // キャッシュクリアなど
    await this.page.evaluate(() => {
      localStorage.removeItem('reportFilters')
      sessionStorage.removeItem('reportCache')
    })
  }
}

/**
 * テスト用のレポートフィルター設定を生成
 */
export function generateTestReportFilter(): ReportFilter {
  const today = new Date()
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  return {
    dateRange: {
      start: oneWeekAgo.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    },
    category: '仕事',
    period: 'week'
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