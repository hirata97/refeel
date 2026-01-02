<template>
  <div class="pagination-animation-wrapper">
    <!-- スケルトンローダー -->
    <template v-if="showSkeleton">
      <div class="pagination-skeleton">
        <v-skeleton-loader type="text@3" class="skeleton-controls" />
        <v-skeleton-loader type="text" class="skeleton-pagination" />
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
          <v-btn variant="text" size="small" @click="$emit('retry')"> 再試行 </v-btn>
        </template>
      </v-alert>
    </template>

    <!-- 通常コンテンツ -->
    <template v-else>
      <div class="animated-content">
        <slot />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
interface Props {
  showSkeleton?: boolean
  error?: string | null
}

interface Emits {
  (e: 'dismiss-error'): void
  (e: 'retry'): void
}

withDefaults(defineProps<Props>(), {
  showSkeleton: false,
  error: null,
})

defineEmits<Emits>()
</script>

<style scoped>
.pagination-animation-wrapper {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-surface)),
    rgba(var(--v-theme-surface-variant), 0.1)
  );
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  padding: 20px;
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

/* アニメーション */
.animated-content {
  animation: fadeInUp 0.3s ease-out;
}

.animated-content > * {
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
@media (max-width: 768px) {
  .pagination-animation-wrapper {
    gap: 16px;
    padding: 16px;
    border-radius: 8px;
  }
}

@media (max-width: 480px) {
  .pagination-animation-wrapper {
    padding: 12px;
    gap: 12px;
  }
}

/* ダークテーマ対応 */
@media (prefers-color-scheme: dark) {
  .pagination-animation-wrapper {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    border-color: rgba(var(--v-theme-outline), 0.3);
  }
}

/* 印刷時の最適化 */
@media print {
  .pagination-animation-wrapper {
    box-shadow: none;
    border: 1px solid #ccc;
    background: white;
  }
}

/* 高コントラストモード */
@media (prefers-contrast: high) {
  .pagination-animation-wrapper {
    border: 2px solid;
  }
}

/* モーション低減設定 */
@media (prefers-reduced-motion: reduce) {
  .pagination-animation-wrapper,
  .animated-content,
  .animated-content > *,
  * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
