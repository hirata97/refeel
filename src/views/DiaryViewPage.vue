<template>
  <v-container class="diary-view-page">
    <v-typography variant="h4" class="mb-4">日記一覧</v-typography>
    <v-data-table :headers="headers" :items="diaries" class="mb-4">
      <template v-slot:header>
        <thead>
          <tr>
            <th v-for="header in headers" :key="header.value">
              {{ header.text }}
            </th>
          </tr>
        </thead>
      </template>
      <template #[`item.actions`]="{ item }">
        <v-btn icon @click="handleDeleteDiary(item.raw)">
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
import { supabase } from '@/lib/supabase'

interface Diary {
  id?: string // 追加
  date: string
  title: string
  content: string
}

const router = useRouter()

// Supabaseからログインユーザーの日記を読み込む
const diaries = ref<Diary[]>([])
const loadDiaries = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const { data, error } = await supabase.from('diaries').select('*').eq('user_id', user.id)
    if (error) {
      console.error('日記取得エラー:', error)
      return
    }
    diaries.value = data || []
  }
}

// 日記削除処理（Supabaseから削除）
const handleDeleteDiary = async (diaryToDelete: Diary) => {
  if (!diaryToDelete.id) return
  const { error } = await supabase.from('diaries').delete().eq('id', diaryToDelete.id)
  if (error) {
    console.error('日記削除エラー:', error)
    return
  }
  // 再読み込み
  await loadDiaries()
}

// 認証チェックと日記データのロード
onMounted(async () => {
  if (!isAuthenticated()) {
    router.push({
      path: '/login',
      query: { redirect: router.currentRoute.value.fullPath },
    })
  } else {
    await loadDiaries()
  }
})

// テーブル用ヘッダー定義
const headers = ref([
  {
    title: '日付',
    key: 'date',
    align: 'start',
    sortable: true,
  },
  {
    title: 'タイトル',
    key: 'title',
    align: 'start',
    sortable: true,
  },
  {
    title: '内容',
    key: 'content',
    align: 'start',
    sortable: true,
  },
  {
    title: '操作',
    key: 'actions',
    align: 'center',
    sortable: false,
  },
])
</script>

<style scoped>
.diary-view-page {
  padding: 24px;
}
</style>
