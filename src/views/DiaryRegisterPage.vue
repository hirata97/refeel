<template>
  <v-container class="diary-page" max-width="600">
    <!-- 新しい日記作成セクション -->
    <v-sheet class="form-section pa-4 my-4" elevation="2">
      <h2>新しい日記を追加する</h2>
      <v-form @submit.prevent="addDiary">
        <v-text-field v-model="diaryEntry.title" label="タイトル" outlined required />
        <v-textarea v-model="diaryEntry.content" label="内容" outlined rows="3" required />
        <v-text-field v-model="diaryEntry.date" label="日付" type="date" outlined required />
        <v-slider v-model="diaryEntry.mood" label="今日の調子" :min="1" :max="5" :step="1" />
        <v-btn type="submit" color="primary" block>日記を追加</v-btn>
      </v-form>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDataStore } from '@/stores/data'
import { usePerformanceMonitor, debounce } from '@/utils/performance'

const router = useRouter()
const authStore = useAuthStore()
const dataStore = useDataStore()
const performance = usePerformanceMonitor()

interface Diary {
  id?: string
  user_id?: string
  date: string
  title: string
  content: string
  mood: number
}

// 最適化された現在日付取得（メモ化）
const getCurrentDate = (() => {
  let cached = ''
  let lastCheck = 0
  
  return (): string => {
    const now = Date.now()
    // 1分以内は同じ日付を返す
    if (now - lastCheck < 60000 && cached) {
      return cached
    }
    
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    
    cached = `${yyyy}-${mm}-${dd}`
    lastCheck = now
    return cached
  }
})()

const diaryEntry = ref<Diary>({
  date: getCurrentDate(),
  title: '',
  content: '',
  mood: 3,
})

const resetDiaryEntry = () => {
  diaryEntry.value = {
    date: getCurrentDate(),
    title: '',
    content: '',
    mood: 3,
  }
}

// バリデーション（計算プロパティで最適化）
const isValid = computed(() => {
  return diaryEntry.value.title.trim().length > 0 && 
         diaryEntry.value.content.trim().length > 0
})

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
  if (!isValid.value) {
    alert('タイトルと内容は必須です。')
    return
  }

  // 認証状態を再確認
  if (!authStore.isAuthenticated || !authStore.user) {
    alert('認証が必要です。ログインしてください。')
    router.push('/login')
    return
  }

  try {
    performance.start('create_diary')
    
    // データストアを使用した最適化された作成処理
    const diaryData = {
      user_id: authStore.user.id,
      title: diaryEntry.value.title.trim(),
      content: diaryEntry.value.content.trim(),
      goal_category: 'default', // デフォルトカテゴリ
      progress_level: diaryEntry.value.mood || 3
    }

    await dataStore.createDiary(diaryData)
    
    performance.end('create_diary')
    
    // 成功メッセージ
    alert('日記が登録されました！')
    
    // フォームリセット
    resetDiaryEntry()
    
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
