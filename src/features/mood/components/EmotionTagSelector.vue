<template>
  <v-card variant="outlined" class="emotion-tag-selector">
    <v-card-subtitle class="pb-2">
      今日の感情（複数選択可）
      <v-chip v-if="selectedTags.length > 0" size="x-small" color="primary" class="ml-2">
        {{ selectedTags.length }}個選択中
      </v-chip>
    </v-card-subtitle>

    <v-card-text class="pt-0">
      <!-- ローディング状態 -->
      <div v-if="loading" class="text-center py-4">
        <v-progress-circular indeterminate size="24" />
        <div class="text-caption mt-2">感情タグを読み込み中...</div>
      </div>

      <!-- エラー状態 -->
      <v-alert
        v-else-if="error"
        type="error"
        variant="tonal"
        class="mb-4"
        density="compact"
        data-testid="error-alert"
      >
        {{ error }}
      </v-alert>

      <!-- 感情タグ選択UI -->
      <div v-else class="emotion-categories">
        <!-- ポジティブ感情 -->
        <div v-if="positiveTagsGroup.tags.length > 0" class="emotion-category mb-4">
          <div class="category-header mb-2">
            <v-icon :color="positiveTagsGroup.color" size="small" class="mr-1">
              mdi-emoticon-happy
            </v-icon>
            <span class="text-subtitle-2 font-weight-medium">
              {{ positiveTagsGroup.label }}
            </span>
          </div>
          <v-chip-group
            v-model="selectedPositiveTags"
            multiple
            color="success"
            class="emotion-chips"
            :disabled="disabled"
          >
            <v-chip
              v-for="tag in positiveTagsGroup.tags"
              :key="tag.id"
              :value="tag.id"
              :color="tag.color"
              variant="outlined"
              size="small"
              :title="tag.description"
              data-testid="emotion-chip"
              :disabled="disabled"
            >
              {{ tag.name }}
            </v-chip>
          </v-chip-group>
        </div>

        <!-- ネガティブ感情 -->
        <div v-if="negativeTagsGroup.tags.length > 0" class="emotion-category mb-4">
          <div class="category-header mb-2">
            <v-icon :color="negativeTagsGroup.color" size="small" class="mr-1">
              mdi-emoticon-sad
            </v-icon>
            <span class="text-subtitle-2 font-weight-medium">
              {{ negativeTagsGroup.label }}
            </span>
          </div>
          <v-chip-group
            v-model="selectedNegativeTags"
            multiple
            color="error"
            class="emotion-chips"
            :disabled="disabled"
          >
            <v-chip
              v-for="tag in negativeTagsGroup.tags"
              :key="tag.id"
              :value="tag.id"
              :color="tag.color"
              variant="outlined"
              size="small"
              :title="tag.description"
              data-testid="emotion-chip"
              :disabled="disabled"
            >
              {{ tag.name }}
            </v-chip>
          </v-chip-group>
        </div>

        <!-- 中性感情 -->
        <div v-if="neutralTagsGroup.tags.length > 0" class="emotion-category">
          <div class="category-header mb-2">
            <v-icon :color="neutralTagsGroup.color" size="small" class="mr-1">
              mdi-emoticon-neutral
            </v-icon>
            <span class="text-subtitle-2 font-weight-medium">
              {{ neutralTagsGroup.label }}
            </span>
          </div>
          <v-chip-group
            v-model="selectedNeutralTags"
            multiple
            color="info"
            class="emotion-chips"
            :disabled="disabled"
          >
            <v-chip
              v-for="tag in neutralTagsGroup.tags"
              :key="tag.id"
              :value="tag.id"
              :color="tag.color"
              variant="outlined"
              size="small"
              :title="tag.description"
              data-testid="emotion-chip"
              :disabled="disabled"
            >
              {{ tag.name }}
            </v-chip>
          </v-chip-group>
        </div>
      </div>

      <!-- 選択中のタグサマリー -->
      <div v-if="selectedTags.length > 0" class="selected-summary mt-4">
        <v-divider class="mb-3" />
        <div class="text-caption text-medium-emphasis mb-2">選択中の感情:</div>
        <div class="selected-tags">
          <v-chip
            v-for="tag in selectedTags"
            :key="tag.id"
            :color="tag.color"
            size="small"
            variant="flat"
            class="mr-1 mb-1"
            closable
            @click:close="removeTag(tag.id)"
          >
            {{ tag.name }}
          </v-chip>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useEmotionTagsStore } from '@features/mood'
import type { EmotionTag, EmotionTagGroup, EmotionCategory } from '@features/mood'

// Props
interface Props {
  modelValue: string[] // 選択されたタグのID配列
  disabled?: boolean
}

// Emits
interface Emits {
  (e: 'update:modelValue', value: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<Emits>()

// Store
const emotionTagsStore = useEmotionTagsStore()

// State
const loading = computed(() => emotionTagsStore.loading.fetchEmotionTags || false)
const error = computed(() => emotionTagsStore.error.fetchEmotionTags || null)
const emotionTags = computed(() => emotionTagsStore.emotionTags)

// 感情タグをカテゴリ別に分類
const categorizeEmotionTags = (tags: EmotionTag[]): Record<EmotionCategory, EmotionTag[]> => {
  return {
    positive: tags
      .filter((tag) => tag.category === 'positive')
      .sort((a, b) => a.display_order - b.display_order),
    negative: tags
      .filter((tag) => tag.category === 'negative')
      .sort((a, b) => a.display_order - b.display_order),
    neutral: tags
      .filter((tag) => tag.category === 'neutral')
      .sort((a, b) => a.display_order - b.display_order),
  }
}

// カテゴリ別タググループ
const positiveTagsGroup = computed((): EmotionTagGroup => {
  const categories = categorizeEmotionTags(emotionTags.value)
  return {
    category: 'positive',
    label: 'ポジティブ',
    tags: categories.positive,
    color: '#4CAF50',
  }
})

const negativeTagsGroup = computed((): EmotionTagGroup => {
  const categories = categorizeEmotionTags(emotionTags.value)
  return {
    category: 'negative',
    label: 'ネガティブ',
    tags: categories.negative,
    color: '#F44336',
  }
})

const neutralTagsGroup = computed((): EmotionTagGroup => {
  const categories = categorizeEmotionTags(emotionTags.value)
  return {
    category: 'neutral',
    label: '中性',
    tags: categories.neutral,
    color: '#757575',
  }
})

// カテゴリ別選択状態
const selectedPositiveTags = ref<string[]>([])
const selectedNegativeTags = ref<string[]>([])
const selectedNeutralTags = ref<string[]>([])

// 全選択タグID
const allSelectedTagIds = computed<string[]>(() => [
  ...selectedPositiveTags.value,
  ...selectedNegativeTags.value,
  ...selectedNeutralTags.value,
])

// 選択されたタグオブジェクト
const selectedTags = computed<EmotionTag[]>(() => {
  return emotionTags.value.filter((tag) => allSelectedTagIds.value.includes(tag.id))
})

// modelValueとの双方向バインディング
watch(
  allSelectedTagIds,
  (newIds) => {
    emit('update:modelValue', newIds)
  },
  { immediate: true },
)

watch(
  () => props.modelValue,
  (newValue) => {
    if (JSON.stringify(newValue) !== JSON.stringify(allSelectedTagIds.value)) {
      // カテゴリ別に分類して設定
      const categories = categorizeEmotionTags(emotionTags.value)
      selectedPositiveTags.value = newValue.filter((id) =>
        categories.positive.some((tag) => tag.id === id),
      )
      selectedNegativeTags.value = newValue.filter((id) =>
        categories.negative.some((tag) => tag.id === id),
      )
      selectedNeutralTags.value = newValue.filter((id) =>
        categories.neutral.some((tag) => tag.id === id),
      )
    }
  },
  { immediate: true },
)

// タグ削除
const removeTag = (tagId: string): void => {
  selectedPositiveTags.value = selectedPositiveTags.value.filter((id) => id !== tagId)
  selectedNegativeTags.value = selectedNegativeTags.value.filter((id) => id !== tagId)
  selectedNeutralTags.value = selectedNeutralTags.value.filter((id) => id !== tagId)
}

// 感情タグデータの読み込み
const loadEmotionTags = async (): Promise<void> => {
  await emotionTagsStore.fetchEmotionTags()
}

// 初期化
onMounted(() => {
  loadEmotionTags()
})
</script>

<style scoped>
.emotion-tag-selector {
  margin: 16px 0;
}

.emotion-categories {
  max-width: 100%;
}

.emotion-category {
  border-left: 3px solid transparent;
  padding-left: 8px;
  margin-bottom: 16px;
}

.emotion-category:nth-child(1) {
  border-left-color: #4caf50; /* ポジティブ */
}

.emotion-category:nth-child(2) {
  border-left-color: #f44336; /* ネガティブ */
}

.emotion-category:nth-child(3) {
  border-left-color: #757575; /* 中性 */
}

.category-header {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.emotion-chips {
  margin-top: 8px;
}

.emotion-chips :deep(.v-chip) {
  margin: 2px;
  user-select: none;
  transition: all 0.2s ease;
}

.emotion-chips :deep(.v-chip:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.selected-summary {
  background-color: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 8px;
  padding: 12px;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* レスポンシブ対応 */
@media (max-width: 600px) {
  .emotion-chips :deep(.v-chip) {
    font-size: 0.7rem;
    height: 28px;
  }

  .category-header {
    font-size: 0.85rem;
  }
}
</style>
