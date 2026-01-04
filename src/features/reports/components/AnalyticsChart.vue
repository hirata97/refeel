<template>
  <v-card class="analytics-chart" :loading="loading">
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon v-if="icon" :color="iconColor" class="me-2">
          {{ icon }}
        </v-icon>
        <div>
          <div class="text-h6">{{ title }}</div>
          <div v-if="subtitle" class="text-caption text-medium-emphasis">
            {{ subtitle }}
          </div>
        </div>
      </div>

      <!-- チャートタイプ切り替え -->
      <div v-if="allowTypeSwitch && availableTypes.length > 1" class="chart-controls">
        <v-btn-toggle
          v-model="selectedTypeIndex"
          density="compact"
          variant="outlined"
          divided
          @update:model-value="onTypeChange"
        >
          <v-btn
            v-for="(type, index) in availableTypes"
            :key="type.value"
            :value="index"
            size="small"
          >
            <v-icon size="small">{{ type.icon }}</v-icon>
          </v-btn>
        </v-btn-toggle>
      </div>
    </v-card-title>

    <v-card-text>
      <!-- エラー表示 -->
      <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
        {{ error }}
      </v-alert>

      <!-- データなし表示 -->
      <div v-else-if="!loading && (!chartData || !hasData)" class="empty-state">
        <div class="text-center py-8">
          <v-icon size="64" color="grey-lighten-1"> mdi-chart-line-variant </v-icon>
          <div class="text-h6 mt-2 text-medium-emphasis">データがありません</div>
          <div class="text-body-2 text-medium-emphasis">選択した期間にデータが存在しません</div>
        </div>
      </div>

      <!-- チャート表示 -->
      <div v-else class="chart-container">
        <component
          :is="currentChartComponent"
          v-bind="chartProps"
          :data="chartData as any"
          :options="chartOptions as any"
          :height="chartHeight"
        />
      </div>

      <!-- 統計サマリー -->
      <div v-if="showSummary && summaryData" class="chart-summary mt-4">
        <v-row dense>
          <v-col
            v-for="(item, index) in summaryData"
            :key="index"
            :cols="12 / Math.min(summaryData.length, 4)"
          >
            <div class="text-center pa-2">
              <div class="text-h6 font-weight-bold" :class="`text-${item.color || 'primary'}`">
                {{ item.value }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ item.label }}
              </div>
            </div>
          </v-col>
        </v-row>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Line, Bar, Doughnut, Radar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import type { ChartData, ChartOptions } from 'chart.js'

// Chart.jsコンポーネントの登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
)

interface ChartType {
  value: 'line' | 'bar' | 'doughnut' | 'radar'
  label: string
  icon: string
}

interface SummaryItem {
  label: string
  value: string | number
  color?: string
}

interface Props {
  title: string
  subtitle?: string
  icon?: string
  iconColor?: string
  type?: 'line' | 'bar' | 'doughnut' | 'radar'
  data: ChartData | null
  options?: ChartOptions
  loading?: boolean
  error?: string
  height?: number
  allowTypeSwitch?: boolean
  availableTypes?: ChartType[]
  showSummary?: boolean
  summaryData?: SummaryItem[]
}

interface Emits {
  (e: 'typeChange', type: string): void
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: undefined,
  icon: undefined,
  iconColor: 'primary',
  type: 'line',
  options: () => ({}),
  loading: false,
  error: undefined,
  height: 300,
  allowTypeSwitch: false,
  availableTypes: () => [
    { value: 'line', label: 'ライン', icon: 'mdi-chart-line' },
    { value: 'bar', label: 'バー', icon: 'mdi-chart-bar' },
    { value: 'doughnut', label: 'ドーナツ', icon: 'mdi-chart-donut' },
    { value: 'radar', label: 'レーダー', icon: 'mdi-radar' },
  ],
  showSummary: false,
  summaryData: () => [],
})

const emit = defineEmits<Emits>()

// 現在選択されているチャートタイプのインデックス
const selectedTypeIndex = ref(0)

// 現在のチャートタイプ
const currentType = computed(() => {
  if (props.allowTypeSwitch) {
    const selectedType = props.availableTypes[selectedTypeIndex.value]
    return selectedType?.value || props.type
  }
  return props.type
})

// チャートコンポーネントのマッピング
const chartComponentMap = {
  line: Line,
  bar: Bar,
  doughnut: Doughnut,
  radar: Radar,
}

// 現在のチャートコンポーネント
const currentChartComponent = computed(() => {
  return chartComponentMap[currentType.value]
})

// チャートデータの存在チェック
const hasData = computed(() => {
  if (!props.data) return false

  if ('datasets' in props.data) {
    return props.data.datasets.some((dataset) => dataset.data && dataset.data.length > 0)
  }

  return false
})

// チャートの高さ
const chartHeight = computed(() => {
  if (currentType.value === 'doughnut') {
    return Math.min(props.height, 400)
  }
  return props.height
})

// デフォルトチャートオプション
const defaultOptions = computed<ChartOptions>(() => {
  const baseOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  }

  // チャートタイプ別のオプション
  switch (currentType.value) {
    case 'line':
      return {
        ...baseOptions,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
        elements: {
          point: {
            radius: 4,
            hoverRadius: 6,
          },
        },
      }

    case 'bar':
      return {
        ...baseOptions,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      }

    case 'doughnut':
      return {
        ...baseOptions,
        cutout: '60%',
        plugins: {
          ...baseOptions.plugins,
          legend: {
            position: 'bottom',
          },
        },
      }

    case 'radar':
      return {
        ...baseOptions,
        scales: {
          r: {
            beginAtZero: true,
          },
        },
      }

    default:
      return baseOptions
  }
})

// 統合されたチャートオプション
const chartOptions = computed<ChartOptions>(() => {
  return {
    ...defaultOptions.value,
    ...props.options,
  }
})

// チャートプロパティ
const chartProps = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
}))

// チャートデータ
const chartData = computed(() => props.data)

// チャートタイプ変更
const onTypeChange = (index: number) => {
  if (index !== null && props.availableTypes[index]) {
    emit('typeChange', props.availableTypes[index].value)
  }
}

// 初期化
const initialize = () => {
  if (props.allowTypeSwitch && props.availableTypes.length > 0) {
    const initialTypeIndex = props.availableTypes.findIndex((type) => type.value === props.type)
    selectedTypeIndex.value = initialTypeIndex !== -1 ? initialTypeIndex : 0
  }
}

// プロパティの監視
watch(
  () => props.type,
  (newType) => {
    if (props.allowTypeSwitch) {
      const typeIndex = props.availableTypes.findIndex((type) => type.value === newType)
      if (typeIndex !== -1) {
        selectedTypeIndex.value = typeIndex
      }
    }
  },
)

onMounted(() => {
  initialize()
})
</script>

<style scoped>
.analytics-chart {
  height: 100%;
}

.chart-container {
  position: relative;
  height: v-bind('chartHeight + "px"');
  width: 100%;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.chart-summary {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 8px;
  padding: 16px;
}

/* レスポンシブ対応 */
@media (max-width: 600px) {
  .chart-container {
    height: v-bind('Math.min(chartHeight, 250) + "px"');
  }

  .chart-controls {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
