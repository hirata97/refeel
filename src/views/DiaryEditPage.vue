<template>
  <v-container class="diary-edit-page" max-width="600">
    <v-sheet class="form-section pa-4 my-4" elevation="2">
      <div class="header-section mb-4">
        <h2>日記を編集する</h2>
        <v-btn variant="text" icon="mdi-arrow-left" @click="goBack" class="back-button" />
      </div>

      <v-form @submit.prevent="updateDiary" v-if="diary">
        <v-text-field
          v-model="title"
          :error-messages="titleError ? [titleError] : []"
          @blur="validateField('title')"
          label="タイトル"
          outlined
          required
        />
        <v-textarea
          v-model="content"
          :error-messages="contentError ? [contentError] : []"
          @blur="validateField('content')"
          label="内容"
          outlined
          rows="5"
          required
        />
        <v-text-field
          v-model="date"
          :error-messages="dateError ? [dateError] : []"
          @blur="validateField('date')"
          label="日付"
          type="date"
          outlined
          required
        />
        <v-slider
          v-model="mood"
          label="進捗レベル"
          :min="0"
          :max="100"
          :step="5"
          show-ticks="always"
          thumb-label
        >
          <template #thumb-label="{ modelValue }"> {{ modelValue }}% </template>
        </v-slider>

        <div class="action-buttons">
          <v-btn type="submit" color="primary" :loading="isSubmitting" class="mr-2">
            更新する
          </v-btn>
          <v-btn variant="outlined" @click="goBack" class="mr-2"> キャンセル </v-btn>
          <v-btn
            variant="outlined"
            color="error"
            :loading="isDeleting"
            @click="showDeleteConfirmation"
          >
            削除
          </v-btn>
        </div>
      </v-form>

      <!-- ローディング表示 -->
      <div v-else-if="loading" class="loading-section">
        <v-progress-circular indeterminate color="primary" />
        <p class="mt-2">日記を読み込み中...</p>
      </div>

      <!-- エラー表示 -->
      <div v-else class="error-section">
        <v-icon size="48" color="error">mdi-alert-circle</v-icon>
        <p class="mt-2">日記が見つかりませんでした</p>
        <v-btn color="primary" @click="goBack">戻る</v-btn>
      </div>
    </v-sheet>

    <!-- 削除確認ダイアログ -->
    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5 text-error">
          <v-icon icon="mdi-alert-circle" class="mr-2" />
          日記の削除確認
        </v-card-title>
        <v-card-text>
          <v-alert type="warning" variant="tonal" class="mb-4">
            この操作は取り消せません。削除された日記は復旧できません。
          </v-alert>

          <p class="mb-3"><strong>削除対象の日記:</strong></p>
          <v-card variant="outlined" class="mb-4">
            <v-card-title class="text-subtitle-1">{{ diary?.title }}</v-card-title>
            <v-card-text>
              <p class="text-body-2 text-medium-emphasis mb-2">
                作成日: {{ diary ? formatDate(diary.created_at) : '' }}
              </p>
              <p class="text-body-2">
                {{ diary?.content?.slice(0, 100)
                }}{{ (diary?.content?.length || 0) > 100 ? '...' : '' }}
              </p>
            </v-card-text>
          </v-card>

          <p class="text-body-2 text-medium-emphasis">本当にこの日記を削除しますか？</p>

          <!-- 二段階確認 -->
          <v-checkbox
            v-model="deleteConfirmed"
            label="削除することを理解し、同意します"
            color="error"
            class="mt-4"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelDelete" :disabled="isDeleting"> キャンセル </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :disabled="!deleteConfirmed"
            :loading="isDeleting"
            @click="confirmDelete"
          >
            削除実行
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- エラー/成功通知スナックバー -->
    <v-snackbar
      v-model="notification.show"
      :color="notification.type"
      :timeout="notification.timeout"
      location="top"
    >
      <v-icon :icon="notification.icon" class="mr-2" />
      {{ notification.message }}
      <template #actions>
        <v-btn variant="text" @click="notification.show = false"> 閉じる </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDataStore } from '@/stores/data'
import { usePerformanceMonitor } from '@/utils/performance'
import { useSimpleDiaryForm } from '@/composables/useSimpleForm'
import type { DiaryEntry } from '@/stores/data'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const dataStore = useDataStore()
const performance = usePerformanceMonitor()

// シンプルなフォーム管理を使用
const {
  title,
  content,
  date,
  mood,
  titleError,
  contentError,
  dateError,
  isSubmitting,
  validateField,
  handleSubmit,
  setFormData,
} = useSimpleDiaryForm()

// 状態管理
const diary = ref<DiaryEntry | null>(null)
const loading = ref(true)
const diaryId = route.params.id as string

// 削除機能の状態
const isDeleting = ref(false)
const deleteDialog = ref(false)
const deleteConfirmed = ref(false)

// 通知システム
const notification = ref({
  show: false,
  message: '',
  type: 'info' as 'success' | 'error' | 'warning' | 'info',
  timeout: 5000,
  icon: 'mdi-information',
})

// 認証チェックとデータ取得
onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  if (!diaryId) {
    router.push('/diary-view')
    return
  }

  await loadDiary()
})

// 日記データ取得
const loadDiary = async () => {
  try {
    loading.value = true
    performance.start('load_diary_for_edit')

    // データストアから日記を取得
    const diaryData = await dataStore.getDiaryById(diaryId, authStore.user!.id)

    if (!diaryData) {
      showNotification('日記が見つかりませんでした。', 'error', 'mdi-alert-circle')
      return
    }

    diary.value = diaryData

    // フォームに既存データを設定
    setFormData({
      title: diaryData.title,
      content: diaryData.content,
      date: new Date(diaryData.created_at).toISOString().split('T')[0],
      mood: diaryData.progress_level || 0,
    })

    performance.end('load_diary_for_edit')
  } catch (error) {
    console.error('日記読み込みエラー:', error)
    const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました'
    showNotification(`日記の読み込みに失敗しました: ${errorMessage}`, 'error', 'mdi-alert-circle')
  } finally {
    loading.value = false
  }
}

// 日記更新処理
const updateDiary = async (): Promise<void> => {
  if (!diary.value || !authStore.isAuthenticated || !authStore.user) {
    showNotification('認証が必要です。ログインしてください。', 'error', 'mdi-account-alert')
    router.push('/login')
    return
  }

  let retryCount = 0
  const maxRetries = 3

  const attemptUpdate = async (): Promise<void> => {
    try {
      // バリデーションとサニタイゼーションを実行
      const sanitizedData = await handleSubmit()
      if (!sanitizedData) return

      performance.start('update_diary')

      // 更新データの準備
      const updateData = {
        title: sanitizedData.title,
        content: sanitizedData.content,
        progress_level: sanitizedData.mood,
        updated_at: new Date().toISOString(),
      }

      // データストアを使用した更新処理
      await dataStore.updateDiary(diary.value!.id, updateData)

      performance.end('update_diary')

      // 成功メッセージ
      showNotification('日記が正常に更新されました！', 'success', 'mdi-check-circle')

      // 少し待ってからリダイレクト
      setTimeout(() => {
        router.push('/diary-view')
      }, 1500)
    } catch (error: unknown) {
      console.error('日記更新エラー:', error)
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました'

      // ネットワークエラーの場合は自動リトライ
      if (
        retryCount < maxRetries &&
        (errorMessage.includes('network') || errorMessage.includes('fetch'))
      ) {
        retryCount++
        showNotification(
          `接続エラーが発生しました。再試行中... (${retryCount}/${maxRetries})`,
          'warning',
          'mdi-refresh',
        )

        // 指数バックオフで再試行
        setTimeout(() => attemptUpdate(), Math.pow(2, retryCount) * 1000)
        return
      }

      showNotification(`日記の更新に失敗しました: ${errorMessage}`, 'error', 'mdi-alert-circle')
    }
  }

  await attemptUpdate()
}

// 削除確認ダイアログの表示
const showDeleteConfirmation = () => {
  if (!diary.value) return
  deleteDialog.value = true
  deleteConfirmed.value = false
}

// 削除キャンセル処理
const cancelDelete = () => {
  deleteDialog.value = false
  deleteConfirmed.value = false
}

// 削除実行処理
const confirmDelete = async () => {
  if (!diary.value || !authStore.user?.id || !deleteConfirmed.value) return

  let retryCount = 0
  const maxRetries = 3

  const attemptDelete = async (): Promise<void> => {
    try {
      isDeleting.value = true
      performance.start('delete_diary')

      await dataStore.deleteDiary(diary.value!.id, authStore.user!.id)

      performance.end('delete_diary')

      // ダイアログを閉じる
      deleteDialog.value = false
      deleteConfirmed.value = false

      showNotification('日記が正常に削除されました。', 'success', 'mdi-check-circle')

      // 少し待ってからリダイレクト
      setTimeout(() => {
        router.push('/diary-view')
      }, 1500)
    } catch (error: unknown) {
      console.error('日記削除エラー:', error)
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました'

      // ネットワークエラーの場合は自動リトライ
      if (
        retryCount < maxRetries &&
        (errorMessage.includes('network') || errorMessage.includes('fetch'))
      ) {
        retryCount++
        showNotification(
          `接続エラーが発生しました。再試行中... (${retryCount}/${maxRetries})`,
          'warning',
          'mdi-refresh',
        )

        // 指数バックオフで再試行
        setTimeout(() => attemptDelete(), Math.pow(2, retryCount) * 1000)
        return
      }

      showNotification(`日記の削除に失敗しました: ${errorMessage}`, 'error', 'mdi-alert-circle')
    } finally {
      isDeleting.value = false
    }
  }

  await attemptDelete()
}

// 通知表示ヘルパー
const showNotification = (
  message: string,
  type: 'success' | 'error' | 'warning' | 'info',
  icon: string,
  timeout: number = 5000,
) => {
  notification.value = {
    show: true,
    message,
    type,
    icon,
    timeout,
  }
}

// 日付フォーマット（削除確認ダイアログ用）
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ja-JP')
}

// 戻る処理（未保存変更の警告付き）
const goBack = () => {
  // フォームが変更されている場合は確認
  const hasUnsavedChanges =
    diary.value &&
    (title.value !== diary.value.title ||
      content.value !== diary.value.content ||
      date.value !== new Date(diary.value.created_at).toISOString().split('T')[0] ||
      mood.value !== (diary.value.progress_level || 0))

  if (hasUnsavedChanges) {
    if (confirm('未保存の変更があります。本当にページを離れますか？')) {
      router.back()
    }
  } else {
    router.back()
  }
}
</script>

<style scoped>
.diary-edit-page {
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-button {
  margin-left: auto;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.loading-section,
.error-section {
  text-align: center;
  padding: 48px 24px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.loading-section p,
.error-section p {
  margin: 16px 0;
  font-size: 1.1rem;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .diary-edit-page {
    padding: 16px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .v-btn {
    width: 100%;
    margin: 4px 0;
  }
}

@media (max-width: 480px) {
  .diary-edit-page {
    padding: 12px;
  }

  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .back-button {
    margin-left: 0;
    align-self: flex-end;
  }
}
</style>
