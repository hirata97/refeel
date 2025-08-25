<template>
  <BaseForm
    title="Login"
    container-class="login-container"
    form-class="login-form"
    @submit="handleLogin"
  >
    <template #content>
      <!-- アカウントロックアウト警告 -->
      <v-alert
        v-if="lockoutInfo"
        type="error"
        class="mb-4"
        variant="tonal"
        :icon="lockoutInfo.isLocked ? 'mdi-lock' : 'mdi-alert'"
      >
        <div v-if="lockoutInfo.isLocked">
          <strong>アカウントがロックされています</strong>
          <div class="text-body-2 mt-1">
            連続ログイン失敗により一時的にロックされました。
            <div v-if="lockoutInfo.lockoutEnd">
              解除まで残り: {{ getRemainingTime(lockoutInfo.lockoutEnd) }}
            </div>
          </div>
        </div>
        <div v-else-if="lockoutInfo.failedAttempts > 0">
          <strong>ログイン失敗警告</strong>
          <div class="text-body-2 mt-1">
            失敗回数: {{ lockoutInfo.failedAttempts }}回 <br />残り試行回数:
            {{ lockoutInfo.remainingAttempts }}回
            <br />制限に達するとアカウントが一時的にロックされます。
          </div>
        </div>
      </v-alert>

      <!-- 一般的なエラー表示 -->
      <BaseAlert
        v-model="showError"
        type="error"
        closable
        :message="displayError || ''"
        @close="clearDisplayError"
      />


      <!-- メールアドレス入力 -->
      <v-text-field
        label="Email"
        v-model="email"
        :error-messages="emailError ? [emailError] : []"
        @blur="validateField('email')"
        variant="outlined"
        class="mb-3"
        required
        aria-label="Enter your email"
        :disabled="lockoutInfo?.isLocked"
        autofocus
      />

      <!-- パスワード入力 -->
      <v-text-field
        label="Password"
        type="password"
        v-model="password"
        :error-messages="passwordError ? [passwordError] : []"
        @blur="validateField('password')"
        variant="outlined"
        class="mb-4"
        required
        aria-label="Enter your password"
        :disabled="lockoutInfo?.isLocked"
      />


      <!-- セキュリティヒント -->
      <v-expansion-panels
        v-if="!lockoutInfo?.isLocked"
        variant="accordion"
        class="mb-4"
      >
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon class="me-2">mdi-information</v-icon>
            セキュリティ情報
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list density="compact" class="bg-transparent">
              <v-list-item>
                <v-list-item-title class="text-body-2">
                  <v-icon class="me-2" size="small">mdi-shield-check</v-icon>
                  強固なパスワードを使用してください
                </v-list-item-title>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="text-body-2">
                  <v-icon class="me-2" size="small">mdi-key</v-icon>
                  2要素認証でアカウントを保護
                </v-list-item-title>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="text-body-2">
                  <v-icon class="me-2" size="small">mdi-alert-circle</v-icon>
                  不審な活動を検出した場合は即座に報告
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </template>

    <template #actions>
      <BaseButton
        :loading="authStore.loading || isSubmitting"
        :disabled="lockoutInfo?.isLocked"
        type="submit"
        color="primary"
        block
        class="mb-2"
      >
        Login
      </BaseButton>
      <BaseButton color="secondary" block @click="navigateToTopPage">
        トップページに戻る
      </BaseButton>
    </template>
  </BaseForm>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { BaseForm, BaseButton, BaseAlert } from '@/components/base'
import { InputValidation, XSSProtection } from '@/utils/security'
import { logAuthAttempt } from '@/utils/auth'
import { useSimpleLoginForm } from '@/composables/useSimpleForm'

const router = useRouter()
const authStore = useAuthStore()

const lockoutCheckInterval = ref<NodeJS.Timeout | null>(null)

// シンプルなフォーム管理を使用
const { email, password, emailError, passwordError, isSubmitting, validateField, handleSubmit } =
  useSimpleLoginForm()

// アカウントロックアウト情報を取得
const lockoutInfo = computed(() => authStore.lockoutStatus)

// エラー表示の統合管理
const displayError = computed(() => {
  if (lockoutInfo.value?.isLocked) {
    return null // ロックアウト時は別途表示
  }
  return authStore.error || null
})

const showError = computed({
  get: () => !!displayError.value,
  set: (value: boolean) => {
    if (!value) {
      authStore.clearError()
    }
  },
})

// エラークリア関数
const clearDisplayError = () => {
  authStore.clearError()
}

// 残り時間の計算
const getRemainingTime = (lockoutEnd: Date): string => {
  const now = new Date()
  const diff = Math.max(0, lockoutEnd.getTime() - now.getTime())
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return `${minutes}分${seconds}秒`
}

// ロックアウトステータスの定期更新
const startLockoutStatusCheck = (email: string) => {
  if (lockoutCheckInterval.value) {
    clearInterval(lockoutCheckInterval.value)
  }

  lockoutCheckInterval.value = setInterval(async () => {
    if (lockoutInfo.value?.isLocked) {
      await authStore.checkLockoutStatus(email)
    }
  }, 10000) // 10秒間隔でチェック
}

const stopLockoutStatusCheck = () => {
  if (lockoutCheckInterval.value) {
    clearInterval(lockoutCheckInterval.value)
    lockoutCheckInterval.value = null
  }
}


// すでにログイン済みの場合はダッシュボードにリダイレクト
onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }
})

// コンポーネント破棄時のクリーンアップ
onUnmounted(() => {
  stopLockoutStatusCheck()
})

// メールアドレス変更時のロックアウトステータス確認
watch(email, async (newEmail) => {
  if (newEmail && InputValidation.isValidEmail(newEmail)) {
    await authStore.checkLockoutStatus(newEmail)
    if (lockoutInfo.value?.failedAttempts || lockoutInfo.value?.isLocked) {
      startLockoutStatusCheck(newEmail)
    } else {
      stopLockoutStatusCheck()
    }
  }
})

const handleLogin = async (isValid: boolean) => {
  if (!isValid || lockoutInfo.value?.isLocked) return

  let sanitizedEmail = 'unknown'

  try {
    // バリデーションとサニタイゼーションを実行
    const sanitizedData = await handleSubmit()
    if (!sanitizedData) return

    // 追加のセキュリティ検証（XSSフレームワークによる）
    sanitizedEmail = XSSProtection.sanitizeText(sanitizedData.email)

    // メールアドレス形式の検証
    if (!InputValidation.isValidEmail(sanitizedEmail)) {
      authStore.setError('有効なメールアドレスを入力してください')
      await logAuthAttempt(false, sanitizedEmail, 'invalid_email_format')
      return
    }

    const result = await authStore.signIn(sanitizedData.email, sanitizedData.password)

    if (result.success) {
      // ログイン成功をログに記録
      await logAuthAttempt(true, sanitizedEmail)

      // ログイン成功時は認証ストアが自動的に状態を更新する
      // ダッシュボードにリダイレクト
      router.push('/dashboard')
    } else {
      // ログイン失敗をログに記録
      await logAuthAttempt(false, sanitizedEmail, result.error || 'login_failed')

      // ロックアウト関連のUI更新のため、ステータスを再取得
      await authStore.checkLockoutStatus(sanitizedEmail)
      if (lockoutInfo.value?.failedAttempts || lockoutInfo.value?.isLocked) {
        startLockoutStatusCheck(sanitizedEmail)
      }
    }
    // エラーの場合は認証ストアが自動的にエラー状態を設定する
  } catch (err) {
    // 予期しないエラーをログに記録
    await logAuthAttempt(false, sanitizedEmail, 'unexpected_error')
    authStore.setError(err instanceof Error ? err.message : 'ログイン処理中にエラーが発生しました')
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
