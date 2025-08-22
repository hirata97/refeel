import { test, expect } from '@playwright/test'
import { AuthTestHelper, generateTestUser } from './helpers/auth'
import { DiaryTestHelper, generateTestDiary, generateInvalidDiaryData } from './helpers/diary'

/**
 * 日記操作のE2Eテスト
 * 
 * テスト対象:
 * - 日記作成フロー（正常系・異常系）
 * - 日記編集フロー（正常系・異常系）
 * - 日記削除フロー（正常系・異常系）
 * - 日記一覧表示・検索・フィルタリング
 * - バリデーション機能
 * - レスポンシブ対応
 */

test.describe('日記操作システム', () => {
  let authHelper: AuthTestHelper
  let diaryHelper: DiaryTestHelper
  let testUser: { email: string; password: string; username: string }

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthTestHelper(page)
    diaryHelper = new DiaryTestHelper(page)
    
    // テストの前にクリーンアップ
    await authHelper.cleanup()
    await diaryHelper.cleanup()
    
    // テスト用ユーザーでログイン
    testUser = generateTestUser('diary_test')
    await authHelper.navigateToRegister()
    await authHelper.performRegister(testUser)
    await authHelper.expectRegisterSuccess()
  })

  test.afterEach(async () => {
    // テスト後のクリーンアップ
    await diaryHelper.cleanup()
    await authHelper.cleanup()
  })

  test.describe('日記作成フロー', () => {
    
    test('正常系: 新規日記作成成功', async () => {
      const testDiary = generateTestDiary('create_success')
      
      await diaryHelper.navigateToDiaryRegister()
      await expect(diaryHelper.page).toHaveURL(/\/diary\/register/)
      
      // フォーム要素が表示されていることを確認
      const elements = diaryHelper.getRegisterFormElements()
      await expect(elements.titleField).toBeVisible()
      await expect(elements.categorySelect).toBeVisible()
      await expect(elements.contentField).toBeVisible()
      await expect(elements.submitButton).toBeVisible()
      
      await diaryHelper.performDiaryRegister(testDiary)
      
      // 登録成功を確認
      await diaryHelper.expectRegisterSuccess()
    })

    test('正常系: 目標日付を設定した日記作成', async () => {
      const testDiary = generateTestDiary('with_target_date')
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7) // 7日後
      testDiary.targetDate = futureDate.toISOString().split('T')[0]
      
      await diaryHelper.navigateToDiaryRegister()
      await expect(diaryHelper.page).toHaveURL(/\/diary\/register/)
      
      await diaryHelper.performDiaryRegister(testDiary)
      
      // 登録成功を確認
      await diaryHelper.expectRegisterSuccess()
    })

    test('異常系: 必須項目未入力でバリデーションエラー', async () => {
      const invalidData = generateInvalidDiaryData()
      
      await diaryHelper.navigateToDiaryRegister()
      await expect(diaryHelper.page).toHaveURL(/\/diary\/register/)
      
      const elements = diaryHelper.getRegisterFormElements()
      
      // 空のタイトルでバリデーション発生
      await elements.titleField.fill(invalidData.emptyTitle.title)
      await elements.titleField.blur()
      await diaryHelper.expectValidationError('title')
      
      // 空のコンテンツでバリデーション発生
      await elements.contentField.fill(invalidData.emptyContent.content)
      await elements.contentField.blur()
      await diaryHelper.expectValidationError('content')
    })

    test('異常系: カテゴリ未選択でバリデーションエラー', async () => {
      const testDiary = generateTestDiary('no_category')
      
      await diaryHelper.navigateToDiaryRegister()
      await expect(diaryHelper.page).toHaveURL(/\/diary\/register/)
      
      const elements = diaryHelper.getRegisterFormElements()
      
      // タイトルとコンテンツのみ入力（カテゴリ未選択）
      await elements.titleField.fill(testDiary.title)
      await elements.contentField.fill(testDiary.content)
      
      // 登録を試行
      await elements.submitButton.click()
      
      // バリデーションエラーまたは登録失敗を確認
      await diaryHelper.expectValidationError('category')
    })

    test('UI: キャンセルボタンで前のページに戻る', async () => {
      await diaryHelper.navigateToDiaryRegister()
      await expect(diaryHelper.page).toHaveURL(/\/diary\/register/)
      
      const elements = diaryHelper.getRegisterFormElements()
      
      // キャンセルボタンの可視性を確認
      await expect(elements.cancelButton).toBeVisible()
      
      await elements.cancelButton.click()
      
      // ダッシュボードまたは一覧ページに戻ることを確認
      await expect(diaryHelper.page).toHaveURL(/\/(dashboard|diary\/view)/)
    })
  })

  test.describe('日記編集フロー', () => {
    
    test('正常系: 既存日記の編集成功', async () => {
      // まず日記を作成
      const originalDiary = generateTestDiary('edit_original')
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(originalDiary)
      await diaryHelper.expectRegisterSuccess()
      
      // 日記一覧に移動
      await diaryHelper.navigateToDiaryView()
      await expect(diaryHelper.page).toHaveURL(/\/diary\/view/)
      
      // 作成した日記をクリックして編集ページに移動
      await diaryHelper.clickDiaryItem(originalDiary.title)
      
      // 編集フォームが表示されることを確認
      const elements = diaryHelper.getEditFormElements()
      await expect(elements.titleField).toBeVisible()
      await expect(elements.updateButton).toBeVisible()
      
      // 日記を編集
      const updatedDiary = {
        title: `${originalDiary.title}_更新済み`,
        content: `${originalDiary.content} - 編集済みコンテンツ`
      }
      
      await diaryHelper.performDiaryEdit(updatedDiary)
      
      // 編集成功を確認
      await diaryHelper.expectEditSuccess()
    })

    test('正常系: カテゴリ変更', async () => {
      // まず日記を作成
      const originalDiary = generateTestDiary('category_change')
      originalDiary.category = '仕事'
      
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(originalDiary)
      await diaryHelper.expectRegisterSuccess()
      
      // 日記一覧に移動して編集
      await diaryHelper.navigateToDiaryView()
      await diaryHelper.clickDiaryItem(originalDiary.title)
      
      // カテゴリを変更
      const updatedDiary = {
        category: 'プライベート'
      }
      
      await diaryHelper.performDiaryEdit(updatedDiary)
      await diaryHelper.expectEditSuccess()
      
      // カテゴリ変更が成功したことを確認
      await expect(diaryHelper.page).toHaveURL(/\/diary\/view/)
    })

    test('異常系: 必須項目を空にしてバリデーションエラー', async () => {
      // まず日記を作成
      const originalDiary = generateTestDiary('edit_validation')
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(originalDiary)
      await diaryHelper.expectRegisterSuccess()
      
      // 日記一覧に移動して編集
      await diaryHelper.navigateToDiaryView()
      await diaryHelper.clickDiaryItem(originalDiary.title)
      
      const elements = diaryHelper.getEditFormElements()
      
      // タイトルを空にしてバリデーション発生
      await elements.titleField.fill('')
      await elements.titleField.blur()
      await diaryHelper.expectValidationError('title')
      
      // コンテンツを空にしてバリデーション発生
      await elements.contentField.fill('')
      await elements.contentField.blur()
      await diaryHelper.expectValidationError('content')
      
      // バリデーションエラーにより編集ページにとどまることを確認
      await expect(diaryHelper.page).toHaveURL(/\/diary\/edit/)
    })
  })

  test.describe('日記削除フロー', () => {
    
    test('正常系: 日記削除成功', async () => {
      // まず日記を作成
      const testDiary = generateTestDiary('delete_success')
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(testDiary)
      await diaryHelper.expectRegisterSuccess()
      
      // 日記一覧に移動
      await diaryHelper.navigateToDiaryView()
      await expect(diaryHelper.page).toHaveURL(/\/diary\/view/)
      
      // 作成した日記が一覧に表示されることを確認
      await diaryHelper.expectDiaryInList(testDiary.title)
      
      // 日記をクリックして編集ページに移動
      await diaryHelper.clickDiaryItem(testDiary.title)
      
      // 削除ボタンが表示されることを確認
      const elements = diaryHelper.getEditFormElements()
      await expect(elements.deleteButton).toBeVisible()
      
      // 日記を削除
      await diaryHelper.performDiaryDelete()
      
      // 削除成功を確認
      await diaryHelper.expectDeleteSuccess()
      
      // 日記が一覧から削除されていることを確認
      await diaryHelper.expectDiaryNotInList(testDiary.title)
    })

    test('UI: 削除確認ダイアログの表示', async () => {
      // まず日記を作成
      const testDiary = generateTestDiary('delete_confirm')
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(testDiary)
      await diaryHelper.expectRegisterSuccess()
      
      // 日記一覧に移動して編集ページへ
      await diaryHelper.navigateToDiaryView()
      await diaryHelper.clickDiaryItem(testDiary.title)
      
      const elements = diaryHelper.getEditFormElements()
      
      // 削除ボタンをクリック
      await elements.deleteButton.click()
      
      // 確認ダイアログが表示されることを確認
      const confirmDialog = diaryHelper.page.locator('.v-dialog .v-card')
      await expect(confirmDialog).toBeVisible()
      
      // キャンセルボタンで削除をキャンセル
      await diaryHelper.page.locator('button:has-text("キャンセル"), button:has-text("いいえ")').click()
      
      // ダイアログが閉じることを確認
      await expect(confirmDialog).toBeHidden()
      
      // 編集ページにとどまることを確認
      await expect(diaryHelper.page).toHaveURL(/\/diary\/edit/)
    })
  })

  test.describe('日記一覧・検索・フィルタリング', () => {
    
    test('正常系: 複数の日記が一覧表示される', async () => {
      // 複数の日記を作成
      const diaries = [
        generateTestDiary('list_test_1'),
        generateTestDiary('list_test_2'),
        generateTestDiary('list_test_3')
      ]
      
      for (const diary of diaries) {
        await diaryHelper.navigateToDiaryRegister()
        await diaryHelper.performDiaryRegister(diary)
        await diaryHelper.expectRegisterSuccess()
      }
      
      // 日記一覧に移動
      await diaryHelper.navigateToDiaryView()
      await expect(diaryHelper.page).toHaveURL(/\/diary\/view/)
      
      const elements = diaryHelper.getViewPageElements()
      
      // 日記リストが表示されることを確認
      await expect(elements.diaryList).toBeVisible()
      
      // 作成した日記がすべて表示されることを確認
      for (const diary of diaries) {
        await diaryHelper.expectDiaryInList(diary.title)
      }
    })

    test('正常系: 日記検索機能', async () => {
      // テスト用日記を作成
      const searchableDiary = generateTestDiary('searchable')
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(searchableDiary)
      await diaryHelper.expectRegisterSuccess()
      
      // 日記一覧に移動
      await diaryHelper.navigateToDiaryView()
      await expect(diaryHelper.page).toHaveURL(/\/diary\/view/)
      
      // 検索機能をテスト
      const foundDiary = await diaryHelper.searchDiary(searchableDiary.title)
      expect(foundDiary).not.toBeNull()
      
      if (foundDiary) {
        await expect(foundDiary).toBeVisible()
      }
    })

    test('正常系: カテゴリフィルタリング', async () => {
      // 異なるカテゴリの日記を作成
      const workDiary = generateTestDiary('work')
      workDiary.category = '仕事'
      
      const privateDiary = generateTestDiary('private')
      privateDiary.category = 'プライベート'
      
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(workDiary)
      await diaryHelper.expectRegisterSuccess()
      
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(privateDiary)
      await diaryHelper.expectRegisterSuccess()
      
      // 日記一覧に移動
      await diaryHelper.navigateToDiaryView()
      await expect(diaryHelper.page).toHaveURL(/\/diary\/view/)
      
      // カテゴリフィルタをテスト
      await diaryHelper.testCategoryFilter('仕事')
    })

    test('正常系: データが無い場合のメッセージ表示', async () => {
      // 新しいユーザーで日記データが無い状態をテスト
      await authHelper.performLogout()
      
      const newUser = generateTestUser('no_data')
      await authHelper.navigateToRegister()
      await authHelper.performRegister(newUser)
      await authHelper.expectRegisterSuccess()
      
      // 日記一覧に移動
      await diaryHelper.navigateToDiaryView()
      await expect(diaryHelper.page).toHaveURL(/\/diary\/view/)
      
      const elements = diaryHelper.getViewPageElements()
      
      // データなしメッセージが表示されることを確認
      await expect(elements.noDataMessage).toBeVisible()
    })
  })

  test.describe('レスポンシブ対応', () => {
    
    test('モバイル画面での日記登録フォーム表示', async () => {
      // モバイル画面サイズに設定
      await diaryHelper.page.setViewportSize({ width: 375, height: 667 })
      
      await diaryHelper.navigateToDiaryRegister()
      await expect(diaryHelper.page).toHaveURL(/\/diary\/register/)
      
      const elements = diaryHelper.getRegisterFormElements()
      
      // フォーム要素が表示されることを確認
      await expect(elements.titleField).toBeVisible()
      await expect(elements.categorySelect).toBeVisible()
      await expect(elements.contentField).toBeVisible()
      await expect(elements.submitButton).toBeVisible()
      
      // フォームが機能することを確認
      await elements.titleField.fill('モバイルテスト')
      await expect(elements.titleField).toHaveValue('モバイルテスト')
    })

    test('タブレット画面での日記一覧表示', async () => {
      // タブレット画面サイズに設定
      await diaryHelper.page.setViewportSize({ width: 768, height: 1024 })
      
      // テスト用日記を作成
      const testDiary = generateTestDiary('tablet_test')
      await diaryHelper.navigateToDiaryRegister()
      await diaryHelper.performDiaryRegister(testDiary)
      await diaryHelper.expectRegisterSuccess()
      
      await diaryHelper.navigateToDiaryView()
      await expect(diaryHelper.page).toHaveURL(/\/diary\/view/)
      
      const elements = diaryHelper.getViewPageElements()
      
      // 一覧表示が適切に動作することを確認
      await expect(elements.diaryList).toBeVisible()
      await diaryHelper.expectDiaryInList(testDiary.title)
    })
  })

  test.describe('アクセシビリティ', () => {
    
    test('キーボードナビゲーション: 日記登録フォーム', async () => {
      await diaryHelper.navigateToDiaryRegister()
      await expect(diaryHelper.page).toHaveURL(/\/diary\/register/)
      
      const elements = diaryHelper.getRegisterFormElements()
      
      // フォーム要素の可視性を確認
      await expect(elements.titleField).toBeVisible()
      await expect(elements.categorySelect).toBeVisible()
      await expect(elements.contentField).toBeVisible()
      await expect(elements.submitButton).toBeVisible()
      
      // タブキーでフォーム間を移動できることを確認
      await diaryHelper.page.keyboard.press('Tab')
      await expect(elements.titleField).toBeFocused()
      
      await diaryHelper.page.keyboard.press('Tab')
      await expect(elements.categorySelect).toBeFocused()
      
      await diaryHelper.page.keyboard.press('Tab')
      await expect(elements.contentField).toBeFocused()
    })
  })

  test.describe('パフォーマンス', () => {
    
    test('大量データでの一覧表示パフォーマンス', async () => {
      // 複数の日記を作成（実際のテストでは数を調整）
      const diaryCount = 5 // CI環境を考慮して少なめに設定
      
      for (let i = 0; i < diaryCount; i++) {
        const diary = generateTestDiary(`perf_test_${i}`)
        await diaryHelper.navigateToDiaryRegister()
        await diaryHelper.performDiaryRegister(diary)
        await diaryHelper.expectRegisterSuccess()
      }
      
      // 一覧表示のパフォーマンスを測定
      const startTime = Date.now()
      await diaryHelper.navigateToDiaryView()
      await expect(diaryHelper.page).toHaveURL(/\/diary\/view/)
      
      const elements = diaryHelper.getViewPageElements()
      await expect(elements.diaryList).toBeVisible()
      
      const loadTime = Date.now() - startTime
      
      // 一覧表示が5秒以内に完了することを確認
      expect(loadTime).toBeLessThan(5000)
    })
  })
})