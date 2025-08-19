<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="me-2" :color="is2FAEnabled ? 'success' : 'warning'">
        {{ is2FAEnabled ? 'mdi-shield-check' : 'mdi-shield-alert' }}
      </v-icon>
      2要素認証
      <v-spacer />
      <v-chip 
        :color="is2FAEnabled ? 'success' : 'warning'"
        :prepend-icon="is2FAEnabled ? 'mdi-check-circle' : 'mdi-alert-circle'"
        size="small"
      >
        {{ is2FAEnabled ? '有効' : '無効' }}
      </v-chip>
    </v-card-title>

    <v-divider />

    <v-card-text>
      <!-- 2FAが無効の場合 -->
      <template v-if="!is2FAEnabled">
        <v-alert type="info" class="mb-4">
          <v-icon class="me-2">mdi-information</v-icon>
          2要素認証を有効にして、アカウントのセキュリティを向上させましょう。
        </v-alert>
        
        <div class="text-body-2 mb-4">
          2要素認証により、パスワードに加えて認証アプリで生成されるコードが必要になり、
          不正アクセスから大切なデータを保護できます。
        </div>

        <v-btn
          color="primary"
          prepend-icon="mdi-shield-plus"
          @click="showSetup = true"
        >
          2要素認証を設定
        </v-btn>
      </template>

      <!-- 2FAが有効の場合 -->
      <template v-else>
        <v-alert type="success" variant="tonal" class="mb-4">
          <v-icon class="me-2">mdi-check-circle</v-icon>
          2要素認証が有効になっています。アカウントは保護されています。
        </v-alert>

        <!-- 2FA状態情報 -->
        <v-list class="bg-transparent mb-4">
          <v-list-item>
            <v-list-item-title>設定日時</v-list-item-title>
            <v-list-item-subtitle>
              {{ formatDate(twoFactorStatus.setupAt) }}
            </v-list-item-subtitle>
          </v-list-item>
          
          <v-list-item v-if="twoFactorStatus.lastUsedAt">
            <v-list-item-title>最終使用</v-list-item-title>
            <v-list-item-subtitle>
              {{ formatDate(twoFactorStatus.lastUsedAt) }}
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>バックアップコード</v-list-item-title>
            <v-list-item-subtitle>
              {{ twoFactorStatus.backupCodesCount }} 個残っています
              <v-chip 
                v-if="twoFactorStatus.backupCodesCount <= 2"
                color="warning"
                size="x-small"
                class="ms-2"
              >
                残り少
              </v-chip>
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <!-- アクションボタン -->
        <div class="d-flex flex-wrap gap-2">
          <v-btn
            color="primary"
            variant="outlined"
            prepend-icon="mdi-refresh"
            :loading="regeneratingCodes"
            @click="regenerateBackupCodes"
          >
            バックアップコード再生成
          </v-btn>

          <v-btn
            color="warning"
            variant="outlined"
            prepend-icon="mdi-shield-off"
            @click="showDisableDialog = true"
          >
            2FA無効化
          </v-btn>
        </div>
      </template>

      <!-- エラー表示 -->
      <v-alert v-if="error" type="error" class="mt-4">
        {{ error }}
      </v-alert>
    </v-card-text>

    <!-- 2FA設定ダイアログ -->
    <v-dialog v-model="showSetup" max-width="700" persistent>
      <TwoFactorSetup 
        @complete="onSetupComplete"
        @cancel="showSetup = false"
      />
    </v-dialog>

    <!-- 2FA無効化ダイアログ -->
    <v-dialog v-model="showDisableDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6">
          <v-icon class="me-2 text-warning">mdi-alert</v-icon>
          2要素認証を無効化
        </v-card-title>
        
        <v-card-text>
          <v-alert type="warning" class="mb-4">
            <strong>警告:</strong> 2要素認証を無効にすると、アカウントのセキュリティレベルが低下します。
          </v-alert>

          <div class="text-body-2 mb-4">
            無効化するには、認証アプリまたはバックアップコードで確認してください。
          </div>

          <v-text-field
            v-model="disableVerificationCode"
            label="確認コード"
            placeholder="6桁のコードまたはバックアップコード"
            variant="outlined"
            :rules="disableCodeRules"
            :loading="disabling"
            :disabled="disabling"
          />

          <v-alert v-if="disableError" type="error" class="mt-4">
            {{ disableError }}
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="outlined"
            @click="cancelDisable"
            :disabled="disabling"
          >
            キャンセル
          </v-btn>
          <v-btn
            color="warning"
            @click="confirmDisable"
            :loading="disabling"
            :disabled="!disableVerificationCode"
          >
            無効化
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- バックアップコード表示ダイアログ -->
    <v-dialog v-model="showBackupCodes" max-width="500">
      <v-card>
        <v-card-title class="text-h6">
          <v-icon class="me-2 text-success">mdi-key-variant</v-icon>
          新しいバックアップコード
        </v-card-title>

        <v-card-text>
          <v-alert type="info" class="mb-4">
            <strong>重要:</strong> 古いバックアップコードは無効になりました。
            新しいコードを安全な場所に保存してください。
          </v-alert>

          <v-card variant="outlined" class="pa-3 mb-4">
            <v-row v-if="newBackupCodes" density="compact">
              <v-col 
                v-for="(code, index) in newBackupCodes" 
                :key="index"
                cols="6"
              >
                <div class="text-body-2 font-weight-medium text-center pa-1">
                  {{ code }}
                </div>
              </v-col>
            </v-row>
          </v-card>

          <div class="d-flex justify-center gap-2">
            <v-btn
              color="primary"
              variant="outlined"
              prepend-icon="mdi-content-copy"
              @click="copyNewBackupCodes"
            >
              コピー
            </v-btn>
            <v-btn
              color="primary"
              variant="outlined"
              prepend-icon="mdi-download"
              @click="downloadNewBackupCodes"
            >
              ダウンロード
            </v-btn>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            @click="showBackupCodes = false"
          >
            確認しました
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import TwoFactorSetup from './TwoFactorSetup.vue'

// State
const authStore = useAuthStore()
const showSetup = ref(false)
const showDisableDialog = ref(false)
const showBackupCodes = ref(false)
const disabling = ref(false)
const regeneratingCodes = ref(false)
const error = ref<string | null>(null)
const disableError = ref<string | null>(null)
const disableVerificationCode = ref('')
const newBackupCodes = ref<string[] | null>(null)

// Computed
const is2FAEnabled = computed(() => authStore.is2FAEnabled)

const twoFactorStatus = computed(() => {
  if (!authStore.user?.id) {
    return {
      setupAt: null,
      lastUsedAt: null,
      backupCodesCount: 0
    }
  }
  
  // 実際の実装では authStore から取得
  return {
    setupAt: new Date(), // プレースホルダー
    lastUsedAt: null,
    backupCodesCount: 8 // プレースホルダー
  }
})

const disableCodeRules = [
  (value: string) => !!value || '確認コードを入力してください',
  (value: string) => value.length >= 6 || '6桁以上のコードを入力してください'
]

// Methods
const formatDate = (date: Date | null): string => {
  if (!date) return '不明'
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const onSetupComplete = (success: boolean) => {
  showSetup.value = false
  if (success) {
    error.value = null
  }
}

const regenerateBackupCodes = async () => {
  try {
    regeneratingCodes.value = true
    error.value = null

    const codes = await authStore.regenerateBackupCodes()
    if (codes) {
      newBackupCodes.value = codes
      showBackupCodes.value = true
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'バックアップコードの再生成に失敗しました'
  } finally {
    regeneratingCodes.value = false
  }
}

const confirmDisable = async () => {
  try {
    disabling.value = true
    disableError.value = null

    const success = await authStore.disable2FA(disableVerificationCode.value)
    if (success) {
      showDisableDialog.value = false
      disableVerificationCode.value = ''
      error.value = null
    } else {
      disableError.value = '確認コードが正しくありません'
    }
  } catch (err) {
    disableError.value = err instanceof Error ? err.message : '2FA無効化に失敗しました'
  } finally {
    disabling.value = false
  }
}

const cancelDisable = () => {
  showDisableDialog.value = false
  disableVerificationCode.value = ''
  disableError.value = null
}

const copyNewBackupCodes = async () => {
  if (!newBackupCodes.value) return
  
  const codesText = newBackupCodes.value.join('\n')
  try {
    await navigator.clipboard.writeText(codesText)
    console.log('バックアップコードをクリップボードにコピーしました')
  } catch (err) {
    console.error('クリップボードへのコピーに失敗:', err)
  }
}

const downloadNewBackupCodes = () => {
  if (!newBackupCodes.value) return

  const codesText = [
    'Goal Categorization Diary - 2FA バックアップコード（更新版）',
    '作成日時: ' + new Date().toLocaleString(),
    '',
    '重要: これらのコードは安全な場所に保管してください',
    '各コードは1回のみ使用可能です',
    '',
    ...newBackupCodes.value.map((code, index) => `${index + 1}. ${code}`)
  ].join('\n')

  const blob = new Blob([codesText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `2FA_backup_codes_updated_${new Date().getTime()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Lifecycle
onMounted(() => {
  error.value = null
})
</script>

<style scoped>
.font-weight-medium {
  font-family: 'Courier New', monospace;
}

.gap-2 {
  gap: 0.5rem;
}
</style>