<template>
  <v-container class="register-container">
    <v-text class="display-1 mb-4 text-center">アカウント新規登録</v-text>

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
        v-bind="usernameField"
        outlined
        full-width
        class="mb-3"
        required
      />
      <v-text-field
        label="Email"
        v-bind="emailField"
        outlined
        full-width
        class="mb-3"
        type="email"
        required
      />
      <v-text-field
        label="Password"
        type="password"
        v-bind="passwordField"
        outlined
        full-width
        class="mb-4"
        required
      />
      <v-text-field
        label="Confirm Password"
        type="password"
        v-bind="confirmPasswordField"
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
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { InputValidation, XSSProtection } from '@/utils/security'
import { logAuthAttempt } from '@/utils/auth'
import { useRegisterValidation } from '@/composables/useValidation'

const router = useRouter()
const authStore = useAuthStore()

// バリデーション機能を使用
const { 
  usernameField, 
  emailField, 
  passwordField, 
  confirmPasswordField, 
  onSubmit, 
  isSubmitting 
} = useRegisterValidation()

// エラーメッセージやローディング状態
const errorMessage = computed(() => authStore.error)
const isLoading = computed(() => authStore.loading || isSubmitting.value)

// すでにログイン済みの場合はダッシュボードにリダイレクト
onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }
})

// フォーム送信時の処理
const handleRegister = async () => {
  let sanitizedEmail = 'unknown'
  
  try {
    // バリデーションとサニタイゼーションを実行
    const sanitizedData = await onSubmit()
    if (!sanitizedData) return

    // 追加のセキュリティ検証（XSSフレームワークによる）
    const sanitizedUsername = XSSProtection.sanitizeText(sanitizedData.username)
    sanitizedEmail = XSSProtection.sanitizeText(sanitizedData.email)

    // SQLインジェクション対策
    const sqlSafeUsername = InputValidation.checkForSQLInjection(sanitizedUsername)
    const sqlSafeEmail = InputValidation.checkForSQLInjection(sanitizedEmail)

    if (!sqlSafeUsername || !sqlSafeEmail) {
      authStore.setError('入力値に不正な文字が含まれています')
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
              authStore.setError('User registration successful, but failed to save account data.')
              return
            }
          }

          // 確認メールが必要な場合
          if (result.needsConfirmation) {
            authStore.setError('確認メールを送信しました。メールを確認してアカウントをアクティブ化してください。')
            // エラーではないので、ログインページに移動
            setTimeout(() => {
              router.push('/login')
            }, 3000)
          } else {
            // すぐにログインできる場合はダッシュボードへ
            router.push('/dashboard')
          }
        } catch (err) {
          console.error('Account creation error:', err)
          authStore.setError('アカウント情報の保存に失敗しました')
          await logAuthAttempt(false, sanitizedEmail, 'account_save_failed')
        }
      } else {
        // ユーザー登録失敗をログに記録
        await logAuthAttempt(false, sanitizedEmail, result.error || 'registration_failed')
      }
    } catch {
      // 内部エラーをログに記録
      await logAuthAttempt(false, sanitizedEmail, 'inner_registration_error')
      authStore.setError('認証処理中にエラーが発生しました')
    }
    // エラーの場合は認証ストアが自動的にエラー状態を設定する
  } catch {
    // 予期しないエラーをログに記録
    await logAuthAttempt(false, sanitizedEmail, 'unexpected_registration_error')
    authStore.setError('アカウント登録処理中にエラーが発生しました')
  }
}

// エラーメッセージをクリア
const clearErrorMessage = () => {
  authStore.clearError()
}

// トップページへの遷移
const navigateToTopPage = () => {
  router.push('/')
}
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
