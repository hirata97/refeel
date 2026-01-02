<template>
  <BaseCard title="気分の推移" class="mood-chart-card">
    <div v-if="loading" class="loading-state">
      <v-skeleton-loader type="image" height="200" />
    </div>

    <div v-else-if="error" class="error-state">
      <v-alert type="error" variant="outlined">
        {{ error }}
      </v-alert>
    </div>

    <div v-else-if="moodData.length === 0" class="empty-state">
      <div class="empty-content">
        <v-icon size="48" color="grey-lighten-1">mdi-chart-line</v-icon>
        <p class="empty-text">データが不足しています</p>
        <p class="empty-subtitle">7日間のデータが蓄積されると表示されます</p>
      </div>
    </div>

    <div v-else class="chart-container">
      <Line :data="chartData" :options="chartOptions" class="mood-chart" />
      <div class="chart-footer">
        <v-btn variant="text" color="primary" size="small" @click="$emit('view-details')">
          詳細レポートを見る
          <v-icon end size="16">mdi-arrow-right</v-icon>
        </v-btn>
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { BaseCard } from '@shared/components/base'
import type { MoodDataPoint } from '@/types/dashboard'

// Chart.jsコンポーネントの登録
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface Props {
  /** 気分データ */
  moodData: MoodDataPoint[]
  /** ローディング状態 */
  loading?: boolean
  /** エラーメッセージ */
  error?: string | null
}

interface Emits {
  (e: 'view-details'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
})

defineEmits<Emits>()

const chartData = computed(() => {
  return {
    labels: props.moodData.map((point) => point.label),
    datasets: [
      {
        label: '気分スコア',
        data: props.moodData.map((point) => point.mood),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.4,
        pointBackgroundColor: 'rgb(75, 192, 192)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      cornerRadius: 8,
      callbacks: {
        label: (context: { parsed: { y: number } }) => `気分: ${context.parsed.y}/10`,
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: 'var(--v-theme-on-surface-variant)',
        font: {
          size: 12,
        },
      },
    },
    y: {
      beginAtZero: true,
      min: 1,
      max: 10,
      ticks: {
        stepSize: 1,
        color: 'var(--v-theme-on-surface-variant)',
        font: {
          size: 12,
        },
        callback: (value: number | string) => `${value}/10`,
      },
      grid: {
        color: 'var(--v-theme-outline-variant)',
      },
    },
  },
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
}))
</script>

<style scoped>
.mood-chart-card {
  height: 100%;
}

.loading-state,
.error-state {
  padding: 16px 0;
}

.empty-state {
  padding: 32px 16px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.empty-text {
  color: var(--v-theme-on-surface-variant);
  margin: 0;
  font-weight: 500;
}

.empty-subtitle {
  color: var(--v-theme-on-surface-variant);
  margin: 0;
  font-size: 0.875rem;
  opacity: 0.7;
}

.chart-container {
  display: flex;
  flex-direction: column;
  height: 280px;
}

.mood-chart {
  flex: 1;
  height: 200px;
}

.chart-footer {
  padding-top: 16px;
  border-top: 1px solid var(--v-theme-outline-variant);
  display: flex;
  justify-content: center;
}

/* モバイル対応 */
@media (max-width: 600px) {
  .chart-container {
    height: 240px;
  }

  .mood-chart {
    height: 160px;
  }
}
</style>
