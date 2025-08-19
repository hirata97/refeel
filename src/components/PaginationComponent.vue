<template>
  <div class="pagination-wrapper">
    <!-- ローディング状態のスケルトン -->
    <template v-if="showSkeleton">
      <div class="pagination-skeleton">
        <v-skeleton-loader
          type="text@3"
          class="skeleton-controls"
        />
        <v-skeleton-loader
          type="text"
          class="skeleton-pagination"
        />
      </div>
    </template>

    <!-- エラー状態 -->
    <template v-else-if="error">
      <v-alert
        type="error"
        variant="outlined"
        class="pagination-error"
        closable
        @click:close="$emit('dismiss-error')"
      >
        <template #prepend>
          <v-icon>mdi-alert-circle</v-icon>
        </template>
        <div>
          <strong>ページネーションエラー</strong>
          <p>{{ error }}</p>
        </div>
        <template #append>
          <v-btn
            variant="text"
            size="small"
            @click="$emit('retry')"
          >
            再試行
          </v-btn>
        </template>
      </v-alert>
    </template>

    <!-- 通常の表示 -->
    <template v-else>
      <!-- ページサイズ選択 -->
      <div class="pagination-controls">
        <v-select
          v-model="localPageSize"
          :items="pageSizeOptions"
          :disabled="loading"
          label="表示件数"
          variant="outlined"
          density="compact"
          class="page-size-select"
          aria-label="1ページに表示するアイテム数を選択"
          @update:model-value="handlePageSizeChange"
        />
        
        <div class="pagination-info" role="status" aria-live="polite">
          <template v-if="total > 0">
            {{ startIndex }} - {{ endIndex }} / {{ total }} 件
          </template>
          <template v-else>
            データがありません
          </template>
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
          v-model="localPage"
          :length="totalPages"
          :total-visible="responsiveVisiblePages"
          :disabled="loading"
          show-first-last-page
          rounded
          color="primary"
          aria-label="ページネーション"
          @update:model-value="handlePageChange"
        />

        <!-- 高速ナビゲーション -->
        <div class="quick-navigation" role="navigation" aria-label="クイックナビゲーション">
          <v-btn-group divided variant="outlined" class="navigation-buttons">
            <v-btn
              :disabled="localPage === 1 || loading"
              size="small"
              aria-label="最初のページに移動"
              @click="goToFirstPage"
            >
              <v-icon start>mdi-page-first</v-icon>
              最初
            </v-btn>
            
            <v-btn
              :disabled="localPage === 1 || loading"
              size="small"
              aria-label="前のページに移動"
              @click="goToPreviousPage"
            >
              <v-icon start>mdi-chevron-left</v-icon>
              前へ
            </v-btn>
          </v-btn-group>

          <v-text-field
            v-model.number="jumpToPage"
            :max="totalPages"
            :min="1"
            :disabled="loading"
            type="number"
            label="ページ番号"
            variant="outlined"
            density="compact"
            class="page-jump"
            aria-label="移動したいページ番号を入力してEnterキーを押してください"
            @keyup.enter="handleJumpToPage"
            @blur="validateJumpInput"
          >
            <template #append-inner>
              <v-btn
                :disabled="!isValidJump || loading"
                variant="text"
                size="x-small"
                icon="mdi-keyboard-return"
                aria-label="指定したページに移動"
                @click="handleJumpToPage"
              />
            </template>
          </v-text-field>

          <v-btn-group divided variant="outlined" class="navigation-buttons">
            <v-btn
              :disabled="localPage === totalPages || loading"
              size="small"
              aria-label="次のページに移動"
              @click="goToNextPage"
            >
              次へ
              <v-icon end>mdi-chevron-right</v-icon>
            </v-btn>

            <v-btn
              :disabled="localPage === totalPages || loading"
              size="small"
              aria-label="最後のページに移動"
              @click="goToLastPage"
            >
              最後
              <v-icon end>mdi-page-last</v-icon>
            </v-btn>
          </v-btn-group>
        </div>

        <!-- モバイル専用ナビゲーション -->
        <div class="mobile-navigation" role="navigation" aria-label="モバイル用ナビゲーション">
          <v-btn
            :disabled="localPage === 1 || loading"
            variant="outlined"
            size="small"
            class="mobile-nav-btn"
            @click="goToPreviousPage"
          >
            <v-icon start>mdi-chevron-left</v-icon>
            前へ
          </v-btn>

          <div class="mobile-page-info">
            {{ localPage }} / {{ totalPages }}
          </div>

          <v-btn
            :disabled="localPage === totalPages || loading"
            variant="outlined"
            size="small"
            class="mobile-nav-btn"
            @click="goToNextPage"
          >
            次へ
            <v-icon end>mdi-chevron-right</v-icon>
          </v-btn>
        </div>
      </template>

      <!-- 空の状態 -->
      <div v-else class="empty-state">
        <v-icon size="48" color="grey-lighten-1">mdi-database-outline</v-icon>
        <p>表示するデータがありません</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useDisplay } from 'vuetify'

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
  visiblePages: 7
})

const emit = defineEmits<Emits>()

// Vuetifyのdisplayコンポーザブル
const { mobile, smAndDown, mdAndDown } = useDisplay()

// ローカル状態
const localPage = ref(props.page)
const localPageSize = ref(props.pageSize)
const jumpToPage = ref(props.page)
const scrollPosition = ref(0)

// 計算プロパティ
const startIndex = computed(() => {
  if (props.total === 0) return 0
  return (localPage.value - 1) * localPageSize.value + 1
})

const endIndex = computed(() => {
  const end = localPage.value * localPageSize.value
  return Math.min(end, props.total)
})

// レスポンシブ対応の表示ページ数
const responsiveVisiblePages = computed(() => {
  if (mobile.value) return 3
  if (smAndDown.value) return 5
  if (mdAndDown.value) return 6
  return props.visiblePages
})

// ジャンプ入力の妥当性チェック
const isValidJump = computed(() => {
  return jumpToPage.value >= 1 && jumpToPage.value <= props.totalPages && 
         jumpToPage.value !== localPage.value
})

// スクロール位置の保存と復元
const saveScrollPosition = () => {
  scrollPosition.value = window.scrollY || document.documentElement.scrollTop
}

const restoreScrollPosition = () => {
  if (scrollPosition.value > 0) {
    window.scrollTo({
      top: scrollPosition.value,
      behavior: 'smooth'
    })
  }
}

// イベントハンドラー
const handlePageChange = (page: number) => {
  saveScrollPosition()
  
  localPage.value = page
  jumpToPage.value = page
  emit('update:page', page)
  
  // ページ変更後にスクロール位置を復元（少し遅延させる）
  setTimeout(restoreScrollPosition, 100)
}

const handlePageSizeChange = (pageSize: number) => {
  localPageSize.value = pageSize
  // ページサイズ変更時は1ページ目に戻る
  const newPage = 1
  localPage.value = newPage
  jumpToPage.value = newPage
  emit('update:page-size', pageSize)
  emit('update:page', newPage)
  
  // トップにスクロール
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleJumpToPage = () => {
  if (isValidJump.value) {
    handlePageChange(jumpToPage.value)
  }
}

const validateJumpInput = () => {
  if (jumpToPage.value < 1) {
    jumpToPage.value = 1
  } else if (jumpToPage.value > props.totalPages) {
    jumpToPage.value = props.totalPages
  }
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
watch(() => props.page, (newPage) => {
  if (newPage !== localPage.value) {
    localPage.value = newPage
    jumpToPage.value = newPage
  }
})

watch(() => props.pageSize, (newPageSize) => {
  if (newPageSize !== localPageSize.value) {
    localPageSize.value = newPageSize
  }
})

// ライフサイクル
onMounted(() => {
  jumpToPage.value = localPage.value
  
  // キーボードイベントリスナーを追加
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  // キーボードイベントリスナーを削除
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.pagination-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, rgba(var(--v-theme-surface)), rgba(var(--v-theme-surface-variant), 0.1));
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

/* スケルトンローダー */
.pagination-skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.skeleton-controls {
  height: 60px;
}

.skeleton-pagination {
  height: 40px;
}

/* エラー表示 */
.pagination-error {
  width: 100%;
  margin: 0;
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

/* 高速ナビゲーション */
.quick-navigation {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.navigation-buttons {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-jump {
  min-width: 120px;
  max-width: 160px;
}

/* モバイル専用ナビゲーション */
.mobile-navigation {
  display: none;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px 0;
}

.mobile-nav-btn {
  flex: 0 0 auto;
}

.mobile-page-info {
  flex: 1;
  text-align: center;
  font-size: 1rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.8);
  padding: 8px 16px;
  background-color: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 20px;
  margin: 0 16px;
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

/* ホバー効果 */
.v-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

/* フォーカス状態のアクセシビリティ */
.v-btn:focus-visible,
.v-text-field:focus-within,
.v-select:focus-within {
  outline: 2px solid rgba(var(--v-theme-primary));
  outline-offset: 2px;
}

/* アニメーション */
.pagination-wrapper > * {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* レスポンシブ対応 */
@media (max-width: 960px) {
  .quick-navigation {
    display: none;
  }
  
  .mobile-navigation {
    display: flex;
  }
}

@media (max-width: 768px) {
  .pagination-wrapper {
    gap: 16px;
    padding: 16px;
    border-radius: 8px;
  }
  
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
  .pagination-wrapper {
    padding: 12px;
    gap: 12px;
  }
  
  .pagination-controls {
    gap: 8px;
  }
  
  .pagination-info {
    padding: 6px 10px;
    font-size: 0.8rem;
  }
  
  .mobile-page-info {
    margin: 0 8px;
    padding: 6px 12px;
    font-size: 0.9rem;
  }
}

/* ダークテーマ対応 */
@media (prefers-color-scheme: dark) {
  .pagination-wrapper {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    border-color: rgba(var(--v-theme-outline), 0.3);
  }
  
  .navigation-buttons {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
}

/* 印刷時の最適化 */
@media print {
  .pagination-wrapper {
    box-shadow: none;
    border: 1px solid #ccc;
    background: white;
  }
  
  .quick-navigation,
  .mobile-navigation {
    display: none;
  }
}

/* 高コントラストモード */
@media (prefers-contrast: high) {
  .pagination-wrapper {
    border: 2px solid;
  }
  
  .pagination-info {
    border: 2px solid;
  }
}

/* モーション低減設定 */
@media (prefers-reduced-motion: reduce) {
  .pagination-wrapper,
  .v-btn,
  * {
    animation: none !important;
    transition: none !important;
  }
}
</style>