<template>
  <div class="report-page">
    <!-- ヘッダー -->
    <header class="report-header mb-6">
      <div class="d-flex align-center justify-space-between">
        <div>
          <h1 class="text-h3 font-weight-bold mb-2">📊 レポート</h1>
          <p class="text-h6 text-medium-emphasis">
            データを基にした詳細な統計と分析結果を表示します
          </p>
        </div>
        
        <!-- 分析期間表示 -->
        <div v-if="currentPeriod" class="period-display">
          <v-chip
            color="primary"
            variant="tonal"
            size="large"
            prepend-icon="mdi-calendar-range"
          >
            {{ formatDateRange(currentPeriod.range) }}
          </v-chip>
        </div>
      </div>
    </header>

    <!-- 期間選択セクション -->
    <section class="period-selection-section mb-6">
      <DateRangePicker
        :model-value="selectedDateRange || undefined"
        @change="onDateRangeChange"
        :default-preset="defaultPreset"
      />
    </section>

    <!-- ローディング表示 -->
    <div v-if="loading" class="loading-section">
      <v-row>
        <v-col v-for="i in 6" :key="i" cols="12" md="6" lg="4">
          <v-skeleton-loader type="card" />
        </v-col>
      </v-row>
    </div>

    <!-- エラー表示 -->
    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      class="mb-6"
      prominent
    >
      <template #title>分析エラー</template>
      {{ error }}
      <template #append>
        <v-btn
          variant="text"
          @click="retryAnalysis"
        >
          再試行
        </v-btn>
      </template>
    </v-alert>

    <!-- メイン分析結果 -->
    <section v-else-if="analyticsResult" class="analytics-section">
      
      <!-- 統計サマリーカード -->
      <div class="stats-summary mb-6">
        <v-row>
          <!-- 投稿統計 -->
          <v-col cols="12" md="4">
            <StatsCard
              title="投稿統計"
              subtitle="期間内の投稿頻度"
              icon="mdi-calendar-edit"
              icon-color="primary"
              :value="analyticsResult.continuity.totalActiveDays"
              unit="日"
              :sub-stats="statisticsSummary?.frequency || []"
              variant="primary"
            />
          </v-col>
          
          <!-- 気分統計 -->
          <v-col cols="12" md="4">
            <StatsCard
              title="気分統計"
              subtitle="平均気分スコア"
              icon="mdi-heart"
              icon-color="success"
              :value="analyticsResult.mood.average"
              unit="点"
              :sub-stats="statisticsSummary?.mood || []"
              variant="success"
            />
          </v-col>
          
          <!-- 継続性統計 -->
          <v-col cols="12" md="4">
            <StatsCard
              title="継続性"
              subtitle="連続投稿記録"
              icon="mdi-fire"
              icon-color="warning"
              :value="analyticsResult.continuity.currentStreak"
              unit="日"
              :sub-stats="statisticsSummary?.continuity || []"
              variant="warning"
            />
          </v-col>
        </v-row>
      </div>

      <!-- チャート分析 -->
      <div class="charts-analysis mb-6">
        <v-row>
          <!-- 投稿頻度分析（曜日別） -->
          <v-col cols="12" lg="6">
            <AnalyticsChart
              title="投稿頻度分析"
              subtitle="曜日別の投稿パターン"
              icon="mdi-chart-bar"
              type="bar"
              :data="weeklyFrequencyChartData"
              :loading="loading"
              :allow-type-switch="true"
              :available-types="[
                { value: 'bar', label: 'バー', icon: 'mdi-chart-bar' },
                { value: 'line', label: 'ライン', icon: 'mdi-chart-line' }
              ]"
            />
          </v-col>
          
          <!-- 気分推移分析 -->
          <v-col cols="12" lg="6">
            <AnalyticsChart
              title="気分推移分析"
              subtitle="曜日別の平均気分スコア"
              icon="mdi-chart-line"
              type="line"
              :data="moodTrendChartData"
              :loading="loading"
              :allow-type-switch="true"
              :available-types="[
                { value: 'line', label: 'ライン', icon: 'mdi-chart-line' },
                { value: 'radar', label: 'レーダー', icon: 'mdi-radar' }
              ]"
            />
          </v-col>
          
          <!-- 時間帯別投稿分析 -->
          <v-col cols="12" lg="6">
            <AnalyticsChart
              title="時間帯別分析"
              subtitle="投稿時間の傾向"
              icon="mdi-clock-outline"
              type="bar"
              :data="hourlyPostsChartData"
              :loading="loading"
            />
          </v-col>
          
          <!-- 文字数分布分析 -->
          <v-col cols="12" lg="6">
            <AnalyticsChart
              title="文字数分布"
              subtitle="投稿内容の長さ分析"
              icon="mdi-text"
              type="doughnut"
              :data="lengthDistributionChartData"
              :loading="loading"
              :allow-type-switch="true"
              :available-types="[
                { value: 'doughnut', label: 'ドーナツ', icon: 'mdi-chart-donut' },
                { value: 'bar', label: 'バー', icon: 'mdi-chart-bar' }
              ]"
            />
          </v-col>
        </v-row>
      </div>

      <!-- 詳細統計 -->
      <div class="detailed-stats mb-6">
        <v-expansion-panels>
          <!-- キーワード分析 -->
          <v-expansion-panel
            title="📝 キーワード分析"
            text="よく使用される単語と感情分析"
          >
            <v-expansion-panel-text>
              <v-row v-if="analyticsResult.keywords">
                <!-- よく使われるキーワード -->
                <v-col cols="12" md="6">
                  <div class="text-h6 mb-3">頻出キーワード</div>
                  <div class="keyword-cloud">
                    <v-chip
                      v-for="keyword in analyticsResult.keywords.topKeywords.slice(0, 10)"
                      :key="keyword.word"
                      :size="getKeywordSize(keyword.count)"
                      color="primary"
                      variant="tonal"
                      class="ma-1"
                    >
                      {{ keyword.word }} ({{ keyword.count }})
                    </v-chip>
                  </div>
                </v-col>
                
                <!-- 感情キーワード -->
                <v-col cols="12" md="6">
                  <div class="text-h6 mb-3">感情分析</div>
                  <div class="emotion-keywords">
                    <v-chip
                      v-for="emotion in analyticsResult.keywords.emotionalKeywords.slice(0, 8)"
                      :key="emotion.word"
                      :color="getEmotionColor(emotion.sentiment)"
                      variant="tonal"
                      class="ma-1"
                    >
                      {{ emotion.word }} ({{ emotion.count }})
                    </v-chip>
                  </div>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- 詳細統計 -->
          <v-expansion-panel
            title="📊 詳細統計"
            text="数値による詳細な分析結果"
          >
            <v-expansion-panel-text>
              <v-row>
                <v-col cols="12" md="4">
                  <div class="stats-section">
                    <div class="text-h6 mb-2">📅 投稿統計</div>
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title>総投稿日数</v-list-item-title>
                        <template #append>{{ analyticsResult.continuity.totalActiveDays }}日</template>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>週平均投稿頻度</v-list-item-title>
                        <template #append>{{ analyticsResult.continuity.averageFrequency }}回</template>
                      </v-list-item>
                    </v-list>
                  </div>
                </v-col>
                
                <v-col cols="12" md="4">
                  <div class="stats-section">
                    <div class="text-h6 mb-2">📝 内容統計</div>
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title>平均文字数</v-list-item-title>
                        <template #append>{{ analyticsResult.content.averageLength }}文字</template>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>最大文字数</v-list-item-title>
                        <template #append>{{ analyticsResult.content.maxLength }}文字</template>
                      </v-list-item>
                    </v-list>
                  </div>
                </v-col>
                
                <v-col cols="12" md="4">
                  <div class="stats-section">
                    <div class="text-h6 mb-2">⏰ 時間統計</div>
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title>最も活発な時間</v-list-item-title>
                        <template #append>{{ analyticsResult.time.peakHours.join(', ') || 'なし' }}</template>
                      </v-list-item>
                    </v-list>
                  </div>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </section>

    <!-- データなし表示 -->
    <div v-else class="no-data-section">
      <div class="text-center py-12">
        <v-icon size="120" color="grey-lighten-2">
          mdi-chart-timeline-variant
        </v-icon>
        <div class="text-h5 mt-4 text-medium-emphasis">
          選択した期間にデータがありません
        </div>
        <div class="text-body-1 text-medium-emphasis mt-2">
          別の期間を選択するか、日記を投稿してください
        </div>
      </div>
    </div>

    <!-- アクションボタン -->
    <footer class="report-actions mt-8">
      <div class="d-flex justify-center gap-4">
        <v-btn
          color="primary"
          variant="elevated"
          prepend-icon="mdi-view-dashboard"
          @click="navigateTo('/dashboard')"
        >
          ダッシュボード
        </v-btn>
        
        <v-btn
          variant="outlined"
          prepend-icon="mdi-refresh"
          :loading="loading"
          @click="refreshAnalysis"
        >
          分析を更新
        </v-btn>
        
        <v-btn
          variant="text"
          prepend-icon="mdi-help-circle"
          @click="navigateTo('/help')"
        >
          ヘルプ
        </v-btn>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { DateRange } from '@/types/report'
import { formatDateRange } from '@/utils/dateRange'
import { useReportAnalytics } from '@/composables/useReportAnalytics'

// コンポーネントインポート
import DateRangePicker from '@/components/report/DateRangePicker.vue'
import StatsCard from '@/components/report/StatsCard.vue'
import AnalyticsChart from '@/components/report/AnalyticsChart.vue'

const router = useRouter()

// レポート分析機能
const {
  loading,
  error,
  currentPeriod,
  analyticsResult,
  generateReport,
  updatePeriod,
  weeklyFrequencyChartData,
  moodTrendChartData,
  hourlyPostsChartData,
  lengthDistributionChartData,
  statisticsSummary
} = useReportAnalytics({
  defaultPreset: 'last30Days',
  autoRefresh: true,
  enableCache: true
})

// ローカル状態
const selectedDateRange = ref<DateRange | null>(null)
const defaultPreset = 'last30Days'

// 期間変更ハンドラー
const onDateRangeChange = async (range: DateRange) => {
  selectedDateRange.value = range
  await updatePeriod({ range })
}

// 分析の再試行
const retryAnalysis = async () => {
  if (currentPeriod.value) {
    await generateReport(currentPeriod.value)
  }
}

// 分析の更新
const refreshAnalysis = async () => {
  if (currentPeriod.value) {
    await generateReport(currentPeriod.value)
  }
}

// ナビゲーション
const navigateTo = (path: string) => {
  router.push(path)
}

// ユーティリティ関数

// キーワードサイズの計算
const getKeywordSize = (count: number): string => {
  if (count > 10) return 'large'
  if (count > 5) return 'default'
  if (count > 2) return 'small'
  return 'x-small'
}

// 感情色の取得
const getEmotionColor = (sentiment: 'positive' | 'negative' | 'neutral'): string => {
  switch (sentiment) {
    case 'positive':
      return 'success'
    case 'negative':
      return 'error'
    case 'neutral':
    default:
      return 'info'
  }
}
</script>

<style scoped>
.report-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 24px;
}

.report-header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.period-display {
  position: relative;
}

.period-selection-section {
  position: relative;
  z-index: 10;
}

.stats-summary {
  position: relative;
}

.charts-analysis {
  position: relative;
}

.detailed-stats {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.stats-section {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.keyword-cloud,
.emotion-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
}

.no-data-section {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 48px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.report-actions {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .report-page {
    padding: 16px;
  }
  
  .report-header {
    padding: 16px;
  }
  
  .period-display {
    margin-top: 16px;
  }
  
  .report-header .d-flex {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 16px;
  }
}

@media (max-width: 600px) {
  .report-page {
    padding: 12px;
  }
  
  .no-data-section {
    padding: 24px;
  }
  
  .keyword-cloud,
  .emotion-keywords {
    justify-content: center;
  }
}

/* アニメーション */
.stats-summary .v-col {
  animation: fadeInUp 0.6s ease-out;
}

.charts-analysis .v-col {
  animation: fadeInUp 0.8s ease-out;
}

.detailed-stats {
  animation: fadeInUp 1s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* カスタムスクロールバー */
.keyword-cloud::-webkit-scrollbar,
.emotion-keywords::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.keyword-cloud::-webkit-scrollbar-track,
.emotion-keywords::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.keyword-cloud::-webkit-scrollbar-thumb,
.emotion-keywords::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
}

.keyword-cloud::-webkit-scrollbar-thumb:hover,
.emotion-keywords::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}
</style>
