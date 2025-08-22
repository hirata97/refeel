<template>
  <v-container fluid class="tag-goal-dashboard">
    <v-row>
      <!-- サマリーカード -->
      <v-col cols="12">
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-card color="primary" variant="tonal">
              <v-card-text class="text-center">
                <v-icon size="32" class="mb-2">mdi-tag-multiple</v-icon>
                <div class="text-h5">{{ tags.length }}</div>
                <div class="text-body-2">総タグ数</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" sm="6" md="3">
            <v-card color="success" variant="tonal">
              <v-card-text class="text-center">
                <v-icon size="32" class="mb-2">mdi-target</v-icon>
                <div class="text-h5">{{ activeGoals.length }}</div>
                <div class="text-body-2">アクティブ目標</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" sm="6" md="3">
            <v-card color="info" variant="tonal">
              <v-card-text class="text-center">
                <v-icon size="32" class="mb-2">mdi-chart-line</v-icon>
                <div class="text-h5">{{ Math.round(averageProgress) }}%</div>
                <div class="text-body-2">平均進捗</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" sm="6" md="3">
            <v-card color="warning" variant="tonal">
              <v-card-text class="text-center">
                <v-icon size="32" class="mb-2">mdi-link-variant</v-icon>
                <div class="text-h5">{{ tagGoals.length }}</div>
                <div class="text-body-2">タグ連携数</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <!-- メインコンテンツ -->
      <v-col cols="12" lg="8">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span>カテゴリ別進捗状況</span>
            <v-btn-toggle
              v-model="viewMode"
              variant="outlined"
              density="compact"
              mandatory
            >
              <v-btn value="grid" size="small">
                <v-icon>mdi-view-grid</v-icon>
              </v-btn>
              <v-btn value="list" size="small">
                <v-icon>mdi-view-list</v-icon>
              </v-btn>
            </v-btn-toggle>
          </v-card-title>

          <v-card-text>
            <!-- グリッドビュー -->
            <v-row v-if="viewMode === 'grid'">
              <v-col
                v-for="(analysis, category) in categoryAnalyses"
                :key="category"
                cols="12"
                md="6"
              >
                <v-card variant="outlined" class="h-100">
                  <v-card-title class="d-flex align-center">
                    <v-icon :color="getCategoryColor(category)" class="me-2">
                      {{ getCategoryIcon(category) }}
                    </v-icon>
                    {{ category }}
                  </v-card-title>

                  <v-card-text>
                    <!-- 進捗サークル -->
                    <div class="d-flex align-center justify-center mb-4">
                      <v-progress-circular
                        :model-value="analysis.averageProgress"
                        :color="getProgressColor(analysis.averageProgress)"
                        :size="80"
                        :width="8"
                      >
                        {{ Math.round(analysis.averageProgress) }}%
                      </v-progress-circular>
                    </div>

                    <!-- 統計情報 -->
                    <div class="mb-3">
                      <div class="d-flex justify-space-between">
                        <span class="text-body-2">日記数:</span>
                        <span class="font-weight-medium">{{ analysis.totalDiaries }}</span>
                      </div>
                      <div class="d-flex justify-space-between">
                        <span class="text-body-2">関連タグ:</span>
                        <span class="font-weight-medium">{{ analysis.tags.length }}</span>
                      </div>
                    </div>

                    <!-- 関連タグ -->
                    <div v-if="analysis.tags.length > 0">
                      <div class="text-caption mb-2">よく使用されるタグ:</div>
                      <div class="d-flex flex-wrap gap-1">
                        <v-chip
                          v-for="tagUsage in analysis.tags.slice(0, 3)"
                          :key="tagUsage.tag.id"
                          :color="tagUsage.tag.color"
                          size="x-small"
                          variant="tonal"
                        >
                          {{ tagUsage.tag.name }} ({{ tagUsage.usageCount }})
                        </v-chip>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- リストビュー -->
            <v-list v-else>
              <v-list-item
                v-for="(analysis, category) in categoryAnalyses"
                :key="category"
                class="mb-2"
              >
                <template #prepend>
                  <v-avatar :color="getCategoryColor(category)" size="40">
                    <v-icon color="white">{{ getCategoryIcon(category) }}</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title>{{ category }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ analysis.totalDiaries }}日記 • {{ analysis.tags.length }}タグ
                </v-list-item-subtitle>

                <template #append>
                  <div class="text-center">
                    <div class="text-h6">{{ Math.round(analysis.averageProgress) }}%</div>
                    <v-progress-linear
                      :model-value="analysis.averageProgress"
                      :color="getProgressColor(analysis.averageProgress)"
                      height="4"
                      class="mt-1"
                      style="width: 80px;"
                    />
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- サイドバー -->
      <v-col cols="12" lg="4">
        <v-row>
          <!-- タグクラウド -->
          <v-col cols="12">
            <v-card class="mb-4">
              <v-card-title>タグクラウド</v-card-title>
              <v-card-text>
                <div class="tag-cloud">
                  <v-chip
                    v-for="tag in popularTags"
                    :key="tag.id"
                    :color="tag.color"
                    :size="getTagSize()"
                    variant="elevated"
                    class="ma-1"
                    @click="filterByTag(tag)"
                  >
                    {{ tag.name }}
                  </v-chip>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- 近日期限の目標 -->
          <v-col cols="12">
            <v-card>
              <v-card-title>期限の近い目標</v-card-title>
              <v-card-text>
                <v-list v-if="upcomingGoals.length > 0" density="compact">
                  <v-list-item
                    v-for="goal in upcomingGoals"
                    :key="goal.id"
                    class="pa-2"
                  >
                    <v-list-item-title class="text-body-2">
                      {{ goal.title }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      期限: {{ formatDate(goal.target_date!) }}
                    </v-list-item-subtitle>
                    <template #append>
                      <v-progress-circular
                        :model-value="(goal.current_value / goal.target_value) * 100"
                        :color="getProgressColor((goal.current_value / goal.target_value) * 100)"
                        size="24"
                        width="3"
                      >
                        <span class="text-caption">
                          {{ Math.round((goal.current_value / goal.target_value) * 100) }}
                        </span>
                      </v-progress-circular>
                    </template>
                  </v-list-item>
                </v-list>

                <v-alert
                  v-else
                  type="info"
                  variant="tonal"
                  text="期限の設定された目標がありません"
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <!-- 進捗トレンドチャート -->
      <v-col cols="12">
        <v-card>
          <v-card-title>進捗トレンド（過去30日）</v-card-title>
          <v-card-text>
            <div class="chart-container">
              <!-- チャートは今後Chart.jsで実装 -->
              <v-alert type="info" variant="tonal">
                進捗トレンドチャートは今後実装予定です
              </v-alert>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- タグフィルター結果ダイアログ -->
    <v-dialog
      v-model="showTagFilterDialog"
      max-width="600px"
    >
      <v-card v-if="selectedTag">
        <v-card-title>
          タグ「{{ selectedTag.name }}」の詳細
        </v-card-title>
        <v-card-text>
          <div class="mb-4">
            <v-chip :color="selectedTag.color" variant="elevated">
              {{ selectedTag.name }}
            </v-chip>
            <p v-if="selectedTag.description" class="mt-2 text-body-2">
              {{ selectedTag.description }}
            </p>
          </div>

          <!-- 関連目標 -->
          <div v-if="getGoalsForTag(selectedTag.id).length > 0">
            <h4 class="mb-2">関連目標</h4>
            <v-list density="compact">
              <v-list-item
                v-for="goal in getGoalsForTag(selectedTag.id)"
                :key="goal.id"
              >
                <v-list-item-title>{{ goal.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ goal.category }}</v-list-item-subtitle>
                <template #append>
                  <v-progress-linear
                    :model-value="(goal.current_value / goal.target_value) * 100"
                    :color="getProgressColor((goal.current_value / goal.target_value) * 100)"
                    height="4"
                    width="60"
                  />
                </template>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showTagFilterDialog = false">
            閉じる
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTagGoalStore } from '@/stores/tagGoal'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
import type { Tag, Goal, DiaryTag } from '@/types/tags'

// ストア
const tagGoalStore = useTagGoalStore()
const dataStore = useDataStore()
const authStore = useAuthStore()

// リアクティブな参照
const { tags, goals, activeGoals, tagGoals } = tagGoalStore
const { diaries } = dataStore

// ローカル状態
const viewMode = ref<'grid' | 'list'>('grid')
const showTagFilterDialog = ref(false)
const selectedTag = ref<Tag | null>(null)

// 計算プロパティ
const averageProgress = computed(() => {
  if (activeGoals.length === 0) return 0
  return activeGoals.reduce((acc: number, goal: Goal) => 
    acc + (goal.current_value / goal.target_value) * 100, 0
  ) / activeGoals.length
})

const categoryAnalyses = computed(() => {
  const analyses: Record<string, ReturnType<typeof tagGoalStore.analyzeCategory>> = {}
  
  // 各カテゴリの分析を計算
  const categories = [...new Set(goals.map((g: Goal) => g.category))]
  
  categories.forEach((category: string) => {
    analyses[category] = tagGoalStore.analyzeCategory(category, diaries)
  })
  
  return analyses
})

const popularTags = computed(() => {
  // タグの使用頻度でソート
  return tags
    .slice()
    .sort((a: Tag, b: Tag) => {
      const aUsage = getTagUsageCount(a.id)
      const bUsage = getTagUsageCount(b.id)
      return bUsage - aUsage
    })
    .slice(0, 10)
})

const upcomingGoals = computed(() => {
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  
  return activeGoals
    .filter((goal: Goal) => goal.target_date && new Date(goal.target_date) <= thirtyDaysFromNow)
    .sort((a: Goal, b: Goal) => 
      new Date(a.target_date!).getTime() - new Date(b.target_date!).getTime()
    )
    .slice(0, 5)
})

// メソッド
const getProgressColor = (percentage: number): string => {
  if (percentage >= 100) return 'success'
  if (percentage >= 75) return 'info'
  if (percentage >= 50) return 'warning'
  return 'error'
}

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    general: '#607D8B',
    health: '#4CAF50',
    work: '#FF9800',
    learning: '#2196F3',
    hobby: '#9C27B0',
    relationship: '#E91E63',
    finance: '#795548'
  }
  return colors[category] || '#607D8B'
}

const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    general: 'mdi-folder',
    health: 'mdi-heart',
    work: 'mdi-briefcase',
    learning: 'mdi-school',
    hobby: 'mdi-palette',
    relationship: 'mdi-account-group',
    finance: 'mdi-currency-usd'
  }
  return icons[category] || 'mdi-folder'
}

const getTagUsageCount = (tagId?: string): number => {
  if (!tagId) return 0
  
  // 実際の使用回数を計算
  const usageCount = tagGoalStore.diaryTags.filter((dt: DiaryTag) => dt.tag_id === tagId).length
  return usageCount
}

const getTagSize = (tagId?: string): string => {
  const usageCount = getTagUsageCount(tagId)
  if (usageCount > 15) return 'large'
  if (usageCount > 10) return 'default'
  if (usageCount > 5) return 'small'
  return 'x-small'
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric'
  })
}

const filterByTag = (tag: Tag): void => {
  selectedTag.value = tag
  showTagFilterDialog.value = true
}

const getGoalsForTag = (tagId: string) => {
  return tagGoalStore.getGoalsForTag(tagId)
}

// ライフサイクル
onMounted(async () => {
  const userId = authStore.user?.id
  if (userId) {
    try {
      await tagGoalStore.initializeTagGoalData(userId)
      await dataStore.fetchDiaries(userId)
    } catch (err) {
      console.error('ダッシュボードデータ取得エラー:', err)
    }
  }
})
</script>

<style scoped>
.tag-goal-dashboard {
  min-height: 100vh;
}

.tag-cloud {
  min-height: 100px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>