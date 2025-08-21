import { Page, Locator, expect } from '@playwright/test'

/**
 * 認証関連のE2Eテストヘルパー関数
 */

export interface TestUser {
  email: string
  password: string
  username?: string
}

export interface LoginOptions {
  expectSuccess?: boolean
  expectTwoFactorRequired?: boolean
  expect2FAVerification?: boolean
  expectLockout?: boolean
}

export interface RegisterOptions {
  expectSuccess?: boolean
  expectValidationError?: boolean
  expectExistingUser?: boolean
}

/**
 * 認証テスト用のヘルパークラス
 */
export class AuthTestHelper {
  constructor(private page: Page) {}

  /**
   * ログインページに移動
   */
  async navigateToLogin(): Promise<void> {
    await this.page.goto('/login')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * アカウント登録ページに移動
   */
  async navigateToRegister(): Promise<void> {
    await this.page.goto('/register')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * ログインフォームの入力要素を取得
   */
  getLoginFormElements() {
    return {
      emailField: this.page.locator('input[aria-label="Enter your email"]'),
      passwordField: this.page.locator('input[aria-label="Enter your password"]'),
      submitButton: this.page.locator('button[type="submit"]'),
      errorAlert: this.page.locator('[role="alert"]'),
      lockoutAlert: this.page.locator('.v-alert--type-error'),
      twoFactorAlert: this.page.locator('.v-alert--type-info')
    }
  }

  /**
   * アカウント登録フォームの入力要素を取得
   */
  getRegisterFormElements() {
    return {
      usernameField: this.page.locator('input[label="Username"]'),
      emailField: this.page.locator('input[type="email"]'),
      passwordField: this.page.locator('input[type="password"]').first(),
      confirmPasswordField: this.page.locator('input[type="password"]').nth(1),
      submitButton: this.page.locator('button[type="submit"]'),
      errorAlert: this.page.locator('.v-alert--type-error'),
      backButton: this.page.locator('text=トップページに戻る')
    }
  }

  /**
   * ログイン操作を実行
   */
  async performLogin(user: TestUser): Promise<void> {
    const elements = this.getLoginFormElements()

    // フォーム入力
    await elements.emailField.fill(user.email)
    await elements.passwordField.fill(user.password)
    
    // Submit button click
    await elements.submitButton.click()

    // Wait for response
    await this.page.waitForTimeout(1000)
  }

  /**
   * アカウント登録操作を実行
   */
  async performRegister(user: TestUser): Promise<void> {
    const elements = this.getRegisterFormElements()

    // フォーム入力
    if (user.username) {
      await elements.usernameField.fill(user.username)
    }
    await elements.emailField.fill(user.email)
    await elements.passwordField.fill(user.password)
    await elements.confirmPasswordField.fill(user.password)
    
    // Submit button click
    await elements.submitButton.click()

    // Wait for response
    await this.page.waitForTimeout(1000)
  }

  /**
   * ログイン成功を確認
   */
  async expectLoginSuccess(): Promise<void> {
    // ダッシュボードまたはトップページにリダイレクトされることを確認
    await expect(this.page).toHaveURL(/\/(dashboard|top)/)
    
    // ログイン状態を示すUI要素の存在を確認
    await expect(this.page.locator('text=ログアウト')).toBeVisible({ timeout: 5000 })
  }

  /**
   * ログイン失敗を確認
   */
  async expectLoginFailure(expectedErrorMessage?: string): Promise<void> {
    const elements = this.getLoginFormElements()
    
    // エラーメッセージの表示を確認
    await expect(elements.errorAlert).toBeVisible({ timeout: 5000 })
    
    if (expectedErrorMessage) {
      await expect(elements.errorAlert).toContainText(expectedErrorMessage)
    }
    
    // ログインページにとどまることを確認
    await expect(this.page).toHaveURL(/\/login/)
  }

  /**
   * アカウントロックアウトを確認
   */
  async expectAccountLockout(): Promise<void> {
    const elements = this.getLoginFormElements()
    
    // ロックアウト警告の表示を確認
    await expect(elements.lockoutAlert).toBeVisible()
    await expect(elements.lockoutAlert).toContainText('アカウントがロックされています')
    
    // フォーム要素が無効化されていることを確認
    await expect(elements.emailField).toBeDisabled()
    await expect(elements.passwordField).toBeDisabled()
  }

  /**
   * 2要素認証要求を確認
   */
  async expect2FARequired(): Promise<void> {
    const elements = this.getLoginFormElements()
    
    // 2FA要求メッセージの表示を確認
    await expect(elements.twoFactorAlert).toBeVisible()
    await expect(elements.twoFactorAlert).toContainText('2要素認証が必要です')
  }

  /**
   * アカウント登録成功を確認
   */
  async expectRegisterSuccess(): Promise<void> {
    // 確認メールが送信された旨のメッセージ、またはダッシュボードへのリダイレクトを確認
    const isOnConfirmation = await this.page.locator('text=確認メール').isVisible()
    const isOnDashboard = this.page.url().includes('/dashboard') || this.page.url().includes('/top')
    
    expect(isOnConfirmation || isOnDashboard).toBeTruthy()
  }

  /**
   * アカウント登録失敗を確認
   */
  async expectRegisterFailure(expectedErrorMessage?: string): Promise<void> {
    const elements = this.getRegisterFormElements()
    
    // エラーメッセージの表示を確認
    await expect(elements.errorAlert).toBeVisible({ timeout: 5000 })
    
    if (expectedErrorMessage) {
      await expect(elements.errorAlert).toContainText(expectedErrorMessage)
    }
    
    // 登録ページにとどまることを確認
    await expect(this.page).toHaveURL(/\/register/)
  }

  /**
   * バリデーションエラーを確認
   */
  async expectValidationError(fieldType: 'email' | 'password' | 'username' | 'confirmPassword'): Promise<void> {
    let errorLocator: Locator

    switch (fieldType) {
      case 'email':
        errorLocator = this.page.locator('.v-text-field__error-messages').first()
        break
      case 'password':
        errorLocator = this.page.locator('.v-text-field__error-messages').nth(1)
        break
      case 'username':
        errorLocator = this.page.locator('.v-text-field__error-messages').first()
        break
      case 'confirmPassword':
        errorLocator = this.page.locator('.v-text-field__error-messages').last()
        break
    }

    await expect(errorLocator).toBeVisible({ timeout: 3000 })
  }

  /**
   * ログアウト操作を実行
   */
  async performLogout(): Promise<void> {
    // ログアウトボタンやメニューを探してクリック
    const logoutButton = this.page.locator('text=ログアウト')
    await logoutButton.click()
    
    // ログアウト後のリダイレクトを待つ
    await this.page.waitForURL('/')
  }

  /**
   * ログアウト成功を確認
   */
  async expectLogoutSuccess(): Promise<void> {
    // トップページにリダイレクトされることを確認
    await expect(this.page).toHaveURL('/')
    
    // ログイン状態を示すUI要素が表示されないことを確認
    await expect(this.page.locator('text=ログアウト')).not.toBeVisible()
    
    // ログインリンクが表示されることを確認
    await expect(this.page.locator('text=ログイン')).toBeVisible()
  }

  /**
   * セッション期限切れのシミュレーション
   */
  async simulateSessionTimeout(): Promise<void> {
    // ローカルストレージからセッション情報を削除
    await this.page.evaluate(() => {
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('lastActivity')
      sessionStorage.clear()
    })
    
    // ページを再読み込みしてセッション期限切れを発生させる
    await this.page.reload()
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
 * テスト用のユーザーデータ生成
 */
export function generateTestUser(prefix = 'test'): TestUser {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(7)
  
  return {
    email: `${prefix}_${timestamp}_${randomId}@example.com`,
    password: 'TestPassword123!',
    username: `${prefix}_user_${timestamp}`
  }
}

/**
 * 無効なユーザーデータの生成
 */
export function generateInvalidTestData() {
  return {
    invalidEmail: {
      email: 'invalid-email',
      password: 'TestPassword123!',
      username: 'testuser'
    },
    weakPassword: {
      email: 'test@example.com',
      password: '123',
      username: 'testuser'
    },
    emptyFields: {
      email: '',
      password: '',
      username: ''
    },
    passwordMismatch: {
      email: 'test@example.com',
      password: 'TestPassword123!',
      confirmPassword: 'DifferentPassword456!',
      username: 'testuser'
    }
  }
}