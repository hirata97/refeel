<template>
  <v-container class="register-container">
    <h1 class="display-1 mb-4 text-center">アカウント新規登録</h1>

    <v-form @submit.prevent="handleRegister" class="register-form">
      <v-alert
        v-if="errorMessage"
        type="error"
        dismissible
        class="mb-3"
        @click:close="clearErrorMessage"
      >
        {{ errorMessage }}
      </v-alert>

      <v-text-field
        label="Username"
        v-model="username"
        :error-messages="usernameError ? [usernameError] : []"
        @blur="validateField('username')"
        outlined
        full-width
        class="mb-3"
        required
      />
      <v-text-field
        label="Email"
        v-model="email"
        :error-messages="emailError ? [emailError] : []"
        @blur="validateField('email')"
        outlined
        full-width
        class="mb-3"
        type="email"
        required
      />
      <v-text-field
        label="Password"
        type="password"
        v-model="password"
        :error-messages="passwordError ? [passwordError] : []"
        @blur="validateField('password')"
        outlined
        full-width
        class="mb-4"
        required
      />
      <v-text-field
        label="Confirm Password"
        type="password"
        v-model="confirmPassword"
        :error-messages="confirmPasswordError ? [confirmPasswordError] : []"
        @blur="validateField('confirmPassword')"
        outlined
        full-width
        class="mb-4"
        required
      />
      <v-btn type="submit" color="primary" block class="mb-2" :loading="isLoading"
        >アカウントを登録する</v-btn
      >
      <v-btn color="secondary" block @click="navigateToTopPage">トップページに戻る</v-btn>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { useAppRouter } from '@/composables/useAppRouter'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { supabase } from '@/lib/supabase'
import { InputValidation, XSSProtection } from '@/utils/security'
import { logAuthAttempt } from '@/utils/auth'
import { useSimpleRegisterForm } from '@/composables/useSimpleForm'
import { createLogger } from '@/utils/logger'

const logger = createLogger('ACCOUNTREGISTERPAGE')

const { authStore } = useAuthGuard({ requireAuth: false })
const { navigateToDashboard, navigateToTop, navigateToLogin } = useAppRouter()
const { showError, clearError, error: displayError } = useErrorHandler()

// シンプルなフォーム管理を使用
const {
  username,
  email,
  password,
  confirmPassword,
  usernameError,
  emailError,
  passwordError,
  confirmPasswordError,
  isSubmitting,
  validateField,
  handleSubmit,
} = useSimpleRegisterForm()

// エラーメッセージやローディング状態
const errorMessage = computed(() => displayError.value || authStore.error)
const isLoading = computed(() => authStore.loading || isSubmitting.value)

// すでにログイン済みの場合はダッシュボードにリダイレクト
// 認証済みユーザーのリダイレクト処理は useAuthGuard で自動処理

// フォーム送信時の処理
const handleRegister = async () => {
  let sanitizedEmail = 'unknown'

  try {
    // バリデーションとサニタイゼーションを実行
    const sanitizedData = await handleSubmit()
    if (!sanitizedData) return

    // 追加のセキュリティ検証（XSSフレームワークによる）
    const sanitizedUsername = XSSProtection.sanitizeText(sanitizedData.username)
    sanitizedEmail = XSSProtection.sanitizeText(sanitizedData.email)

    // SQLインジェクション対策
    const sqlSafeUsername = InputValidation.checkForSQLInjection(sanitizedUsername)
    const sqlSafeEmail = InputValidation.checkForSQLInjection(sanitizedEmail)

    if (!sqlSafeUsername || !sqlSafeEmail) {
      showError('入力値に不正な文字が含まれています')
      await logAuthAttempt(false, sanitizedEmail, 'sql_injection_attempt')
      return
    }

    try {
      // ユーザー登録成功をログに記録
      await logAuthAttempt(true, sanitizedEmail)

      // 認証ストアを使用してユーザー登録
      const result = await authStore.signUp(sanitizedData.email, sanitizedData.password)

      if (result.success) {
        // ユーザー登録成功時、accounts テーブルに追加
        try {
          if (result.user) {
            const { error: accountError } = await supabase.from('accounts').insert([
              {
                id: result.user.id,
                username: sanitizedUsername,
                email: sanitizedEmail,
              },
            ])
            if (accountError) {
              showError('User registration successful, but failed to save account data.')
              return
            }
          }

          // 確認メールが必要な場合
          if (result.needsConfirmation) {
            authStore.setError(
              '確認メールを送信しました。メールを確認してアカウントをアクティブ化してください。',
            )
            // エラーではないので、ログインページに移動
            setTimeout(() => {
              navigateToLogin()
            }, 3000)
          } else {
            // すぐにログインできる場合はダッシュボードへ
            navigateToDashboard()
          }
        } catch (err) {
          logger.error('Account creation error:', err)
          showError('アカウント情報の保存に失敗しました')
          await logAuthAttempt(false, sanitizedEmail, 'account_save_failed')
        }
      } else {
        // ユーザー登録失敗をログに記録
        await logAuthAttempt(false, sanitizedEmail, result.error || 'registration_failed')
      }
    } catch {
      // 内部エラーをログに記録
      await logAuthAttempt(false, sanitizedEmail, 'inner_registration_error')
      showError('認証処理中にエラーが発生しました')
    }
    // エラーの場合は認証ストアが自動的にエラー状態を設定する
  } catch {
    // 予期しないエラーをログに記録
    await logAuthAttempt(false, sanitizedEmail, 'unexpected_registration_error')
    showError('アカウント登録処理中にエラーが発生しました')
  }
}

// エラーメッセージをクリア
const clearErrorMessage = () => {
  clearError()
  authStore.clearError()
}

// トップページへの遷移
const navigateToTopPage = navigateToTop
</script>

<style scoped>
.register-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.register-form {
  width: 100%;
  max-width: 400px;
}
</style>
