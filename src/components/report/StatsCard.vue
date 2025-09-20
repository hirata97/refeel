<template>
  <v-card :class="['stats-card', `stats-card--${variant}`]" :loading="loading" elevation="2">
    <v-card-title class="d-flex align-center">
      <v-icon v-if="icon" :color="iconColor" class="me-2" size="large">
        {{ icon }}
      </v-icon>
      <div class="flex-grow-1">
        <div class="text-h6">{{ title }}</div>
        <div v-if="subtitle" class="text-caption text-medium-emphasis">
          {{ subtitle }}
        </div>
      </div>
      <v-btn v-if="showDetails" icon size="small" variant="text" @click="toggleExpanded">
        <v-icon>
          {{ isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
        </v-icon>
      </v-btn>
    </v-card-title>

    <v-card-text class="pb-2">
      <!-- メイン値表示 -->
      <div class="stats-main">
        <div :class="['stats-value', `text-${valueColor}`]">
          {{ formattedMainValue }}
        </div>
        <div v-if="unit" class="stats-unit text-medium-emphasis">
          {{ unit }}
        </div>
      </div>

      <!-- 変化率表示 -->
      <div v-if="change !== undefined" class="stats-change mt-2">
        <v-chip
          :color="getChangeColor(change)"
          :prepend-icon="getChangeIcon(change)"
          size="small"
          variant="tonal"
        >
          {{ formatChange(change) }}
        </v-chip>
        <span v-if="changeLabel" class="text-caption text-medium-emphasis ms-2">
          {{ changeLabel }}
        </span>
      </div>

      <!-- サブ統計 -->
      <div v-if="subStats && subStats.length > 0" class="stats-sub mt-3">
        <v-row dense>
          <v-col
            v-for="(stat, index) in subStats"
            :key="index"
            :cols="12 / Math.min(subStats.length, 3)"
          >
            <div class="text-center">
              <div class="text-body-2 font-weight-medium">
                {{ stat.value }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ stat.label }}
              </div>
            </div>
          </v-col>
        </v-row>
      </div>
    </v-card-text>

    <!-- 詳細表示（展開時） -->
    <v-expand-transition>
      <v-card-text v-if="isExpanded" class="pt-0">
        <v-divider class="mb-3" />
        <slot name="details">
          <div v-if="details" class="text-body-2">
            {{ details }}
          </div>
          <div v-else class="text-center text-medium-emphasis">詳細情報はありません</div>
        </slot>
      </v-card-text>
    </v-expand-transition>

    <!-- エラー表示 -->
    <v-card-text v-if="error">
      <v-alert type="error" density="compact" variant="tonal">
        {{ error }}
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface SubStat {
  label: string
  value: string | number
}

interface Props {
  title: string
  subtitle?: string
  icon?: string
  iconColor?: string
  value: number | string
  unit?: string
  change?: number
  changeLabel?: string
  subStats?: SubStat[]
  details?: string
  showDetails?: boolean
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  valueColor?: string
  loading?: boolean
  error?: string
}

interface Emits {
  (e: 'click'): void
  (e: 'expand', expanded: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: undefined,
  icon: undefined,
  iconColor: 'primary',
  unit: undefined,
  change: undefined,
  changeLabel: undefined,
  subStats: () => [],
  details: undefined,
  showDetails: false,
  variant: 'default',
  valueColor: 'primary',
  loading: false,
  error: undefined,
})

const emit = defineEmits<Emits>()

// 展開状態
const isExpanded = ref(false)

// メイン値のフォーマット
const formattedMainValue = computed(() => {
  if (typeof props.value === 'number') {
    // 大きな数値には区切り文字を追加
    if (props.value >= 1000) {
      return props.value.toLocaleString('ja-JP')
    }
    return props.value.toString()
  }
  return props.value
})

// 変化率の色を取得
const getChangeColor = (change: number): string => {
  if (change > 0) return 'success'
  if (change < 0) return 'error'
  return 'primary'
}

// 変化率のアイコンを取得
const getChangeIcon = (change: number): string => {
  if (change > 0) return 'mdi-trending-up'
  if (change < 0) return 'mdi-trending-down'
  return 'mdi-trending-neutral'
}

// 変化率のフォーマット
const formatChange = (change: number): string => {
  const sign = change > 0 ? '+' : ''
  if (Math.abs(change) >= 1) {
    return `${sign}${change.toFixed(1)}%`
  }
  return `${sign}${change.toFixed(2)}%`
}

// 展開状態の切り替え
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
  emit('expand', isExpanded.value)
}
</script>

<style scoped>
.stats-card {
  transition: all 0.2s ease-in-out;
}

.stats-card:hover {
  transform: translateY(-2px);
}

.stats-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.stats-value {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
}

.stats-unit {
  font-size: 1rem;
  font-weight: 500;
}

.stats-change {
  display: flex;
  align-items: center;
}

.stats-sub {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 8px;
  padding: 12px;
}

/* バリアント別のスタイル */
.stats-card--primary {
  border-left: 4px solid rgb(var(--v-theme-primary));
}

.stats-card--success {
  border-left: 4px solid rgb(var(--v-theme-success));
}

.stats-card--warning {
  border-left: 4px solid rgb(var(--v-theme-warning));
}

.stats-card--error {
  border-left: 4px solid rgb(var(--v-theme-error));
}

/* レスポンシブ対応 */
@media (max-width: 600px) {
  .stats-value {
    font-size: 2rem;
  }

  .stats-main {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
