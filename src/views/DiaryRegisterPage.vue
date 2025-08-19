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
        <v-btn type="submit" color="primary" block :loading="isSubmitting">日記を追加</v-btn>
      </v-form>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDataStore } from '@/stores/data'
import { usePerformanceMonitor } from '@/utils/performance'
import { useSimpleDiaryForm } from '@/composables/useSimpleForm'

const router = useRouter()
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
  resetForm
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
    alert('認証が必要です。ログインしてください。')
    router.push('/login')
    return
  }

  try {
    // バリデーションとサニタイゼーションを実行
    const sanitizedData = await handleSubmit()
    if (!sanitizedData) return

    performance.start('create_diary')
    
    // データストアを使用した最適化された作成処理
    const diaryData = {
      user_id: authStore.user.id,
      title: sanitizedData.title || '',
      content: sanitizedData.content || '',
      goal_category: 'general', // デフォルトカテゴリ
      progress_level: Number(sanitizedData.mood) || 50
    }

    await dataStore.createDiary(diaryData)
    
    performance.end('create_diary')
    
    // 成功メッセージ
    alert('日記が登録されました！')
    
    // フォームリセット
    resetForm()
    
    // オプション: ダッシュボードにリダイレクト
    router.push('/dashboard')
    
  } catch (error: unknown) {
    console.error('日記作成エラー:', error)
    alert(`日記の作成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
</script>

<style scoped>
.diary-page {
  margin: 0 auto;
}
</style>
