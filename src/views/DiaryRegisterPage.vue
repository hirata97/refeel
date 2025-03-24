<template>
  <v-container class="diary-page" max-width="600">
    <!-- 新しい日記作成セクション -->
    <v-sheet class="form-section pa-4 my-4" elevation="2">
      <h2>新しい日記を追加する</h2>
      <v-form @submit.prevent="handleAddDiary">
        <v-text-field v-model="diaryEntry.title" label="タイトル" outlined required />
        <v-textarea v-model="diaryEntry.content" label="内容" outlined rows="3" required />
        <v-text-field v-model="diaryEntry.date" label="日付" type="date" outlined required />
        <v-slider v-model="diaryEntry.mood" label="今日の調子" min="1" max="5" step="1" />
        <v-btn type="submit" color="primary" block>日記を追加</v-btn>
      </v-form>
    </v-sheet>

    <!-- 最新の日記表示セクション -->
    <v-sheet class="latest-diary-section pa-4 my-4" elevation="2">
      <h2>最新の日記</h2>
      <div v-if="diaries.length">
        <v-card v-for="(_, index) in [diaries[diaries.length - 1]]" :key="index" class="mb-4">
          <v-card-title>{{ diaries[diaries.length - 1].title }}</v-card-title>
          <v-card-text>
            <p>{{ diaries[diaries.length - 1].content }}</p>
            <small>{{ diaries[diaries.length - 1].date }}</small>
          </v-card-text>
          <v-card-actions>
            <v-btn color="error" @click="handleDeleteDiary(diaries.length - 1)">削除</v-btn>
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
          <v-btn color="error" @click="handleDeleteDiary(index)">削除</v-btn>
        </v-card-actions>
      </v-card>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { isAuthenticated } from '@/utils/auth'

interface Diary {
  date: string
  title: string
  content: string
  mood: number
}

const router = useRouter()

// ユーティリティ: 現在の日付を "yyyy-mm-dd" 形式で返す
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

// onMounted で認証チェックと保存された日記の読み込みを実施
onMounted(() => {
  if (!isAuthenticated()) {
    router.push({
      path: '/login',
      query: { redirect: router.currentRoute.value.fullPath },
    })
  }
  const saved = localStorage.getItem('diaries')
  if (saved) {
    diaries.value = JSON.parse(saved)
  }
})

// 日記追加処理
const handleAddDiary = (): void => {
  if (!diaryEntry.value.title || !diaryEntry.value.content) {
    alert('タイトルと内容は必須です。')
    return
  }
  diaries.value.push({ ...diaryEntry.value })
  localStorage.setItem('diaries', JSON.stringify(diaries.value))
  diaryEntry.value = {
    date: getCurrentDate(),
    title: '',
    content: '',
    mood: 3,
  }
}

// 日記削除処理
const handleDeleteDiary = (index: number): void => {
  diaries.value.splice(index, 1)
  localStorage.setItem('diaries', JSON.stringify(diaries.value))
}
</script>

<style scoped>
.diary-page {
  margin: 0 auto;
}
</style>
