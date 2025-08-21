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
      await authHelper.performRegister(testUser)
      
      // ログアウトしてからログインテストを実行
      await authHelper.performLogout()
      
      // ログインテスト実行
      await authHelper.navigateToLogin()
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
      await authHelper.performLogin(invalidUser)
      
      // ログイン失敗を確認
      await authHelper.expectLoginFailure()
    })

    test('異常系: 間違ったパスワードでログイン失敗', async () => {
      // まず正しいユーザーを登録
      const testUser = generateTestUser('wrong_password')
      await authHelper.navigateToRegister()
      await authHelper.performRegister(testUser)
      await authHelper.performLogout()
      
      // 間違ったパスワードでログイン
      const wrongPasswordUser = {
        email: testUser.email,
        password: 'WrongPassword123!'
      }
      
      await authHelper.navigateToLogin()
      await authHelper.performLogin(wrongPasswordUser)
      
      // ログイン失敗を確認
      await authHelper.expectLoginFailure()
    })

    test('異常系: 空のフィールドでバリデーションエラー', async () => {
      await authHelper.navigateToLogin()
      
      // 空のメールアドレスでフォーカスを移動してバリデーション発生
      await authHelper.getLoginFormElements().emailField.fill('')
      await authHelper.getLoginFormElements().emailField.blur()
      
      // バリデーションエラーを確認
      await authHelper.expectValidationError('email')
      
      // 空のパスワードでフォーカスを移動してバリデーション発生
      await authHelper.getLoginFormElements().passwordField.fill('')
      await authHelper.getLoginFormElements().passwordField.blur()
      
      // バリデーションエラーを確認
      await authHelper.expectValidationError('password')
    })

    test('異常系: 不正な形式のメールアドレスでバリデーションエラー', async () => {
      const invalidData = generateInvalidTestData()
      
      await authHelper.navigateToLogin()
      
      // 不正な形式のメールアドレスを入力
      await authHelper.getLoginFormElements().emailField.fill(invalidData.invalidEmail.email)
      await authHelper.getLoginFormElements().emailField.blur()
      
      // バリデーションエラーを確認
      await authHelper.expectValidationError('email')
    })

    test.skip('セキュリティ: 連続ログイン失敗によるアカウントロック', async () => {
      // Note: 実際のロックアウト機能をテストする場合
      // 開発環境では時間がかかるため、skipして実際のCI/CDでのみ実行することを推奨
      
      const testUser = generateTestUser('lockout_test')
      const wrongPasswordUser = {
        email: testUser.email,
        password: 'WrongPassword123!'
      }
      
      await authHelper.navigateToLogin()
      
      // 複数回ログイン失敗を試行（実装に応じて回数を調整）
      for (let i = 0; i < 5; i++) {
        await authHelper.performLogin(wrongPasswordUser)
        await authHelper.expectLoginFailure()
      }
      
      // アカウントロックを確認
      await authHelper.expectAccountLockout()
    })
  })

  test.describe('アカウント登録フロー', () => {
    
    test('正常系: 新規ユーザー登録成功', async () => {
      const testUser = generateTestUser('register_success')
      
      await authHelper.navigateToRegister()
      await authHelper.performRegister(testUser)
      
      // 登録成功を確認
      await authHelper.expectRegisterSuccess()
    })

    test('異常系: 既存メールアドレスでの重複登録', async () => {
      const testUser = generateTestUser('duplicate_email')
      
      // 最初のユーザー登録
      await authHelper.navigateToRegister()
      await authHelper.performRegister(testUser)
      await authHelper.expectRegisterSuccess()
      
      // ログアウト
      await authHelper.performLogout()
      
      // 同じメールアドレスで再度登録を試行
      await authHelper.navigateToRegister()
      await authHelper.performRegister(testUser)
      
      // 重複エラーを確認
      await authHelper.expectRegisterFailure()
    })

    test('異常系: 必須項目未入力でバリデーションエラー', async () => {
      await authHelper.navigateToRegister()
      
      const elements = authHelper.getRegisterFormElements()
      
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
      
      const elements = authHelper.getRegisterFormElements()
      
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
      
      const elements = authHelper.getRegisterFormElements()
      
      // 弱いパスワードを入力
      await elements.passwordField.fill(invalidData.weakPassword.password)
      await elements.passwordField.blur()
      
      // パスワード強度エラーを確認
      await authHelper.expectValidationError('password')
    })

    test('UI: トップページへの戻るボタン', async () => {
      await authHelper.navigateToRegister()
      
      const elements = authHelper.getRegisterFormElements()
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
      await authHelper.performRegister(testUser)
      await authHelper.expectRegisterSuccess()
      
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
      await authHelper.performRegister(testUser)
      await authHelper.expectRegisterSuccess()
      
      // セッション期限切れをシミュレート
      await authHelper.simulateSessionTimeout()
      
      // 認証が必要なページにアクセスしようとする
      await authHelper.page.goto('/dashboard')
      
      // ログインページにリダイレクトされることを確認
      await expect(authHelper.page).toHaveURL(/\/login/)
    })
  })

  test.describe('レスポンシブ対応', () => {
    
    test('モバイル画面でのログインフォーム表示', async () => {
      // モバイル画面サイズに設定
      await authHelper.page.setViewportSize({ width: 375, height: 667 })
      
      await authHelper.navigateToLogin()
      
      const elements = authHelper.getLoginFormElements()
      
      // フォーム要素が表示されることを確認
      await expect(elements.emailField).toBeVisible()
      await expect(elements.passwordField).toBeVisible()
      await expect(elements.submitButton).toBeVisible()
    })

    test('タブレット画面でのアカウント登録フォーム表示', async () => {
      // タブレット画面サイズに設定
      await authHelper.page.setViewportSize({ width: 768, height: 1024 })
      
      await authHelper.navigateToRegister()
      
      const elements = authHelper.getRegisterFormElements()
      
      // フォーム要素が表示されることを確認
      await expect(elements.usernameField).toBeVisible()
      await expect(elements.emailField).toBeVisible()
      await expect(elements.passwordField).toBeVisible()
      await expect(elements.confirmPasswordField).toBeVisible()
      await expect(elements.submitButton).toBeVisible()
    })
  })

  test.describe('アクセシビリティ', () => {
    
    test('キーボードナビゲーション: ログインフォーム', async () => {
      await authHelper.navigateToLogin()
      
      // タブキーでフォーム間を移動できることを確認
      await authHelper.page.keyboard.press('Tab')
      await expect(authHelper.getLoginFormElements().emailField).toBeFocused()
      
      await authHelper.page.keyboard.press('Tab')
      await expect(authHelper.getLoginFormElements().passwordField).toBeFocused()
      
      await authHelper.page.keyboard.press('Tab')
      await expect(authHelper.getLoginFormElements().submitButton).toBeFocused()
    })

    test('ARIA属性の確認', async () => {
      await authHelper.navigateToLogin()
      
      const elements = authHelper.getLoginFormElements()
      
      // aria-label属性が設定されていることを確認
      await expect(elements.emailField).toHaveAttribute('aria-label', 'Enter your email')
      await expect(elements.passwordField).toHaveAttribute('aria-label', 'Enter your password')
    })
  })
})

test.describe.skip('2要素認証フロー', () => {
  // 2要素認証のテストは実装状況に応じてskipまたは有効化
  
  test('2FA有効時のログインフロー', async () => {
    // 2要素認証が有効な場合のログインフローをテスト
    // 実装完了後に有効化
  })

  test('2FAコード入力とタイムアウト', async () => {
    // 2FAコードの入力とタイムアウト処理をテスト
    // 実装完了後に有効化
  })
})