<template>
  <v-card class="comparison-card" elevation="2">
    <v-card-title class="card-title">
      <v-icon icon="mdi-compare" class="title-icon" />
      昨日からの変化
    </v-card-title>

    <v-card-text class="card-content">
      <div v-if="loading" class="loading-state">
        <v-progress-circular indeterminate size="small" />
        <span class="loading-text">比較データを取得中...</span>
      </div>

      <div v-else-if="error" class="error-state">
        <v-icon icon="mdi-alert-circle" color="error" />
        <span class="error-text">{{ error }}</span>
      </div>

      <div v-else-if="!comparison" class="no-data-state">
        <v-icon icon="mdi-information" color="info" />
        <span class="no-data-text">昨日のデータがありません</span>
        <p class="no-data-description">日記を継続して記録すると、変化を確認できます</p>
      </div>

      <div v-else class="comparison-content">
        <!-- 気分スコア比較 -->
        <div class="mood-comparison">
          <div class="comparison-row">
            <span class="comparison-label">気分:</span>
            <div class="comparison-values">
              <span class="previous-value">{{ comparison.previousMood }}</span>
              <v-icon
                :icon="getMoodChangeIcon()"
                :color="getMoodChangeColor()"
                class="change-icon"
              />
              <span class="current-value">{{ comparison.currentMood }}</span>
              <span :class="['change-amount', getMoodChangeColor()]">
                ({{ getMoodChangeText() }})
              </span>
            </div>
          </div>

          <!-- 気分理由の比較（ある場合のみ） -->
          <div
            v-if="comparison.previousReason || comparison.currentReason"
            class="reason-comparison"
          >
            <div v-if="comparison.previousReason" class="reason-item">
              <span class="reason-label">昨日:</span>
              <span class="reason-text">{{ comparison.previousReason }}</span>
            </div>
            <div v-if="comparison.currentReason" class="reason-item">
              <span class="reason-label">今日:</span>
              <span class="reason-text">{{ comparison.currentReason }}</span>
            </div>
          </div>
        </div>

        <!-- 連続記録 -->
        <div class="streak-info">
          <v-icon icon="mdi-fire" color="orange" class="streak-icon" />
          <span class="streak-text"> {{ comparison.streakDays }}日連続記録中 </span>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
// import { computed } from 'vue' // 現在未使用

export interface ComparisonData {
  previousMood: number
  currentMood: number
  previousReason?: string
  currentReason?: string
  streakDays: number
}

interface Props {
  comparison: ComparisonData | null
  loading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
})

// 気分変化のアイコンを取得
const getMoodChangeIcon = (): string => {
  if (!props.comparison) return 'mdi-minus'

  const change = props.comparison.currentMood - props.comparison.previousMood
  if (change > 0) return 'mdi-trending-up'
  if (change < 0) return 'mdi-trending-down'
  return 'mdi-minus'
}

// 気分変化の色を取得
const getMoodChangeColor = (): string => {
  if (!props.comparison) return 'grey'

  const change = props.comparison.currentMood - props.comparison.previousMood
  if (change > 0) return 'success'
  if (change < 0) return 'error'
  return 'info'
}

// 気分変化のテキストを取得
const getMoodChangeText = (): string => {
  if (!props.comparison) return '±0'

  const change = props.comparison.currentMood - props.comparison.previousMood
  if (change > 0) return `+${change}`
  if (change < 0) return `${change}`
  return '±0'
}
</script>

<style scoped>
.comparison-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 24px 16px;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--v-theme-on-surface);
}

.title-icon {
  font-size: 1.2rem;
  color: var(--v-theme-primary);
}

.card-content {
  flex: 1;
  padding: 0 24px 24px;
}

/* ローディング状態 */
.loading-state {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  padding: 32px 0;
}

.loading-text {
  font-size: 0.9rem;
  color: var(--v-theme-on-surface-variant);
}

/* エラー状態 */
.error-state {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  padding: 32px 0;
}

.error-text {
  font-size: 0.9rem;
  color: var(--v-theme-error);
}

/* データなし状態 */
.no-data-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 0;
  text-align: center;
}

.no-data-text {
  font-size: 1rem;
  color: var(--v-theme-on-surface);
  font-weight: 500;
}

.no-data-description {
  font-size: 0.875rem;
  color: var(--v-theme-on-surface-variant);
  margin: 4px 0 0;
}

/* 比較コンテンツ */
.comparison-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.mood-comparison {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comparison-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comparison-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--v-theme-on-surface-variant);
}

.comparison-values {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.25rem;
  font-weight: 600;
}

.previous-value {
  color: var(--v-theme-on-surface-variant);
}

.current-value {
  color: var(--v-theme-on-surface);
}

.change-icon {
  font-size: 1.5rem;
}

.change-amount {
  font-size: 1rem;
  font-weight: 500;
}

.change-amount.success {
  color: var(--v-theme-success);
}

.change-amount.error {
  color: var(--v-theme-error);
}

.change-amount.info {
  color: var(--v-theme-info);
}

/* 理由比較 */
.reason-comparison {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background-color: var(--v-theme-surface-variant);
  border-radius: 8px;
}

.reason-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reason-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--v-theme-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.reason-text {
  font-size: 0.875rem;
  color: var(--v-theme-on-surface);
  line-height: 1.4;
}

/* 連続記録 */
.streak-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: rgba(255, 152, 0, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 152, 0, 0.3);
}

.streak-icon {
  font-size: 1.2rem;
}

.streak-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--v-theme-on-surface);
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .card-title {
    padding: 16px 20px 12px;
    font-size: 1rem;
  }

  .card-content {
    padding: 0 20px 20px;
  }

  .comparison-values {
    font-size: 1.1rem;
    gap: 8px;
  }

  .change-icon {
    font-size: 1.3rem;
  }

  .reason-comparison {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .card-title {
    padding: 12px 16px 8px;
    font-size: 0.95rem;
  }

  .card-content {
    padding: 0 16px 16px;
  }

  .comparison-content {
    gap: 20px;
  }

  .comparison-values {
    font-size: 1rem;
    gap: 6px;
  }

  .streak-info {
    padding: 10px 12px;
  }
}
</style>
