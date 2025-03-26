<template>
  <v-container class="diary-view-page">
    <v-typography variant="h4" class="mb-4">日記一覧</v-typography>
    <v-data-table :headers="headers" :items="diaries" class="mb-4" hover>
      <template #[`item.date`]="{ item }">
        {{ formatDate(item.date) }}
      </template>
      <template #[`item.actions`]="{ item }">
        <v-btn
          icon="mdi-delete"
          variant="text"
          color="error"
          @click="handleDeleteDiary(item)"
          :loading="isDeleting"
        />
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
  id?: string
  date: string
  title: string
  content: string
}

const router = useRouter()
const diaries = ref<Diary[]>([])
const isDeleting = ref(false)

const headers = [
  {
    title: '日付',
    key: 'date',
    align: 'start',
    sortable: true,
    width: '120px',
  },
  {
    title: 'タイトル',
    key: 'title',
    align: 'start',
    sortable: true,
    width: '200px',
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
    width: '100px',
  },
]

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ja-JP')
}

const loadDiaries = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (error) throw error
    diaries.value = data || []
  } catch (error) {
    console.error('日記取得エラー:', error)
  }
}

const handleDeleteDiary = async (item: Diary) => {
  if (!item?.id || isDeleting.value) return

  if (!confirm('本当にこの日記を削除しますか？')) return

  try {
    isDeleting.value = true
    const { error } = await supabase.from('diaries').delete().eq('id', item.id)

    if (error) throw error
    await loadDiaries()
  } catch (error) {
    console.error('日記削除エラー:', error)
  } finally {
    isDeleting.value = false
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
  await loadDiaries()
})
</script>

<style scoped>
.diary-view-page {
  padding: 24px;
}
</style>
