<template>
  <div class="pagination-core">
    <!-- ページサイズ選択 -->
    <div class="pagination-controls">
      <v-select
        :model-value="pageSize"
        :items="pageSizeOptions"
        :disabled="loading"
        label="表示件数"
        variant="outlined"
        density="compact"
        class="page-size-select"
        aria-label="1ページに表示するアイテム数を選択"
        @update:model-value="$emit('update:page-size', $event)"
      />

      <div class="pagination-info" role="status" aria-live="polite">
        <template v-if="total > 0"> {{ startIndex }} - {{ endIndex }} / {{ total }} 件 </template>
        <template v-else> データがありません </template>
      </div>

      <!-- ローディングインジケーター -->
      <v-progress-circular
        v-if="loading"
        size="20"
        width="2"
        color="primary"
        indeterminate
        class="loading-indicator"
      />
    </div>

    <!-- ページネーション（データがある場合のみ） -->
    <template v-if="total > 0">
      <v-pagination
        :model-value="page"
        :length="totalPages"
        :total-visible="responsiveVisiblePages"
        :disabled="loading"
        show-first-last-page
        rounded
        color="primary"
        aria-label="ページネーション"
        @update:model-value="$emit('update:page', $event)"
      />
    </template>

    <!-- 空の状態 -->
    <div v-else class="empty-state">
      <v-icon size="48" color="grey-lighten-1">mdi-database-outline</v-icon>
      <p>表示するデータがありません</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplay } from 'vuetify'

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
  visiblePages: 7,
})

defineEmits<Emits>()

// Vuetifyのdisplayコンポーザブル
const { mobile, smAndDown, mdAndDown } = useDisplay()

// 計算プロパティ
const startIndex = computed(() => {
  if (props.total === 0) return 0
  return (props.page - 1) * props.pageSize + 1
})

const endIndex = computed(() => {
  const end = props.page * props.pageSize
  return Math.min(end, props.total)
})

// レスポンシブ対応の表示ページ数
const responsiveVisiblePages = computed(() => {
  if (mobile.value) return 3
  if (smAndDown.value) return 5
  if (mdAndDown.value) return 6
  return props.visiblePages
})
</script>

<style scoped>
.pagination-core {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

/* コントロール部分 */
.pagination-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  justify-content: space-between;
}

.page-size-select {
  min-width: 140px;
  max-width: 180px;
  flex-shrink: 0;
}

.pagination-info {
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.8);
  white-space: nowrap;
  padding: 8px 12px;
  background-color: rgba(var(--v-theme-primary), 0.1);
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.loading-indicator {
  flex-shrink: 0;
}

/* 空の状態 */
.empty-state {
  text-align: center;
  padding: 32px 16px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.empty-state p {
  margin-top: 12px;
  font-size: 1rem;
  line-height: 1.5;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .pagination-controls {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .page-size-select {
    min-width: auto;
    max-width: none;
  }

  .pagination-info {
    text-align: center;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .pagination-controls {
    gap: 8px;
  }

  .pagination-info {
    padding: 6px 10px;
    font-size: 0.8rem;
  }
}
</style>
