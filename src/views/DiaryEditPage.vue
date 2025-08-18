<template>
  <v-container class="diary-edit-page" max-width="600">
    <v-sheet class="form-section pa-4 my-4" elevation="2">
      <div class="header-section mb-4">
        <h2>日記を編集する</h2>
        <v-btn 
          variant="text" 
          icon="mdi-arrow-left" 
          @click="goBack"
          class="back-button"
        />
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
          <template #thumb-label="{ modelValue }">
            {{ modelValue }}%
          </template>
        </v-slider>
        
        <div class="action-buttons">
          <v-btn 
            type="submit" 
            color="primary" 
            :loading="isSubmitting"
            class="mr-2"
          >
            更新する
          </v-btn>
          <v-btn 
            variant="outlined" 
            @click="goBack"
          >
            キャンセル
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
  setFormData
} = useSimpleDiaryForm()

// 状態管理
const diary = ref<DiaryEntry | null>(null)
const loading = ref(true)
const diaryId = route.params.id as string

// 認証チェックとデータ取得
onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  if (!diaryId) {
    router.push('/diaryview')
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
      console.error('日記が見つかりません:', diaryId)
      return
    }

    diary.value = diaryData
    
    // フォームに既存データを設定
    setFormData({
      title: diaryData.title,
      content: diaryData.content,
      date: new Date(diaryData.created_at).toISOString().split('T')[0],
      mood: diaryData.progress_level || 0
    })
    
    performance.end('load_diary_for_edit')
    
  } catch (error) {
    console.error('日記読み込みエラー:', error)
  } finally {
    loading.value = false
  }
}

// 日記更新処理
const updateDiary = async (): Promise<void> => {
  if (!diary.value || !authStore.isAuthenticated || !authStore.user) {
    alert('認証が必要です。ログインしてください。')
    router.push('/login')
    return
  }

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
      updated_at: new Date().toISOString()
    }

    // データストアを使用した更新処理
    await dataStore.updateDiary(diary.value.id, updateData)
    
    performance.end('update_diary')
    
    // 成功メッセージ
    alert('日記が更新されました！')
    
    // 日記一覧ページにリダイレクト
    router.push('/diaryview')
    
  } catch (error: unknown) {
    console.error('日記更新エラー:', error)
    alert(`日記の更新に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// 戻る処理
const goBack = () => {
  router.back()
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