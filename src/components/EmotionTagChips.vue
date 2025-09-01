<template>
  <div class="emotion-tag-chips" :class="{ 'clickable': clickable }">
    <v-chip
      v-for="tag in displayTags"
      :key="tag.id"
      :color="getCategoryColor(tag.category)"
      :size="size"
      :variant="variant"
      :class="chipClass"
      :tabindex="clickable ? 0 : -1"
      :role="clickable ? 'button' : undefined"
      :aria-label="clickable ? `${tag.name}でフィルタリング` : tag.name"
      @click="handleTagClick(tag)"
      @keydown.enter="handleTagClick(tag)"
      @keydown.space.prevent="handleTagClick(tag)"
    >
      <v-icon
        v-if="showIcons"
        :icon="getCategoryIcon(tag.category)"
        size="small"
        class="mr-1"
      />
      {{ tag.name }}
    </v-chip>

    <!-- 表示制限時の「+N個」表示 -->
    <v-chip
      v-if="remainingCount > 0"
      :size="size"
      variant="outlined"
      color="primary"
      class="remaining-count-chip"
      :tabindex="clickable ? 0 : -1"
      :role="clickable ? 'button' : undefined"
      :aria-label="`他${remainingCount}個の感情タグ`"
      @click="handleMoreClick"
      @keydown.enter="handleMoreClick"
      @keydown.space.prevent="handleMoreClick"
    >
      +{{ remainingCount }}個
    </v-chip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EmotionTag, EmotionCategory } from '@/types/emotion-tags'

interface Props {
  /** 表示する感情タグの配列 */
  tags: EmotionTag[]
  /** 最大表示数（デフォルト: 無制限） */
  maxDisplay?: number
  /** チップのサイズ */
  size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large'
  /** チップのバリアント */
  variant?: 'text' | 'flat' | 'elevated' | 'tonal' | 'outlined' | 'plain'
  /** クリック可能かどうか */
  clickable?: boolean
  /** アイコンを表示するかどうか */
  showIcons?: boolean
  /** 空の場合のメッセージ */
  emptyMessage?: string
}

interface Emits {
  /** タグがクリックされた時 */
  (e: 'tag-click', tag: EmotionTag): void
  /** 「+N個」がクリックされた時 */
  (e: 'more-click', hiddenTags: EmotionTag[]): void
}

const props = withDefaults(defineProps<Props>(), {
  maxDisplay: undefined,
  size: 'small',
  variant: 'tonal',
  clickable: false,
  showIcons: false,
  emptyMessage: '感情タグなし'
})

const emit = defineEmits<Emits>()

// 表示するタグ
const displayTags = computed(() => {
  if (!props.maxDisplay || props.tags.length <= props.maxDisplay) {
    return props.tags
  }
  return props.tags.slice(0, props.maxDisplay)
})

// 残りのタグ数
const remainingCount = computed(() => {
  if (!props.maxDisplay || props.tags.length <= props.maxDisplay) {
    return 0
  }
  return props.tags.length - props.maxDisplay
})

// 隠れているタグ
const hiddenTags = computed(() => {
  if (!props.maxDisplay || props.tags.length <= props.maxDisplay) {
    return []
  }
  return props.tags.slice(props.maxDisplay)
})

// チップのクラス
const chipClass = computed(() => {
  return {
    'emotion-chip': true,
    'emotion-chip--clickable': props.clickable
  }
})

/**
 * 感情カテゴリに対応する色を取得
 */
const getCategoryColor = (category: EmotionCategory): string => {
  switch (category) {
    case 'positive':
      return 'success'
    case 'negative':
      return 'error'
    case 'neutral':
      return 'info'
    default:
      return 'grey'
  }
}

/**
 * 感情カテゴリに対応するアイコンを取得
 */
const getCategoryIcon = (category: EmotionCategory): string => {
  switch (category) {
    case 'positive':
      return 'mdi-emoticon-happy'
    case 'negative':
      return 'mdi-emoticon-sad'
    case 'neutral':
      return 'mdi-emoticon-neutral'
    default:
      return 'mdi-emoticon'
  }
}

/**
 * タグクリック処理
 */
const handleTagClick = (tag: EmotionTag): void => {
  if (props.clickable) {
    emit('tag-click', tag)
  }
}

/**
 * 「+N個」クリック処理
 */
const handleMoreClick = (): void => {
  if (props.clickable && hiddenTags.value.length > 0) {
    emit('more-click', hiddenTags.value)
  }
}
</script>

<style scoped>
.emotion-tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.emotion-chip {
  transition: all 0.2s ease-in-out;
  font-size: 0.75rem;
  font-weight: 500;
}

.emotion-chip--clickable {
  cursor: pointer;
}

.emotion-chip--clickable:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.emotion-chip--clickable:focus {
  outline: 2px solid rgba(var(--v-theme-primary), 0.5);
  outline-offset: 2px;
}

.remaining-count-chip {
  font-size: 0.7rem;
  font-weight: 600;
}

.clickable .remaining-count-chip {
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.clickable .remaining-count-chip:hover {
  transform: scale(1.05);
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.clickable .remaining-count-chip:focus {
  outline: 2px solid rgba(var(--v-theme-primary), 0.5);
  outline-offset: 2px;
}

/* レスポンシブ対応 */
@media (max-width: 600px) {
  .emotion-tag-chips {
    gap: 2px;
  }
  
  .emotion-chip {
    font-size: 0.7rem;
  }
  
  .remaining-count-chip {
    font-size: 0.65rem;
  }
}

/* アニメーション */
.emotion-chip,
.remaining-count-chip {
  animation: fadeInScale 0.3s ease-out;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 空状態のスタイル */
.emotion-tag-chips:empty::after {
  content: attr(data-empty-message);
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 0.875rem;
  font-style: italic;
}
</style>