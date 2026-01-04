<template>
  <div
    class="diary-preview-wrapper"
    @mouseenter="showPreview"
    @mouseleave="hidePreview"
    @focus="showPreview"
    @blur="hidePreview"
  >
    <!-- トリガー要素（スロットで提供） -->
    <slot :preview-visible="isVisible" />

    <!-- プレビューカード -->
    <v-menu
      v-model="isVisible"
      :activator="triggerElement || undefined"
      location="top"
      offset="10"
      :close-delay="200"
      :open-delay="300"
      max-width="400"
      no-click-animation
    >
      <v-card v-if="diary && isVisible" class="diary-preview-card" elevation="8">
        <!-- ヘッダー -->
        <v-card-subtitle class="preview-header pa-3 pb-2">
          <v-row no-gutters class="align-center">
            <v-col>
              <div class="text-subtitle-2 font-weight-bold text-truncate">
                {{ diary.title }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ formatDate(diary.created_at) }}
              </div>
            </v-col>
            <v-col cols="auto">
              <v-chip
                :color="getProgressColor(diary.progress_level)"
                size="x-small"
                variant="outlined"
              >
                {{ diary.progress_level }}%
              </v-chip>
            </v-col>
          </v-row>
        </v-card-subtitle>

        <!-- コンテンツプレビュー -->
        <v-card-text class="preview-content pa-3 pt-0">
          <div class="content-text">
            {{ truncatedContent }}
            <span v-if="isTruncated" class="text-primary">...続きを読む</span>
          </div>

          <!-- メタ情報 -->
          <v-row no-gutters class="mt-2 align-center">
            <v-col cols="auto" class="me-3">
              <v-icon icon="mdi-folder-outline" size="small" class="me-1" />
              <span class="text-caption">{{ diary.goal_category }}</span>
            </v-col>

            <v-col cols="auto" class="me-3">
              <v-icon icon="mdi-text" size="small" class="me-1" />
              <span class="text-caption">{{ diary.content.length }}文字</span>
            </v-col>

            <v-col cols="auto" v-if="(diary as any).mood_score !== undefined">
              <v-icon icon="mdi-emoticon-outline" size="small" class="me-1" />
              <v-rating
                :model-value="(diary as any).mood_score"
                readonly
                size="x-small"
                density="compact"
              />
            </v-col>
          </v-row>

          <!-- プログレスバー -->
          <v-progress-linear
            :model-value="diary.progress_level"
            height="6"
            :color="getProgressColor(diary.progress_level)"
            class="mt-2"
            rounded
          />
        </v-card-text>

        <!-- フッター -->
        <v-card-actions class="preview-footer pa-2">
          <v-btn
            size="small"
            variant="text"
            color="primary"
            @click="openDetail"
            prepend-icon="mdi-eye"
          >
            詳細表示
          </v-btn>

          <v-spacer />

          <v-btn
            size="small"
            variant="text"
            color="warning"
            @click="editDiary"
            prepend-icon="mdi-pencil"
          >
            編集
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { DiaryEntry } from '@/stores/data'

interface Props {
  diary: DiaryEntry | null
  maxLength?: number
  previewDelay?: number
  hideDelay?: number
}

interface Emits {
  (e: 'detail', diary: DiaryEntry): void
  (e: 'edit', diary: DiaryEntry): void
}

const props = withDefaults(defineProps<Props>(), {
  maxLength: 150,
  previewDelay: 300,
  hideDelay: 200,
})

const emit = defineEmits<Emits>()

// リアクティブな状態
const isVisible = ref(false)
const triggerElement = ref<HTMLElement | null>(null)
const showTimeout = ref<number | null>(null)
const hideTimeout = ref<number | null>(null)

// 計算されたプロパティ
const truncatedContent = computed(() => {
  if (!props.diary?.content) return ''

  const content = props.diary.content.trim()
  if (content.length <= props.maxLength) {
    return content
  }

  // 文の境界で切り詰める
  const truncated = content.substring(0, props.maxLength)
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('。'),
    truncated.lastIndexOf('！'),
    truncated.lastIndexOf('？'),
    truncated.lastIndexOf('\n'),
  )

  if (lastSentenceEnd > props.maxLength * 0.7) {
    return content.substring(0, lastSentenceEnd + 1)
  }

  // 単語の境界で切り詰める
  const lastSpace = truncated.lastIndexOf(' ')
  if (lastSpace > props.maxLength * 0.8) {
    return content.substring(0, lastSpace)
  }

  return truncated
})

const isTruncated = computed(() => {
  return props.diary?.content && props.diary.content.length > props.maxLength
})

// ユーティリティ関数
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
  })
}

const getProgressColor = (progress: number): string => {
  if (progress >= 80) return 'success'
  if (progress >= 50) return 'warning'
  return 'error'
}

// イベントハンドラー
const showPreview = async () => {
  if (!props.diary) return

  // 非表示のタイムアウトをクリア
  if (hideTimeout.value) {
    clearTimeout(hideTimeout.value)
    hideTimeout.value = null
  }

  // 表示のタイムアウトを設定
  showTimeout.value = window.setTimeout(async () => {
    await nextTick()

    // トリガー要素を設定
    const wrapper = document.querySelector('.diary-preview-wrapper')
    if (wrapper) {
      triggerElement.value = wrapper as HTMLElement
    }

    isVisible.value = true
  }, props.previewDelay)
}

const hidePreview = () => {
  // 表示のタイムアウトをクリア
  if (showTimeout.value) {
    clearTimeout(showTimeout.value)
    showTimeout.value = null
  }

  // 非表示のタイムアウトを設定
  hideTimeout.value = window.setTimeout(() => {
    isVisible.value = false
  }, props.hideDelay)
}

const openDetail = () => {
  if (!props.diary) return
  isVisible.value = false
  emit('detail', props.diary)
}

const editDiary = () => {
  if (!props.diary) return
  isVisible.value = false
  emit('edit', props.diary)
}

// クリーンアップ
const cleanup = () => {
  if (showTimeout.value) {
    clearTimeout(showTimeout.value)
    showTimeout.value = null
  }
  if (hideTimeout.value) {
    clearTimeout(hideTimeout.value)
    hideTimeout.value = null
  }
}

// コンポーネントがアンマウントされる時にクリーンアップ
import { onBeforeUnmount } from 'vue'
onBeforeUnmount(cleanup)
</script>

<style scoped>
.diary-preview-wrapper {
  display: inline-block;
  width: 100%;
}

.diary-preview-card {
  max-width: 400px;
  backdrop-filter: blur(8px);
  background-color: rgba(var(--v-theme-surface), 0.95);
}

.preview-header {
  background-color: rgba(var(--v-theme-primary), 0.05);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.preview-content {
  max-height: 200px;
  overflow: hidden;
}

.content-text {
  line-height: 1.5;
  color: rgba(var(--v-theme-on-surface), 0.87);
  word-wrap: break-word;
  word-break: break-word;
}

.preview-footer {
  background-color: rgba(var(--v-theme-surface), 0.5);
  border-top: 1px solid rgba(var(--v-theme-outline), 0.12);
}

/* アニメーション */
.v-menu > .v-overlay__content {
  animation: preview-fade-in 0.2s ease-out;
}

@keyframes preview-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ダークモード対応 */
.v-theme--dark .diary-preview-card {
  background-color: rgba(var(--v-theme-surface), 0.98);
}

/* モーション削減対応 */
@media (prefers-reduced-motion: reduce) {
  .v-menu > .v-overlay__content {
    animation: none;
  }
}

/* 高コントラスト対応 */
@media (prefers-contrast: high) {
  .preview-header,
  .preview-footer {
    border-color: rgba(var(--v-theme-outline), 0.38);
  }
}
</style>
