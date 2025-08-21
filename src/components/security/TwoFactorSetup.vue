<template>
  <v-card class="mx-auto" max-width="600">
    <v-card-title class="text-h5 pa-4">
      <v-icon class="me-2">mdi-shield-key</v-icon>
      2要素認証の設定
    </v-card-title>

    <v-card-text class="pa-4">
      <!-- ステップ表示 -->
      <v-stepper v-model="currentStep" :items="stepItems" class="mb-4">
        <!-- ステップ1: 説明 -->
        <template v-slot:[`item.1`]>
          <v-card flat>
            <v-card-text>
              <div class="text-h6 mb-3">2要素認証について</div>
              <v-alert type="info" class="mb-4">
                <div class="text-body-2">
                  2要素認証（2FA）を有効にすると、パスワードに加えて認証アプリで生成されるコードが必要になり、
                  アカウントのセキュリティが大幅に向上します。
                </div>
              </v-alert>
              
              <div class="mb-3">
                <v-icon class="me-2 text-green">mdi-check-circle</v-icon>
                <strong>推奨認証アプリ:</strong>
              </div>
              <v-list density="compact" class="bg-transparent">
                <v-list-item>
                  <v-list-item-title>Google Authenticator</v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Microsoft Authenticator</v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Authy</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </template>

        <!-- ステップ2: QRコードスキャン -->
        <template v-slot:[`item.2`]>
          <v-card flat>
            <v-card-text class="text-center">
              <div class="text-h6 mb-4">認証アプリでQRコードをスキャン</div>
              
              <v-progress-circular
                v-if="loading"
                indeterminate
                color="primary"
                class="mb-4"
              />
              
              <div v-else-if="setupResult">
                <!-- QRコード表示 -->
                <div class="mb-4">
                  <img 
                    :src="setupResult.qrCodeUrl" 
                    alt="2FA QRコード"
                    style="max-width: 200px; max-height: 200px;"
                    class="mx-auto d-block"
                  />
                </div>

                <!-- 手動入力用 -->
                <v-expansion-panels variant="accordion" class="mb-4">
                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <v-icon class="me-2">mdi-keyboard</v-icon>
                      手動で入力する場合
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <div class="text-body-2 mb-2">
                        認証アプリで以下のキーを手動入力してください：
                      </div>
                      <v-text-field
                        :model-value="setupResult.manualEntryKey"
                        readonly
                        variant="outlined"
                        density="compact"
                        append-inner-icon="mdi-content-copy"
                        @click:append-inner="copyToClipboard(setupResult.manualEntryKey)"
                        hide-details
                      />
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>

                <v-alert type="info" variant="tonal" class="text-start">
                  <div class="text-body-2">
                    1. 認証アプリでQRコードをスキャンするか、手動でキーを入力<br>
                    2. アプリに表示される6桁のコードを次のステップで入力
                  </div>
                </v-alert>
              </div>

              <v-alert v-if="error" type="error" class="mt-4">
                {{ error }}
              </v-alert>
            </v-card-text>
          </v-card>
        </template>

        <!-- ステップ3: 確認コード入力 -->
        <template v-slot:[`item.3`]>
          <v-card flat>
            <v-card-text>
              <div class="text-h6 mb-4 text-center">確認コードを入力</div>
              
              <v-text-field
                v-model="verificationCode"
                label="認証アプリの6桁コード"
                placeholder="000000"
                variant="outlined"
                maxlength="6"
                :rules="codeRules"
                :loading="verifying"
                :disabled="verifying"
                class="text-center"
                style="font-size: 1.2em; letter-spacing: 0.2em;"
                @input="formatVerificationCode"
              />

              <v-alert type="info" variant="tonal" class="mb-4">
                認証アプリに表示されている6桁のコードを入力してください。
                コードは30秒ごとに更新されます。
              </v-alert>

              <v-alert v-if="verificationError" type="error" class="mb-4">
                {{ verificationError }}
              </v-alert>
            </v-card-text>
          </v-card>
        </template>

        <!-- ステップ4: バックアップコード -->
        <template v-slot:[`item.4`]>
          <v-card flat>
            <v-card-text>
              <div class="text-h6 mb-4 text-center">バックアップコード</div>
              
              <v-alert type="warning" class="mb-4">
                <div class="text-body-2">
                  <strong>重要:</strong> これらのバックアップコードは安全な場所に保存してください。
                  認証アプリにアクセスできない場合の緊急時に使用できます。
                </div>
              </v-alert>

              <v-card variant="outlined" class="pa-3 mb-4">
                <div class="text-subtitle-2 mb-2">バックアップコード（各コードは1回のみ使用可能）</div>
                <v-row v-if="setupResult?.backupCodes" density="compact">
                  <v-col 
                    v-for="(code, index) in setupResult.backupCodes" 
                    :key="index"
                    cols="6"
                  >
                    <div class="text-body-2 font-weight-medium text-center pa-1">
                      {{ code }}
                    </div>
                  </v-col>
                </v-row>
              </v-card>

              <div class="d-flex justify-center gap-2 mb-4">
                <v-btn
                  color="primary"
                  variant="outlined"
                  prepend-icon="mdi-content-copy"
                  @click="copyBackupCodes"
                >
                  コピー
                </v-btn>
                <v-btn
                  color="primary"
                  variant="outlined"
                  prepend-icon="mdi-download"
                  @click="downloadBackupCodes"
                >
                  ダウンロード
                </v-btn>
              </div>

              <v-alert type="success" class="text-center">
                <v-icon class="me-2">mdi-check-circle</v-icon>
                2要素認証の設定が完了しました！
              </v-alert>
            </v-card-text>
          </v-card>
        </template>
      </v-stepper>
    </v-card-text>

    <v-card-actions class="pa-4">
      <v-btn
        v-if="currentStep > 1 && currentStep < 4"
        variant="outlined"
        @click="previousStep"
        :disabled="loading || verifying"
      >
        戻る
      </v-btn>
      
      <v-spacer />
      
      <v-btn
        v-if="currentStep === 1"
        color="primary"
        @click="startSetup"
        :loading="loading"
      >
        設定開始
      </v-btn>
      
      <v-btn
        v-else-if="currentStep === 2"
        color="primary"
        @click="nextStep"
        :disabled="!setupResult"
      >
        次へ
      </v-btn>
      
      <v-btn
        v-else-if="currentStep === 3"
        color="primary"
        @click="verifyAndEnable"
        :loading="verifying"
        :disabled="!isValidCode"
      >
        確認して有効化
      </v-btn>
      
      <v-btn
        v-else-if="currentStep === 4"
        color="success"
        @click="finish"
      >
        完了
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { TwoFactorSetupResult } from '@/utils/two-factor-auth'

// Props & Emits
const emit = defineEmits<{
  complete: [success: boolean]
  cancel: []
}>()

// State
const authStore = useAuthStore()
const currentStep = ref(1)
const loading = ref(false)
const verifying = ref(false)
const error = ref<string | null>(null)
const verificationError = ref<string | null>(null)
const verificationCode = ref('')
const setupResult = ref<TwoFactorSetupResult | null>(null)

// Computed
const stepItems = [
  { title: '説明', value: 1 },
  { title: 'QRコード', value: 2 },
  { title: '確認', value: 3 },
  { title: '完了', value: 4 }
]

const isValidCode = computed(() => {
  return verificationCode.value.length === 6 && /^\d{6}$/.test(verificationCode.value)
})

const codeRules = [
  (value: string) => !!value || '確認コードを入力してください',
  (value: string) => value.length === 6 || '6桁のコードを入力してください',
  (value: string) => /^\d{6}$/.test(value) || '数字のみ入力してください'
]

// Methods
const startSetup = async () => {
  try {
    loading.value = true
    error.value = null
    
    setupResult.value = await authStore.setup2FA()
    nextStep()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '2FA設定の開始に失敗しました'
  } finally {
    loading.value = false
  }
}

const nextStep = () => {
  if (currentStep.value < 4) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    verificationError.value = null
  }
}

const verifyAndEnable = async () => {
  if (!setupResult.value || !isValidCode.value) return

  try {
    verifying.value = true
    verificationError.value = null

    const success = await authStore.enable2FA(
      verificationCode.value,
      setupResult.value.secret,
      setupResult.value.backupCodes
    )

    if (success) {
      nextStep()
    } else {
      verificationError.value = '確認コードが正しくありません。もう一度お試しください。'
    }
  } catch (err) {
    verificationError.value = err instanceof Error ? err.message : '2FA有効化に失敗しました'
  } finally {
    verifying.value = false
  }
}

const formatVerificationCode = (event: Event) => {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '').slice(0, 6)
  verificationCode.value = value
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    // Toast通知を表示する場合
    console.log('クリップボードにコピーしました')
  } catch (err) {
    console.error('クリップボードへのコピーに失敗:', err)
  }
}

const copyBackupCodes = async () => {
  if (!setupResult.value?.backupCodes) return
  
  const codesText = setupResult.value.backupCodes.join('\n')
  await copyToClipboard(codesText)
}

const downloadBackupCodes = () => {
  if (!setupResult.value?.backupCodes) return

  const codesText = [
    'Goal Categorization Diary - 2FA バックアップコード',
    '作成日時: ' + new Date().toLocaleString(),
    '',
    '重要: これらのコードは安全な場所に保管してください',
    '各コードは1回のみ使用可能です',
    '',
    ...setupResult.value.backupCodes.map((code, index) => `${index + 1}. ${code}`)
  ].join('\n')

  const blob = new Blob([codesText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `2FA_backup_codes_${new Date().getTime()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const finish = () => {
  emit('complete', true)
}

// Lifecycle
onMounted(() => {
  // 既に2FAが有効な場合は警告
  if (authStore.is2FAEnabled) {
    error.value = '2要素認証は既に有効になっています'
  }
})
</script>

<style scoped>
.v-stepper {
  box-shadow: none;
}

.font-weight-medium {
  font-family: 'Courier New', monospace;
}
</style>