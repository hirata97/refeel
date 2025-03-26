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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { isAuthenticated } from '@/utils/auth'
import { supabase } from '@/lib/supabase'

interface Diary {
  id?: string
  user_id?: string
  date: string
  title: string
  content: string
  mood: number
}

const router = useRouter()

const getCurrentDate = (): string => {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const diaryEntry = ref<Diary>({
  date: getCurrentDate(),
  title: '',
  content: '',
  mood: 3,
})

const userId = ref<string>('')

const resetDiaryEntry = () => {
  diaryEntry.value = {
    date: getCurrentDate(),
    title: '',
    content: '',
    mood: 3,
  }
}

const initializeUser = async () => {
  if (!isAuthenticated()) {
    router.push({
      path: '/login',
      query: { redirect: router.currentRoute.value.fullPath },
    })
    return
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    userId.value = user.id
  }
}

onMounted(() => {
  initializeUser()
})

const addDiary = async (): Promise<void> => {
  if (!diaryEntry.value.title || !diaryEntry.value.content) {
    alert('タイトルと内容は必須です。')
    return
  }
  try {
    const { error } = await supabase.from('diaries').insert([
      {
        user_id: userId.value,
        title: diaryEntry.value.title,
        content: diaryEntry.value.content,
        date: diaryEntry.value.date,
        mood: diaryEntry.value.mood,
      },
    ])
    if (error) {
      throw error
    }
    resetDiaryEntry()
    alert('日記の記録が成功しました')
  } catch (err: unknown) {
    let message = '不明なエラー'
    if (err instanceof Error) {
      message = err.message
    }
    console.error('Supabase Error:', err)
    alert(`日記の保存に失敗しました: ${message}`)
  }
}
</script>

<style scoped>
.diary-page {
  margin: 0 auto;
}
</style>
