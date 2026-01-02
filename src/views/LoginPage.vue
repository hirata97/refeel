<template>
  <v-container class="d-flex align-center justify-center" style="min-height: calc(100vh - 64px)">
    <v-card class="pa-6" max-width="480" width="100%">
      <h2 class="text-center text-h5 font-weight-bold mb-6">
        <v-icon start color="primary">mdi-login</v-icon> Login
      </h2>

      <v-form ref="formRef" v-model="isValid" @submit.prevent="handleLogin">
        <!-- アカウントロックアウト警告 -->
        <v-alert
          v-if="shouldShowLockoutAlert"
          type="error"
          class="mb-4"
          variant="tonal"
          :icon="lockoutInfo?.isLocked ? 'mdi-lock' : 'mdi-alert'"
        >
          <div v-if="lockoutInfo?.isLocked">
            <strong>アカウントがロックされています</strong>
            <div class="text-body-2 mt-1">
              連続ログイン失敗により一時的にロックされました。
              <div v-if="lockoutInfo?.lockoutEnd">
                解除まで残り: {{ getRemainingTime(lockoutInfo?.lockoutEnd!) }}
              </div>
            </div>
          </div>
          <div v-else-if="(lockoutInfo?.failedAttempts ?? 0) > 0">
            <strong>ログイン失敗警告</strong>
            <div class="text-body-2 mt-1">
              失敗回数: {{ lockoutInfo?.failedAttempts }}回 <br />残り試行回数:
              {{ lockoutInfo?.remainingAttempts }}回
              <br />制限に達するとアカウントが一時的にロックされます。
            </div>
          </div>
        </v-alert>

        <!-- 一般的なエラー表示 -->
        <BaseAlert
          v-if="finalDisplayError && finalDisplayError.trim()"
          v-model="showErrorState"
          type="error"
          closable
          :message="finalDisplayError"
          @close="clearDisplayError"
        />

        <!-- メールアドレス入力 -->
        <v-text-field
          label="Email"
          v-model="email"
          :error-messages="emailError && emailError.trim() ? [emailError] : []"
          @blur="validateField('email')"
          @input="clearEmailErrorOnInput"
          variant="outlined"
          density="compact"
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
          :error-messages="passwordError && passwordError.trim() ? [passwordError] : []"
          @blur="validateField('password')"
          @input="clearPasswordErrorOnInput"
          variant="outlined"
          density="compact"
          class="mb-4"
          required
          aria-label="Enter your password"
          :disabled="lockoutInfo?.isLocked"
        />

        <v-card-actions class="d-flex flex-column pa-0">
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
        </v-card-actions>
      </v-form>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch, nextTick } from 'vue'
import { BaseButton, BaseAlert } from '@shared/components/base'
import { InputValidation, XSSProtection } from '@/utils/security'
import { logAuthAttempt } from '@/utils/auth'
import { useSimpleLoginForm } from '@/composables/useSimpleForm'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { useAppRouter } from '@shared/composables'
import { useErrorHandler } from '@shared/composables'

const { authStore } = useAuthGuard({ requireAuth: false })
const { navigateToDashboard, navigateToTop } = useAppRouter()
const { showError, clearError, error: displayError } = useErrorHandler()

const lockoutCheckInterval = ref<NodeJS.Timeout | null>(null)

// Form validation state
const formRef = ref()
const isValid = ref(false)

// シンプルなフォーム管理を使用
const {
  email,
  password,
  emailError,
  passwordError,
  isSubmitting,
  validateField,
  handleSubmit,
  clearPasswordErrorOnInput,
  clearEmailErrorOnInput,
} = useSimpleLoginForm()

// アカウントロックアウト情報を取得
const lockoutInfo = computed(() => authStore.lockoutStatus)

// ロックアウトアラートを表示すべきかの判定
const shouldShowLockoutAlert = computed(() => {
  const info = lockoutInfo.value
  if (!info) return false
  return !!(info.isLocked || (info.failedAttempts ?? 0) > 0)
})

// エラー表示の統合管理（ロックアウト時の特別処理を含む）
const finalDisplayError = computed(() => {
  // 認証中はエラーを表示しない（状態遷移中の古いエラーを避けるため）
  if (authStore.loading) {
    return null
  }

  if (lockoutInfo.value?.isLocked) {
    return null // ロックアウト時は別途表示
  }

  // エラーメッセージの統一処理（空白のみを完全排除）
  const msg =
    (typeof displayError.value === 'string' ? displayError.value : '') ||
    (typeof authStore.error === 'string' ? authStore.error : '')
  const trimmed = msg.trim()
  if (trimmed.length > 0) return trimmed

  return null
})

const showErrorState = computed({
  get: () => !!finalDisplayError.value,
  set: (value: boolean) => {
    if (!value) {
      clearError()
      authStore.clearError()
    }
  },
})

// エラークリア関数
const clearDisplayError = () => {
  clearError()
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

// 認証済みユーザーのリダイレクト処理は useAuthGuard で自動処理

// コンポーネント破棄時のクリーンアップ
onUnmounted(() => {
  stopLockoutStatusCheck()
})

// メールアドレス変更時のロックアウトステータス確認
watch(email, async (newEmail) => {
  if (newEmail && InputValidation.isValidEmail(newEmail)) {
    await authStore.checkLockoutStatus(newEmail)
    // リアクティブ反映を待ってから判定（表示のワンテンポずれを防ぐ）
    await nextTick()
    if (lockoutInfo.value?.failedAttempts || lockoutInfo.value?.isLocked) {
      startLockoutStatusCheck(newEmail)
    } else {
      stopLockoutStatusCheck()
    }
  }
})

const handleLogin = async () => {
  if (formRef.value) {
    const { valid } = await formRef.value.validate()
    if (!valid || lockoutInfo.value?.isLocked) return
  }

  let sanitizedEmail = 'unknown'

  try {
    // サインイン開始時にエラー状態をクリア（フラッシュ表示を防ぐ）
    clearError()
    authStore.clearError()

    // バリデーションとサニタイゼーションを実行
    const sanitizedData = await handleSubmit()
    if (!sanitizedData) return

    // 追加のセキュリティ検証（XSSフレームワークによる）
    sanitizedEmail = XSSProtection.sanitizeText(sanitizedData.email)

    // メールアドレス形式の検証
    if (!InputValidation.isValidEmail(sanitizedEmail)) {
      showError('有効なメールアドレスを入力してください')
      await logAuthAttempt(false, sanitizedEmail, 'invalid_email_format')
      return
    }

    const result = await authStore.signIn(sanitizedData.email, sanitizedData.password)

    if (result.success) {
      // ログイン成功をログに記録
      await logAuthAttempt(true, sanitizedEmail)

      // 残っている可能性のあるエラーを必ず掃除
      clearError()
      authStore.clearError()

      // ログイン成功時は認証ストアが自動的に状態を更新する
      // ダッシュボードにリダイレクト
      navigateToDashboard()
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
    showError(err instanceof Error ? err.message : 'ログイン処理中にエラーが発生しました')
  }
}

// 登録ページからトップページに遷移（useAppRouterを使用）
const navigateToTopPage = navigateToTop
</script>

<style scoped>
/* Responsive adjustments for mobile */
@media (max-width: 600px) {
  .v-container {
    padding: 16px 8px !important;
  }

  .v-card {
    padding: 24px 16px !important;
  }
}

/* Ensure proper spacing on very small screens */
@media (max-width: 375px) {
  .v-card {
    max-width: 100% !important;
    margin: 0 8px;
  }
}
</style>
