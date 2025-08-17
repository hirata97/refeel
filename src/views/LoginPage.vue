<template>
  <BaseForm
    title="Login"
    container-class="login-container"
    form-class="login-form"
    @submit="handleLogin"
  >
    <template #content>
      <BaseAlert
        v-model="showError"
        type="error"
        closable
        :message="authStore.error || ''"
        @close="authStore.clearError"
      />

      <v-text-field
        label="Email"
        v-model="email"
        variant="outlined"
        class="mb-3"
        required
        :rules="[(v) => !!v || 'Email is required']"
        aria-label="Enter your email"
        autofocus
      />

      <v-text-field
        label="Password"
        type="password"
        v-model="password"
        variant="outlined"
        class="mb-4"
        required
        :rules="[(v) => !!v || 'Password is required']"
        aria-label="Enter your password"
      />
    </template>

    <template #actions>
      <BaseButton
        :loading="authStore.loading"
        type="submit"
        color="primary"
        block
        class="mb-2"
      >
        Login
      </BaseButton>
      <BaseButton
        color="secondary"
        block
        @click="navigateToTopPage"
      >
        トップページに戻る
      </BaseButton>
    </template>
  </BaseForm>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { BaseForm, BaseButton, BaseAlert } from '@/components/base'
import { InputValidation, XSSProtection } from '@/utils/security'
import { logAuthAttempt } from '@/utils/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')

// 認証ストアからエラー状態とローディング状態を使用
const showError = computed({
  get: () => !!authStore.error,
  set: (value: boolean) => {
    if (!value) {
      authStore.clearError()
    }
  }
})

// すでにログイン済みの場合はダッシュボードにリダイレクト
onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }
})

const handleLogin = async (isValid: boolean) => {
  if (!isValid) return

  const emailTrim = email.value.trim()
  const passwordTrim = password.value.trim()

  if (!emailTrim || !passwordTrim) {
    authStore.setError('メールアドレスとパスワードを入力してください')
    return
  }

  // 入力値の検証とサニタイゼーション
  const sanitizedEmail = XSSProtection.sanitizeText(emailTrim)
  
  // メールアドレス形式の検証
  if (!InputValidation.isValidEmail(sanitizedEmail)) {
    authStore.setError('有効なメールアドレスを入力してください')
    await logAuthAttempt(false, sanitizedEmail, 'invalid_email_format')
    return
  }

  // パスワード長の基本チェック
  if (passwordTrim.length < 1 || passwordTrim.length > 128) {
    authStore.setError('パスワードが不正です')
    await logAuthAttempt(false, sanitizedEmail, 'invalid_password_length')
    return
  }

  try {
    const result = await authStore.signIn(sanitizedEmail, passwordTrim)

    if (result.success) {
      // ログイン成功をログに記録
      await logAuthAttempt(true, sanitizedEmail)
      
      // ダッシュボードにリダイレクト
      router.push('/dashboard')
    } else {
      // ログイン失敗をログに記録
      await logAuthAttempt(false, sanitizedEmail, result.error || 'login_failed')
    }
  } catch {
    // 予期しないエラーをログに記録
    await logAuthAttempt(false, sanitizedEmail, 'unexpected_error')
    authStore.setError('ログイン処理中にエラーが発生しました')
  }
}

// 登録ページからトップページに遷移
const navigateToTopPage = () => {
  router.push('/')
}
</script>

<style scoped>
.login-container {
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

.login-form {
  width: 100%;
  max-width: 400px;
}

@media (max-width: 600px) {
  .login-container {
    height: auto;
    padding: 16px;
  }
}
</style>
