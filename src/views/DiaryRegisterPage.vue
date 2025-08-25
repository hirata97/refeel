<template>
  <v-container class="diary-page" max-width="600">
    <!-- 新しい日記作成セクション -->
    <v-sheet class="form-section pa-4 my-4" elevation="2">
      <h2>新しい日記を追加する</h2>
      <v-form @submit.prevent="addDiary">
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
          rows="3"
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
              <v-btn :value="1" size="large" class="mood-btn">
                <v-icon>mdi-emoticon-sad</v-icon>
                <span class="ml-2">1</span>
              </v-btn>
              <v-btn :value="2" size="large" class="mood-btn">
                <v-icon>mdi-emoticon-neutral</v-icon>
                <span class="ml-2">2</span>
              </v-btn>
              <v-btn :value="3" size="large" class="mood-btn">
                <v-icon>mdi-emoticon</v-icon>
                <span class="ml-2">3</span>
              </v-btn>
              <v-btn :value="4" size="large" class="mood-btn">
                <v-icon>mdi-emoticon-happy</v-icon>
                <span class="ml-2">4</span>
              </v-btn>
              <v-btn :value="5" size="large" class="mood-btn">
                <v-icon>mdi-emoticon-excited</v-icon>
                <span class="ml-2">5</span>
              </v-btn>
            </v-btn-toggle>
          </v-card-text>
        </v-card>
        <v-btn 
          type="submit" 
          color="primary" 
          block 
          :loading="isSubmitting || loadingStore.isLoading('create_diary')"
        >
          日記を追加
        </v-btn>
      </v-form>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDataStore } from '@/stores/data'
import { useNotificationStore } from '@/stores/notification'
import { useLoadingStore } from '@/stores/loading'
import { usePerformanceMonitor } from '@/utils/performance'
import { useSimpleDiaryForm } from '@/composables/useSimpleForm'

const router = useRouter()
const authStore = useAuthStore()
const dataStore = useDataStore()
const notificationStore = useNotificationStore()
const loadingStore = useLoadingStore()
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
  resetForm,
} = useSimpleDiaryForm()

// 古いコードは削除し、バリデーションフィールドを使用

// デバウンス処理されたオートセーブ（実装例）
// const debouncedAutoSave = debounce(async () => {
//   if (isValid.value && authStore.user?.id) {
//     try {
//       // オートセーブロジック（必要に応じて実装）
//       console.log('Auto-saving draft...')
//     } catch (error) {
//       console.error('オートセーブエラー:', error)
//     }
//   }
// }, 2000)

// 認証チェックとユーザー初期化
onMounted(() => {
  // 認証状態をチェック
  if (!authStore.isAuthenticated) {
    // 認証されていない場合はログインページにリダイレクト
    router.push('/login')
    return
  }
})

// 最適化された日記作成処理
const addDiary = async (): Promise<void> => {
  // 認証状態を再確認
  if (!authStore.isAuthenticated || !authStore.user) {
    notificationStore.showError(
      '認証が必要です',
      'ログインしてください。'
    )
    router.push('/login')
    return
  }

  try {
    await loadingStore.withLoading('create_diary', async () => {
      // バリデーションとサニタイゼーションを実行
      const sanitizedData = await handleSubmit()
      if (!sanitizedData) return

      performance.start('create_diary')
      
      // データストアを使用した最適化された作成処理
      const diaryData = {
        user_id: authStore.user!.id, // 上で既にチェック済み
        title: sanitizedData.title || '',
        content: sanitizedData.content || '',
        date: sanitizedData.date || new Date().toISOString().split('T')[0], // YYYY-MM-DD形式
        mood: Number(sanitizedData.mood) || 3, // 1-5の値をそのまま使用、デフォルトは3
        goal_category: 'general',
        progress_level: 0
      }

      await dataStore.createDiary(diaryData)
      
      performance.end('create_diary')
      
      // 成功メッセージ
      notificationStore.showSuccess(
        '日記が登録されました！',
        'ダッシュボードに移動します。'
      )
      
      // フォームリセット
      resetForm()
      
      // オプション: ダッシュボードにリダイレクト
      router.push('/dashboard')
    })
  } catch (error: unknown) {
    console.error('日記作成エラー:', error)
    notificationStore.showError(
      '日記の作成に失敗しました',
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
}
</script>

<style scoped>
.diary-page {
  margin: 0 auto;
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
  margin: 0 2px;
  min-height: 56px;
  flex-direction: column;
}

@media (max-width: 600px) {
  .mood-btn {
    min-height: 48px;
  }
}
</style>
