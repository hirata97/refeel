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

    <!-- 最新の日記表示セクション -->
    <v-sheet class="latest-diary-section pa-4 my-4" elevation="2">
      <h2>最新の日記</h2>
      <div v-if="latestDiary">
        <v-card class="mb-4">
          <v-card-title>{{ latestDiary.title }}</v-card-title>
          <v-card-text>
            <p>{{ latestDiary.content }}</p>
            <small>{{ latestDiary.date }}</small>
          </v-card-text>
          <v-card-actions>
            <v-btn color="error" @click="deleteDiary(latestIndex)">削除</v-btn>
          </v-card-actions>
        </v-card>
      </div>
      <p v-else>日記がありません。</p>
    </v-sheet>

    <!-- 全ての日記表示セクション -->
    <v-sheet class="all-diaries-section pa-4 my-4" elevation="2">
      <h2>全ての日記</h2>
      <v-card v-for="(diary, index) in diaries" :key="index" class="mb-4">
        <v-card-title>{{ diary.date }}</v-card-title>
        <v-card-text>
          <p>{{ diary.title }}</p>
          <p>{{ diary.content }}</p>
          <p>調子: {{ diary.mood }}</p>
        </v-card-text>
        <v-card-actions>
          <v-btn color="error" @click="deleteDiary(index)">削除</v-btn>
        </v-card-actions>
      </v-card>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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

const diaries = ref<Diary[]>([])
const diaryEntry = ref<Diary>({
  date: getCurrentDate(),
  title: '',
  content: '',
  mood: 3,
})

const userId = ref<string>('')

const fetchDiaries = async () => {
  const { data, error } = await supabase.from('diaries').select('*').eq('user_id', userId.value)
  if (!error && data) {
    diaries.value = data as Diary[]
  }
}

onMounted(async () => {
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
  await fetchDiaries()
})

const addDiary = async (): Promise<void> => {
  if (!diaryEntry.value.title || !diaryEntry.value.content) {
    alert('タイトルと内容は必須です。')
    return
  }
  const { data, error } = await supabase.from('diaries').insert([
    {
      user_id: userId.value,
      title: diaryEntry.value.title,
      content: diaryEntry.value.content,
      date: diaryEntry.value.date,
      mood: diaryEntry.value.mood,
    },
  ])
  if (error) {
    console.error('Supabase Error:', error)
    alert(`日記の保存に失敗しました: ${error.message}`)
    return
  }
  if (data && data.length > 0) {
    // 最新のデータを再読み込み
    await fetchDiaries()
  }
  // フォームのリセット
  diaryEntry.value = {
    date: getCurrentDate(),
    title: '',
    content: '',
    mood: 3,
  }
}

const deleteDiary = (index: number): void => {
  diaries.value.splice(index, 1)
  // 今後Supabaseとの同期実装が必要な場合はここに追加
}

const latestDiary = computed(() => {
  return diaries.value.length ? diaries.value[diaries.value.length - 1] : null
})
const latestIndex = computed(() => diaries.value.length - 1)
</script>

<style scoped>
.diary-page {
  margin: 0 auto;
}
</style>
