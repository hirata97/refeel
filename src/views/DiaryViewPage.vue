<template>
  <v-container class="diary-view-page">
    <v-typography variant="h4" class="mb-4">日記一覧</v-typography>

    <v-tabs v-model="selectedTab" class="mb-4">
      <v-tab v-for="month in availableMonths" :key="month" :value="month">
        {{ formatMonthTab(month) }}
      </v-tab>
    </v-tabs>

    <v-window v-model="selectedTab">
      <v-window-item v-for="month in availableMonths" :key="month" :value="month">
        <v-data-table :headers="headers" :items="getFilteredDiaries(month)" class="mb-4" hover>
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
      </v-window-item>
    </v-window>
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
const selectedTab = ref('')
const availableMonths = ref<string[]>([])

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
    title: '削除',
    key: 'actions',
    align: 'center',
    sortable: false,
    width: '100px',
  },
]

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ja-JP')
}

// 月表示用のフォーマット関数
const formatMonthTab = (monthStr: string): string => {
  const date = new Date(monthStr + '-01')
  return new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long' }).format(date)
}

// 選択された月の日記をフィルタリングする関数
const getFilteredDiaries = (month: string) => {
  return diaries.value.filter((diary) => diary.date.startsWith(month))
}

// 日記データから利用可能な月のリストを生成する関数
const updateAvailableMonths = () => {
  const months = new Set<string>()
  diaries.value.forEach((diary) => {
    const monthStr = diary.date.substring(0, 7) // YYYY-MM 形式で取得
    months.add(monthStr)
  })
  availableMonths.value = Array.from(months).sort().reverse()
  if (availableMonths.value.length > 0 && !selectedTab.value) {
    selectedTab.value = availableMonths.value[0]
  }
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
    updateAvailableMonths() // 月リストを更新
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
