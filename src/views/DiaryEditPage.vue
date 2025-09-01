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
        <v-card variant="outlined" class="mood-selector">
          <v-card-subtitle class="pb-2">気分</v-card-subtitle>
          <v-card-text class="pt-0">
            <v-btn-toggle
              v-model="mood"
              color="primary"
              variant="outlined"
              divided
              mandatory
              class="mood-buttons"
            >
              <v-btn :value="1" size="small" class="mood-btn">
                <v-icon size="small">mdi-emoticon-dead</v-icon>
                <span class="ml-1">1</span>
              </v-btn>
              <v-btn :value="2" size="small" class="mood-btn">
                <v-icon size="small">mdi-emoticon-sad</v-icon>
                <span class="ml-1">2</span>
              </v-btn>
              <v-btn :value="3" size="small" class="mood-btn">
                <v-icon size="small">mdi-emoticon-cry</v-icon>
                <span class="ml-1">3</span>
              </v-btn>
              <v-btn :value="4" size="small" class="mood-btn">
                <v-icon size="small">mdi-emoticon-neutral</v-icon>
                <span class="ml-1">4</span>
              </v-btn>
              <v-btn :value="5" size="small" class="mood-btn">
                <v-icon size="small">mdi-emoticon</v-icon>
                <span class="ml-1">5</span>
              </v-btn>
              <v-btn :value="6" size="small" class="mood-btn">
                <v-icon size="small">mdi-emoticon-happy</v-icon>
                <span class="ml-1">6</span>
              </v-btn>
              <v-btn :value="7" size="small" class="mood-btn">
                <v-icon size="small">mdi-emoticon-excited</v-icon>
                <span class="ml-1">7</span>
              </v-btn>
              <v-btn :value="8" size="small" class="mood-btn">
                <v-icon size="small">mdi-emoticon-cool</v-icon>
                <span class="ml-1">8</span>
              </v-btn>
              <v-btn :value="9" size="small" class="mood-btn">
                <v-icon size="small">mdi-emoticon-kiss</v-icon>
                <span class="ml-1">9</span>
              </v-btn>
              <v-btn :value="10" size="small" class="mood-btn">
                <v-icon size="small">mdi-emoticon-lol</v-icon>
                <span class="ml-1">10</span>
              </v-btn>
            </v-btn-toggle>
          </v-card-text>
        </v-card>

        <!-- 感情タグ選択コンポーネント -->
        <EmotionTagSelector
          v-model="selectedEmotionTags"
          class="mt-4"
        />

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
import { useEmotionTagsStore } from '@/stores/emotionTags'
import { usePerformanceMonitor } from '@/utils/performance'
import { useSimpleDiaryForm } from '@/composables/useSimpleForm'
import EmotionTagSelector from '@/components/EmotionTagSelector.vue'
import type { DiaryEntry } from '@/stores/data'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const dataStore = useDataStore()
const emotionTagsStore = useEmotionTagsStore()
const performance = usePerformanceMonitor()

// 感情タグ選択状態
const selectedEmotionTags = ref<string[]>([])

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
      mood: diaryData.mood || 5, // moodフィールドを使用、デフォルトは5
    })

    // 既存感情タグを取得して設定
    try {
      const emotionTags = await emotionTagsStore.getDiaryEmotionTags(diaryData.id)
      selectedEmotionTags.value = emotionTags.map(tag => tag.id)
    } catch (emotionTagError) {
      console.error('感情タグの取得エラー:', emotionTagError)
      // 感情タグ取得失敗でも日記編集は可能とする
      selectedEmotionTags.value = []
    }

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
        mood: Number(sanitizedData.mood) || 5, // 1-10の値をそのまま使用
        updated_at: new Date().toISOString(),
      }

      // データストアを使用した更新処理
      await dataStore.updateDiary(diary.value!.id, updateData)

      // 感情タグを更新
      try {
        await emotionTagsStore.linkDiaryEmotionTags(diary.value!.id, selectedEmotionTags.value)
      } catch (emotionTagError) {
        console.error('感情タグの更新エラー:', emotionTagError)
        // 感情タグ更新失敗でも日記更新は成功扱いとし、警告メッセージを表示
        showNotification(
          '日記は更新されましたが、感情タグの更新に失敗しました',
          'warning',
          'mdi-alert'
        )
        // 少し待ってからリダイレクト
        setTimeout(() => {
          router.push('/diary-view')
        }, 2000)
        return
      }

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
      mood.value !== (diary.value.mood || 5)) // moodフィールドを使用

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

.mood-selector {
  margin: 16px 0;
}

.mood-buttons {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.mood-btn {
  flex: 1;
  margin: 0 1px;
  min-height: 48px;
  flex-direction: column;
  font-size: 0.75rem;
}

@media (max-width: 600px) {
  .mood-btn {
    min-height: 40px;
    font-size: 0.7rem;
  }
}
</style>
