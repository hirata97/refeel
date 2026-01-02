<template>
  <v-dialog
    v-model="isVisible"
    fullscreen
    :scrim="false"
    transition="dialog-bottom-transition"
    @keydown.esc="closeDiary"
    @keydown.left="navigatePrevious"
    @keydown.right="navigateNext"
  >
    <v-card v-if="diary" class="diary-detail-modal">
      <!-- ヘッダー -->
      <v-toolbar color="primary" dark class="diary-header">
        <v-btn icon="mdi-close" @click="closeDiary" aria-label="詳細モーダルを閉じる" />

        <v-toolbar-title class="diary-title">
          {{ diary.title }}
        </v-toolbar-title>

        <v-spacer />

        <!-- ナビゲーションボタン -->
        <v-btn
          icon="mdi-chevron-left"
          :disabled="!hasPrevious"
          @click="navigatePrevious"
          aria-label="前の日記"
        />

        <v-btn
          icon="mdi-chevron-right"
          :disabled="!hasNext"
          @click="navigateNext"
          aria-label="次の日記"
        />

        <!-- アクションメニュー -->
        <v-menu>
          <template #activator="{ props }">
            <v-btn icon="mdi-dots-vertical" v-bind="props" aria-label="アクションメニュー" />
          </template>

          <v-list>
            <v-list-item @click="editDiary">
              <template #prepend>
                <v-icon icon="mdi-pencil" />
              </template>
              <v-list-item-title>編集</v-list-item-title>
            </v-list-item>

            <v-list-item @click="copyContent">
              <template #prepend>
                <v-icon icon="mdi-content-copy" />
              </template>
              <v-list-item-title>内容をコピー</v-list-item-title>
            </v-list-item>

            <v-list-item @click="toggleFavorite">
              <template #prepend>
                <v-icon :icon="(diary as any).is_favorite ? 'mdi-heart' : 'mdi-heart-outline'" />
              </template>
              <v-list-item-title>
                {{ (diary as any).is_favorite ? 'お気に入り解除' : 'お気に入り追加' }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-toolbar>

      <!-- メタデータ -->
      <v-card-subtitle class="diary-metadata pa-4">
        <v-row no-gutters class="align-center">
          <v-col cols="auto" class="me-4">
            <v-chip
              :color="getProgressColor(diary.progress_level)"
              size="small"
              variant="outlined"
              prepend-icon="mdi-chart-line"
            >
              進捗 {{ diary.progress_level }}%
            </v-chip>
          </v-col>

          <v-col cols="auto" class="me-4">
            <v-chip
              color="primary"
              size="small"
              variant="outlined"
              prepend-icon="mdi-folder-outline"
            >
              {{ diary.goal_category }}
            </v-chip>
          </v-col>

          <v-col cols="auto" class="me-4">
            <v-chip color="info" size="small" variant="outlined" prepend-icon="mdi-calendar">
              {{ formatDate(diary.created_at) }}
            </v-chip>
          </v-col>

          <v-col cols="auto" class="me-4">
            <v-chip color="secondary" size="small" variant="outlined" prepend-icon="mdi-text">
              {{ contentLength }}文字
            </v-chip>
          </v-col>

          <v-col cols="auto" v-if="diary.updated_at !== diary.created_at">
            <v-chip color="warning" size="small" variant="outlined" prepend-icon="mdi-pencil">
              {{ formatDate(diary.updated_at) }} 更新
            </v-chip>
          </v-col>
        </v-row>

        <!-- 気分スコア表示 -->
        <v-row v-if="(diary as any).mood_score !== undefined" class="mt-2" no-gutters>
          <v-col cols="auto" class="align-center d-flex">
            <v-icon icon="mdi-emoticon-outline" class="me-2" />
            <span class="text-body-2">気分スコア:</span>
            <v-rating
              :model-value="(diary as any).mood_score"
              readonly
              half-increments
              size="small"
              class="ms-2"
            />
            <span class="text-body-2 ms-2">({{ (diary as any).mood_score }}/5)</span>
          </v-col>
        </v-row>
      </v-card-subtitle>

      <!-- 進捗バー -->
      <v-card-text class="pa-4 pb-0">
        <v-progress-linear
          :model-value="diary.progress_level"
          height="20"
          :color="getProgressColor(diary.progress_level)"
          class="progress-bar"
          rounded
        >
          <strong>{{ diary.progress_level }}%</strong>
        </v-progress-linear>
      </v-card-text>

      <!-- メインコンテンツ -->
      <v-card-text class="diary-content-wrapper pa-4">
        <div
          class="diary-content"
          :style="{ fontSize: fontSize + 'px' }"
          v-html="formattedContent"
        />

        <!-- フォントサイズ調整 -->
        <v-card class="font-size-controls mt-4" flat outlined>
          <v-card-text class="py-2">
            <v-row no-gutters align="center">
              <v-col cols="auto">
                <v-icon icon="mdi-format-font-size-decrease" class="me-2" />
                <span class="text-body-2">フォントサイズ:</span>
              </v-col>
              <v-col class="mx-4">
                <v-slider
                  v-model="fontSize"
                  :min="12"
                  :max="24"
                  :step="1"
                  hide-details
                  thumb-label
                />
              </v-col>
              <v-col cols="auto">
                <v-btn size="small" variant="text" @click="resetFontSize"> リセット </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-card-text>

      <!-- フッターアクション -->
      <v-card-actions class="diary-footer pa-4">
        <v-btn variant="outlined" color="warning" @click="editDiary" prepend-icon="mdi-pencil">
          編集
        </v-btn>

        <v-btn variant="text" @click="copyContent" prepend-icon="mdi-content-copy"> コピー </v-btn>

        <v-spacer />

        <v-btn variant="text" @click="closeDiary"> 閉じる </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { DiaryEntry } from '@/stores/data'
import { createLogger } from '@shared/utils'

const logger = createLogger('DIARYDETAILMODAL')

interface Props {
  modelValue: boolean
  diary: DiaryEntry | null
  diaries?: DiaryEntry[]
  currentIndex?: number
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'edit', diary: DiaryEntry): void
  (e: 'favorite', diary: DiaryEntry): void
  (e: 'navigate', direction: 'prev' | 'next'): void
}

const props = withDefaults(defineProps<Props>(), {
  diaries: () => [],
  currentIndex: -1,
})

const emit = defineEmits<Emits>()

// フォントサイズ設定
const fontSize = ref(16)
const defaultFontSize = 16

// 計算されたプロパティ
const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const contentLength = computed(() => {
  return props.diary?.content?.length ?? 0
})

const formattedContent = computed(() => {
  if (!props.diary?.content) return ''

  // 改行を<br>に変換し、段落を適切に表示
  return props.diary.content
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
})

const hasPrevious = computed(() => {
  return props.currentIndex > 0 && props.diaries.length > 1
})

const hasNext = computed(() => {
  return props.currentIndex < props.diaries.length - 1 && props.diaries.length > 1
})

// ユーティリティ関数
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

const getProgressColor = (progress: number): string => {
  if (progress >= 80) return 'success'
  if (progress >= 50) return 'warning'
  return 'error'
}

const resetFontSize = () => {
  fontSize.value = defaultFontSize
}

// イベントハンドラー
const closeDiary = () => {
  isVisible.value = false
}

const editDiary = () => {
  if (!props.diary) return
  emit('edit', props.diary)
}

const copyContent = async () => {
  if (!props.diary?.content) return

  try {
    await navigator.clipboard.writeText(props.diary.content)
    // TODO: スナックバー通知を追加
  } catch (error) {
    logger.error('コピーに失敗しました:', error)
  }
}

const toggleFavorite = () => {
  if (!props.diary) return
  emit('favorite', props.diary)
}

const navigatePrevious = () => {
  if (hasPrevious.value) {
    emit('navigate', 'prev')
  }
}

const navigateNext = () => {
  if (hasNext.value) {
    emit('navigate', 'next')
  }
}

// モーダルが開かれたときにフォントサイズをリセット
watch(isVisible, (newValue) => {
  if (newValue) {
    resetFontSize()
  }
})
</script>

<style scoped>
.diary-detail-modal {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.diary-header {
  flex-shrink: 0;
}

.diary-title {
  font-size: 1.2rem;
  font-weight: 600;
}

.diary-metadata {
  flex-shrink: 0;
  background-color: rgba(var(--v-theme-surface), 0.5);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.diary-content-wrapper {
  flex: 1;
  overflow-y: auto;
}

.diary-content {
  line-height: 1.8;
  color: rgba(var(--v-theme-on-surface), 0.87);
  word-wrap: break-word;
  word-break: break-word;
}

.diary-content :deep(p) {
  margin-bottom: 1rem;
}

.diary-content :deep(p:last-child) {
  margin-bottom: 0;
}

.progress-bar {
  border-radius: 8px;
}

.font-size-controls {
  background-color: rgba(var(--v-theme-surface), 0.3);
}

.diary-footer {
  flex-shrink: 0;
  border-top: 1px solid rgba(var(--v-theme-outline), 0.12);
}

/* モバイル対応 */
@media (max-width: 768px) {
  .diary-metadata .v-row {
    flex-direction: column;
    gap: 8px;
  }

  .diary-metadata .v-col {
    width: 100%;
  }
}

/* 印刷スタイル */
@media print {
  .diary-header,
  .diary-footer,
  .font-size-controls {
    display: none !important;
  }

  .diary-content-wrapper {
    overflow: visible;
  }

  .diary-content {
    font-size: 12pt;
    line-height: 1.6;
  }
}

/* ダークモード対応 */
.v-theme--dark .diary-content {
  color: rgba(var(--v-theme-on-surface), 0.87);
}

/* アクセシビリティ対応 */
@media (prefers-reduced-motion: reduce) {
  .v-dialog-transition {
    transition: none;
  }
}

/* 高コントラスト対応 */
@media (prefers-contrast: high) {
  .diary-metadata,
  .diary-footer {
    border-color: rgba(var(--v-theme-outline), 0.38);
  }

  .progress-bar {
    border: 1px solid rgba(var(--v-theme-outline), 0.38);
  }
}
</style>
