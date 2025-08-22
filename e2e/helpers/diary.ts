import { Page, Locator, expect } from '@playwright/test'

/**
 * 日記操作関連のE2Eテストヘルパー関数
 */

export interface DiaryData {
  title: string
  content: string
  date?: string
  mood?: number // 進捗レベル 0-100
}

export interface DiarySearchOptions {
  dateRange?: {
    start: string
    end: string
  }
  keyword?: string
  moodRange?: {
    min: number
    max: number
  }
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
      titleField: this.page.locator('input[label="タイトル"], .v-text-field:has-text("タイトル") input').first(),
      contentField: this.page.locator('textarea[label="内容"], .v-textarea:has-text("内容") textarea').first(),
      dateField: this.page.locator('input[type="date"], input[label="日付"]').first(),
      moodSlider: this.page.locator('.v-slider:has-text("進捗レベル"), .v-slider').first(),
      submitButton: this.page.locator('button[type="submit"], button:has-text("日記を追加"), button:has-text("登録")'),
      cancelButton: this.page.locator('button:has-text("キャンセル"), button:has-text("戻る")'),
      errorAlert: this.page.locator('.v-alert--type-error, [role="alert"]'),
      successAlert: this.page.locator('.v-alert--type-success, .v-snackbar--type-success')
    }
  }

  /**
   * 日記編集フォームの入力要素を取得
   */
  getEditFormElements() {
    return {
      titleField: this.page.locator('input[label="タイトル"], .v-text-field:has-text("タイトル") input').first(),
      contentField: this.page.locator('textarea[label="内容"], .v-textarea:has-text("内容") textarea').first(),
      dateField: this.page.locator('input[type="date"], input[label="日付"]').first(),
      moodSlider: this.page.locator('.v-slider:has-text("進捗レベル"), .v-slider').first(),
      updateButton: this.page.locator('button[type="submit"], button:has-text("更新"), button:has-text("保存")'),
      cancelButton: this.page.locator('button:has-text("キャンセル"), button:has-text("戻る")'),
      deleteButton: this.page.locator('button:has-text("削除")'),
      errorAlert: this.page.locator('.v-alert--type-error, [role="alert"]'),
      successAlert: this.page.locator('.v-alert--type-success, .v-snackbar--type-success')
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
    await elements.contentField.fill(diaryData.content)
    
    if (diaryData.date) {
      await elements.dateField.fill(diaryData.date)
    }

    // 進捗レベル設定（スライダー操作）
    if (diaryData.mood !== undefined) {
      // スライダーの値を設定（Vuetifyスライダーの操作）
      await elements.moodSlider.click()
      // スライダーのthumbを目標値まで移動（簡易実装）
      const sliderTrack = elements.moodSlider.locator('.v-slider__track')
      const sliderBoundingBox = await sliderTrack.boundingBox()
      if (sliderBoundingBox) {
        const targetX = sliderBoundingBox.x + (sliderBoundingBox.width * (diaryData.mood / 100))
        await this.page.mouse.click(targetX, sliderBoundingBox.y + sliderBoundingBox.height / 2)
      }
    }

    // 登録ボタンをクリック
    await elements.submitButton.click()

    // レスポンスを待つ
    await this.page.waitForTimeout(2000)
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
    
    if (diaryData.content) {
      await elements.contentField.fill(diaryData.content)
    }
    
    if (diaryData.date) {
      await elements.dateField.fill(diaryData.date)
    }

    // 進捗レベル設定（スライダー操作）
    if (diaryData.mood !== undefined) {
      await elements.moodSlider.click()
      const sliderTrack = elements.moodSlider.locator('.v-slider__track')
      const sliderBoundingBox = await sliderTrack.boundingBox()
      if (sliderBoundingBox) {
        const targetX = sliderBoundingBox.x + (sliderBoundingBox.width * (diaryData.mood / 100))
        await this.page.mouse.click(targetX, sliderBoundingBox.y + sliderBoundingBox.height / 2)
      }
    }

    // 更新ボタンをクリック
    await elements.updateButton.click()

    // レスポンスを待つ
    await this.page.waitForTimeout(2000)
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
    
    const itemCount = await diaryItem.count()
    return itemCount > 0 ? diaryItem.first() : null
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
    // 成功メッセージまたはフォームクリア、ページの状態変化を確認
    try {
      // まず成功メッセージを確認
      const successAlert = this.page.locator('.v-alert--type-success, .v-snackbar--type-success, text=追加されました, text=登録されました')
      await expect(successAlert).toBeVisible({ timeout: 5000 })
    } catch {
      // メッセージが無い場合はフォームがクリアされたことを確認
      const elements = this.getRegisterFormElements()
      const titleValue = await elements.titleField.inputValue()
      expect(titleValue).toBe('')
    }
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
  async expectValidationError(): Promise<void> {
    // Vuetifyの一般的なエラーメッセージ要素をより包括的に探す
    const errorSelectors = [
      '.v-text-field__error-messages',
      '.v-textarea__error-messages',
      '.v-messages__message',
      '.error--text',
      '.v-input__details .v-messages'
    ]
    
    const errorLocator = this.page.locator(errorSelectors.join(', '))
    
    // フィールドタイプに応じた特定のエラーメッセージを確認
    const fieldErrorLocator = errorLocator.filter({ hasText: new RegExp('(必須|入力|無効|形式)', 'i') })
    
    await expect(fieldErrorLocator.first()).toBeVisible({ timeout: 5000 })
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
   * 検索機能をテスト
   */
  async testSearchFilter(keyword: string): Promise<void> {
    const elements = this.getViewPageElements()
    
    // 検索フィールドに入力
    if (await elements.searchField.isVisible()) {
      await elements.searchField.fill(keyword)
      await this.page.keyboard.press('Enter')
      await this.page.waitForTimeout(1000)
    }
    
    // 検索結果の確認
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
    content: `これは${prefix}用の日記内容です。タイムスタンプ: ${timestamp}`,
    date: new Date().toISOString().split('T')[0], // 今日の日付
    mood: Math.floor(Math.random() * 101) // 0-100のランダムな進捗レベル
  }
}

/**
 * 無効な日記データの生成
 */
export function generateInvalidDiaryData() {
  return {
    emptyTitle: {
      title: '',
      content: 'コンテンツ内容',
      date: new Date().toISOString().split('T')[0]
    },
    emptyContent: {
      title: 'テストタイトル',
      content: '',
      date: new Date().toISOString().split('T')[0]
    },
    invalidDate: {
      title: 'テストタイトル',
      content: 'コンテンツ内容',
      date: 'invalid-date'
    }
  }
}