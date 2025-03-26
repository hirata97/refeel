<template>
  <v-container class="diary-view-page">
    <v-typography variant="h4" class="mb-4">日記一覧</v-typography>
    <v-data-table :headers="headers" :items="diaries" class="mb-4">
      <template v-slot:[`actions`]="{ item }">
        <v-btn icon @click="handleDeleteDiary(item)">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table>
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
}

const router = useRouter()

// 認証チェックと日記データのロード
onMounted(() => {
  if (!isAuthenticated()) {
    router.push({
      path: '/login',
      query: { redirect: router.currentRoute.value.fullPath },
    })
  } else {
    loadDiaries()
  }
})

// ローカルストレージから日記を読み込み
const diaries = ref<Diary[]>([])
const loadDiaries = () => {
  const savedDiaries = localStorage.getItem('diaries')
  if (savedDiaries) {
    diaries.value = JSON.parse(savedDiaries)
  }
}

// 日記削除処理
const handleDeleteDiary = (diaryToDelete: Diary) => {
  diaries.value = diaries.value.filter((diary) => diary !== diaryToDelete)
  localStorage.setItem('diaries', JSON.stringify(diaries.value))
}

// テーブル用ヘッダー定義
const headers = ref([
  { text: '日付', value: 'date' },
  { text: 'タイトル', value: 'title' },
  { text: '内容', value: 'content' },
  { text: '操作', value: 'actions', sortable: false },
])
</script>

<style scoped>
.diary-view-page {
  padding: 24px;
}
</style>
