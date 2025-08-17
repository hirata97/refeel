<template>
  <div class="pagination-wrapper">
    <!-- ページサイズ選択 -->
    <div class="pagination-controls">
      <v-select
        v-model="localPageSize"
        :items="pageSizeOptions"
        label="表示件数"
        variant="outlined"
        density="compact"
        class="page-size-select"
        @update:model-value="handlePageSizeChange"
      />
      
      <div class="pagination-info">
        {{ startIndex }} - {{ endIndex }} / {{ total }} 件
      </div>
    </div>

    <!-- ページネーション -->
    <v-pagination
      v-model="localPage"
      :length="totalPages"
      :total-visible="visiblePages"
      :disabled="loading"
      show-first-last-page
      @update:model-value="handlePageChange"
    />

    <!-- 高速ナビゲーション -->
    <div class="quick-navigation">
      <v-btn
        :disabled="localPage === 1 || loading"
        variant="outlined"
        size="small"
        @click="goToFirstPage"
      >
        最初
      </v-btn>
      
      <v-btn
        :disabled="localPage === 1 || loading"
        variant="outlined"
        size="small"
        @click="goToPreviousPage"
      >
        前へ
      </v-btn>

      <v-text-field
        v-model.number="jumpToPage"
        :max="totalPages"
        :min="1"
        type="number"
        label="ページ番号"
        variant="outlined"
        density="compact"
        class="page-jump"
        @keyup.enter="handleJumpToPage"
      />

      <v-btn
        :disabled="localPage === totalPages || loading"
        variant="outlined"
        size="small"
        @click="goToNextPage"
      >
        次へ
      </v-btn>

      <v-btn
        :disabled="localPage === totalPages || loading"
        variant="outlined"
        size="small"
        @click="goToLastPage"
      >
        最後
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

interface Props {
  page: number
  pageSize: number
  total: number
  totalPages: number
  loading?: boolean
  pageSizeOptions?: number[]
  visiblePages?: number
}

interface Emits {
  (e: 'update:page', page: number): void
  (e: 'update:page-size', pageSize: number): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  pageSizeOptions: () => [5, 10, 20, 50, 100],
  visiblePages: 7
})

const emit = defineEmits<Emits>()

// ローカル状態
const localPage = ref(props.page)
const localPageSize = ref(props.pageSize)
const jumpToPage = ref(props.page)

// 計算プロパティ
const startIndex = computed(() => {
  if (props.total === 0) return 0
  return (localPage.value - 1) * localPageSize.value + 1
})

const endIndex = computed(() => {
  const end = localPage.value * localPageSize.value
  return Math.min(end, props.total)
})

// イベントハンドラー
const handlePageChange = (page: number) => {
  localPage.value = page
  jumpToPage.value = page
  emit('update:page', page)
}

const handlePageSizeChange = (pageSize: number) => {
  localPageSize.value = pageSize
  // ページサイズ変更時は1ページ目に戻る
  localPage.value = 1
  jumpToPage.value = 1
  emit('update:page-size', pageSize)
}

const handleJumpToPage = () => {
  if (jumpToPage.value >= 1 && jumpToPage.value <= props.totalPages) {
    handlePageChange(jumpToPage.value)
  }
}

// ナビゲーション関数
const goToFirstPage = () => handlePageChange(1)
const goToLastPage = () => handlePageChange(props.totalPages)
const goToPreviousPage = () => handlePageChange(Math.max(1, localPage.value - 1))
const goToNextPage = () => handlePageChange(Math.min(props.totalPages, localPage.value + 1))

// プロパティ変更の監視
watch(() => props.page, (newPage) => {
  localPage.value = newPage
  jumpToPage.value = newPage
})

watch(() => props.pageSize, (newPageSize) => {
  localPageSize.value = newPageSize
})

// マウント時の初期化
onMounted(() => {
  jumpToPage.value = localPage.value
})
</script>

<style scoped>
.pagination-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background-color: rgba(var(--v-theme-surface));
  border-radius: 8px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  justify-content: space-between;
}

.page-size-select {
  min-width: 120px;
  max-width: 150px;
}

.pagination-info {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  white-space: nowrap;
}

.quick-navigation {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.page-jump {
  max-width: 100px;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .pagination-wrapper {
    gap: 12px;
  }
  
  .pagination-controls {
    flex-direction: column;
    gap: 8px;
  }
  
  .quick-navigation {
    gap: 4px;
  }
  
  .quick-navigation .v-btn {
    min-width: auto;
    padding: 0 8px;
  }
}

@media (max-width: 480px) {
  .pagination-wrapper {
    padding: 12px;
  }
  
  .quick-navigation {
    flex-direction: column;
    width: 100%;
  }
  
  .page-jump {
    width: 100%;
    max-width: none;
  }
}
</style>