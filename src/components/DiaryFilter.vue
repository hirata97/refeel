<template>
  <v-card class="filter-card">
    <v-card-title class="filter-title">
      <v-icon>mdi-filter</v-icon>
      フィルター
      <v-spacer />
      <v-btn
        variant="text"
        size="small"
        @click="clearAllFilters"
      >
        クリア
      </v-btn>
    </v-card-title>

    <v-card-text>
      <v-row>
        <!-- カテゴリフィルター -->
        <v-col cols="12" md="6" lg="4">
          <v-select
            v-model="localFilters.goal_category"
            :items="categoryOptions"
            label="目標カテゴリ"
            clearable
            variant="outlined"
            density="compact"
            @update:model-value="handleFilterChange"
          />
        </v-col>

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

        <!-- 進捗レベル範囲 -->
        <v-col cols="12" md="6" lg="4">
          <div class="progress-filter">
            <v-label class="filter-label">進捗レベル</v-label>
            <div class="progress-inputs">
              <v-text-field
                v-model.number="localFilters.progress_level_min"
                type="number"
                :min="0"
                :max="100"
                label="最小"
                variant="outlined"
                density="compact"
                class="progress-input"
                @update:model-value="handleFilterChange"
              />
              <span class="range-separator">〜</span>
              <v-text-field
                v-model.number="localFilters.progress_level_max"
                type="number"
                :min="0"
                :max="100"
                label="最大"
                variant="outlined"
                density="compact"
                class="progress-input"
                @update:model-value="handleFilterChange"
              />
            </div>
          </div>
        </v-col>

        <!-- 作成日期間 -->
        <v-col cols="12" md="6" lg="6">
          <div class="date-filter">
            <v-label class="filter-label">作成日期間</v-label>
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

        <!-- フィルター適用ボタン -->
        <v-col cols="12" md="6" lg="6">
          <div class="filter-actions">
            <v-btn
              color="primary"
              variant="elevated"
              :loading="loading"
              @click="applyFilters"
            >
              <v-icon>mdi-filter-check</v-icon>
              フィルター適用
            </v-btn>
            
            <v-btn
              variant="outlined"
              @click="clearAllFilters"
            >
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

interface FilterValues {
  goal_category: string
  date_from: string
  date_to: string
  search_text: string
  progress_level_min: number | null
  progress_level_max: number | null
}

interface Props {
  filters: FilterValues
  categories?: string[]
  loading?: boolean
}

interface Emits {
  (e: 'update:filters', filters: FilterValues): void
  (e: 'apply-filters'): void
  (e: 'clear-filters'): void
}

const props = withDefaults(defineProps<Props>(), {
  categories: () => [],
  loading: false
})

const emit = defineEmits<Emits>()

// ローカルフィルター状態
const localFilters = ref<FilterValues>({ ...props.filters })

// カテゴリオプション
const categoryOptions = computed(() => [
  { title: 'すべて', value: '' },
  ...props.categories.map(cat => ({ title: cat, value: cat }))
])

// アクティブフィルターの計算
const hasActiveFilters = computed(() => {
  return Object.values(localFilters.value).some(value => 
    value !== null && value !== undefined && value !== ''
  )
})

const activeFiltersList = computed(() => {
  const filters = []
  
  if (localFilters.value.goal_category) {
    filters.push({
      key: 'goal_category',
      label: 'カテゴリ',
      value: localFilters.value.goal_category
    })
  }
  
  if (localFilters.value.search_text) {
    filters.push({
      key: 'search_text',
      label: '検索',
      value: localFilters.value.search_text
    })
  }
  
  if (localFilters.value.progress_level_min !== null) {
    filters.push({
      key: 'progress_level_min',
      label: '進捗最小',
      value: `${localFilters.value.progress_level_min}%`
    })
  }
  
  if (localFilters.value.progress_level_max !== null) {
    filters.push({
      key: 'progress_level_max',
      label: '進捗最大',
      value: `${localFilters.value.progress_level_max}%`
    })
  }
  
  if (localFilters.value.date_from) {
    filters.push({
      key: 'date_from',
      label: '開始日',
      value: localFilters.value.date_from
    })
  }
  
  if (localFilters.value.date_to) {
    filters.push({
      key: 'date_to',
      label: '終了日',
      value: localFilters.value.date_to
    })
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
    goal_category: '',
    date_from: '',
    date_to: '',
    search_text: '',
    progress_level_min: null,
    progress_level_max: null
  }
  emit('update:filters', { ...localFilters.value })
  emit('clear-filters')
}

const removeFilter = (key: string) => {
  const filterKey = key as keyof FilterValues
  if (filterKey === 'progress_level_min' || filterKey === 'progress_level_max') {
    localFilters.value[filterKey] = null
  } else {
    // 文字列型のプロパティに対して空文字を設定
    if (filterKey === 'goal_category' || filterKey === 'date_from' || 
        filterKey === 'date_to' || filterKey === 'search_text') {
      localFilters.value[filterKey] = ''
    }
  }
  handleFilterChange()
  emit('apply-filters')
}

// プロパティ変更の監視
watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters }
}, { deep: true })
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

.progress-filter,
.date-filter {
  width: 100%;
}

.progress-inputs,
.date-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-input,
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
  .progress-inputs,
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