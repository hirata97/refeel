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
import { supabase } from '@/lib/supabase'

interface Diary {
  id?: string
  user_id?: string
  date: string
  title: string
  content: string
  mood: number
}


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

  // 同日の日記が既に存在しているかチェック
  const { data: existingEntries, error: fetchError } = await supabase
    .from('diaries')
    .select('id')
    .eq('user_id', userId.value)
    .eq('date', diaryEntry.value.date)

  if (fetchError) {
    console.error('日記取得エラー:', fetchError)
    alert(`日記の取得に失敗しました: ${fetchError.message}`)
    return
  }

  if (existingEntries && existingEntries.length > 0) {
    // 既に日記が存在する場合は更新確認ダイアログを表示
    const shouldUpdate = confirm('本日の記録は既に登録されています。更新しますか？')
    if (!shouldUpdate) {
      return
    }
    // 先頭のレコードを更新する
    const diaryId = existingEntries[0].id
    const { error: updateError } = await supabase
      .from('diaries')
      .update({
        title: diaryEntry.value.title,
        content: diaryEntry.value.content,
        date: diaryEntry.value.date,
        mood: diaryEntry.value.mood,
      })
      .eq('id', diaryId)
    if (updateError) {
      console.error('更新エラー:', updateError)
      alert(`日記の更新に失敗しました: ${updateError.message}`)
      return
    }
    resetDiaryEntry()
    alert('日記の更新が成功しました')
    return
  }

  // 同日のレコードが無ければ新規登録する
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
    console.error('登録エラー:', error)
    alert(`日記の保存に失敗しました: ${error.message}`)
    return
  }
  resetDiaryEntry()
  alert('日記の記録が成功しました')
}
</script>

<style scoped>
.diary-page {
  margin: 0 auto;
}
</style>
