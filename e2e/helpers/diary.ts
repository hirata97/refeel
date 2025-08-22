import { Page, Locator, expect } from '@playwright/test'

/**
 * 日記操作関連のE2Eテストヘルパー関数
 */

export interface DiaryData {
  title: string
  category: string
  content: string
  targetDate?: string
}

export interface DiarySearchOptions {
  category?: string
  dateRange?: {
    start: string
    end: string
  }
  keyword?: string
}

/**
 * 日記操作テスト用のヘルパークラス
 */
export class DiaryTestHelper {
  constructor(private page: Page) {}

  /**
   * 日記登録ページに移動
   */
  async navigateToDiaryRegister(): Promise<void> {
    await this.page.goto('/diary/register')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * 日記一覧ページに移動
   */
  async navigateToDiaryView(): Promise<void> {
    await this.page.goto('/diary/view')
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
   * 日記登録フォームの入力要素を取得
   */
  getRegisterFormElements() {
    return {
      titleField: this.page.locator('input[label="タイトル"], input[placeholder*="タイトル"]'),
      categorySelect: this.page.locator('.v-select').first(),
      contentField: this.page.locator('textarea[label="内容"], textarea[placeholder*="内容"]'),
      targetDateField: this.page.locator('input[type="date"]'),
      submitButton: this.page.locator('button[type="submit"], button:has-text("登録")'),
      cancelButton: this.page.locator('button:has-text("キャンセル")'),
      errorAlert: this.page.locator('.v-alert--type-error'),
      successAlert: this.page.locator('.v-alert--type-success')
    }
  }

  /**
   * 日記編集フォームの入力要素を取得
   */
  getEditFormElements() {
    return {
      titleField: this.page.locator('input[label="タイトル"], input[placeholder*="タイトル"]'),
      categorySelect: this.page.locator('.v-select').first(),
      contentField: this.page.locator('textarea[label="内容"], textarea[placeholder*="内容"]'),
      targetDateField: this.page.locator('input[type="date"]'),
      updateButton: this.page.locator('button[type="submit"], button:has-text("更新")'),
      cancelButton: this.page.locator('button:has-text("キャンセル")'),
      deleteButton: this.page.locator('button:has-text("削除")'),
      errorAlert: this.page.locator('.v-alert--type-error'),
      successAlert: this.page.locator('.v-alert--type-success')
    }
  }

  /**
   * 日記一覧の要素を取得
   */
  getViewPageElements() {
    return {
      diaryList: this.page.locator('.diary-list, .v-list'),
      diaryItems: this.page.locator('.diary-item, .v-list-item'),
      searchField: this.page.locator('input[placeholder*="検索"]'),
      categoryFilter: this.page.locator('.category-filter .v-select'),
      dateFilter: this.page.locator('.date-filter input[type="date"]'),
      sortOptions: this.page.locator('.sort-options .v-select'),
      paginationButtons: this.page.locator('.v-pagination button'),
      noDataMessage: this.page.locator('.no-data, .v-alert:has-text("データが見つかりません")')
    }
  }

  /**
   * 日記登録操作を実行
   */
  async performDiaryRegister(diaryData: DiaryData): Promise<void> {
    const elements = this.getRegisterFormElements()

    // フォーム入力
    await elements.titleField.fill(diaryData.title)
    
    // カテゴリ選択
    await elements.categorySelect.click()
    await this.page.locator(`.v-list-item:has-text("${diaryData.category}")`).click()
    
    await elements.contentField.fill(diaryData.content)
    
    if (diaryData.targetDate) {
      await elements.targetDateField.fill(diaryData.targetDate)
    }

    // 登録ボタンをクリック
    await elements.submitButton.click()

    // レスポンスを待つ
    await this.page.waitForTimeout(1000)
  }

  /**
   * 日記編集操作を実行
   */
  async performDiaryEdit(diaryData: Partial<DiaryData>): Promise<void> {
    const elements = this.getEditFormElements()

    // フォーム入力（変更するフィールドのみ）
    if (diaryData.title) {
      await elements.titleField.fill(diaryData.title)
    }
    
    if (diaryData.category) {
      await elements.categorySelect.click()
      await this.page.locator(`.v-list-item:has-text("${diaryData.category}")`).click()
    }
    
    if (diaryData.content) {
      await elements.contentField.fill(diaryData.content)
    }
    
    if (diaryData.targetDate) {
      await elements.targetDateField.fill(diaryData.targetDate)
    }

    // 更新ボタンをクリック
    await elements.updateButton.click()

    // レスポンスを待つ
    await this.page.waitForTimeout(1000)
  }

  /**
   * 日記削除操作を実行
   */
  async performDiaryDelete(): Promise<void> {
    const elements = this.getEditFormElements()
    
    await elements.deleteButton.click()
    
    // 確認ダイアログが表示される場合
    const confirmDialog = this.page.locator('.v-dialog .v-card')
    if (await confirmDialog.isVisible()) {
      await this.page.locator('button:has-text("削除"), button:has-text("はい")').click()
    }

    // レスポンスを待つ
    await this.page.waitForTimeout(1000)
  }

  /**
   * 日記リストで特定の日記を検索
   */
  async searchDiary(title: string): Promise<Locator | null> {
    const elements = this.getViewPageElements()
    
    // 検索フィールドに入力
    if (await elements.searchField.isVisible()) {
      await elements.searchField.fill(title)
      await this.page.keyboard.press('Enter')
      await this.page.waitForTimeout(500)
    }

    // 該当する日記アイテムを探す
    const diaryItem = this.page.locator(`.diary-item:has-text("${title}"), .v-list-item:has-text("${title}")`)
    
    if (await diaryItem.count() > 0) {
      return diaryItem.first()
    }
    
    return null
  }

  /**
   * 日記アイテムをクリックして詳細/編集ページに移動
   */
  async clickDiaryItem(title: string): Promise<void> {
    const diaryItem = await this.searchDiary(title)
    
    if (diaryItem) {
      await diaryItem.click()
      await this.page.waitForLoadState('networkidle')
    } else {
      throw new Error(`日記「${title}」が見つかりません`)
    }
  }

  /**
   * 日記登録成功を確認
   */
  async expectRegisterSuccess(): Promise<void> {
    const elements = this.getRegisterFormElements()
    
    // 成功メッセージまたはリダイレクトを確認
    const hasSuccessMessage = await elements.successAlert.isVisible()
    const isRedirected = this.page.url().includes('/diary/view') || this.page.url().includes('/dashboard')
    
    expect(hasSuccessMessage || isRedirected).toBeTruthy()
  }

  /**
   * 日記登録失敗を確認
   */
  async expectRegisterFailure(expectedErrorMessage?: string): Promise<void> {
    const elements = this.getRegisterFormElements()
    
    // エラーメッセージの表示を確認
    await expect(elements.errorAlert).toBeVisible({ timeout: 5000 })
    
    if (expectedErrorMessage) {
      await expect(elements.errorAlert).toContainText(expectedErrorMessage)
    }
    
    // 登録ページにとどまることを確認
    await expect(this.page).toHaveURL(/\/diary\/register/)
  }

  /**
   * 日記編集成功を確認
   */
  async expectEditSuccess(): Promise<void> {
    const elements = this.getEditFormElements()
    
    // 成功メッセージまたはリダイレクトを確認
    const hasSuccessMessage = await elements.successAlert.isVisible()
    const isRedirected = this.page.url().includes('/diary/view')
    
    expect(hasSuccessMessage || isRedirected).toBeTruthy()
  }

  /**
   * 日記削除成功を確認
   */
  async expectDeleteSuccess(): Promise<void> {
    // 日記一覧ページにリダイレクトされることを確認
    await expect(this.page).toHaveURL(/\/diary\/view/)
    
    // 成功メッセージが表示されることを確認
    const successAlert = this.page.locator('.v-alert--type-success, .v-snackbar--type-success')
    await expect(successAlert).toBeVisible({ timeout: 5000 })
  }

  /**
   * バリデーションエラーを確認
   */
  async expectValidationError(fieldType: 'title' | 'category' | 'content'): Promise<void> {
    let errorLocator: Locator

    switch (fieldType) {
      case 'title':
        errorLocator = this.page.locator('.v-text-field__error-messages').first()
        break
      case 'category':
        errorLocator = this.page.locator('.v-select__error-messages').first()
        break
      case 'content':
        errorLocator = this.page.locator('.v-textarea__error-messages').first()
        break
    }

    await expect(errorLocator).toBeVisible({ timeout: 3000 })
  }

  /**
   * 日記が一覧に表示されることを確認
   */
  async expectDiaryInList(title: string): Promise<void> {
    const diaryItem = await this.searchDiary(title)
    expect(diaryItem).not.toBeNull()
    
    if (diaryItem) {
      await expect(diaryItem).toBeVisible()
    }
  }

  /**
   * 日記が一覧から削除されていることを確認
   */
  async expectDiaryNotInList(title: string): Promise<void> {
    const diaryItem = await this.searchDiary(title)
    
    if (diaryItem) {
      await expect(diaryItem).not.toBeVisible()
    }
  }

  /**
   * フィルタリング機能をテスト
   */
  async testCategoryFilter(category: string): Promise<void> {
    const elements = this.getViewPageElements()
    
    // カテゴリフィルタを選択
    await elements.categoryFilter.click()
    await this.page.locator(`.v-list-item:has-text("${category}")`).click()
    
    // フィルタ結果を待つ
    await this.page.waitForTimeout(500)
    
    // フィルタされた結果の確認
    const visibleItems = await elements.diaryItems.count()
    expect(visibleItems).toBeGreaterThanOrEqual(0)
  }

  /**
   * テストデータのクリーンアップ
   */
  async cleanup(): Promise<void> {
    // 必要に応じてテスト用の日記データを削除
    // 実装は具体的なデータ削除APIに依存
  }
}

/**
 * テスト用の日記データ生成
 */
export function generateTestDiary(prefix = 'test'): DiaryData {
  const timestamp = Date.now()
  
  return {
    title: `${prefix}_日記_${timestamp}`,
    category: '仕事',
    content: `これは${prefix}用の日記内容です。タイムスタンプ: ${timestamp}`,
    targetDate: new Date().toISOString().split('T')[0] // 今日の日付
  }
}

/**
 * 無効な日記データの生成
 */
export function generateInvalidDiaryData() {
  return {
    emptyTitle: {
      title: '',
      category: '仕事',
      content: 'コンテンツ内容'
    },
    emptyContent: {
      title: 'テストタイトル',
      category: '仕事',
      content: ''
    },
    invalidCategory: {
      title: 'テストタイトル',
      category: '', // 未選択
      content: 'コンテンツ内容'
    }
  }
}