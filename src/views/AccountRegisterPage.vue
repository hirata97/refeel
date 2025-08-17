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
        v-model="username"
        outlined
        full-width
        class="mb-3"
        :error="usernameError"
        required
      />
      <v-text-field
        label="Email"
        v-model="email"
        outlined
        full-width
        class="mb-3"
        type="email"
        :error="emailError"
        required
      />
      <v-text-field
        label="Password"
        type="password"
        v-model="password"
        outlined
        full-width
        class="mb-4"
        :error="passwordError"
        required
      />
      <v-text-field
        label="Confirm Password"
        type="password"
        v-model="confirmPassword"
        outlined
        full-width
        class="mb-4"
        :error="confirmPasswordError"
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const authStore = useAuthStore()

const username = ref<string>('')
const email = ref<string>('')
const password = ref<string>('')

// 追加: Confirm Password用の変数
const confirmPassword = ref<string>('')

// エラーメッセージやバリデーションフラグ
const errorMessage = computed(() => authStore.error)
const usernameError = ref<boolean>(false)
const emailError = ref<boolean>(false)
const passwordError = ref<boolean>(false)
// 追加: Confirm Passwordのエラーフラグ
const confirmPasswordError = ref<boolean>(false)

// 追加: ローディング状態用の変数
const isLoading = computed(() => authStore.loading)

// すでにログイン済みの場合はダッシュボードにリダイレクト
onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }
})

// メールアドレスの形式をチェックする関数
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// フォーム送信時の処理
const handleRegister = async () => {
  const usernameTrim = username.value.trim()
  const emailTrim = email.value.trim()
  const passwordTrim = password.value.trim()
  const confirmPasswordTrim = confirmPassword.value.trim()

  usernameError.value = !usernameTrim
  emailError.value = !emailTrim || !isValidEmail(emailTrim)
  passwordError.value = passwordTrim.length < 6
  // 追加: パスワード確認のバリデーション
  confirmPasswordError.value = passwordTrim !== confirmPasswordTrim

  if (
    usernameError.value ||
    emailError.value ||
    passwordError.value ||
    confirmPasswordError.value
  ) {
    authStore.setError(
      '各項目を正しく入力してください。（パスワードは6文字以上、メールは有効な形式、確認パスワードが一致していること）'
    )
    return
  }

  // 認証ストアを使用してユーザー登録
  const result = await authStore.signUp(emailTrim, passwordTrim)

  if (result.success) {
    // ユーザー登録成功時、accounts テーブルに追加
    try {
      if (result.user) {
        const { error: accountError } = await supabase.from('accounts').insert([
          {
            id: result.user.id,
            username: usernameTrim,
            email: emailTrim,
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
    }
  }
  // エラーの場合は認証ストアが自動的にエラー状態を設定する
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
