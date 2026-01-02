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
        <!-- 気分選択コンポーネント -->
        <MoodSelector v-model="mood" />

        <!-- 感情タグ選択コンポーネント -->
        <EmotionTagSelector v-model="selectedEmotionTags" class="mt-4" />

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
    <DiaryDeleteDialog
      v-model="deleteDialog"
      :diary="diary"
      :is-deleting="isDeleting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

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
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSimpleDiaryForm } from '@/composables/useSimpleForm'
import { useDiaryLoader } from '@/composables/useDiaryLoader'
import { useDiaryEditor } from '@/composables/useDiaryEditor'
import { useNotification } from '@features/notifications'
import EmotionTagSelector from '@/components/mood/EmotionTagSelector.vue'
import DiaryDeleteDialog from '@/components/diary/DiaryDeleteDialog.vue'
import MoodSelector from '@/components/mood/MoodSelector.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const diaryId = route.params.id as string

// Composablesの使用
const {
  title,
  content,
  date,
  mood,
  titleError,
  contentError,
  dateError,
  validateField,
  handleSubmit,
  setFormData,
} = useSimpleDiaryForm()

const { diary, loading, selectedEmotionTags, loadError, loadDiary } = useDiaryLoader()

const {
  isSubmitting,
  isDeleting,
  deleteDialog,
  updateDiary: updateDiaryComposable,
  deleteDiary: deleteDiaryComposable,
  showDeleteConfirmation,
  cancelDelete,
  goBackWithConfirmation,
  redirectToDiaryView,
} = useDiaryEditor()

const { notification, showSuccess, showError, showWarning } = useNotification()

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

  const success = await loadDiary(diaryId, authStore.user!.id)

  if (success && diary.value) {
    // フォームに既存データを設定
    setFormData({
      title: diary.value.title,
      content: diary.value.content,
      date: new Date(diary.value.created_at).toISOString().split('T')[0],
      mood: diary.value.mood || 5,
    })
  } else if (loadError.value) {
    showError(loadError.value)
  }
})

// 日記更新処理
const updateDiary = async (): Promise<void> => {
  if (!diary.value || !authStore.isAuthenticated || !authStore.user) {
    showError('認証が必要です。ログインしてください。')
    router.push('/login')
    return
  }

  // バリデーションとサニタイゼーションを実行
  const sanitizedData = await handleSubmit()
  if (!sanitizedData) return

  // 更新データの準備
  const updateData = {
    title: sanitizedData.title,
    content: sanitizedData.content,
    mood: Number(sanitizedData.mood) || 5,
    updated_at: new Date().toISOString(),
  }

  // 更新実行
  const result = await updateDiaryComposable(diary.value.id, updateData, selectedEmotionTags.value)

  if (result.success) {
    if (result.warning) {
      showWarning(result.message, 2000)
      redirectToDiaryView(2000)
    } else {
      showSuccess(result.message)
      redirectToDiaryView()
    }
  } else {
    showError(result.message)
  }
}

// 削除実行処理
const confirmDelete = async () => {
  if (!diary.value || !authStore.user?.id) return

  const result = await deleteDiaryComposable(diary.value.id, authStore.user.id)

  if (result.success) {
    showSuccess(result.message)
    redirectToDiaryView()
  } else {
    showError(result.message)
  }
}

// 戻る処理（未保存変更の警告付き）
const goBack = () => {
  goBackWithConfirmation(
    {
      title: title.value,
      content: content.value,
      date: date.value,
      mood: mood.value,
    },
    diary.value,
  )
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
