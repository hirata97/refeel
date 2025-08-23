<template>
  <BaseCard title="最近の日記" class="recent-diary-card">
    <div v-if="loading" class="loading-state">
      <v-skeleton-loader type="list-item-three-line" />
    </div>
    
    <div v-else-if="error" class="error-state">
      <v-alert type="error" variant="outlined">
        {{ error }}
      </v-alert>
    </div>
    
    <div v-else-if="recentDiaries.length === 0" class="empty-state">
      <div class="empty-content">
        <v-icon size="64" color="grey-lighten-1">mdi-notebook-outline</v-icon>
        <p class="empty-text">まだ日記が投稿されていません</p>
        <v-btn color="primary" variant="outlined" @click="$emit('create-diary')">
          最初の日記を書く
        </v-btn>
      </div>
    </div>
    
    <div v-else class="diary-list">
      <div
        v-for="diary in recentDiaries"
        :key="diary.id"
        class="diary-item"
        @click="$emit('view-diary', diary.id)"
      >
        <div class="diary-header">
          <h4 class="diary-title">{{ diary.title }}</h4>
          <v-chip size="small" color="primary" variant="outlined">
            {{ diary.goal_category }}
          </v-chip>
        </div>
        
        <p class="diary-preview">{{ diary.preview }}</p>
        
        <div class="diary-footer">
          <span class="diary-date">{{ formatDate(diary.created_at) }}</span>
          <div class="mood-indicator">
            <v-icon size="16" :color="getMoodColor(diary.progress_level)">
              mdi-emoticon
            </v-icon>
            <span class="mood-value">{{ diary.progress_level }}%</span>
          </div>
        </div>
      </div>
      
      <div class="view-all">
        <v-btn 
          variant="text" 
          color="primary" 
          block
          @click="$emit('view-all')"
        >
          すべての日記を見る
          <v-icon end>mdi-arrow-right</v-icon>
        </v-btn>
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { BaseCard } from '@/components/base'
import type { RecentDiary } from '@/types/dashboard'

interface Props {
  /** 最近の日記データ */
  recentDiaries: RecentDiary[]
  /** ローディング状態 */
  loading?: boolean
  /** エラーメッセージ */
  error?: string | null
}

interface Emits {
  (e: 'view-diary', diaryId: string): void
  (e: 'view-all'): void
  (e: 'create-diary'): void
}

withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
})

defineEmits<Emits>()

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getMoodColor = (mood: number): string => {
  if (mood >= 80) return 'success'
  if (mood >= 60) return 'warning'
  if (mood >= 40) return 'orange'
  return 'error'
}
</script>

<style scoped>
.recent-diary-card {
  height: 100%;
}

.loading-state,
.error-state {
  padding: 16px 0;
}

.empty-state {
  padding: 32px 16px;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.empty-text {
  color: var(--v-theme-on-surface-variant);
  margin: 0;
}

.diary-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.diary-item {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--v-theme-outline-variant);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.diary-item:hover {
  background-color: var(--v-theme-surface-variant);
  border-color: var(--v-theme-primary);
}

.diary-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 8px;
}

.diary-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.diary-preview {
  font-size: 0.875rem;
  color: var(--v-theme-on-surface-variant);
  line-height: 1.4;
  margin: 0 0 8px 0;
}

.diary-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.diary-date {
  color: var(--v-theme-on-surface-variant);
}

.mood-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mood-value {
  color: var(--v-theme-on-surface-variant);
  font-weight: 500;
}

.view-all {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--v-theme-outline-variant);
}

/* モバイル対応 */
@media (max-width: 600px) {
  .diary-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .diary-title {
    white-space: normal;
    line-height: 1.3;
  }
}
</style>