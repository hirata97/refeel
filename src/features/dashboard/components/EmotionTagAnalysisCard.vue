<template>
  <v-card class="emotion-tag-analysis-card" elevation="2" rounded="lg">
    <v-card-title class="pb-2">
      <div class="title-section">
        <v-icon color="primary" class="mr-2">mdi-tag-heart</v-icon>
        <span class="title-text">感情タグ分析</span>
      </div>
      <v-spacer />
      <v-menu location="bottom">
        <template #activator="{ props }">
          <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props" />
        </template>
        <v-list density="compact">
          <v-list-item @click="refresh">
            <template #prepend>
              <v-icon>mdi-refresh</v-icon>
            </template>
            <v-list-item-title>更新</v-list-item-title>
          </v-list-item>
          <v-list-item @click="$emit('view-details')">
            <template #prepend>
              <v-icon>mdi-chart-box</v-icon>
            </template>
            <v-list-item-title>詳細を見る</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-card-title>

    <!-- ローディング状態 -->
    <div v-if="loading" class="loading-container">
      <v-progress-circular indeterminate size="32" color="primary" />
      <p class="loading-text">感情タグを分析中...</p>
    </div>

    <!-- エラー状態 -->
    <v-alert v-else-if="error" type="error" variant="tonal" density="compact" class="ma-4">
      {{ error }}
    </v-alert>

    <!-- データ表示 -->
    <div v-else class="analysis-content">
      <!-- サマリー統計 -->
      <div class="summary-section">
        <v-card-text class="pb-2">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">{{ analysisData.totalTags }}</div>
              <div class="summary-label">今月使用タグ数</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">{{ analysisData.mostUsedTag?.name || '-' }}</div>
              <div class="summary-label">最頻出タグ</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">{{ analysisData.positiveRatio }}%</div>
              <div class="summary-label">ポジティブ比率</div>
            </div>
          </div>
        </v-card-text>
      </div>

      <v-divider />

      <!-- カテゴリ別分析 -->
      <div class="category-section">
        <v-card-text>
          <h4 class="section-title mb-3">カテゴリ別感情分布</h4>
          <div class="category-analysis">
            <div
              v-for="category in categoryAnalysis"
              :key="category.category"
              class="category-item"
            >
              <div class="category-header">
                <v-icon :color="category.color" size="small" class="mr-2">
                  {{ getCategoryIcon(category.category) }}
                </v-icon>
                <span class="category-name">{{ category.label }}</span>
                <v-spacer />
                <span class="category-count">{{ category.count }}回</span>
              </div>
              <v-progress-linear
                :model-value="category.percentage"
                :color="category.color"
                height="6"
                rounded
                class="category-progress"
              />
              <div v-if="category.topTags.length > 0" class="top-tags">
                <v-chip
                  v-for="tag in category.topTags.slice(0, 3)"
                  :key="tag.name"
                  :color="tag.color"
                  size="x-small"
                  variant="outlined"
                  class="mr-1"
                >
                  {{ tag.name }}
                </v-chip>
              </div>
            </div>
          </div>
        </v-card-text>
      </div>

      <v-divider />

      <!-- 最近のトレンド -->
      <div class="trend-section">
        <v-card-text class="pb-3">
          <h4 class="section-title mb-3">最近のトレンド</h4>
          <div v-if="recentTrends.length > 0" class="trends-list">
            <div v-for="trend in recentTrends.slice(0, 3)" :key="trend.tagName" class="trend-item">
              <v-chip :color="trend.color" size="small" variant="flat" class="trend-chip">
                {{ trend.tagName }}
              </v-chip>
              <div class="trend-info">
                <div class="trend-direction">
                  <v-icon :color="getTrendColor(trend.direction)" size="small">
                    {{ getTrendIcon(trend.direction) }}
                  </v-icon>
                  <span class="trend-text">{{ getTrendText(trend.direction) }}</span>
                </div>
                <div class="trend-description">{{ trend.description }}</div>
              </div>
            </div>
          </div>
          <div v-else class="no-trends">
            <v-icon color="grey" size="large" class="mb-2">mdi-chart-line</v-icon>
            <p class="text-caption text-medium-emphasis">まだトレンドデータがありません</p>
          </div>
        </v-card-text>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { EmotionCategory } from '@features/mood'

// Props
interface Props {
  loading?: boolean
  error?: string | null
}

// Emits
interface Emits {
  (e: 'refresh'): void
  (e: 'view-details'): void
}

withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
})

const emit = defineEmits<Emits>()

// モックデータ（実際の実装では親から渡すかストアから取得）
const analysisData = ref({
  totalTags: 12,
  mostUsedTag: { name: '集中', color: '#2196F3' },
  positiveRatio: 68,
})

const categoryAnalysis = ref([
  {
    category: 'positive' as EmotionCategory,
    label: 'ポジティブ',
    color: '#4CAF50',
    count: 28,
    percentage: 68,
    topTags: [
      { name: '集中', color: '#2196F3' },
      { name: '達成感', color: '#4CAF50' },
      { name: '安心', color: '#009688' },
    ],
  },
  {
    category: 'negative' as EmotionCategory,
    label: 'ネガティブ',
    color: '#F44336',
    count: 10,
    percentage: 24,
    topTags: [
      { name: '疲労', color: '#795548' },
      { name: '不安', color: '#9C27B0' },
    ],
  },
  {
    category: 'neutral' as EmotionCategory,
    label: '中性',
    color: '#757575',
    count: 3,
    percentage: 8,
    topTags: [{ name: '平常', color: '#757575' }],
  },
])

const recentTrends = ref([
  {
    tagName: '集中',
    color: '#2196F3',
    direction: 'up' as const,
    description: '先週より3回多く使用',
  },
  {
    tagName: '疲労',
    color: '#795548',
    direction: 'down' as const,
    description: '先週より2回減少',
  },
  {
    tagName: '安心',
    color: '#009688',
    direction: 'stable' as const,
    description: '先週と同程度の使用',
  },
])

// Helper functions
const getCategoryIcon = (category: EmotionCategory): string => {
  switch (category) {
    case 'positive':
      return 'mdi-emoticon-happy'
    case 'negative':
      return 'mdi-emoticon-sad'
    case 'neutral':
      return 'mdi-emoticon-neutral'
    default:
      return 'mdi-tag'
  }
}

const getTrendIcon = (direction: 'up' | 'down' | 'stable'): string => {
  switch (direction) {
    case 'up':
      return 'mdi-trending-up'
    case 'down':
      return 'mdi-trending-down'
    case 'stable':
      return 'mdi-trending-neutral'
    default:
      return 'mdi-minus'
  }
}

const getTrendColor = (direction: 'up' | 'down' | 'stable'): string => {
  switch (direction) {
    case 'up':
      return 'success'
    case 'down':
      return 'warning'
    case 'stable':
      return 'info'
    default:
      return 'grey'
  }
}

const getTrendText = (direction: 'up' | 'down' | 'stable'): string => {
  switch (direction) {
    case 'up':
      return '増加傾向'
    case 'down':
      return '減少傾向'
    case 'stable':
      return '安定'
    default:
      return '-'
  }
}

const refresh = () => {
  emit('refresh')
}

// 初期化（実際の実装では親コンポーネントまたはストアからデータを取得）
onMounted(() => {
  // TODO: 感情タグ分析データの取得処理を実装
})
</script>

<style scoped>
.emotion-tag-analysis-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.title-section {
  display: flex;
  align-items: center;
}

.title-text {
  font-weight: 600;
  font-size: 1.1rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.loading-text {
  margin-top: 16px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.875rem;
}

.analysis-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.summary-section {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.summary-item {
  text-align: center;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  line-height: 1.2;
}

.summary-label {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 4px;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.category-analysis {
  space-y: 16px;
}

.category-item {
  margin-bottom: 16px;
}

.category-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.category-name {
  font-size: 0.875rem;
  font-weight: 500;
}

.category-count {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.category-progress {
  margin-bottom: 8px;
}

.top-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.trends-list {
  space-y: 12px;
}

.trend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.trend-chip {
  flex-shrink: 0;
}

.trend-info {
  flex: 1;
  min-width: 0;
}

.trend-direction {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
}

.trend-text {
  font-size: 0.75rem;
  font-weight: 500;
}

.trend-description {
  font-size: 0.7rem;
  color: rgb(var(--v-theme-on-surface-variant));
  line-height: 1.2;
}

.no-trends {
  text-align: center;
  padding: 24px 16px;
  color: rgb(var(--v-theme-on-surface-variant));
}

/* レスポンシブ対応 */
@media (max-width: 600px) {
  .summary-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .summary-value {
    font-size: 1.25rem;
  }

  .trend-item {
    gap: 8px;
  }
}
</style>
