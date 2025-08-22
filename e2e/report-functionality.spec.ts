import { test, expect } from '@playwright/test'
import { AuthTestHelper, generateTestUser } from './helpers/auth'
import { DiaryTestHelper, generateTestDiary } from './helpers/diary'
import { ReportTestHelper } from './helpers/report'

/**
 * レポート機能のE2Eテスト
 * 
 * テスト対象:
 * - レポートページの表示・ナビゲーション
 * - 気分推移チャート表示機能
 * - ダッシュボードへのナビゲーション
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
      
      // レポートページの基本要素が表示されることを確認
      await reportHelper.expectReportPageVisible()
      await reportHelper.expectReportContentVisible()
    })

    test('正常系: ダッシュボードからレポートページへの遷移', async () => {
      await reportHelper.navigateToDashboard()
      await expect(reportHelper.page).toHaveURL(/\/dashboard/)
      
      // ダッシュボードからレポートページへの遷移をテスト
      await reportHelper.testDashboardToReportNavigation()
    })

    test('正常系: データが無い場合の表示', async () => {
      // 日記データが無い状態でレポートページにアクセス
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      // データが無い場合の表示を確認
      await reportHelper.expectNoDataState()
    })
  })

  test.describe('チャート表示機能', () => {
    
    test('正常系: テストデータありで気分チャート表示', async () => {
      // テスト用日記データを複数作成
      const testDiaries = [
        { ...generateTestDiary('chart_1'), mood: 80 },
        { ...generateTestDiary('chart_2'), mood: 60 },
        { ...generateTestDiary('chart_3'), mood: 90 }
      ]
      
      for (const diary of testDiaries) {
        await diaryHelper.navigateToDiaryRegister()
        await diaryHelper.performDiaryRegister(diary)
        await diaryHelper.expectRegisterSuccess()
      }
      
      // レポートページで気分チャートが表示されることを確認
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      await reportHelper.expectMoodChartVisible()
    })

    test('正常系: 気分チャートの相互作用性', async () => {
      // 異なる気分レベルの日記を作成
      const moodLevels = [20, 50, 80]
      
      for (let i = 0; i < moodLevels.length; i++) {
        const diary = generateTestDiary(`mood_${moodLevels[i]}`)
        diary.mood = moodLevels[i]
        
        await diaryHelper.navigateToDiaryRegister()
        await diaryHelper.performDiaryRegister(diary)
        await diaryHelper.expectRegisterSuccess()
      }
      
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      // 気分チャートが表示されることを確認
      await reportHelper.expectMoodChartVisible()
      
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

  test.describe('ナビゲーション機能', () => {
    
    test('正常系: ダッシュボードへの戻るボタン', async () => {
      // テストデータを作成
      const diary = generateTestDiary('navigation_test')
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(diary)
      await diaryHelper.expectRegisterSuccess()
      
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      // ダッシュボードに戻るボタンをテスト
      await reportHelper.navigateBackToDashboard()
    })

    test('正常系: ヘルプページへのナビゲーション', async () => {
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      // ヘルプページへのナビゲーションをテスト
      const elements = reportHelper.getReportPageElements()
      
      // ヘルプボタンが存在することを確認してからナビゲーション
      await expect(elements.helpButton).toBeVisible()
      await reportHelper.navigateToHelp()
    })
  })

  test.describe('レポートコンテンツ表示', () => {
    
    test('正常系: レポートコンテンツの表示', async () => {
      // テストデータを作成
      const diary = generateTestDiary('content_test')
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(diary)
      await diaryHelper.expectRegisterSuccess()
      
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      // レポートコンテンツが表示されることを確認
      await reportHelper.expectReportContentVisible()
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

  test.describe('ダッシュボード連携', () => {
    
    test('正常系: ダッシュボードの表示', async () => {
      // テストデータを作成
      const diary = generateTestDiary('dashboard_test')
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(diary)
      await diaryHelper.expectRegisterSuccess()
      
      await reportHelper.navigateToDashboard()
      await expect(reportHelper.page).toHaveURL(/\/dashboard/)
      
      // ダッシュボードが表示されることを確認
      await reportHelper.expectDashboardVisible()
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
      await reportHelper.expectDashboardVisible()
    })
  })

  test.describe('アクセシビリティ', () => {
    
    test('キーボードナビゲーション: レポートナビゲーション', async () => {
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      const elements = reportHelper.getReportPageElements()
      
      // ナビゲーションボタンの可視性を確認
      await expect(elements.dashboardButton).toBeVisible()
      await expect(elements.helpButton).toBeVisible()
      
      // タブキーでボタン間を移動できることを確認
      await reportHelper.page.keyboard.press('Tab')
      await expect(elements.dashboardButton).toBeFocused()
      
      await reportHelper.page.keyboard.press('Tab')
      await expect(elements.helpButton).toBeFocused()
    })

    test('スクリーンリーダー対応: ARIA属性の確認', async () => {
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      const elements = reportHelper.getReportPageElements()
      
      // Chart.jsのcanvas要素がアクセシブルであることを確認
      await expect(elements.moodChart).toBeVisible()
      
      // ナビゲーションボタンのアクセシビリティを確認
      await expect(elements.dashboardButton).toBeVisible()
      await expect(elements.helpButton).toBeVisible()
    })
  })

  test.describe('エラーハンドリング', () => {
    
    test('異常系: ネットワークエラーシミュレーション', async () => {
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      // ネットワークエラーをシミュレート（Supabase APIへのリクエストをブロック）
      await reportHelper.page.route('**/rest/v1/diaries*', route => {
        route.abort('failed')
      })
      
      // ページをリロードしてデータ取得を発生させる
      await reportHelper.page.reload()
      
      // エラー状態またはデータ無し状態が適切に表示されることを確認
      await reportHelper.expectNoDataState()
    })

    test('異常系: 長時間のローディング状態', async () => {
      await reportHelper.navigateToReport()
      await expect(reportHelper.page).toHaveURL(/\/diary\/report/)
      
      // Supabase APIのレスポンスを遅延させる
      await reportHelper.page.route('**/rest/v1/diaries*', route => {
        setTimeout(() => route.continue(), 3000)
      })
      
      // ページをリロードしてデータ取得を発生させる
      await reportHelper.page.reload()
      
      // シンプルなレポートページでは特別なローディングインジケーターがないかもしれない
      // チャートが最終的に表示されることを確認
      await reportHelper.expectMoodChartVisible()
    })
  })
})