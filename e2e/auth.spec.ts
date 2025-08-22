import { test, expect } from '@playwright/test'
import { AuthTestHelper, generateTestUser, generateInvalidTestData } from './helpers/auth'

/**
 * 認証フローのE2Eテスト
 * 
 * テスト対象:
 * - ログインフロー（正常系・異常系）
 * - アカウント登録フロー（正常系・異常系）
 * - ログアウトフロー
 * - セッション管理
 * - バリデーションエラー
 */

test.describe('認証システム', () => {
  let authHelper: AuthTestHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthTestHelper(page)
    
    // テストの前にクリーンアップ
    await authHelper.cleanup()
  })

  test.afterEach(async () => {
    // テスト後のクリーンアップ
    await authHelper.cleanup()
  })

  test.describe('ログインフロー', () => {
    
    test('正常系: 正しい認証情報でログイン成功', async () => {
      // テスト用ユーザーデータ
      const testUser = generateTestUser('login_success')
      
      // まず、テスト用ユーザーを登録（前提条件）
      await authHelper.navigateToRegister()
      await expect(authHelper.page).toHaveURL(/\/register/)
      
      await authHelper.performRegister(testUser)
      
      // ログアウトしてからログインテストを実行
      await authHelper.performLogout()
      
      // ログインテスト実行
      await authHelper.navigateToLogin()
      await expect(authHelper.page).toHaveURL(/\/login/)
      
      await authHelper.performLogin(testUser)
      
      // ログイン成功を確認
      await authHelper.expectLoginSuccess()
    })

    test('異常系: 間違ったメールアドレスでログイン失敗', async () => {
      const invalidUser = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!'
      }
      
      await authHelper.navigateToLogin()
      await expect(authHelper.page).toHaveURL(/\/login/)
      
      await authHelper.performLogin(invalidUser)
      
      // ログイン失敗を確認
      await authHelper.expectLoginFailure()
      // 追加検証: ログインページにとどまることを確認
      await expect(authHelper.page).toHaveURL(/\/login/)
    })

    test('異常系: 間違ったパスワードでログイン失敗', async () => {
      // まず正しいユーザーを登録
      const testUser = generateTestUser('wrong_password')
      await authHelper.navigateToRegister()
      await expect(authHelper.page).toHaveURL(/\/register/)
      
      await authHelper.performRegister(testUser)
      await authHelper.performLogout()
      
      // 間違ったパスワードでログイン
      const wrongPasswordUser = {
        email: testUser.email,
        password: 'WrongPassword123!'
      }
      
      await authHelper.navigateToLogin()
      await expect(authHelper.page).toHaveURL(/\/login/)
      
      await authHelper.performLogin(wrongPasswordUser)
      
      // ログイン失敗を確認
      await authHelper.expectLoginFailure()
    })

    test('異常系: 空のフィールドでバリデーションエラー', async () => {
      await authHelper.navigateToLogin()
      await expect(authHelper.page).toHaveURL(/\/login/)
      
      const elements = authHelper.getLoginFormElements()
      
      // 空のメールアドレスでフォーカスを移動してバリデーション発生
      await elements.emailField.fill('')
      await elements.emailField.blur()
      
      // バリデーションエラーを確認
      await authHelper.expectValidationError('email')
      
      // 空のパスワードでフォーカスを移動してバリデーション発生
      await elements.passwordField.fill('')
      await elements.passwordField.blur()
      
      // バリデーションエラーを確認
      await authHelper.expectValidationError('password')
      
      // フォーム要素が存在することを確認
      await expect(elements.submitButton).toBeVisible()
    })

    test('異常系: 不正な形式のメールアドレスでバリデーションエラー', async () => {
      const invalidData = generateInvalidTestData()
      
      await authHelper.navigateToLogin()
      await expect(authHelper.page).toHaveURL(/\/login/)
      
      const elements = authHelper.getLoginFormElements()
      
      // 不正な形式のメールアドレスを入力
      await elements.emailField.fill(invalidData.invalidEmail.email)
      await elements.emailField.blur()
      
      // バリデーションエラーを確認
      await authHelper.expectValidationError('email')
      
      // フォームが表示されていることを確認
      await expect(elements.passwordField).toBeVisible()
    })

    test('セキュリティ: 連続ログイン失敗シミュレーション', async () => {
      // Note: 実際のロックアウト機能をテストするプレースホルダー
      // 開発環境では時間がかかるため、基本的な流れのみテスト
      
      const testUser = generateTestUser('lockout_test')
      const wrongPasswordUser = {
        email: testUser.email,
        password: 'WrongPassword123!'
      }
      
      await authHelper.navigateToLogin()
      await expect(authHelper.page).toHaveURL(/\/login/)
      
      // ログイン失敗を1回試行（実際のテストでは複数回実行）
      await authHelper.performLogin(wrongPasswordUser)
      await authHelper.expectLoginFailure()
      
      // フォームが引き続き利用可能であることを確認
      const elements = authHelper.getLoginFormElements()
      await expect(elements.emailField).toBeVisible()
      await expect(elements.passwordField).toBeVisible()
    })
  })

  test.describe('アカウント登録フロー', () => {
    
    test('正常系: 新規ユーザー登録成功', async () => {
      const testUser = generateTestUser('register_success')
      
      await authHelper.navigateToRegister()
      await expect(authHelper.page).toHaveURL(/\/register/)
      
      // フォーム要素が表示されていることを確認
      const elements = authHelper.getRegisterFormElements()
      await expect(elements.emailField).toBeVisible()
      await expect(elements.passwordField).toBeVisible()
      await expect(elements.submitButton).toBeVisible()
      
      await authHelper.performRegister(testUser)
      
      // 登録成功を確認
      await authHelper.expectRegisterSuccess()
    })

    test('異常系: 既存メールアドレスでの重複登録', async () => {
      const testUser = generateTestUser('duplicate_email')
      
      // 最初のユーザー登録
      await authHelper.navigateToRegister()
      await expect(authHelper.page).toHaveURL(/\/register/)
      
      await authHelper.performRegister(testUser)
      await authHelper.expectRegisterSuccess()
      
      // ログアウト
      await authHelper.performLogout()
      
      // 同じメールアドレスで再度登録を試行
      await authHelper.navigateToRegister()
      await expect(authHelper.page).toHaveURL(/\/register/)
      
      await authHelper.performRegister(testUser)
      
      // 重複エラーを確認
      await authHelper.expectRegisterFailure()
      await expect(authHelper.page).toHaveURL(/\/register/)
    })

    test('異常系: 必須項目未入力でバリデーションエラー', async () => {
      await authHelper.navigateToRegister()
      await expect(authHelper.page).toHaveURL(/\/register/)
      
      const elements = authHelper.getRegisterFormElements()
      
      // フォーム要素の可視性を確認
      await expect(elements.usernameField).toBeVisible()
      await expect(elements.emailField).toBeVisible()
      await expect(elements.passwordField).toBeVisible()
      
      // 空のユーザー名でバリデーション発生
      await elements.usernameField.fill('')
      await elements.usernameField.blur()
      await authHelper.expectValidationError('username')
      
      // 空のメールアドレスでバリデーション発生
      await elements.emailField.fill('')
      await elements.emailField.blur()
      await authHelper.expectValidationError('email')
      
      // 空のパスワードでバリデーション発生
      await elements.passwordField.fill('')
      await elements.passwordField.blur()
      await authHelper.expectValidationError('password')
    })

    test('異常系: パスワード確認不一致', async () => {
      const invalidData = generateInvalidTestData()
      
      await authHelper.navigateToRegister()
      await expect(authHelper.page).toHaveURL(/\/register/)
      
      const elements = authHelper.getRegisterFormElements()
      
      // フォーム要素の可視性を確認
      await expect(elements.usernameField).toBeVisible()
      await expect(elements.confirmPasswordField).toBeVisible()
      
      // 異なるパスワードを入力
      await elements.usernameField.fill(invalidData.passwordMismatch.username!)
      await elements.emailField.fill(invalidData.passwordMismatch.email)
      await elements.passwordField.fill(invalidData.passwordMismatch.password)
      await elements.confirmPasswordField.fill(invalidData.passwordMismatch.confirmPassword!)
      await elements.confirmPasswordField.blur()
      
      // パスワード不一致エラーを確認
      await authHelper.expectValidationError('confirmPassword')
    })

    test('異常系: 弱いパスワードでバリデーションエラー', async () => {
      const invalidData = generateInvalidTestData()
      
      await authHelper.navigateToRegister()
      await expect(authHelper.page).toHaveURL(/\/register/)
      
      const elements = authHelper.getRegisterFormElements()
      
      // パスワードフィールドの可視性を確認
      await expect(elements.passwordField).toBeVisible()
      
      // 弱いパスワードを入力
      await elements.passwordField.fill(invalidData.weakPassword.password)
      await elements.passwordField.blur()
      
      // パスワード強度エラーを確認
      await authHelper.expectValidationError('password')
    })

    test('UI: トップページへの戻るボタン', async () => {
      await authHelper.navigateToRegister()
      await expect(authHelper.page).toHaveURL(/\/register/)
      
      const elements = authHelper.getRegisterFormElements()
      
      // 戻るボタンの可視性を確認
      await expect(elements.backButton).toBeVisible()
      
      await elements.backButton.click()
      
      // トップページにリダイレクトされることを確認
      await expect(authHelper.page).toHaveURL('/')
    })
  })

  test.describe('ログアウトフロー', () => {
    
    test('正常系: ログアウト処理とリダイレクト確認', async () => {
      // まずログイン
      const testUser = generateTestUser('logout_test')
      await authHelper.navigateToRegister()
      await expect(authHelper.page).toHaveURL(/\/register/)
      
      await authHelper.performRegister(testUser)
      await authHelper.expectRegisterSuccess()
      
      // ログアウトボタンの存在を確認
      await expect(authHelper.page.locator('text=ログアウト')).toBeVisible()
      
      // ログアウト実行
      await authHelper.performLogout()
      
      // ログアウト成功を確認
      await authHelper.expectLogoutSuccess()
    })
  })

  test.describe('セッション管理', () => {
    
    test('セッション期限切れ処理', async () => {
      // ログイン
      const testUser = generateTestUser('session_test')
      await authHelper.navigateToRegister()
      await expect(authHelper.page).toHaveURL(/\/register/)
      
      await authHelper.performRegister(testUser)
      await authHelper.expectRegisterSuccess()
      
      // セッション期限切れをシミュレート
      await authHelper.simulateSessionTimeout()
      
      // 認証が必要なページにアクセスしようとする
      await authHelper.page.goto('/dashboard')
      await authHelper.page.waitForLoadState('domcontentloaded')
      
      // ログインページにリダイレクトされることを確認
      await expect(authHelper.page).toHaveURL(/\/login/)
    })
  })

  test.describe('レスポンシブ対応', () => {
    
    test('モバイル画面でのログインフォーム表示', async () => {
      // モバイル画面サイズに設定
      await authHelper.page.setViewportSize({ width: 375, height: 667 })
      
      await authHelper.navigateToLogin()
      await expect(authHelper.page).toHaveURL(/\/login/)
      
      const elements = authHelper.getLoginFormElements()
      
      // フォーム要素が表示されることを確認
      await expect(elements.emailField).toBeVisible()
      await expect(elements.passwordField).toBeVisible()
      await expect(elements.submitButton).toBeVisible()
      
      // フォームが機能することを確認
      await elements.emailField.fill('test@example.com')
      await expect(elements.emailField).toHaveValue('test@example.com')
    })

    test('タブレット画面でのアカウント登録フォーム表示', async () => {
      // タブレット画面サイズに設定
      await authHelper.page.setViewportSize({ width: 768, height: 1024 })
      
      await authHelper.navigateToRegister()
      await expect(authHelper.page).toHaveURL(/\/register/)
      
      const elements = authHelper.getRegisterFormElements()
      
      // フォーム要素が表示されることを確認
      await expect(elements.usernameField).toBeVisible()
      await expect(elements.emailField).toBeVisible()
      await expect(elements.passwordField).toBeVisible()
      await expect(elements.confirmPasswordField).toBeVisible()
      await expect(elements.submitButton).toBeVisible()
      
      // フォームが機能することを確認
      await elements.emailField.fill('test@example.com')
      await expect(elements.emailField).toHaveValue('test@example.com')
    })
  })

  test.describe('アクセシビリティ', () => {
    
    test('キーボードナビゲーション: ログインフォーム', async () => {
      await authHelper.navigateToLogin()
      await expect(authHelper.page).toHaveURL(/\/login/)
      
      const elements = authHelper.getLoginFormElements()
      
      // フォーム要素の可視性を確認
      await expect(elements.emailField).toBeVisible()
      await expect(elements.passwordField).toBeVisible()
      await expect(elements.submitButton).toBeVisible()
      
      // タブキーでフォーム間を移動できることを確認
      await authHelper.page.keyboard.press('Tab')
      await expect(elements.emailField).toBeFocused()
      
      await authHelper.page.keyboard.press('Tab')
      await expect(elements.passwordField).toBeFocused()
      
      await authHelper.page.keyboard.press('Tab')
      await expect(elements.submitButton).toBeFocused()
    })

    test('ARIA属性の確認', async () => {
      await authHelper.navigateToLogin()
      await expect(authHelper.page).toHaveURL(/\/login/)
      
      const elements = authHelper.getLoginFormElements()
      
      // フィールドの可視性を確認
      await expect(elements.emailField).toBeVisible()
      await expect(elements.passwordField).toBeVisible()
      
      // aria-label属性が設定されていることを確認
      await expect(elements.emailField).toHaveAttribute('aria-label', 'Enter your email')
      await expect(elements.passwordField).toHaveAttribute('aria-label', 'Enter your password')
      
      // ボタンのアクセシビリティを確認
      await expect(elements.submitButton).toBeEnabled()
    })
  })
})

// TODO: 2要素認証フロー実装時に有効化
// test.describe('2要素認証フロー (未実装)', () => {
//   test('2FA有効時のログインフロー', async ({ page }) => {
//     // 2要素認証が有効な場合のログインフローをテスト
//   })
//
//   test('2FAコード入力とタイムアウト', async ({ page }) => {
//     // 2FAコードの入力とタイムアウト処理をテスト
//   })
// })