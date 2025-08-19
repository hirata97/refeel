<template>
  <v-card class="mx-auto" max-width="400">
    <v-card-title class="text-center pa-4">
      <v-icon class="me-2 text-primary">mdi-shield-key</v-icon>
      2要素認証
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-4">
      <div class="text-center mb-4">
        <v-avatar size="64" color="primary" class="mb-3">
          <v-icon size="32">mdi-account-key</v-icon>
        </v-avatar>
        <div class="text-h6 mb-2">確認コードを入力</div>
        <div class="text-body-2 text-medium-emphasis">
          認証アプリに表示されている6桁のコードを入力してください
        </div>
      </div>

      <!-- コード入力フィールド -->
      <v-text-field
        v-model="verificationCode"
        label="認証コード"
        placeholder="000000"
        variant="outlined"
        maxlength="6"
        :rules="codeRules"
        :loading="verifying"
        :disabled="verifying"
        :error="!!error"
        :error-messages="error"
        class="mb-4"
        style="text-align: center; font-size: 1.2em; letter-spacing: 0.2em;"
        @input="formatVerificationCode"
        @keyup.enter="verify"
        autofocus
      />

      <!-- バックアップコード切り替え -->
      <div class="text-center mb-4">
        <v-btn
          variant="text"
          color="primary"
          size="small"
          @click="toggleBackupMode"
        >
          {{ useBackupCode ? '認証アプリコードを使用' : 'バックアップコードを使用' }}
        </v-btn>
      </div>

      <!-- バックアップコード入力（切り替え時） -->
      <v-expand-transition>
        <div v-show="useBackupCode">
          <v-text-field
            v-model="backupCode"
            label="バックアップコード"
            placeholder="8桁のバックアップコード"
            variant="outlined"
            maxlength="8"
            :rules="backupCodeRules"
            :loading="verifying"
            :disabled="verifying"
            class="mb-4"
            style="text-align: center; font-size: 1.1em; letter-spacing: 0.1em;"
            @input="formatBackupCode"
            @keyup.enter="verify"
          />
          
          <v-alert type="info" variant="tonal" class="mb-4">
            <div class="text-body-2">
              バックアップコードは1回のみ使用可能です。
              使用後は残りのコード数が減ります。
            </div>
          </v-alert>
        </div>
      </v-expand-transition>

      <!-- 時間制限表示 -->
      <div v-if="timeRemaining > 0" class="text-center mb-3">
        <v-chip color="warning" size="small">
          <v-icon start>mdi-clock</v-icon>
          残り時間: {{ formatTime(timeRemaining) }}
        </v-chip>
      </div>
    </v-card-text>

    <v-card-actions class="pa-4">
      <v-btn
        variant="outlined"
        @click="cancel"
        :disabled="verifying"
        class="flex-grow-1"
      >
        キャンセル
      </v-btn>
      
      <v-btn
        color="primary"
        @click="verify"
        :loading="verifying"
        :disabled="!canVerify"
        class="flex-grow-1 ms-2"
      >
        確認
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

// Props & Emits
interface Props {
  email: string
  timeoutSeconds?: number
}

const props = withDefaults(defineProps<Props>(), {
  timeoutSeconds: 300 // 5分
})

const emit = defineEmits<{
  success: []
  cancel: []
  timeout: []
}>()

// State
const authStore = useAuthStore()
const verificationCode = ref('')
const backupCode = ref('')
const useBackupCode = ref(false)
const verifying = ref(false)
const error = ref<string | null>(null)
const timeRemaining = ref(props.timeoutSeconds)
let timeoutInterval: NodeJS.Timeout | null = null

// Computed
const canVerify = computed(() => {
  if (useBackupCode.value) {
    return backupCode.value.length >= 6 && !verifying.value
  } else {
    return verificationCode.value.length === 6 && !verifying.value
  }
})

const codeRules = [
  (value: string) => {
    if (useBackupCode.value) return true
    return !!value || '認証コードを入力してください'
  },
  (value: string) => {
    if (useBackupCode.value) return true
    return value.length === 6 || '6桁のコードを入力してください'
  },
  (value: string) => {
    if (useBackupCode.value) return true
    return /^\d{6}$/.test(value) || '数字のみ入力してください'
  }
]

const backupCodeRules = [
  (value: string) => {
    if (!useBackupCode.value) return true
    return !!value || 'バックアップコードを入力してください'
  },
  (value: string) => {
    if (!useBackupCode.value) return true
    return value.length >= 6 || '6桁以上のコードを入力してください'
  }
]

// Methods
const formatVerificationCode = (event: Event) => {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '').slice(0, 6)
  verificationCode.value = value
  error.value = null
}

const formatBackupCode = (event: Event) => {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase()
  backupCode.value = value
  error.value = null
}

const toggleBackupMode = () => {
  useBackupCode.value = !useBackupCode.value
  verificationCode.value = ''
  backupCode.value = ''
  error.value = null
}

const verify = async () => {
  if (!canVerify.value) return

  try {
    verifying.value = true
    error.value = null

    const code = useBackupCode.value ? backupCode.value : verificationCode.value
    const result = await authStore.signIn(props.email, '', code)

    if (result.success) {
      emit('success')
    } else {
      error.value = result.error || '認証に失敗しました'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '認証エラーが発生しました'
  } finally {
    verifying.value = false
  }
}

const cancel = () => {
  emit('cancel')
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const startTimeout = () => {
  timeoutInterval = setInterval(() => {
    timeRemaining.value--
    
    if (timeRemaining.value <= 0) {
      stopTimeout()
      emit('timeout')
    }
  }, 1000)
}

const stopTimeout = () => {
  if (timeoutInterval) {
    clearInterval(timeoutInterval)
    timeoutInterval = null
  }
}

// Lifecycle
onMounted(() => {
  startTimeout()
})

onUnmounted(() => {
  stopTimeout()
})
</script>

<style scoped>
.v-text-field input {
  text-align: center;
}

.flex-grow-1 {
  flex-grow: 1;
}
</style>