<template>
  <div class="diary-page">
    <h1>日記登録ページ</h1>

    <div class="form-section">
      <h2>新しい日記を追加する</h2>
      <form @submit.prevent="handleAddDiary">
        <div>
          <label for="title">タイトル</label>
          <input v-model="diaryEntry.title" id="title" type="text" required />
        </div>
        <div>
          <label for="content">内容</label>
          <textarea v-model="diaryEntry.content" id="content" rows="3" required></textarea>
        </div>
        <div>
          <label for="date">日付</label>
          <input v-model="diaryEntry.date" id="date" type="date" required />
        </div>
        <div>
          <label>今日の調子</label>
          <input type="range" v-model="diaryEntry.mood" min="1" max="5" />
          <span>{{ diaryEntry.mood }}</span>
        </div>
        <button type="submit">日記を追加</button>
      </form>
    </div>

    <div class="latest-diary-section">
      <h2>最新の日記</h2>
      <div v-if="diaries.length">
        <div
          class="diary-entry"
          v-for="(diary, index) in [diaries[diaries.length - 1]]"
          :key="index"
        >
          <h3>{{ diary.title }}</h3>
          <p>{{ diary.content }}</p>
          <small>{{ diary.date }}</small>
          <button @click="handleDeleteDiary(index)">削除</button>
        </div>
      </div>
      <p v-else>日記がありません。</p>
    </div>

    <div class="all-diaries-section">
      <h2>全ての日記</h2>
      <div v-for="(diary, index) in diaries" :key="index">
        <div class="diary-card">
          <h3>{{ diary.date }}</h3>
          <p>{{ diary.title }}</p>
          <p>{{ diary.content }}</p>
          <p>調子: {{ diary.mood }}</p>
          <button @click="handleDeleteDiary(index)">削除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, onMounted } from 'vue'

export interface Diary {
  date: string
  title: string
  content: string
  mood: number
}

export default {
  name: 'DiaryPage',
  setup() {
    const diaries = ref<Diary[]>([])
    const diaryEntry = ref<Diary>({
      date: getCurrentDate(),
      title: '',
      content: '',
      mood: 3,
    })

    function getCurrentDate() {
      const today = new Date()
      const yyyy = today.getFullYear()
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const dd = String(today.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }

    // ローカルストレージから日記データを読み込む
    onMounted(() => {
      const savedDiaries = localStorage.getItem('diaries')
      if (savedDiaries) {
        diaries.value = JSON.parse(savedDiaries)
      }
    })

    // 日記追加
    const handleAddDiary = () => {
      if (!diaryEntry.value.title || !diaryEntry.value.content) {
        alert('タイトルと内容は必須です。')
        return
      }
      diaries.value.push(diaryEntry.value)
      localStorage.setItem('diaries', JSON.stringify(diaries.value))
      // フォームのリセット
      diaryEntry.value = {
        date: getCurrentDate(),
        title: '',
        content: '',
        mood: 3,
      }
    }

    // 日記削除
    const handleDeleteDiary = (index: number) => {
      diaries.value.splice(index, 1)
      localStorage.setItem('diaries', JSON.stringify(diaries.value))
    }

    return {
      diaries,
      diaryEntry,
      handleAddDiary,
      handleDeleteDiary,
    }
  },
}
</script>

<style scoped>
.diary-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
}

.form-section,
.latest-diary-section,
.all-diaries-section {
  margin-bottom: 20px;
}

form input,
form textarea,
form button {
  display: block;
  width: 100%;
  margin: 10px 0;
}

.diary-card {
  background-color: #f9f9f9;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ccc;
}

button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
}
</style>
