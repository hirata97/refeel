<template>
  <PaginationAnimation
    :show-skeleton="showSkeleton"
    :error="error"
    @dismiss-error="$emit('dismiss-error')"
    @retry="$emit('retry')"
  >
    <div class="pagination-main">
      <!-- 基本ページネーション -->
      <PaginationCore
        :page="localPage"
        :page-size="localPageSize"
        :total="total"
        :total-pages="totalPages"
        :loading="loading"
        :page-size-options="pageSizeOptions"
        :visible-pages="visiblePages"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />

      <!-- ナビゲーション制御 -->
      <template v-if="total > 0">
        <PaginationControls
          :page="localPage"
          :total-pages="totalPages"
          :loading="loading"
          @go-to-first="goToFirstPage"
          @go-to-previous="goToPreviousPage"
          @go-to-next="goToNextPage"
          @go-to-last="goToLastPage"
        />

        <!-- ページジャンプ機能 -->
        <PaginationJump
          :page="localPage"
          :total-pages="totalPages"
          :loading="loading"
          @jump-to-page="handlePageChange"
        />
      </template>
    </div>
  </PaginationAnimation>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import PaginationCore from './pagination/PaginationCore.vue'
import PaginationControls from './pagination/PaginationControls.vue'
import PaginationJump from './pagination/PaginationJump.vue'
import PaginationAnimation from './pagination/PaginationAnimation.vue'

interface Props {
  page: number
  pageSize: number
  total: number
  totalPages: number
  loading?: boolean
  pageSizeOptions?: number[]
  visiblePages?: number
  showSkeleton?: boolean
  error?: string | null
}

interface Emits {
  (e: 'update:page', page: number): void
  (e: 'update:page-size', pageSize: number): void
  (e: 'dismiss-error'): void
  (e: 'retry'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showSkeleton: false,
  error: null,
  pageSizeOptions: () => [5, 10, 20, 50, 100],
  visiblePages: 7,
})

const emit = defineEmits<Emits>()

// ローカル状態
const localPage = ref(props.page)
const localPageSize = ref(props.pageSize)
const scrollPosition = ref(0)

// スクロール位置の保存と復元
const saveScrollPosition = () => {
  scrollPosition.value = window.scrollY || document.documentElement.scrollTop
}

const restoreScrollPosition = () => {
  if (scrollPosition.value > 0) {
    window.scrollTo({
      top: scrollPosition.value,
      behavior: 'smooth',
    })
  }
}

// イベントハンドラー
const handlePageChange = (page: number) => {
  saveScrollPosition()

  localPage.value = page
  emit('update:page', page)

  // ページ変更後にスクロール位置を復元（少し遅延させる）
  setTimeout(restoreScrollPosition, 100)
}

const handlePageSizeChange = (pageSize: number) => {
  localPageSize.value = pageSize
  // ページサイズ変更時は1ページ目に戻る
  const newPage = 1
  localPage.value = newPage
  emit('update:page-size', pageSize)
  emit('update:page', newPage)

  // トップにスクロール
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ナビゲーション関数
const goToFirstPage = () => {
  if (localPage.value !== 1) {
    handlePageChange(1)
  }
}

const goToLastPage = () => {
  if (localPage.value !== props.totalPages) {
    handlePageChange(props.totalPages)
  }
}

const goToPreviousPage = () => {
  const prevPage = Math.max(1, localPage.value - 1)
  if (prevPage !== localPage.value) {
    handlePageChange(prevPage)
  }
}

const goToNextPage = () => {
  const nextPage = Math.min(props.totalPages, localPage.value + 1)
  if (nextPage !== localPage.value) {
    handlePageChange(nextPage)
  }
}

// キーボードナビゲーション
const handleKeydown = (event: KeyboardEvent) => {
  if (props.loading || props.showSkeleton || props.error) return

  // Alt+矢印キーでページナビゲーション
  if (event.altKey) {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        goToPreviousPage()
        break
      case 'ArrowRight':
        event.preventDefault()
        goToNextPage()
        break
      case 'Home':
        event.preventDefault()
        goToFirstPage()
        break
      case 'End':
        event.preventDefault()
        goToLastPage()
        break
    }
  }
}

// プロパティ変更の監視
watch(
  () => props.page,
  (newPage) => {
    if (newPage !== localPage.value) {
      localPage.value = newPage
    }
  },
)

watch(
  () => props.pageSize,
  (newPageSize) => {
    if (newPageSize !== localPageSize.value) {
      localPageSize.value = newPageSize
    }
  },
)

// ライフサイクル
onMounted(() => {
  // キーボードイベントリスナーを追加
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  // キーボードイベントリスナーを削除
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.pagination-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  width: 100%;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .pagination-main {
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .pagination-main {
    gap: 12px;
  }
}
</style>
