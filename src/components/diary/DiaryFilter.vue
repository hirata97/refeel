<template>
  <v-card class="filter-card">
    <v-card-title class="filter-title">
      <v-icon>mdi-filter</v-icon>
      フィルター
      <v-spacer />
      <v-btn variant="text" size="small" @click="clearAllFilters"> クリア </v-btn>
    </v-card-title>

    <v-card-text>
      <v-row>
        <!-- テキスト検索 -->
        <v-col cols="12" md="6" lg="4">
          <v-text-field
            v-model="localFilters.search_text"
            label="タイトル・内容で検索"
            clearable
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-magnify"
            @input="debouncedFilterChange"
          />
        </v-col>

        <!-- 気分レベル範囲 -->
        <v-col cols="12" md="6" lg="4">
          <div class="mood-filter">
            <v-label class="filter-label">気分レベル (1-5)</v-label>
            <div class="mood-inputs">
              <v-text-field
                v-model.number="localFilters.mood_min"
                type="number"
                :min="1"
                :max="5"
                label="最小"
                variant="outlined"
                density="compact"
                class="mood-input"
                @update:model-value="handleFilterChange"
              />
              <span class="range-separator">〜</span>
              <v-text-field
                v-model.number="localFilters.mood_max"
                type="number"
                :min="1"
                :max="5"
                label="最大"
                variant="outlined"
                density="compact"
                class="mood-input"
                @update:model-value="handleFilterChange"
              />
            </div>
          </div>
        </v-col>

        <!-- 日記日付期間 -->
        <v-col cols="12" md="6" lg="6">
          <div class="date-filter">
            <v-label class="filter-label">日記日付期間</v-label>
            <div class="date-inputs">
              <v-text-field
                v-model="localFilters.date_from"
                type="date"
                label="開始日"
                variant="outlined"
                density="compact"
                class="date-input"
                @update:model-value="handleFilterChange"
              />
              <span class="range-separator">〜</span>
              <v-text-field
                v-model="localFilters.date_to"
                type="date"
                label="終了日"
                variant="outlined"
                density="compact"
                class="date-input"
                @update:model-value="handleFilterChange"
              />
            </div>
          </div>
        </v-col>

        <!-- 感情タグフィルター -->
        <v-col cols="12">
          <div class="emotion-tag-filter">
            <v-label class="filter-label">感情タグで絞り込み</v-label>
            <EmotionTagSelector
              v-model="localFilters.emotion_tags"
              placeholder="感情タグを選択してフィルタリング"
              class="mt-2"
              @update:model-value="handleFilterChange"
            />
          </div>
        </v-col>

        <!-- フィルター適用ボタン -->
        <v-col cols="12" md="6" lg="6">
          <div class="filter-actions">
            <v-btn color="primary" variant="elevated" :loading="loading" @click="applyFilters">
              <v-icon>mdi-filter-check</v-icon>
              フィルター適用
            </v-btn>

            <v-btn variant="outlined" @click="clearAllFilters">
              <v-icon>mdi-filter-remove</v-icon>
              リセット
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- アクティブフィルター表示 -->
      <div v-if="hasActiveFilters" class="active-filters">
        <v-label class="filter-label">適用中のフィルター:</v-label>
        <div class="filter-chips">
          <v-chip
            v-for="filter in activeFiltersList"
            :key="filter.key"
            closable
            variant="outlined"
            size="small"
            @click:close="removeFilter(filter.key)"
          >
            {{ filter.label }}: {{ filter.value }}
          </v-chip>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { debounce } from '@/utils/performance'
import { useEmotionTagsStore } from '@/stores/emotionTags'
import EmotionTagSelector from '@/components/mood/EmotionTagSelector.vue'

interface FilterValues {
  date_from: string
  date_to: string
  search_text: string
  mood_min: number | null
  mood_max: number | null
  emotion_tags: string[]
}

interface Props {
  filters: FilterValues
  loading?: boolean
}

interface Emits {
  (e: 'update:filters', filters: FilterValues): void
  (e: 'apply-filters'): void
  (e: 'clear-filters'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<Emits>()

// 感情タグストア
const emotionTagsStore = useEmotionTagsStore()

// ローカルフィルター状態
const localFilters = ref<FilterValues>({ ...props.filters })

// フィルター値の削除

// アクティブフィルターの計算
const hasActiveFilters = computed(() => {
  return Object.values(localFilters.value).some(
    (value) => value !== null && value !== undefined && value !== '',
  )
})

const activeFiltersList = computed(() => {
  const filters = []

  if (localFilters.value.search_text) {
    filters.push({
      key: 'search_text',
      label: '検索',
      value: localFilters.value.search_text,
    })
  }

  if (localFilters.value.mood_min !== null) {
    filters.push({
      key: 'mood_min',
      label: '気分最小',
      value: `${localFilters.value.mood_min}/5`,
    })
  }

  if (localFilters.value.mood_max !== null) {
    filters.push({
      key: 'mood_max',
      label: '気分最大',
      value: `${localFilters.value.mood_max}/5`,
    })
  }

  if (localFilters.value.date_from) {
    filters.push({
      key: 'date_from',
      label: '開始日',
      value: localFilters.value.date_from,
    })
  }

  if (localFilters.value.date_to) {
    filters.push({
      key: 'date_to',
      label: '終了日',
      value: localFilters.value.date_to,
    })
  }

  if (localFilters.value.emotion_tags && localFilters.value.emotion_tags.length > 0) {
    const tagNames = localFilters.value.emotion_tags
      .map((tagId) => emotionTagsStore.getEmotionTagById(tagId)?.name)
      .filter(Boolean)

    if (tagNames.length > 0) {
      filters.push({
        key: 'emotion_tags',
        label: '感情タグ',
        value:
          tagNames.length > 2
            ? `${tagNames.slice(0, 2).join(', ')} 他${tagNames.length - 2}件`
            : tagNames.join(', '),
      })
    }
  }

  return filters
})

// イベントハンドラー
const handleFilterChange = () => {
  emit('update:filters', { ...localFilters.value })
}

const debouncedFilterChange = debounce(() => {
  handleFilterChange()
}, 500)

const applyFilters = () => {
  emit('apply-filters')
}

const clearAllFilters = () => {
  localFilters.value = {
    date_from: '',
    date_to: '',
    search_text: '',
    mood_min: null,
    mood_max: null,
    emotion_tags: [],
  }
  emit('update:filters', { ...localFilters.value })
  emit('clear-filters')
}

const removeFilter = (key: string) => {
  const filterKey = key as keyof FilterValues
  if (filterKey === 'mood_min' || filterKey === 'mood_max') {
    localFilters.value[filterKey] = null
  } else if (filterKey === 'emotion_tags') {
    localFilters.value[filterKey] = []
  } else {
    // 文字列型のプロパティに対して空文字を設定
    if (filterKey === 'date_from' || filterKey === 'date_to' || filterKey === 'search_text') {
      localFilters.value[filterKey] = ''
    }
  }
  handleFilterChange()
  emit('apply-filters')
}

// プロパティ変更の監視
watch(
  () => props.filters,
  (newFilters) => {
    localFilters.value = { ...newFilters }
  },
  { deep: true },
)
</script>

<style scoped>
.filter-card {
  margin-bottom: 16px;
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.8);
  margin-bottom: 8px;
  display: block;
}

.mood-filter,
.date-filter {
  width: 100%;
}

.mood-inputs,
.date-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mood-input,
.date-input {
  flex: 1;
}

.range-separator {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  white-space: nowrap;
}

.filter-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  height: 100%;
}

.active-filters {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(var(--v-theme-outline), 0.2);
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .mood-inputs,
  .date-inputs {
    flex-direction: column;
    gap: 12px;
  }

  .range-separator {
    transform: rotate(90deg);
  }

  .filter-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-actions .v-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .filter-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .filter-chips {
    flex-direction: column;
  }
}
</style>
