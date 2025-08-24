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
      <template #[`item.content`]="{ item }">
        <DiaryPreview
          :diary="item"
          @detail="viewDiary"
          @edit="editDiary"
        >
          <template #default="{ previewVisible }">
            <div
              class="diary-content-cell"
              :class="{ 'preview-active': previewVisible }"
              tabindex="0"
              role="button"
              :aria-label="`日記「${item.title}」のプレビューを表示`"
            >
              {{ item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content }}
            </div>
          </template>
        </DiaryPreview>
      </template>

      <template #[`item.actions`]="{ item }">
        <v-btn
          icon="mdi-eye"
          variant="text"
          color="primary"
          size="small"
          @click="viewDiary(item)"
          aria-label="詳細表示"
        />
        <v-btn
          icon="mdi-pencil"
          variant="text"
          color="warning"
          size="small"
          @click="editDiary(item)"
          aria-label="編集"
        />
        <v-btn
          icon="mdi-delete"
          variant="text"
          color="error"
          size="small"
          @click="handleDeleteDiary(item)"
          :loading="isDeleting"
          aria-label="削除"
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

    <!-- 詳細モーダル -->
    <DiaryDetailModal
      v-model="showDetailDialog"
      :diary="selectedDiary"
      :diaries="diaries || []"
      :current-index="currentDiaryIndex"
      @edit="handleEditDiary"
      @favorite="handleToggleFavorite"
      @navigate="handleNavigateDiary"
    />
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
import DiaryDetailModal from '@/components/DiaryDetailModal.vue'
import DiaryPreview from '@/components/DiaryPreview.vue'

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
const currentDiaryIndex = ref(-1)
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
  currentDiaryIndex.value = diaries.value?.findIndex(d => d.id === diary.id) ?? -1
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

// 詳細モーダルのイベントハンドラー
const handleEditDiary = (diary: DiaryEntry) => {
  showDetailDialog.value = false
  editDiary(diary)
}

const handleToggleFavorite = async (diary: DiaryEntry) => {
  // TODO: お気に入り機能の実装
  // 現在はデータモデルにis_favoriteフィールドがないため、将来の実装で対応
  console.log('お気に入り切り替え:', diary.title)
}

const handleNavigateDiary = (direction: 'prev' | 'next') => {
  if (!diaries.value || currentDiaryIndex.value === -1) return
  
  let newIndex = currentDiaryIndex.value
  if (direction === 'prev' && newIndex > 0) {
    newIndex = newIndex - 1
  } else if (direction === 'next' && newIndex < diaries.value.length - 1) {
    newIndex = newIndex + 1
  }
  
  if (newIndex !== currentDiaryIndex.value) {
    currentDiaryIndex.value = newIndex
    selectedDiary.value = diaries.value[newIndex]
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

/* プレビュー機能のスタイル */
.diary-content-cell {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.diary-content-cell:hover,
.diary-content-cell:focus {
  background-color: rgba(var(--v-theme-primary), 0.08);
  outline: none;
}

.diary-content-cell.preview-active {
  background-color: rgba(var(--v-theme-primary), 0.12);
  font-weight: 500;
}

.diary-content-cell:focus-visible {
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.5);
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
