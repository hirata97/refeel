<template>
  <div class="pagination-controls-wrapper">
    <!-- 高速ナビゲーション -->
    <div class="quick-navigation" role="navigation" aria-label="クイックナビゲーション">
      <v-btn-group divided variant="outlined" class="navigation-buttons">
        <v-btn
          :disabled="page === 1 || loading"
          size="small"
          aria-label="最初のページに移動"
          @click="$emit('go-to-first')"
        >
          <v-icon start>mdi-page-first</v-icon>
          最初
        </v-btn>

        <v-btn
          :disabled="page === 1 || loading"
          size="small"
          aria-label="前のページに移動"
          @click="$emit('go-to-previous')"
        >
          <v-icon start>mdi-chevron-left</v-icon>
          前へ
        </v-btn>

        <v-btn
          :disabled="page === totalPages || loading"
          size="small"
          aria-label="次のページに移動"
          @click="$emit('go-to-next')"
        >
          次へ
          <v-icon end>mdi-chevron-right</v-icon>
        </v-btn>

        <v-btn
          :disabled="page === totalPages || loading"
          size="small"
          aria-label="最後のページに移動"
          @click="$emit('go-to-last')"
        >
          最後
          <v-icon end>mdi-page-last</v-icon>
        </v-btn>
      </v-btn-group>
    </div>

    <!-- モバイル専用ナビゲーション -->
    <div class="mobile-navigation" role="navigation" aria-label="モバイル用ナビゲーション">
      <v-btn
        :disabled="page === 1 || loading"
        variant="outlined"
        size="small"
        class="mobile-nav-btn"
        @click="$emit('go-to-previous')"
      >
        <v-icon start>mdi-chevron-left</v-icon>
        前へ
      </v-btn>

      <div class="mobile-page-info">{{ page }} / {{ totalPages }}</div>

      <v-btn
        :disabled="page === totalPages || loading"
        variant="outlined"
        size="small"
        class="mobile-nav-btn"
        @click="$emit('go-to-next')"
      >
        次へ
        <v-icon end>mdi-chevron-right</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  page: number
  totalPages: number
  loading?: boolean
}

interface Emits {
  (e: 'go-to-first'): void
  (e: 'go-to-previous'): void
  (e: 'go-to-next'): void
  (e: 'go-to-last'): void
}

withDefaults(defineProps<Props>(), {
  loading: false,
})

defineEmits<Emits>()
</script>

<style scoped>
.pagination-controls-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
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

/* ホバー効果 */
.v-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

/* フォーカス状態のアクセシビリティ */
.v-btn:focus-visible {
  outline: 2px solid rgba(var(--v-theme-primary));
  outline-offset: 2px;
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

@media (max-width: 480px) {
  .mobile-page-info {
    margin: 0 8px;
    padding: 6px 12px;
    font-size: 0.9rem;
  }
}

/* ダークテーマ対応 */
@media (prefers-color-scheme: dark) {
  .navigation-buttons {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
}

/* 印刷時の最適化 */
@media print {
  .quick-navigation,
  .mobile-navigation {
    display: none;
  }
}

/* モーション低減設定 */
@media (prefers-reduced-motion: reduce) {
  .v-btn,
  * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
