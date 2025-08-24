<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="me-2">mdi-lock-reset</v-icon>
      パスワード変更
    </v-card-title>

    <v-divider />

    <v-card-text>
      <v-form ref="formRef" v-model="formValid" @submit.prevent="changePassword">
        <!-- 現在のパスワード -->
        <v-text-field
          v-model="currentPassword"
          label="現在のパスワード"
          type="password"
          variant="outlined"
          :rules="currentPasswordRules"
          :loading="loading"
          :disabled="loading"
          class="mb-4"
          required
        />

        <!-- 新しいパスワード -->
        <v-text-field
          v-model="newPassword"
          label="新しいパスワード"
          :type="showNewPassword ? 'text' : 'password'"
          variant="outlined"
          :rules="newPasswordRules"
          :loading="loading"
          :disabled="loading"
          :append-inner-icon="showNewPassword ? 'mdi-eye' : 'mdi-eye-off'"
          class="mb-2"
          @click:append-inner="showNewPassword = !showNewPassword"
          @input="onPasswordInput"
          required
        />

        <!-- パスワード強度表示 -->
        <div v-if="passwordValidation" class="mb-4">
          <div class="d-flex justify-between align-center mb-2">
            <span class="text-body-2">パスワード強度</span>
            <span
              class="text-body-2 font-weight-medium"
              :class="getStrengthColor(passwordValidation.score)"
            >
              {{ getStrengthLabel(passwordValidation.score) }}
            </span>
          </div>

          <v-progress-linear
            :model-value="passwordValidation.score"
            :color="getStrengthColor(passwordValidation.score).replace('text-', '')"
            height="6"
            rounded
            class="mb-2"
          />

          <!-- エラーメッセージ -->
          <v-alert
            v-if="passwordValidation.errors.length > 0"
            type="error"
            variant="tonal"
            class="mb-2"
            density="compact"
          >
            <ul class="ma-0 pa-0" style="list-style-position: inside">
              <li v-for="error in passwordValidation.errors" :key="error">
                {{ error }}
              </li>
            </ul>
          </v-alert>

          <!-- 警告メッセージ -->
          <v-alert
            v-if="passwordValidation.warnings.length > 0"
            type="warning"
            variant="tonal"
            class="mb-2"
            density="compact"
          >
            <ul class="ma-0 pa-0" style="list-style-position: inside">
              <li v-for="warning in passwordValidation.warnings" :key="warning">
                {{ warning }}
              </li>
            </ul>
          </v-alert>

          <!-- 改善提案 -->
          <v-alert
            v-if="passwordValidation.suggestions.length > 0"
            type="info"
            variant="tonal"
            class="mb-2"
            density="compact"
          >
            <div class="text-body-2 mb-1">改善提案:</div>
            <ul class="ma-0 pa-0" style="list-style-position: inside">
              <li v-for="suggestion in passwordValidation.suggestions" :key="suggestion">
                {{ suggestion }}
              </li>
            </ul>
          </v-alert>
        </div>

        <!-- パスワード確認 -->
        <v-text-field
          v-model="confirmPassword"
          label="新しいパスワード（確認）"
          :type="showConfirmPassword ? 'text' : 'password'"
          variant="outlined"
          :rules="confirmPasswordRules"
          :loading="loading"
          :disabled="loading"
          :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
          class="mb-4"
          @click:append-inner="showConfirmPassword = !showConfirmPassword"
          required
        />

        <!-- パスワードポリシー表示 -->
        <v-expansion-panels variant="accordion" class="mb-4">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="me-2">mdi-shield-check</v-icon>
              パスワードポリシー
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-list density="compact" class="bg-transparent">
                <v-list-item>
                  <v-list-item-title class="text-body-2">
                    <v-icon class="me-2" size="small">mdi-check-circle-outline</v-icon>
                    8文字以上、128文字以下
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="text-body-2">
                    <v-icon class="me-2" size="small">mdi-check-circle-outline</v-icon>
                    大文字・小文字・数字・特殊文字を含む
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="text-body-2">
                    <v-icon class="me-2" size="small">mdi-check-circle-outline</v-icon>
                    一般的なパスワードの使用禁止
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="text-body-2">
                    <v-icon class="me-2" size="small">mdi-check-circle-outline</v-icon>
                    メールアドレス・ユーザー名の使用禁止
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="text-body-2">
                    <v-icon class="me-2" size="small">mdi-check-circle-outline</v-icon>
                    過去5回のパスワード再利用禁止
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- エラー表示 -->
        <v-alert v-if="error" type="error" class="mb-4">
          {{ error }}
        </v-alert>

        <!-- 成功表示 -->
        <v-alert v-if="success" type="success" class="mb-4">
          <v-icon class="me-2">mdi-check-circle</v-icon>
          パスワードが正常に変更されました。
        </v-alert>
      </v-form>
    </v-card-text>

    <v-card-actions class="pa-4">
      <v-spacer />
      <v-btn variant="outlined" @click="resetForm" :disabled="loading"> リセット </v-btn>
      <v-btn
        color="primary"
        type="submit"
        :loading="loading"
        :disabled="!formValid || !canSubmit"
        @click="changePassword"
        class="ms-2"
      >
        パスワード変更
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { passwordValidator } from '@/utils/password-policy'
import type { PasswordValidationResult } from '@/utils/password-policy'
import type { VForm } from 'vuetify/components'

// State
const authStore = useAuthStore()
const formRef = ref<VForm>()
const formValid = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

// Form fields
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const passwordValidation = ref<PasswordValidationResult | null>(null)

// Computed
const canSubmit = computed(() => {
  return (
    currentPassword.value.length > 0 &&
    newPassword.value.length > 0 &&
    confirmPassword.value.length > 0 &&
    newPassword.value === confirmPassword.value &&
    passwordValidation.value?.isValid
  )
})

// Validation rules
const currentPasswordRules = [(value: string) => !!value || '現在のパスワードを入力してください']

const newPasswordRules = [
  (value: string) => !!value || '新しいパスワードを入力してください',
  () => passwordValidation.value?.isValid || '無効なパスワードです',
]

const confirmPasswordRules = [
  (value: string) => !!value || 'パスワードの確認を入力してください',
  (value: string) => value === newPassword.value || 'パスワードが一致しません',
]

// Methods
const onPasswordInput = () => {
  if (newPassword.value.length > 0) {
    passwordValidation.value = passwordValidator.validatePassword(
      newPassword.value,
      authStore.user?.email,
      authStore.user?.user_metadata?.name,
    )
  } else {
    passwordValidation.value = null
  }

  // 成功状態をリセット
  if (success.value) {
    success.value = false
  }
}

const getStrengthLabel = (score: number): string => {
  if (score >= 80) return '非常に強い'
  if (score >= 60) return '強い'
  if (score >= 40) return '普通'
  if (score >= 20) return '弱い'
  return '非常に弱い'
}

const getStrengthColor = (score: number): string => {
  if (score >= 80) return 'text-success'
  if (score >= 60) return 'text-info'
  if (score >= 40) return 'text-warning'
  return 'text-error'
}

const changePassword = async () => {
  if (!formRef.value?.validate() || !canSubmit.value) return

  try {
    loading.value = true
    error.value = null
    success.value = false

    const result = await authStore.changePassword(currentPassword.value, newPassword.value)

    if (result.success) {
      success.value = true
      resetForm()

      // 成功メッセージを3秒後に自動で隠す
      setTimeout(() => {
        success.value = false
      }, 3000)
    } else {
      error.value = result.error || 'パスワード変更に失敗しました'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'パスワード変更中にエラーが発生しました'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  passwordValidation.value = null
  error.value = null
  success.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false
  formRef.value?.resetValidation()
}

// Watch for password changes
watch(newPassword, () => {
  if (confirmPassword.value && newPassword.value !== confirmPassword.value) {
    formRef.value?.validate()
  }
})
</script>

<style scoped>
.v-progress-linear {
  border-radius: 3px;
}

.text-body-2.font-weight-medium {
  font-weight: 500;
}
</style>
