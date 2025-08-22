<template>
  <v-container class="diary-view-page">
    <v-typography variant="h4" class="mb-4">日記一覧</v-typography>

    <!-- フィルターコンポーネント -->
    <DiaryFilter
      :filters="filter"
      :categories="availableCategories"
      :loading="loading"
      @update:filters="filter = $event"
      @apply-filters="handleApplyFilters"
      @clear-filters="handleClearFilters"
    />

    <!-- データテーブル -->
    <v-data-table
      :headers="headers"
      :items="diaries || []"
      :loading="loading"
      hover
      class="mb-4"
      hide-default-footer
    >
      <template #[`item.created_at`]="{ item }">
        {{ formatDate(item.created_at) }}
      </template>
      <template #[`item.goal_category`]="{ item }">
        <v-chip size="small" color="primary" variant="outlined">
          {{ item.goal_category }}
        </v-chip>
      </template>
      <template #[`item.progress_level`]="{ item }">
        <v-progress-linear
          :model-value="item.progress_level"
          height="20"
          :color="getProgressColor(item.progress_level)"
          class="progress-bar"
        >
          <strong>{{ item.progress_level }}%</strong>
        </v-progress-linear>
      </template>
      <template #[`item.actions`]="{ item }">
        <v-btn
          icon="mdi-eye"
          variant="text"
          color="primary"
          size="small"
          @click="viewDiary(item)"
        />
        <v-btn
          icon="mdi-pencil"
          variant="text"
          color="warning"
          size="small"
          @click="editDiary(item)"
        />
        <v-btn
          icon="mdi-delete"
          variant="text"
          color="error"
          size="small"
          @click="handleDeleteDiary(item)"
          :loading="isDeleting"
        />
      </template>

      <!-- 空の状態 -->
      <template #no-data>
        <div class="no-data">
          <v-icon size="48" color="grey">mdi-notebook-outline</v-icon>
          <p>該当する日記が見つかりません</p>
          <v-btn color="primary" @click="clearFilters">フィルターをクリア</v-btn>
        </div>
      </template>
    </v-data-table>

    <!-- ページネーション -->
    <PaginationComponent
      :page="paginationStore.getCurrentState.page"
      :page-size="paginationStore.getCurrentState.pageSize"
      :total="paginationStore.getCurrentState.total"
      :total-pages="paginationStore.getCurrentState.totalPages"
      :loading="paginationStore.getCurrentLoading"
      :show-skeleton="showPaginationSkeleton"
      :error="paginationStore.getCurrentError"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      @dismiss-error="handleDismissError"
      @retry="handleRetry"
    />

    <!-- 詳細ダイアログ -->
    <v-dialog v-model="showDetailDialog" max-width="600">
      <v-card v-if="selectedDiary">
        <v-card-title>{{ selectedDiary.title }}</v-card-title>
        <v-card-subtitle>
          {{ formatDate(selectedDiary.created_at) }} | {{ selectedDiary.goal_category }}
        </v-card-subtitle>
        <v-card-text>
          <div class="diary-content">{{ selectedDiary.content }}</div>
          <v-progress-linear
            :model-value="selectedDiary.progress_level"
            height="20"
            :color="getProgressColor(selectedDiary.progress_level)"
            class="mt-4"
          >
            <strong>進捗: {{ selectedDiary.progress_level }}%</strong>
          </v-progress-linear>
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" color="warning" @click="editDiary(selectedDiary)"> 編集 </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="showDetailDialog = false">閉じる</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
import { usePaginationStore } from '@/stores/pagination'
import { useDiaries } from '@/composables/useDataFetch'
import type { DiaryEntry } from '@/stores/data'
import DiaryFilter from '@/components/DiaryFilter.vue'
import PaginationComponent from '@/components/PaginationComponent.vue'

const router = useRouter()
const dataStore = useDataStore()
const authStore = useAuthStore()
const paginationStore = usePaginationStore()

// ページネーション初期化とデータ読み込み
onMounted(async () => {
  paginationStore.initialize()

  // URLから復元した状態でデータを読み込み
  await refresh()
})

onUnmounted(() => {
  paginationStore.cleanup()
})

// サーバーサイドページネーション対応のデータ取得
const {
  diaries,
  loading,
  filter,
  pagination,
  changePage,
  changePageSize,
  applyFilters,
  clearFilters,
  categoryStats,
  refresh,
} = useDiaries({
  immediate: false, // 手動で初期化
  cache: true,
  debounceMs: 300,
})

// UI状態
const isDeleting = ref(false)
const showDetailDialog = ref(false)
const selectedDiary = ref<DiaryEntry | null>(null)
const showPaginationSkeleton = ref(false)

// ページネーション状態とuseDataFetchの同期
watch(
  () => paginationStore.getCurrentState,
  (newState) => {
    // PaginationStoreの状態をuseDataFetchに反映
    pagination.value = {
      ...pagination.value,
      page: newState.page,
      pageSize: newState.pageSize,
      total: newState.total,
      totalPages: newState.totalPages,
    }
  },
  { deep: true, immediate: true },
)

// フィルター状態の同期
watch(
  () => paginationStore.getCurrentFilters,
  (newFilters) => {
    // PaginationStoreのフィルターをuseDataFetchに反映
    Object.assign(filter.value, newFilters)
  },
  { deep: true, immediate: true },
)

// 利用可能なカテゴリ（統計から取得）
const availableCategories = computed(() => {
  return Object.keys(categoryStats.value)
})

// テーブルヘッダー
const headers = [
  {
    title: '作成日',
    key: 'created_at',
    align: 'start' as const,
    sortable: false,
    width: '120px',
  },
  {
    title: 'タイトル',
    key: 'title',
    align: 'start' as const,
    sortable: false,
    width: '200px',
  },
  {
    title: 'カテゴリ',
    key: 'goal_category',
    align: 'start' as const,
    sortable: false,
    width: '150px',
  },
  {
    title: '進捗',
    key: 'progress_level',
    align: 'center' as const,
    sortable: false,
    width: '120px',
  },
  {
    title: '内容',
    key: 'content',
    align: 'start' as const,
    sortable: false,
  },
  {
    title: '操作',
    key: 'actions',
    align: 'center' as const,
    sortable: false,
    width: '150px',
  },
]

// ユーティリティ関数
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ja-JP')
}

const getProgressColor = (progress: number): string => {
  if (progress >= 80) return 'success'
  if (progress >= 50) return 'warning'
  return 'error'
}

// 日記詳細表示
const viewDiary = (diary: DiaryEntry) => {
  selectedDiary.value = diary
  showDetailDialog.value = true
}

// 日記編集
const editDiary = (diary: DiaryEntry) => {
  if (!diary?.id) return
  showDetailDialog.value = false
  router.push(`/diary-edit/${diary.id}`)
}

// 新しいページネーションイベントハンドラー
const handlePageChange = (page: number) => {
  paginationStore.changePage(page)
  changePage(page)
}

const handlePageSizeChange = (pageSize: number) => {
  paginationStore.changePageSize(pageSize)
  changePageSize(pageSize)
}

const handleDismissError = () => {
  paginationStore.setError(null)
}

const handleRetry = async () => {
  try {
    paginationStore.setError(null)
    showPaginationSkeleton.value = true
    await refresh()

    // 最新のデータでページネーション状態を更新
    paginationStore.updateState({
      total: pagination.value.total,
      totalPages: pagination.value.totalPages,
    })
  } catch (err) {
    console.error('データの再取得に失敗:', err)
    paginationStore.setError('データの再取得に失敗しました')
  } finally {
    showPaginationSkeleton.value = false
  }
}

// フィルター適用処理を拡張
const handleApplyFilters = () => {
  paginationStore.updateFilters(filter.value)
  applyFilters()
}

const handleClearFilters = () => {
  paginationStore.clearFilters()
  clearFilters()
}

// 削除処理
const handleDeleteDiary = async (item: DiaryEntry) => {
  if (!item?.id || isDeleting.value || !authStore.user?.id) return

  if (!confirm('本当にこの日記を削除しますか？')) return

  try {
    isDeleting.value = true

    await dataStore.deleteDiary(item.id, authStore.user.id)

    // データ再取得
    await refresh()

    // ページネーション状態を更新
    paginationStore.updateState({
      total: pagination.value.total,
      totalPages: pagination.value.totalPages,
    })
  } catch (error) {
    console.error('日記削除エラー:', error)
    paginationStore.setError('日記の削除に失敗しました')
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
.diary-view-page {
  padding: 24px;
}

.progress-bar {
  border-radius: 4px;
}

.no-data {
  text-align: center;
  padding: 48px 24px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.no-data p {
  margin: 16px 0;
  font-size: 1.1rem;
}

.diary-content {
  white-space: pre-wrap;
  line-height: 1.6;
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
  background-color: rgba(var(--v-theme-surface), 0.5);
  border-radius: 4px;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .diary-view-page {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .diary-view-page {
    padding: 12px;
  }
}
</style>
