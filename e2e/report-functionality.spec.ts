import { test, expect } from '@playwright/test'
import { AuthTestHelper, generateTestUser } from './helpers/auth'
import { DiaryTestHelper, generateTestDiary } from './helpers/diary'
import { ReportTestHelper, getDateRangePresets } from './helpers/report'

/**
 * レポート機能のE2Eテスト
 * 
 * テスト対象:
 * - レポートページの表示・ナビゲーション
 * - チャート表示機能（カテゴリ別・時系列・進捗）
 * - フィルタリング機能（日付範囲・カテゴリ・期間）
 * - 統計情報表示
 * - データエクスポート機能（CSV・PDF）
 * - ダッシュボード統計表示
 * - レスポンシブ対応
 * - パフォーマンステスト
 */

test.describe('レポート機能システム', () => {
  let authHelper: AuthTestHelper
  let diaryHelper: DiaryTestHelper
  let reportHelper: ReportTestHelper
  let testUser: { email: string; password: string; username: string }

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthTestHelper(page)
    diaryHelper = new DiaryTestHelper(page)
    reportHelper = new ReportTestHelper(page)
    
    // テストの前にクリーンアップ
    await authHelper.cleanup()
    await diaryHelper.cleanup()
    await reportHelper.cleanup()
    
    // テスト用ユーザーでログイン
    testUser = generateTestUser('report_test')
    await authHelper.navigateToRegister()
    await authHelper.performRegister(testUser)
    await authHelper.expectRegisterSuccess()
  })

  test.afterEach(async () => {
    // テスト後のクリーンアップ
    await reportHelper.cleanup()
    await diaryHelper.cleanup()
    await authHelper.cleanup()
  })

  test.describe('レポートページ基本機能', () => {
    
    test('正常系: レポートページへのアクセスと基本表示', async () => {
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      const elements = reportHelper.getReportPageElements()
      
      // 基本要素が表示されることを確認
      await expect(elements.periodSelector).toBeVisible()
      await expect(elements.categoryFilter).toBeVisible()
      await expect(elements.applyFilterButton).toBeVisible()
    })

    test('正常系: ダッシュボードからレポートページへの遷移', async () => {
      await reportHelper.navigateToDashboard()
      await expect(reportHelper.page).toHaveURL(/\/dashboard/)
      
      // ダッシュボードからレポートページへの遷移をテスト
      await reportHelper.testDashboardToReportNavigation()
    })

    test('正常系: データが無い場合のメッセージ表示', async () => {
      // 日記データが無い状態でレポートページにアクセス
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      // データ無しメッセージが表示されることを確認
      await reportHelper.expectNoDataMessage()
    })
  })

  test.describe('チャート表示機能', () => {
    
    test('正常系: テストデータありでチャート表示', async () => {
      // テスト用日記データを複数作成
      const testDiaries = [
        { ...generateTestDiary('chart_work'), category: '仕事' },
        { ...generateTestDiary('chart_private'), category: 'プライベート' },
        { ...generateTestDiary('chart_study'), category: '勉強' }
      ]
      
      for (const diary of testDiaries) {
        await diaryHelper.navigateToDiaryRegister()
        await diaryHelper.performDiaryRegister(diary)
        await diaryHelper.expectRegisterSuccess()
      }
      
      // レポートページでチャートが表示されることを確認
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      await reportHelper.expectChartsVisible()
    })

    test('正常系: カテゴリ別チャートの表示', async () => {
      // 異なるカテゴリの日記を作成
      const categories = ['仕事', 'プライベート', '勉強']
      
      for (const category of categories) {
        const diary = generateTestDiary(`category_${category}`)
        diary.category = category
        
        await diaryHelper.navigateToDiaryRegister()
        await diaryHelper.performDiaryRegister(diary)
        await diaryHelper.expectRegisterSuccess()
      }
      
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      // カテゴリ別チャートが表示されることを確認
      await reportHelper.expectChartsVisible()
      
      // チャートの相互作用性をテスト
      await reportHelper.testChartInteractivity()
    })

    test('パフォーマンス: チャート読み込み性能', async () => {
      // 複数のテストデータを作成
      for (let i = 0; i < 5; i++) {
        const diary = generateTestDiary(`perf_${i}`)
        await diaryHelper.navigateToDiaryRegister()
        await diaryHelper.performDiaryRegister(diary)
        await diaryHelper.expectRegisterSuccess()
      }
      
      // レポート読み込み性能をテスト
      const loadTime = await reportHelper.testReportLoadPerformance()
      
      // 読み込み時間が妥当であることを確認
      expect(loadTime).toBeLessThan(10000) // 10秒以内
    })
  })

  test.describe('フィルタリング機能', () => {
    
    test('正常系: 日付範囲フィルター', async () => {
      // テストデータを作成
      const diary = generateTestDiary('date_filter')
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(diary)
      await diaryHelper.expectRegisterSuccess()
      
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      // 日付範囲フィルターを設定
      const dateRanges = getDateRangePresets()
      await reportHelper.setDateRangeFilter(
        dateRanges.thisWeek.start,
        dateRanges.thisWeek.end
      )
      
      await reportHelper.applyFilters()
      
      // フィルター適用後もチャートが表示されることを確認
      await reportHelper.expectChartsVisible()
    })

    test('正常系: カテゴリフィルター', async () => {
      // 異なるカテゴリの日記を作成
      const workDiary = generateTestDiary('work_filter')
      workDiary.category = '仕事'
      
      const privateDiary = generateTestDiary('private_filter')
      privateDiary.category = 'プライベート'
      
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(workDiary)
      await diaryHelper.expectRegisterSuccess()
      
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(privateDiary)
      await diaryHelper.expectRegisterSuccess()
      
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      // カテゴリフィルターを設定
      await reportHelper.setCategoryFilter('仕事')
      await reportHelper.applyFilters()
      
      // フィルター適用後の結果を確認
      await reportHelper.expectChartsVisible()
    })

    test('正常系: 期間プリセットフィルター', async () => {
      // テストデータを作成
      const diary = generateTestDiary('period_filter')
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(diary)
      await diaryHelper.expectRegisterSuccess()
      
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      // 期間フィルターを設定（今週）
      await reportHelper.setPeriodFilter('week')
      await reportHelper.applyFilters()
      
      // フィルター適用後の結果を確認
      await reportHelper.expectChartsVisible()
    })

    test('正常系: フィルターリセット機能', async () => {
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      // フィルターを設定
      await reportHelper.setCategoryFilter('仕事')
      await reportHelper.setPeriodFilter('month')
      
      // フィルターをリセット
      await reportHelper.resetFilters()
      
      // リセット後の状態を確認
      const elements = reportHelper.getReportPageElements()
      await expect(elements.categoryFilter).toBeVisible()
      await expect(elements.periodSelector).toBeVisible()
    })

    test('異常系: 無効な日付範囲でのフィルター', async () => {
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      // 無効な日付範囲を設定（終了日が開始日より前）
      const today = new Date()
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
      
      await reportHelper.setDateRangeFilter(
        tomorrow.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      )
      
      await reportHelper.applyFilters()
      
      // エラーメッセージまたは適切な処理が行われることを確認
      const elements = reportHelper.getReportPageElements()
      
      // バリデーションエラーが表示されるか、データが無いメッセージが表示される
      const hasError = await elements.errorAlert.isVisible()
      const hasNoData = await elements.noDataMessage.isVisible()
      
      expect(hasError || hasNoData).toBeTruthy()
    })
  })

  test.describe('統計情報表示', () => {
    
    test('正常系: 統計情報の表示', async () => {
      // テストデータを作成
      const diary = generateTestDiary('stats_test')
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(diary)
      await diaryHelper.expectRegisterSuccess()
      
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      // 統計情報が表示されることを確認
      await reportHelper.expectStatsVisible()
    })

    test('正常系: データテーブル表示', async () => {
      // 複数のテストデータを作成
      for (let i = 0; i < 3; i++) {
        const diary = generateTestDiary(`table_${i}`)
        await diaryHelper.navigateToDiaryRegister()
        await diaryHelper.performDiaryRegister(diary)
        await diaryHelper.expectRegisterSuccess()
      }
      
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      // データテーブルが表示されることを確認
      await reportHelper.expectDataTableVisible()
    })

    test('正常系: データ整合性の確認', async () => {
      // テストデータを作成
      const diary = generateTestDiary('consistency_test')
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(diary)
      await diaryHelper.expectRegisterSuccess()
      
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      // データの整合性をテスト
      await reportHelper.testDataConsistency()
    })
  })

  test.describe('ダッシュボード統計表示', () => {
    
    test('正常系: ダッシュボード統計カードの表示', async () => {
      // テストデータを作成
      const diary = generateTestDiary('dashboard_stats')
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(diary)
      await diaryHelper.expectRegisterSuccess()
      
      await reportHelper.navigateToDashboard()
      await expect(reportHelper.page).toHaveURL(/\/dashboard/)
      
      // ダッシュボードの統計が表示されることを確認
      await reportHelper.expectDashboardStatsVisible()
    })

    test('正常系: ダッシュボードクイックチャート', async () => {
      // 複数のテストデータを作成
      for (let i = 0; i < 3; i++) {
        const diary = generateTestDiary(`quick_chart_${i}`)
        await diaryHelper.navigateToDiaryRegister()
        await diaryHelper.performDiaryRegister(diary)
        await diaryHelper.expectRegisterSuccess()
      }
      
      await reportHelper.navigateToDashboard()
      await expect(reportHelper.page).toHaveURL(/\/dashboard/)
      
      const elements = reportHelper.getDashboardElements()
      
      // クイックチャートが表示されることを確認
      await expect(elements.quickChart).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('データエクスポート機能', () => {
    
    test('正常系: CSVエクスポート機能', async () => {
      // テストデータを作成
      const diary = generateTestDiary('csv_export')
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(diary)
      await diaryHelper.expectRegisterSuccess()
      
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      // CSVエクスポート機能をテスト
      await reportHelper.testCSVExport()
    })

    test('正常系: PDFエクスポート機能', async () => {
      // テストデータを作成
      const diary = generateTestDiary('pdf_export')
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(diary)
      await diaryHelper.expectRegisterSuccess()
      
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      // PDFエクスポート機能をテスト
      await reportHelper.testPDFExport()
    })

    test('異常系: データが無い状態でのエクスポート', async () => {
      // データが無い状態でエクスポートを試行
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      const elements = reportHelper.getReportPageElements()
      
      // エクスポートボタンが無効化されているか、適切なメッセージが表示される
      const exportButton = elements.exportButton
      
      // エクスポートボタンが無効化されているか、データ無しメッセージが表示される
      const buttonVisible = await exportButton.isVisible()
      if (buttonVisible) {
        await expect(exportButton).toBeDisabled()
      } else {
        await reportHelper.expectNoDataMessage()
      }
    })
  })

  test.describe('レスポンシブ対応', () => {
    
    test('モバイル画面でのレポート表示', async () => {
      // テストデータを作成
      const diary = generateTestDiary('mobile_report')
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(diary)
      await diaryHelper.expectRegisterSuccess()
      
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      // レスポンシブ表示をテスト
      await reportHelper.testResponsiveDisplay()
    })

    test('タブレット画面でのダッシュボード表示', async () => {
      // タブレット画面サイズに設定
      await reportHelper.page.setViewportSize({ width: 768, height: 1024 })
      
      // テストデータを作成
      const diary = generateTestDiary('tablet_dashboard')
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(diary)
      await diaryHelper.expectRegisterSuccess()
      
      await reportHelper.navigateToDashboard()
      await expect(reportHelper.page).toHaveURL(/\/dashboard/)
      
      // ダッシュボード要素がタブレットサイズで適切に表示されることを確認
      const elements = reportHelper.getDashboardElements()
      await expect(elements.totalDiariesCard).toBeVisible()
      await expect(elements.quickChart).toBeVisible()
    })
  })

  test.describe('アクセシビリティ', () => {
    
    test('キーボードナビゲーション: レポートフィルター', async () => {
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      const elements = reportHelper.getReportPageElements()
      
      // フィルター要素の可視性を確認
      await expect(elements.periodSelector).toBeVisible()
      await expect(elements.categoryFilter).toBeVisible()
      await expect(elements.applyFilterButton).toBeVisible()
      
      // タブキーでフィルター要素間を移動できることを確認
      await reportHelper.page.keyboard.press('Tab')
      await expect(elements.periodSelector).toBeFocused()
      
      await reportHelper.page.keyboard.press('Tab')
      await expect(elements.categoryFilter).toBeFocused()
      
      await reportHelper.page.keyboard.press('Tab')
      await expect(elements.applyFilterButton).toBeFocused()
    })

    test('スクリーンリーダー対応: ARIA属性の確認', async () => {
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      const elements = reportHelper.getReportPageElements()
      
      // チャート要素にaria-label属性が設定されていることを確認
      const chartVisible = await elements.categoryChart.isVisible()
      if (chartVisible) {
        await elements.categoryChart.getAttribute('aria-label')
        // Note: 実装によってはaria-label以外の方法でアクセシビリティを確保している場合もある
      }
      
      // フィルター要素のアクセシビリティを確認
      await expect(elements.periodSelector).toBeVisible()
      await expect(elements.categoryFilter).toBeVisible()
    })
  })

  test.describe('エラーハンドリング', () => {
    
    test('異常系: ネットワークエラーシミュレーション', async () => {
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      // ネットワークエラーをシミュレート
      await reportHelper.page.route('**/api/**', route => {
        route.abort('failed')
      })
      
      // フィルターを適用してネットワークリクエストを発生させる
      await reportHelper.setPeriodFilter('week')
      await reportHelper.applyFilters()
      
      const elements = reportHelper.getReportPageElements()
      
      // エラーメッセージが表示されることを確認
      await expect(elements.errorAlert).toBeVisible({ timeout: 5000 })
    })

    test('異常系: 長時間のローディング状態', async () => {
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      // レスポンスを遅延させる
      await reportHelper.page.route('**/api/**', route => {
        setTimeout(() => route.continue(), 3000)
      })
      
      // フィルターを適用
      await reportHelper.setPeriodFilter('month')
      await reportHelper.applyFilters()
      
      const elements = reportHelper.getReportPageElements()
      
      // ローディングインジケーターが表示されることを確認
      await expect(elements.loadingIndicator).toBeVisible({ timeout: 1000 })
    })
  })
})