<template>
  <v-container class="dashboard-page">
    <!-- ダッシュボードヘッダー -->
    <header class="dashboard-header">
      <div class="header-content">
        <h1 class="dashboard-title">ダッシュボード</h1>
        <p class="dashboard-description">あなたの振り返り活動の概要を確認できます</p>
      </div>
      <v-btn
        icon="mdi-refresh"
        variant="text"
        :loading="isLoading"
        @click="refresh"
      />
    </header>

    <!-- エラー表示 -->
    <v-alert
      v-if="hasError && !isLoading"
      type="error"
      variant="outlined"
      class="mb-6"
      dismissible
    >
      データの読み込みに失敗しました。リフレッシュボタンをお試しください。
    </v-alert>

    <!-- 統計カードセクション -->
    <section class="stats-section">
      <div class="stats-grid">
        <StatCard
          title="総投稿数"
          :value="dashboardData.stats.totalDiaries"
          unit="件"
          icon="mdi-notebook"
          icon-color="primary"
          description="これまでに投稿した日記の総数"
        />
        <StatCard
          title="今週の投稿"
          :value="dashboardData.stats.weeklyDiaries"
          unit="件"
          icon="mdi-calendar-week"
          icon-color="success"
          description="今週投稿した日記の数"
        />
        <StatCard
          title="平均気分"
          :value="dashboardData.stats.averageMood"
          unit="/10"
          icon="mdi-emoticon"
          icon-color="warning"
          description="これまでの平均気分スコア"
        />
        <StatCard
          title="連続記録"
          :value="dashboardData.stats.streakDays"
          unit="日"
          icon="mdi-fire"
          icon-color="error"
          description="連続で投稿している日数"
        />
      </div>
    </section>

    <!-- メインコンテンツセクション -->
    <section class="main-content">
      <div class="content-grid">
        <!-- 最近の日記 -->
        <RecentDiaryCard
          :recent-diaries="dashboardData.recentDiaries"
          :loading="loading.recentDiaries"
          :error="error.recentDiaries"
          @view-diary="handleViewDiary"
          @view-all="navigateTo('/diary-view')"
          @create-diary="navigateTo('/diary-register')"
        />

        <!-- 気分推移チャート -->
        <MoodChartCard
          :mood-data="dashboardData.moodData"
          :loading="loading.moodData"
          :error="error.moodData"
          @view-details="navigateTo('/diary-report')"
        />

        <!-- 前日比較カード -->
        <ComparisonCard
          :comparison="comparisonData"
          :loading="comparisonLoading"
          :error="comparisonError"
        />

        <!-- 感情タグ分析 -->
        <EmotionTagAnalysisCard
          :loading="loading.emotionTagAnalysis"
          :error="error.emotionTagAnalysis"
          @refresh="refresh"
          @view-details="navigateTo('/diary-report')"
        />

        <!-- クイックアクション -->
        <QuickActionsCard
          :actions="dashboardData.quickActions"
          @action-click="handleActionClick"
        />
      </div>
    </section>
  </v-container>
</template>

<script setup lang="ts">
import { useDashboardData } from '@/composables/useDashboardData'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { useAppRouter } from '@/composables/useAppRouter'
import StatCard from '@/components/dashboard/StatCard.vue'
import RecentDiaryCard from '@/components/dashboard/RecentDiaryCard.vue'
import MoodChartCard from '@/components/dashboard/MoodChartCard.vue'
import EmotionTagAnalysisCard from '@/components/dashboard/EmotionTagAnalysisCard.vue'
import QuickActionsCard from '@/components/dashboard/QuickActionsCard.vue'
import ComparisonCard from '@/components/dashboard/ComparisonCard.vue'
import type { QuickAction } from '@/types/dashboard'

useAuthGuard({
  requireAuth: true,
  onAuthenticated: async () => {
    // 認証成功時にダッシュボードデータを取得
    await fetchDashboardData()
  }
})
const { navigateTo } = useAppRouter()

// ダッシュボードデータコンポーザブル
const {
  dashboardData,
  loading,
  error,
  hasError,
  isLoading,
  comparisonData,
  comparisonLoading,
  comparisonError,
  fetchDashboardData,
  refresh,
} = useDashboardData()

// 認証チェックとデータ取得は useAuthGuard で自動処理

// 日記表示
const handleViewDiary = (diaryId: string) => {
  navigateTo(`/diary-view?id=${diaryId}`)
}

// アクションクリック
const handleActionClick = (action: QuickAction) => {
  console.log('Action clicked:', action.id)
}
</script>

<style scoped>
.dashboard-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* ヘッダー */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.header-content {
  flex: 1;
}

.dashboard-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--v-theme-primary);
}

.dashboard-description {
  font-size: 1.125rem;
  color: var(--v-theme-on-surface-variant);
  margin: 0;
}

/* 統計セクション */
.stats-section {
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

/* メインコンテンツ */
.main-content {
  margin-bottom: 32px;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: auto auto auto;
  gap: 24px;
}

.content-grid > :first-child {
  grid-row: 1 / 4;
}

.content-grid > :nth-child(2) {
  grid-column: 2;
  grid-row: 1;
}

.content-grid > :nth-child(3) {
  grid-column: 2;
  grid-row: 2;
}

.content-grid > :nth-child(4) {
  grid-column: 2;
  grid-row: 3;
}

/* タブレット対応 */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .content-grid {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto auto auto;
  }
  
  .content-grid > :first-child {
    grid-column: 1 / 3;
    grid-row: 1;
  }
  
  .content-grid > :nth-child(2) {
    grid-column: 1;
    grid-row: 2;
  }
  
  .content-grid > :nth-child(3) {
    grid-column: 2;
    grid-row: 2;
  }
  
  .content-grid > :nth-child(4) {
    grid-column: 1 / 3;
    grid-row: 3;
  }
}

/* モバイル対応 */
@media (max-width: 768px) {
  .dashboard-page {
    padding: 16px;
  }
  
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .dashboard-title {
    font-size: 2rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto auto;
    gap: 20px;
  }
  
  .content-grid > :first-child,
  .content-grid > :nth-child(2),
  .content-grid > :nth-child(3),
  .content-grid > :nth-child(4) {
    grid-column: 1;
    grid-row: auto;
  }
}

/* 小さなモバイル画面 */
@media (max-width: 480px) {
  .dashboard-page {
    padding: 12px;
  }
  
  .dashboard-title {
    font-size: 1.75rem;
  }
  
  .dashboard-description {
    font-size: 1rem;
  }
}
</style>
