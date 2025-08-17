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
        <v-data-table :headers="headers" :items="getFilteredDiaries(month)" class="mb-4" hover :loading="loading">
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
import { ref, onMounted, computed } from 'vue'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
import { useDiaries } from '@/composables/useDataFetch'
import { usePerformanceMonitor } from '@/utils/performance'

interface Diary {
  id?: string
  date: string
  title: string
  content: string
}

const dataStore = useDataStore()
const authStore = useAuthStore()
const performance = usePerformanceMonitor()

// 最適化されたデータ取得
const {
  diaries: optimizedDiaries,
  loading,
  refresh
} = useDiaries({
  immediate: true,
  cache: true,
  debounceMs: 300
})

const isDeleting = ref(false)
const selectedTab = ref('')

// メモ化された計算プロパティ
const availableMonths = computed(() => {
  if (!optimizedDiaries.value) return []
  
  const months = new Set<string>()
  optimizedDiaries.value.forEach(diary => {
    const date = new Date(diary.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    months.add(monthKey)
  })
  
  return Array.from(months).sort().reverse()
})

// レガシー互換性のためのdiaries参照
const diaries = computed(() => {
  return optimizedDiaries.value?.map(diary => ({
    id: diary.id,
    date: diary.created_at,
    title: diary.title,
    content: diary.content
  })) || []
})

const headers = [
  {
    title: '日付',
    key: 'date',
    align: 'start' as const,
    sortable: true,
    width: '120px',
  },
  {
    title: 'タイトル',
    key: 'title',
    align: 'start' as const,
    sortable: true,
    width: '200px',
  },
  {
    title: '内容',
    key: 'content',
    align: 'start' as const,
    sortable: true,
  },
  {
    title: '削除',
    key: 'actions',
    align: 'center' as const,
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

// 最適化されたフィルタリング（メモ化）
const getFilteredDiaries = (month: string) => {
  performance.start('filter_diaries')
  const filtered = diaries.value.filter((diary) => diary.date.startsWith(month))
  performance.end('filter_diaries')
  return filtered
}

// 自動タブ選択（新しいデータが読み込まれた時のみ実行）
const updateSelectedTab = () => {
  if (availableMonths.value.length > 0 && !selectedTab.value) {
    selectedTab.value = availableMonths.value[0]
  }
}

// レガシー関数は削除（新しいuseDiariesフックを使用）

// 最適化された削除処理
const handleDeleteDiary = async (item: Diary) => {
  if (!item?.id || isDeleting.value || !authStore.user?.id) return

  if (!confirm('本当にこの日記を削除しますか？')) return

  try {
    isDeleting.value = true
    performance.start('delete_diary')
    
    await dataStore.deleteDiary(item.id, authStore.user.id)
    
    // データ再取得（キャッシュ無効化も含む）
    await refresh()
    
    performance.end('delete_diary')
  } catch (error) {
    console.error('日記削除エラー:', error)
  } finally {
    isDeleting.value = false
  }
}

// 初期化時にタブ選択を更新
onMounted(() => {
  updateSelectedTab()
})
</script>

<style scoped>
.diary-view-page {
  padding: 24px;
}
</style>
