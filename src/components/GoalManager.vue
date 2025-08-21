<template>
  <v-card class="goal-manager">
    <v-card-title class="d-flex align-center justify-space-between">
      <span>目標管理</span>
      <v-btn
        color="primary"
        variant="outlined"
        size="small"
        @click="showCreateDialog = true"
      >
        <v-icon start>mdi-target</v-icon>
        新規目標
      </v-btn>
    </v-card-title>

    <v-card-text>
      <!-- フィルターバー -->
      <v-row class="mb-4">
        <v-col cols="12" md="6">
          <v-select
            v-model="selectedCategory"
            :items="categoryOptions"
            label="カテゴリーフィルター"
            variant="outlined"
            density="compact"
            clearable
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="selectedStatus"
            :items="statusOptions"
            label="ステータスフィルター"
            variant="outlined"
            density="compact"
            clearable
          />
        </v-col>
      </v-row>

      <!-- 目標一覧 -->
      <div v-if="filteredGoals.length > 0" class="goal-list">
        <v-card
          v-for="goal in filteredGoals"
          :key="goal.id"
          class="mb-3"
          variant="outlined"
          @click="viewGoalDetails(goal)"
        >
          <v-card-text>
            <div class="d-flex justify-space-between align-start">
              <div class="flex-grow-1">
                <h3 class="text-h6 mb-2">{{ goal.title }}</h3>
                <p v-if="goal.description" class="text-body-2 mb-2">
                  {{ goal.description }}
                </p>
                
                <!-- 進捗表示 -->
                <div class="mb-2">
                  <div class="d-flex justify-space-between align-center mb-1">
                    <span class="text-caption">進捗</span>
                    <span class="text-caption">
                      {{ goal.current_value }} / {{ goal.target_value }}
                      ({{ Math.round((goal.current_value / goal.target_value) * 100) }}%)
                    </span>
                  </div>
                  <v-progress-linear
                    :model-value="(goal.current_value / goal.target_value) * 100"
                    :color="getProgressColor((goal.current_value / goal.target_value) * 100)"
                    height="8"
                    rounded
                  />
                </div>

                <!-- メタ情報 -->
                <div class="d-flex flex-wrap gap-2">
                  <v-chip size="x-small" :color="getCategoryColor(goal.category)">
                    {{ goal.category }}
                  </v-chip>
                  <v-chip 
                    size="x-small" 
                    :color="getStatusColor(goal.status)"
                    variant="tonal"
                  >
                    {{ getStatusLabel(goal.status) }}
                  </v-chip>
                  <v-chip 
                    v-if="goal.target_date"
                    size="x-small"
                    color="grey"
                    variant="outlined"
                  >
                    期限: {{ formatDate(goal.target_date) }}
                  </v-chip>
                </div>
              </div>

              <!-- アクションボタン -->
              <div class="ml-4">
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn
                      icon="mdi-dots-vertical"
                      variant="text"
                      size="small"
                      v-bind="props"
                      @click.stop
                    />
                  </template>
                  <v-list density="compact">
                    <v-list-item @click="editGoal(goal)">
                      <v-list-item-title>編集</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="linkTagsToGoal(goal)">
                      <v-list-item-title>タグ連携</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="deleteGoal(goal.id)">
                      <v-list-item-title>削除</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <v-alert
        v-else
        type="info"
        variant="tonal"
        text="条件に一致する目標がありません。"
      />

      <!-- エラー表示 -->
      <v-alert
        v-if="error.goals || error.createGoal || error.updateGoal"
        type="error"
        variant="tonal"
        class="mt-4"
        dismissible
        @click:close="clearErrors"
      >
        {{ error.goals || error.createGoal || error.updateGoal }}
      </v-alert>
    </v-card-text>

    <!-- 目標作成/編集ダイアログ -->
    <v-dialog
      v-model="showCreateDialog"
      max-width="600px"
      persistent
    >
      <v-card>
        <v-card-title>
          {{ editingGoal ? '目標編集' : '新規目標作成' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="goalForm" @submit.prevent="submitGoal">
            <v-text-field
              v-model="goalFormData.title"
              label="目標タイトル"
              :rules="[
                v => !!v || '目標タイトルは必須です',
                v => (v && v.length >= 1 && v.length <= 100) || 'タイトルは1-100文字で入力してください'
              ]"
              variant="outlined"
              density="comfortable"
              required
            />

            <v-textarea
              v-model="goalFormData.description"
              label="目標の説明（任意）"
              :rules="[
                v => !v || v.length <= 500 || '説明は500文字以内で入力してください'
              ]"
              variant="outlined"
              density="comfortable"
              rows="3"
            />

            <v-select
              v-model="goalFormData.category"
              :items="availableCategories"
              label="カテゴリー"
              variant="outlined"
              density="comfortable"
              required
            />

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="goalFormData.target_value"
                  label="目標値"
                  type="number"
                  min="0.01"
                  step="0.01"
                  :rules="[
                    v => !!v || '目標値は必須です',
                    v => v > 0 || '目標値は0より大きい値を入力してください'
                  ]"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="goalFormData.current_value"
                  label="現在値"
                  type="number"
                  min="0"
                  step="0.01"
                  :rules="[
                    v => v >= 0 || '現在値は0以上の値を入力してください'
                  ]"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
            </v-row>

            <v-text-field
              v-model="goalFormData.target_date"
              label="目標期限（任意）"
              type="date"
              variant="outlined"
              density="comfortable"
            />

            <v-select
              v-model="goalFormData.status"
              :items="statusOptions"
              label="ステータス"
              variant="outlined"
              density="comfortable"
              required
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelGoalForm">
            キャンセル
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="loading.createGoal || loading.updateGoal"
            @click="submitGoal"
          >
            {{ editingGoal ? '更新' : '作成' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 詳細表示ダイアログ -->
    <v-dialog
      v-model="showDetailDialog"
      max-width="800px"
    >
      <v-card v-if="selectedGoal">
        <v-card-title>{{ selectedGoal.title }}</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <h4>基本情報</h4>
              <p><strong>カテゴリー:</strong> {{ selectedGoal.category }}</p>
              <p><strong>ステータス:</strong> {{ getStatusLabel(selectedGoal.status) }}</p>
              <p v-if="selectedGoal.target_date">
                <strong>期限:</strong> {{ formatDate(selectedGoal.target_date) }}
              </p>
              <p v-if="selectedGoal.description">
                <strong>説明:</strong> {{ selectedGoal.description }}
              </p>
            </v-col>
            <v-col cols="12" md="6">
              <h4>進捗状況</h4>
              <v-progress-circular
                :model-value="(selectedGoal.current_value / selectedGoal.target_value) * 100"
                :color="getProgressColor((selectedGoal.current_value / selectedGoal.target_value) * 100)"
                :size="120"
                :width="12"
              >
                {{ Math.round((selectedGoal.current_value / selectedGoal.target_value) * 100) }}%
              </v-progress-circular>
              <p class="mt-2">
                {{ selectedGoal.current_value }} / {{ selectedGoal.target_value }}
              </p>
            </v-col>
          </v-row>

          <!-- 関連タグ表示 -->
          <div v-if="getTagsForGoal(selectedGoal.id).length > 0" class="mt-4">
            <h4>関連タグ</h4>
            <div class="d-flex flex-wrap gap-2 mt-2">
              <v-chip
                v-for="tag in getTagsForGoal(selectedGoal.id)"
                :key="tag.id"
                :color="tag.color"
                variant="elevated"
                size="small"
              >
                {{ tag.name }}
              </v-chip>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDetailDialog = false">
            閉じる
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTagGoalStore } from '@/stores/tagGoal'
import { useAuthStore } from '@/stores/auth'
import type { Goal } from '@/types/tags'

// ストア
const tagGoalStore = useTagGoalStore()
const authStore = useAuthStore()

// リアクティブな参照
const { goals, loading, error } = tagGoalStore

// ローカル状態
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const editingGoal = ref<Goal | null>(null)
const selectedGoal = ref<Goal | null>(null)
const goalForm = ref()

const selectedCategory = ref<string>('')
const selectedStatus = ref<string>('')

// フォームデータ
const goalFormData = ref({
  title: '',
  description: '',
  category: 'general',
  target_value: 0,
  current_value: 0,
  target_date: '',
  status: 'active'
})

// オプション
const statusOptions = [
  { title: 'アクティブ', value: 'active' },
  { title: '完了', value: 'completed' },
  { title: '一時停止', value: 'paused' },
  { title: 'アーカイブ', value: 'archived' }
]

const availableCategories = [
  'general',
  'health',
  'work',
  'learning',
  'hobby',
  'relationship',
  'finance'
]

// 計算プロパティ
const categoryOptions = computed(() => {
  const categories = [...new Set(goals.map((g: Goal) => g.category))]
  return categories.map(cat => ({ title: cat, value: cat }))
})

const filteredGoals = computed(() => {
  let filtered = goals

  if (selectedCategory.value) {
    filtered = filtered.filter((g: Goal) => g.category === selectedCategory.value)
  }

  if (selectedStatus.value) {
    filtered = filtered.filter((g: Goal) => g.status === selectedStatus.value)
  }

  return filtered
})

// メソッド
const clearErrors = (): void => {
  tagGoalStore.setError('goals', null)
  tagGoalStore.setError('createGoal', null)
  tagGoalStore.setError('updateGoal', null)
}

const getProgressColor = (percentage: number): string => {
  if (percentage >= 100) return 'success'
  if (percentage >= 75) return 'info'
  if (percentage >= 50) return 'warning'
  return 'error'
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active': return 'primary'
    case 'completed': return 'success'
    case 'paused': return 'warning'
    case 'archived': return 'grey'
    default: return 'grey'
  }
}

const getStatusLabel = (status: string): string => {
  return statusOptions.find(opt => opt.value === status)?.title || status
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

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ja-JP')
}

const resetGoalForm = (): void => {
  goalFormData.value = {
    title: '',
    description: '',
    category: 'general',
    target_value: 0,
    current_value: 0,
    target_date: '',
    status: 'active'
  }
  editingGoal.value = null
  if (goalForm.value) {
    goalForm.value.resetValidation()
  }
}

const editGoal = (goal: Goal): void => {
  editingGoal.value = goal
  goalFormData.value = {
    title: goal.title,
    description: goal.description || '',
    category: goal.category,
    target_value: goal.target_value,
    current_value: goal.current_value,
    target_date: goal.target_date || '',
    status: goal.status
  }
  showCreateDialog.value = true
}

const cancelGoalForm = (): void => {
  showCreateDialog.value = false
  resetGoalForm()
}

const submitGoal = async (): Promise<void> => {
  if (!goalForm.value?.validate().valid) {
    return
  }

  try {
    const userId = authStore.user?.id
    if (!userId) {
      throw new Error('ユーザーが認証されていません')
    }

    if (editingGoal.value) {
      // 編集モード
      await tagGoalStore.updateGoal(editingGoal.value.id, {
        title: goalFormData.value.title.trim(),
        description: goalFormData.value.description.trim() || undefined,
        category: goalFormData.value.category,
        target_value: goalFormData.value.target_value,
        current_value: goalFormData.value.current_value,
        target_date: goalFormData.value.target_date || undefined,
        status: goalFormData.value.status as Goal['status']
      })
    } else {
      // 新規作成
      await tagGoalStore.createGoal({
        user_id: userId,
        title: goalFormData.value.title.trim(),
        description: goalFormData.value.description.trim() || undefined,
        category: goalFormData.value.category,
        target_value: goalFormData.value.target_value,
        current_value: goalFormData.value.current_value,
        target_date: goalFormData.value.target_date || undefined,
        status: goalFormData.value.status as Goal['status']
      })
    }

    showCreateDialog.value = false
    resetGoalForm()
  } catch (err) {
    console.error('目標操作エラー:', err)
  }
}

const viewGoalDetails = (goal: Goal): void => {
  selectedGoal.value = goal
  showDetailDialog.value = true
}

const deleteGoal = (goalId: string): void => {
  // 削除機能は実装が必要
  console.log('目標削除機能は今後実装予定です', goalId)
}

const linkTagsToGoal = (goal: Goal): void => {
  // タグ連携機能は実装が必要
  console.log('タグ連携機能は今後実装予定です', goal.id)
}

const getTagsForGoal = (goalId: string) => {
  return tagGoalStore.getTagsForGoal(goalId)
}

// ライフサイクル
onMounted(async () => {
  const userId = authStore.user?.id
  if (userId) {
    try {
      await Promise.all([
        tagGoalStore.fetchGoals(userId),
        tagGoalStore.fetchTags(userId)
      ])
    } catch (err) {
      console.error('データ取得エラー:', err)
    }
  }
})
</script>

<style scoped>
.goal-manager {
  height: 100%;
}

.goal-list {
  max-height: 600px;
  overflow-y: auto;
}
</style>