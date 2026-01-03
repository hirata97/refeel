<template>
  <v-card>
    <v-card-title>
      <v-icon class="mr-2" size="24">mdi-shield-account</v-icon>
      プライバシー・セキュリティ
    </v-card-title>
    <v-card-subtitle>アカウントとデータの安全性に関する設定です。</v-card-subtitle>
    <v-card-text>
      <v-row>
        <v-col cols="12">
          <div class="text-h6 mb-4">アカウント管理</div>
          <v-btn
            variant="outlined"
            prepend-icon="mdi-key"
            href="https://supabase.com"
            target="_blank"
            class="mb-2"
          >
            パスワード変更
          </v-btn>
          <br />
          <v-btn
            variant="outlined"
            prepend-icon="mdi-download"
            @click="handleDownloadData"
            class="mb-2"
            :loading="downloadLoading"
          >
            個人データをダウンロード
          </v-btn>
          <br />
          <v-btn
            variant="outlined"
            color="error"
            prepend-icon="mdi-account-remove"
            @click="showAccountDeleteDialog = true"
          >
            アカウントを削除
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>

    <!-- アカウント削除確認ダイアログ -->
    <v-dialog v-model="showAccountDeleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-error">
          <v-icon class="mr-2">mdi-alert</v-icon>
          アカウント削除の確認
        </v-card-title>
        <v-card-text>
          アカウントとすべてのデータが完全に削除されます。この操作は取り消せません。
          <br /><br />
          本当にアカウントを削除しますか?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showAccountDeleteDialog = false">キャンセル</v-btn>
          <v-btn color="error" @click="handleDeleteAccount" :loading="deleteLoading">
            アカウントを削除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@features/auth'
import { useDataManagementStore } from '@features/settings'
import { createLogger } from '@shared/utils'

const logger = createLogger('PRIVACYSETTINGS')

// Emits
interface Emits {
  (e: 'downloadData'): void
  (e: 'accountDeleted'): void
}

const emit = defineEmits<Emits>()

// Stores
const router = useRouter()
const authStore = useAuthStore()
const dataManagementStore = useDataManagementStore()

// State
const showAccountDeleteDialog = ref<boolean>(false)
const downloadLoading = ref<boolean>(false)
const deleteLoading = ref<boolean>(false)

// Methods
const handleDownloadData = async () => {
  downloadLoading.value = true
  try {
    const blob = await dataManagementStore.exportData({
      format: 'json',
      dataTypes: ['diaries', 'settings', 'profile'],
      compressed: false,
    })

    if (blob) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `goal_diary_backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      emit('downloadData')
    }
  } catch (error) {
    logger.error('個人データのダウンロードに失敗:', error)
  } finally {
    downloadLoading.value = false
  }
}

const handleDeleteAccount = async () => {
  deleteLoading.value = true
  try {
    // まずデータを削除
    await dataManagementStore.deleteAllData()

    // アカウントを削除（Supabaseの機能を使用）
    // 注意: 実際の実装では適切なAPIエンドポイントを使用する必要があります
    showAccountDeleteDialog.value = false
    await authStore.signOut()

    emit('accountDeleted')
    router.push('/')
  } catch (error) {
    logger.error('アカウント削除に失敗:', error)
  } finally {
    deleteLoading.value = false
  }
}
</script>

<style scoped>
/* スタイルは必要に応じて追加 */
</style>
