import { test, expect } from '@playwright/test'
import { AuthTestHelper, generateTestUser } from '../helpers/auth'
import { DiaryTestHelper, generateTestDiary } from '../helpers/diary'

/**
 * Tier 1: スモークテスト（クリティカルパス）
 *
 * 実行条件:
 * - 全PR作成時に必ず実行
 * - chromiumのみで実行
 * - 5分以内で完了
 *
 * テスト対象:
 * - 最重要フロー（ログイン→日記作成→表示→ログアウト）
 * - システムの基本動作確認
 * - リグレッション早期検出
 */

test.describe('スモークテスト: クリティカルパス', () => {
  let authHelper: AuthTestHelper
  let diaryHelper: DiaryTestHelper
  let testUser: { email: string; password: string; username: string }

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthTestHelper(page)
    diaryHelper = new DiaryTestHelper(page)

    // テストの前にクリーンアップ
    await authHelper.cleanup()
    await diaryHelper.cleanup()
  })

  test.afterEach(async () => {
    // テスト後のクリーンアップ
    await diaryHelper.cleanup()
    await authHelper.cleanup()
  })

  test('[スモーク] ユーザー登録→ログイン→日記作成→表示→削除→ログアウト', async () => {
    // 1. ユーザー登録
    testUser = generateTestUser('smoke_test')
    await authHelper.navigateToRegister()
    await expect(authHelper.page).toHaveURL(/\/register/)

    await authHelper.performRegister(testUser)
    await authHelper.expectRegisterSuccess()

    // 2. ダッシュボード表示確認
    await expect(authHelper.page).toHaveURL(/\/(dashboard|diary)/)

    // 3. 日記作成
    const testDiary = generateTestDiary('smoke_diary')
    await diaryHelper.navigateToDiaryRegister()
    await expect(diaryHelper.page).toHaveURL(/\/diary\/register/)

    await diaryHelper.performDiaryRegister(testDiary)
    await diaryHelper.expectRegisterSuccess()

    // 4. 日記一覧で表示確認
    await diaryHelper.navigateToDiaryView()
    await expect(diaryHelper.page).toHaveURL(/\/diary\/view/)

    await diaryHelper.expectDiaryInList(testDiary.title)

    // 5. 日記削除
    await diaryHelper.clickDiaryItem(testDiary.title)
    await diaryHelper.performDiaryDelete()
    await diaryHelper.expectDeleteSuccess()

    // 6. ログアウト
    await authHelper.performLogout()
    await authHelper.expectLogoutSuccess()
  })

  test('[スモーク] ログイン→ログアウト基本フロー', async () => {
    // ユーザー登録
    testUser = generateTestUser('login_smoke')
    await authHelper.navigateToRegister()
    await authHelper.performRegister(testUser)
    await authHelper.expectRegisterSuccess()

    // ログアウト
    await authHelper.performLogout()
    await authHelper.expectLogoutSuccess()

    // 再ログイン
    await authHelper.navigateToLogin()
    await expect(authHelper.page).toHaveURL(/\/login/)

    await authHelper.performLogin(testUser)
    await authHelper.expectLoginSuccess()

    // 再度ログアウト
    await authHelper.performLogout()
    await authHelper.expectLogoutSuccess()
  })

  test('[スモーク] トップページ→ログイン→ダッシュボード表示', async () => {
    // トップページアクセス
    await authHelper.page.goto('/')
    await authHelper.page.waitForLoadState('domcontentloaded')

    // ユーザー登録
    testUser = generateTestUser('dashboard_smoke')
    await authHelper.navigateToRegister()
    await authHelper.performRegister(testUser)
    await authHelper.expectRegisterSuccess()

    // ダッシュボードが表示されることを確認
    await expect(authHelper.page).toHaveURL(/\/(dashboard|diary)/)

    // ページコンテンツが表示されることを確認
    await expect(authHelper.page.locator('body')).toBeVisible()
  })

  test('[スモーク] 日記作成→編集フロー', async () => {
    // ユーザー登録
    testUser = generateTestUser('edit_smoke')
    await authHelper.navigateToRegister()
    await authHelper.performRegister(testUser)
    await authHelper.expectRegisterSuccess()

    // 日記作成
    const originalDiary = generateTestDiary('edit_smoke_diary')
    await diaryHelper.navigateToDiaryRegister()
    await diaryHelper.performDiaryRegister(originalDiary)
    await diaryHelper.expectRegisterSuccess()

    // 日記一覧に移動
    await diaryHelper.navigateToDiaryView()
    await expect(diaryHelper.page).toHaveURL(/\/diary\/view/)

    // 日記をクリックして編集
    await diaryHelper.clickDiaryItem(originalDiary.title)

    const updatedDiary = {
      title: `${originalDiary.title}_更新`,
      content: `${originalDiary.content}_編集済み`
    }

    await diaryHelper.performDiaryEdit(updatedDiary)
    await diaryHelper.expectEditSuccess()

    // 編集内容が保存されたことを確認
    await diaryHelper.navigateToDiaryView()
    await diaryHelper.expectDiaryInList(updatedDiary.title)
  })
})
