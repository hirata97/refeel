<template>
  <v-card class="privacy-settings-card">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" color="primary">mdi-shield-account</v-icon>
      プライバシー設定
    </v-card-title>

    <v-card-text>
      <v-alert
        v-if="loading"
        type="info"
        variant="tonal"
        class="mb-4"
        text="設定を読み込んでいます..."
      />

      <v-form v-else ref="form" @submit.prevent="saveSettings">
        <!-- データ暗号化設定 -->
        <div class="setting-section">
          <h3 class="text-h6 mb-3">
            <v-icon class="mr-2">mdi-lock</v-icon>
            データセキュリティ
          </h3>

          <v-switch
            v-model="localSettings.dataEncryption"
            label="データ暗号化を有効にする"
            color="primary"
            hide-details
          />
          <p class="text-caption text-medium-emphasis ml-8 mt-1">
            目標や進捗などの個人データを暗号化して保存します
          </p>
        </div>

        <v-divider class="my-6" />

        <!-- データ共有設定 -->
        <div class="setting-section">
          <h3 class="text-h6 mb-3">
            <v-icon class="mr-2">mdi-share-variant</v-icon>
            データ共有
          </h3>

          <v-switch
            v-model="localSettings.shareAnalytics"
            label="アナリティクスデータの共有を許可"
            color="primary"
            hide-details
            class="mb-2"
          />
          <p class="text-caption text-medium-emphasis ml-8 mb-4">
            アプリの改善のため匿名化された使用統計の共有を許可します
          </p>

          <v-switch
            v-model="localSettings.shareUsageData"
            label="使用データの共有を許可"
            color="primary"
            hide-details
            class="mb-2"
          />
          <p class="text-caption text-medium-emphasis ml-8 mb-4">
            機能改善のため使用パターンデータの共有を許可します
          </p>

          <v-switch
            v-model="localSettings.publicProfile"
            label="プロフィールを公開"
            color="primary"
            hide-details
            class="mb-2"
          />
          <p class="text-caption text-medium-emphasis ml-8 mb-4">
            他のユーザーがあなたのプロフィールを閲覧できるようにします
          </p>

          <v-switch
            v-model="localSettings.shareProgress"
            label="進捗の共有を許可"
            color="primary"
            hide-details
            class="mb-2"
          />
          <p class="text-caption text-medium-emphasis ml-8">
            あなたの進捗を他のユーザーと共有することを許可します
          </p>
        </div>

        <v-divider class="my-6" />

        <!-- Cookie設定 -->
        <div class="setting-section">
          <h3 class="text-h6 mb-3">
            <v-icon class="mr-2">mdi-cookie</v-icon>
            Cookie設定
          </h3>

          <v-switch
            v-model="localSettings.allowCookies"
            label="Cookieの使用を許可"
            color="primary"
            hide-details
          />
          <p class="text-caption text-medium-emphasis ml-8 mt-1">
            ログイン状態の維持や設定の保存のためCookieを使用します
          </p>
        </div>

        <v-divider class="my-6" />

        <!-- 通知設定 -->
        <div class="setting-section">
          <h3 class="text-h6 mb-3">
            <v-icon class="mr-2">mdi-bell</v-icon>
            通知設定
          </h3>

          <v-switch
            v-model="localSettings.emailNotifications"
            label="メール通知を受け取る"
            color="primary"
            hide-details
          />
          <p class="text-caption text-medium-emphasis ml-8 mt-1">
            重要な更新やお知らせをメールで受け取ります
          </p>
        </div>

        <v-divider class="my-6" />

        <!-- データ保持設定 -->
        <div class="setting-section">
          <h3 class="text-h6 mb-3">
            <v-icon class="mr-2">mdi-database</v-icon>
            データ保持
          </h3>

          <v-select
            v-model="localSettings.dataRetentionPeriod"
            :items="retentionOptions"
            label="データ保持期間"
            outlined
            dense
          />
          <p class="text-caption text-medium-emphasis mt-1">
            アカウント削除後、指定期間経過後にデータが完全に削除されます
          </p>
        </div>

        <v-divider class="my-6" />

        <!-- GDPR権利 -->
        <div class="setting-section">
          <h3 class="text-h6 mb-3">
            <v-icon class="mr-2">mdi-gavel</v-icon>
            データ権利 (GDPR準拠)
          </h3>

          <v-switch
            v-model="localSettings.dataExport"
            label="データエクスポート権限"
            color="primary"
            hide-details
            class="mb-2"
          />
          <p class="text-caption text-medium-emphasis ml-8 mb-4">
            あなたのデータをエクスポート・ダウンロードする権利
          </p>

          <v-switch
            v-model="localSettings.dataDelete"
            label="データ削除権限"
            color="primary"
            hide-details
          />
          <p class="text-caption text-medium-emphasis ml-8 mt-1">
            あなたのデータを削除する権利（忘れられる権利）
          </p>
        </div>
      </v-form>
    </v-card-text>

    <v-card-actions class="px-6 pb-6">
      <v-btn
        color="success"
        variant="flat"
        @click="exportData"
        :disabled="!localSettings.dataExport || loading"
        :loading="exportLoading"
      >
        <v-icon class="mr-2">mdi-download</v-icon>
        データをエクスポート
      </v-btn>

      <v-btn
        color="error"
        variant="outlined"
        @click="openDataDeletionDialog"
        :disabled="!localSettings.dataDelete || loading"
      >
        <v-icon class="mr-2">mdi-delete</v-icon>
        データを削除
      </v-btn>

      <v-spacer />

      <v-btn text @click="resetSettings" :disabled="loading || !hasChanges"> リセット </v-btn>

      <v-btn
        color="primary"
        variant="flat"
        @click="saveSettings"
        :disabled="loading || !hasChanges"
        :loading="saveLoading"
      >
        設定を保存
      </v-btn>
    </v-card-actions>

    <!-- データ削除ダイアログ -->
    <DataDeletionDialog v-model="showDataDeletionDialog" @submitted="onDataDeletionSubmitted" />
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { PrivacyManager, GDPRCompliance } from '@/utils/privacy'
import { useAuthStore } from '@/stores/auth'
import DataDeletionDialog from './DataDeletionDialog.vue'
import type { PrivacySettings } from '@/types/encryption'
import { createLogger } from '@shared/utils'

const logger = createLogger('PRIVACYSETTINGSCARD')
import type { VForm } from 'vuetify/components'

// Composables
const authStore = useAuthStore()

// Reactive data
const loading = ref(true)
const saveLoading = ref(false)
const exportLoading = ref(false)
const showDataDeletionDialog = ref(false)
const form = ref<VForm>()

const originalSettings = ref<PrivacySettings | null>(null)
const localSettings = ref<PrivacySettings>({
  userId: '',
  dataEncryption: true,
  shareAnalytics: false,
  shareUsageData: false,
  allowCookies: true,
  dataRetentionPeriod: 730,
  publicProfile: false,
  shareProgress: false,
  emailNotifications: true,
  dataExport: true,
  dataDelete: true,
  updatedAt: '',
  version: 1,
})

// Data retention options
const retentionOptions = [
  { title: '1年', value: 365 },
  { title: '2年', value: 730 },
  { title: '3年', value: 1095 },
  { title: '5年', value: 1825 },
]

// Computed
const hasChanges = computed(() => {
  if (!originalSettings.value) return false

  return JSON.stringify(localSettings.value) !== JSON.stringify(originalSettings.value)
})

// Watch for auto-save
watch(
  localSettings,
  async () => {
    if (!originalSettings.value || !hasChanges.value) return

    // Auto-save after 2 seconds of no changes
    setTimeout(async () => {
      if (hasChanges.value) {
        await saveSettings()
      }
    }, 2000)
  },
  { deep: true },
)

// Methods
const loadSettings = async () => {
  if (!authStore.user) return

  loading.value = true
  try {
    const settings = await PrivacyManager.getPrivacySettings(authStore.user.id)
    if (settings) {
      localSettings.value = { ...settings }
      originalSettings.value = { ...settings }
    }
  } catch (error) {
    logger.error('プライバシー設定の読み込みに失敗しました:', error)
    // TODO: Error notification
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  if (!authStore.user || !hasChanges.value) return

  saveLoading.value = true
  try {
    const updatedSettings = await PrivacyManager.updatePrivacySettings(
      authStore.user.id,
      localSettings.value,
    )

    originalSettings.value = { ...updatedSettings }
    localSettings.value = { ...updatedSettings }

    // TODO: Success notification
    logger.debug('プライバシー設定を保存しました')
  } catch (error) {
    logger.error('プライバシー設定の保存に失敗しました:', error)
    // TODO: Error notification
  } finally {
    saveLoading.value = false
  }
}

const resetSettings = () => {
  if (originalSettings.value) {
    localSettings.value = { ...originalSettings.value }
  }
}

const exportData = async () => {
  if (!authStore.user) return

  exportLoading.value = true
  try {
    const dataBlob = await GDPRCompliance.exerciseRightToDataPortability(authStore.user.id)

    // Download the data
    const url = URL.createObjectURL(dataBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `my-data-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // TODO: Success notification
    logger.debug('データのエクスポートが完了しました')
  } catch (error) {
    logger.error('データエクスポートに失敗しました:', error)
    // TODO: Error notification
  } finally {
    exportLoading.value = false
  }
}

const openDataDeletionDialog = () => {
  showDataDeletionDialog.value = true
}

const onDataDeletionSubmitted = (token: string) => {
  // TODO: Success notification with token information
  logger.debug('データ削除リクエストが送信されました。トークン:', token)
}

// Lifecycle
onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.privacy-settings-card {
  max-width: 800px;
}

.setting-section {
  margin-bottom: 1rem;
}

.text-caption {
  line-height: 1.4;
}

.v-switch {
  margin-bottom: 0.5rem;
}

.v-divider {
  margin: 1.5rem 0;
}
</style>
