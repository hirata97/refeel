<template>
  <div class="date-range-picker">
    <v-card class="pa-4">
      <v-card-title>
        <v-icon class="me-2">mdi-calendar-range</v-icon>
        期間選択
      </v-card-title>
      
      <v-card-text>
        <!-- プリセット期間 -->
        <div class="preset-section mb-4">
          <v-chip-group
            v-model="selectedPresetIndex"
            selected-class="text-primary"
            @update:model-value="onPresetSelect"
          >
            <v-chip
              v-for="(preset, index) in availablePresets"
              :key="preset.id"
              :value="index"
              :color="selectedPresetIndex === index ? 'primary' : 'default'"
              size="small"
              class="me-2 mb-2"
            >
              {{ preset.label }}
            </v-chip>
          </v-chip-group>
        </div>

        <!-- カスタム期間設定 -->
        <div class="custom-section">
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="customStartDate"
                label="開始日"
                type="date"
                density="compact"
                variant="outlined"
                :max="customEndDate"
                @update:model-value="onCustomDateChange"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="customEndDate"
                label="終了日"
                type="date"
                density="compact"
                variant="outlined"
                :min="customStartDate"
                :max="getToday()"
                @update:model-value="onCustomDateChange"
              />
            </v-col>
          </v-row>
        </div>

        <!-- 期間情報表示 -->
        <div class="period-info mt-3">
          <v-alert
            v-if="dateRange"
            :color="isValidRange ? 'info' : 'error'"
            density="compact"
            variant="tonal"
            class="mb-2"
          >
            <div class="d-flex align-center">
              <v-icon :color="isValidRange ? 'info' : 'error'" class="me-2">
                {{ isValidRange ? 'mdi-calendar-check' : 'mdi-calendar-alert' }}
              </v-icon>
              <div>
                <div class="text-body-2 font-weight-medium">
                  {{ formatDateRange(dateRange) }}
                </div>
                <div v-if="isValidRange" class="text-caption">
                  {{ getDaysBetween(dateRange) }}日間の期間
                </div>
                <div v-else class="text-caption">
                  無効な期間です
                </div>
              </div>
            </div>
          </v-alert>
        </div>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn
          variant="text"
          @click="resetToDefault"
        >
          リセット
        </v-btn>
        <v-btn
          :disabled="!isValidRange"
          color="primary"
          variant="elevated"
          @click="applyRange"
        >
          適用
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { DateRange } from '@/types/report'
import { 
  dateRangePresets, 
  getToday, 
  validateDateRange, 
  getDaysBetween, 
  formatDateRange 
} from '@/utils/dateRange'

interface Props {
  modelValue?: DateRange
  defaultPreset?: string
}

interface Emits {
  (e: 'update:modelValue', value: DateRange): void
  (e: 'change', value: DateRange): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  defaultPreset: 'last30Days'
})

const emit = defineEmits<Emits>()

// リアクティブな状態
const selectedPresetIndex = ref<number | null>(null)
const customStartDate = ref('')
const customEndDate = ref('')

// 利用可能なプリセット
const availablePresets = ref(dateRangePresets)

// 現在の日付範囲
const dateRange = computed<DateRange | null>(() => {
  if (customStartDate.value && customEndDate.value) {
    return {
      startDate: customStartDate.value,
      endDate: customEndDate.value
    }
  }
  return null
})

// 日付範囲の妥当性
const isValidRange = computed(() => {
  return dateRange.value ? validateDateRange(dateRange.value) : false
})

// プリセット選択ハンドラー
const onPresetSelect = (index: number | null) => {
  if (index === null || index < 0) return
  
  const preset = availablePresets.value[index]
  if (preset) {
    const range = preset.getRange()
    customStartDate.value = range.startDate
    customEndDate.value = range.endDate
    
    if (isValidRange.value && dateRange.value) {
      emit('update:modelValue', dateRange.value)
    }
  }
}

// カスタム日付変更ハンドラー
const onCustomDateChange = () => {
  // プリセット選択をクリア
  selectedPresetIndex.value = null
  
  if (isValidRange.value && dateRange.value) {
    emit('update:modelValue', dateRange.value)
  }
}

// 適用ボタン
const applyRange = () => {
  if (isValidRange.value && dateRange.value) {
    emit('change', dateRange.value)
  }
}

// リセット
const resetToDefault = () => {
  const defaultPresetIndex = availablePresets.value.findIndex(
    p => p.id === props.defaultPreset
  )
  
  if (defaultPresetIndex !== -1) {
    selectedPresetIndex.value = defaultPresetIndex
    onPresetSelect(defaultPresetIndex)
  }
}

// 初期化
const initialize = () => {
  if (props.modelValue) {
    // プロパティから初期値を設定
    customStartDate.value = props.modelValue.startDate
    customEndDate.value = props.modelValue.endDate
    
    // 該当するプリセットがあるかチェック
    const matchingPresetIndex = availablePresets.value.findIndex(preset => {
      const range = preset.getRange()
      return range.startDate === props.modelValue!.startDate && 
             range.endDate === props.modelValue!.endDate
    })
    
    if (matchingPresetIndex !== -1) {
      selectedPresetIndex.value = matchingPresetIndex
    }
  } else {
    // デフォルトプリセットを適用
    resetToDefault()
  }
}

// プロパティの変更を監視
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && (
      newValue.startDate !== customStartDate.value ||
      newValue.endDate !== customEndDate.value
    )) {
      customStartDate.value = newValue.startDate
      customEndDate.value = newValue.endDate
    }
  },
  { deep: true }
)

onMounted(() => {
  initialize()
})
</script>

<style scoped>
.date-range-picker {
  max-width: 100%;
}

.preset-section {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding-bottom: 16px;
}

.period-info {
  min-height: 60px;
}

.custom-section {
  padding-top: 8px;
}

/* レスポンシブ対応 */
@media (max-width: 600px) {
  .date-range-picker :deep(.v-chip-group) {
    max-height: 120px;
    overflow-y: auto;
  }
}
</style>