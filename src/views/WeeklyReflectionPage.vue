<template>
  <v-container class="weekly-reflection-page">
    <!-- ページヘッダー -->
    <header class="page-header">
      <div class="header-content">
        <v-icon color="primary" size="large" class="mr-3">mdi-calendar-week</v-icon>
        <div>
          <h1 class="page-title">週間振り返り</h1>
          <p class="page-description">1週間のモチベーション変化パターンを分析・確認できます</p>
        </div>
      </div>
      <div class="header-actions">
        <v-btn
          icon="mdi-refresh"
          variant="text"
          :loading="isLoading"
          @click="refresh"
          title="データを更新"
        />
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-arrow-left"
          @click="navigateBack"
        >
          戻る
        </v-btn>
      </div>
    </header>

    <!-- エラー表示 -->
    <v-alert v-if="hasError && !isLoading" type="error" variant="outlined" class="mb-6" dismissible>
      データの読み込みに失敗しました。リフレッシュボタンをお試しください。
    </v-alert>

    <!-- 週選択コントロール -->
    <section class="week-selector-section mb-6">
      <v-card elevation="1" rounded="lg">
        <v-card-text class="d-flex align-center justify-center pa-4">
          <v-btn
            icon="mdi-chevron-left"
            variant="text"
            @click="changeWeek(selectedWeekOffset + 1)"
            :disabled="isLoading"
          />
          <div class="week-info mx-4 text-center">
            <div class="week-label text-h6">{{ reflectionData.weekLabel }}</div>
            <div class="week-range text-body-2 text-medium-emphasis">
              {{ formatDateRange(reflectionData.startDate, reflectionData.endDate) }}
            </div>
          </div>
          <v-btn
            icon="mdi-chevron-right"
            variant="text"
            @click="changeWeek(selectedWeekOffset - 1)"
            :disabled="isLoading || selectedWeekOffset <= 0"
          />
        </v-card-text>
      </v-card>
    </section>

    <!-- ローディング状態 -->
    <div v-if="isLoading" class="loading-container text-center py-12">
      <v-progress-circular indeterminate size="64" color="primary" class="mb-4" />
      <p class="text-h6 text-medium-emphasis">週間データを分析中...</p>
    </div>

    <!-- メインコンテンツ -->
    <div v-else-if="hasData" class="main-content">
      <!-- 週間統計サマリー -->
      <section class="stats-summary mb-6">
        <div class="stats-grid">
          <StatCard
            title="総投稿数"
            :value="reflectionData.stats.totalEntries"
            unit="件"
            icon="mdi-notebook"
            icon-color="primary"
            :description="`${reflectionData.weekLabel}の日記投稿数`"
          />
          <StatCard
            title="平均気分"
            :value="reflectionData.stats.averageMood"
            unit="/10"
            icon="mdi-emoticon"
            icon-color="success"
            :description="`${reflectionData.weekLabel}の平均気分スコア`"
          />
          <StatCard
            title="最高気分"
            :value="reflectionData.stats.highestMood"
            unit="/10"
            icon="mdi-emoticon-excited"
            icon-color="warning"
            :description="
              reflectionData.stats.highestMood > 0 ? `週間で最も高い気分スコア` : 'データなし'
            "
          />
          <StatCard
            title="最も活発な曜日"
            :value="reflectionData.stats.mostActiveDay || '不明'"
            unit="曜日"
            icon="mdi-calendar-star"
            icon-color="info"
            description="最も多く日記を書いた曜日"
          />
        </div>
      </section>

      <!-- 気分推移チャート -->
      <section class="mood-chart-section mb-6">
        <v-card elevation="2" rounded="lg">
          <v-card-title class="d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-chart-line</v-icon>
            <span>気分推移グラフ</span>
            <v-spacer />
            <v-chip
              v-if="reflectionData.stats.averageMood > 0"
              :color="getMoodColor(reflectionData.stats.averageMood)"
              variant="elevated"
              small
            >
              平均 {{ reflectionData.stats.averageMood }}/10
            </v-chip>
          </v-card-title>
          <v-card-text>
            <div class="chart-container" style="height: 300px; position: relative">
              <Line :data="chartData" :options="chartOptions" style="max-height: 300px" />
            </div>
          </v-card-text>
        </v-card>
      </section>

      <!-- 感情タグ分析と進捗パターン -->
      <div class="analysis-grid mb-6">
        <!-- 感情タグ頻度 -->
        <v-card elevation="2" rounded="lg" class="emotion-tags-card">
          <v-card-title class="d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-tag-heart</v-icon>
            <span>感情タグ頻度</span>
          </v-card-title>
          <v-card-text>
            <div
              v-if="reflectionData.emotionTags.length === 0"
              class="text-center text-medium-emphasis py-4"
            >
              感情タグが記録されていません
            </div>
            <div v-else class="emotion-tags-list">
              <div
                v-for="tag in reflectionData.emotionTags.slice(0, 5)"
                :key="tag.name"
                class="emotion-tag-item d-flex align-center mb-2"
              >
                <v-chip
                  :color="getTagColor(tag.category)"
                  variant="elevated"
                  size="small"
                  class="mr-3"
                >
                  {{ tag.name }}
                </v-chip>
                <v-progress-linear
                  :model-value="tag.percentage"
                  height="8"
                  :color="getTagColor(tag.category)"
                  bg-color="grey-lighten-3"
                  rounded
                  class="flex-grow-1 mr-2"
                />
                <span class="text-body-2 text-medium-emphasis min-width-40">
                  {{ tag.count }}回
                </span>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- 進捗パターン -->
        <v-card elevation="2" rounded="lg" class="progress-pattern-card">
          <v-card-title class="d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-trending-up</v-icon>
            <span>進捗パターン</span>
          </v-card-title>
          <v-card-text>
            <div
              v-if="reflectionData.progressData.length === 0"
              class="text-center text-medium-emphasis py-4"
            >
              進捗データが記録されていません
            </div>
            <div v-else class="progress-list">
              <div
                v-for="progress in reflectionData.progressData"
                :key="progress.goalCategory"
                class="progress-item mb-3"
              >
                <div class="d-flex align-center mb-1">
                  <span class="text-body-1 font-weight-medium flex-grow-1">
                    {{ progress.goalCategory }}
                  </span>
                  <v-chip :color="getTrendColor(progress.trend)" variant="elevated" size="small">
                    <v-icon :icon="getTrendIcon(progress.trend)" size="14" class="mr-1" />
                    {{ getTrendText(progress.trend) }}
                  </v-chip>
                </div>
                <div class="d-flex align-center">
                  <v-progress-linear
                    :model-value="progress.averageProgress * 10"
                    height="8"
                    color="success"
                    bg-color="grey-lighten-3"
                    rounded
                    class="flex-grow-1 mr-2"
                  />
                  <span class="text-body-2 text-medium-emphasis min-width-60">
                    {{ progress.averageProgress }}/10 ({{ progress.entries }}件)
                  </span>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- 分析コメント -->
      <section class="analysis-comments">
        <v-card elevation="2" rounded="lg">
          <v-card-title class="d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-lightbulb</v-icon>
            <span>週間分析</span>
          </v-card-title>
          <v-card-text>
            <div
              v-if="reflectionData.comments.length === 0"
              class="text-center text-medium-emphasis py-4"
            >
              分析コメントがありません
            </div>
            <div v-else class="comments-list">
              <v-alert
                v-for="comment in reflectionData.comments"
                :key="comment.message"
                :type="getAlertType(comment.type)"
                :icon="comment.icon"
                variant="tonal"
                density="comfortable"
                class="mb-3"
              >
                {{ comment.message }}
              </v-alert>
            </div>
          </v-card-text>
        </v-card>
      </section>
    </div>

    <!-- データなし状態 -->
    <div v-else-if="!isLoading && !hasError" class="no-data-container text-center py-12">
      <v-icon size="96" color="grey-lighten-1" class="mb-4">mdi-calendar-blank</v-icon>
      <h3 class="text-h5 text-medium-emphasis mb-2">
        {{ reflectionData.weekLabel }}のデータがありません
      </h3>
      <p class="text-body-1 text-medium-emphasis mb-4">
        この期間には日記が投稿されていません。<br />
        他の週を選択するか、振り返りを書いてみましょう。
      </p>
      <v-btn
        color="primary"
        variant="elevated"
        prepend-icon="mdi-plus"
        @click="navigateTo('/diary-register')"
      >
        振り返りを書く
      </v-btn>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
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
  Filler,
} from 'chart.js'
import { useWeeklyAnalysis } from '@/composables/useWeeklyAnalysis'
import { StatCard } from '@/features/dashboard'

// Chart.js登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

const router = useRouter()

// 週間分析コンポーザブル
const {
  reflectionData,
  selectedWeekOffset,
  hasData,
  hasError,
  isLoading,
  chartData,
  chartOptions,
  fetchWeeklyReflection,
  changeWeek,
  refresh,
} = useWeeklyAnalysis()

// ユーティリティ関数
const formatDateRange = (startDate: string, endDate: string): string => {
  if (!startDate || !endDate) return ''

  const start = new Date(startDate)
  const end = new Date(endDate)

  return `${start.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })} 〜 ${end.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}`
}

const getMoodColor = (mood: number): string => {
  if (mood >= 8) return 'success'
  if (mood >= 6) return 'primary'
  if (mood >= 4) return 'warning'
  return 'error'
}

const getTagColor = (category: string): string => {
  const colors: Record<string, string> = {
    positive: 'success',
    negative: 'error',
    neutral: 'primary',
    general: 'info',
  }
  return colors[category] || 'primary'
}

const getTrendColor = (trend: string): string => {
  const colors: Record<string, string> = {
    up: 'success',
    down: 'error',
    stable: 'primary',
  }
  return colors[trend] || 'primary'
}

const getAlertType = (type: string): 'error' | 'success' | 'warning' | 'info' => {
  const alertTypes: Record<string, 'error' | 'success' | 'warning' | 'info'> = {
    mood: 'info',
    emotion: 'warning',
    progress: 'success',
    general: 'info',
  }
  return alertTypes[type] || 'info'
}

const getTrendIcon = (trend: string): string => {
  const icons: Record<string, string> = {
    up: 'mdi-trending-up',
    down: 'mdi-trending-down',
    stable: 'mdi-trending-neutral',
  }
  return icons[trend] || 'mdi-trending-neutral'
}

const getTrendText = (trend: string): string => {
  const texts: Record<string, string> = {
    up: '向上',
    down: '低下',
    stable: '安定',
  }
  return texts[trend] || '安定'
}

const navigateTo = (path: string): void => {
  router.push(path)
}

const navigateBack = (): void => {
  router.push('/dashboard')
}

// 初期化
onMounted(async () => {
  await fetchWeeklyReflection(0) // 今週のデータを取得
})
</script>

<style scoped>
.weekly-reflection-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-content {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

.page-description {
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 4px 0 0 0;
  font-size: 0.875rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.week-selector-section .week-info {
  min-width: 200px;
}

.week-label {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

.week-range {
  margin-top: 2px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.analysis-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .analysis-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-content {
    justify-content: center;
    text-align: center;
  }

  .header-actions {
    justify-content: center;
  }
}

.emotion-tag-item {
  padding: 4px 0;
}

.progress-item {
  padding: 4px 0;
}

.loading-container {
  padding: 48px 0;
}

.no-data-container {
  padding: 48px 0;
}

.min-width-40 {
  min-width: 40px;
  text-align: right;
}

.min-width-60 {
  min-width: 60px;
  text-align: right;
}

.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}

.comments-list .v-alert:last-child {
  margin-bottom: 0;
}
</style>
