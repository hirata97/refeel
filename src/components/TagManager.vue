<template>
  <v-card class="tag-manager">
    <v-card-title class="d-flex align-center justify-space-between">
      <span>タグ管理</span>
      <v-btn
        color="primary"
        variant="outlined"
        size="small"
        @click="showCreateDialog = true"
      >
        <v-icon start>mdi-plus</v-icon>
        新規タグ
      </v-btn>
    </v-card-title>

    <v-card-text>
      <!-- タグ一覧 -->
      <div v-if="tags.length > 0" class="tag-list">
        <v-chip
          v-for="tag in tags"
          :key="tag.id"
          :color="tag.color"
          variant="elevated"
          class="ma-1"
          closable
          @click="editTag(tag)"
          @click:close="deleteTag(tag.id)"
        >
          {{ tag.name }}
        </v-chip>
      </div>
      
      <v-alert
        v-else
        type="info"
        variant="tonal"
        text="まだタグが作成されていません。上記ボタンから新しいタグを作成してください。"
      />

      <!-- エラー表示 -->
      <v-alert
        v-if="error.tags || error.createTag || error.updateTag"
        type="error"
        variant="tonal"
        class="mt-4"
        dismissible
        @click:close="clearErrors"
      >
        {{ error.tags || error.createTag || error.updateTag }}
      </v-alert>
    </v-card-text>

    <!-- タグ作成/編集ダイアログ -->
    <v-dialog
      v-model="showCreateDialog"
      max-width="500px"
      persistent
    >
      <v-card>
        <v-card-title>
          {{ editingTag ? 'タグ編集' : '新規タグ作成' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="tagForm" @submit.prevent="submitTag">
            <v-text-field
              v-model="tagFormData.name"
              label="タグ名"
              :rules="[
                v => !!v || 'タグ名は必須です',
                v => (v && v.length >= 1 && v.length <= 50) || 'タグ名は1-50文字で入力してください',
                v => !isDuplicateTagName(v) || '同じ名前のタグが既に存在します'
              ]"
              variant="outlined"
              density="comfortable"
              required
            />

            <v-text-field
              v-model="tagFormData.description"
              label="説明（任意）"
              :rules="[
                v => !v || v.length <= 200 || '説明は200文字以内で入力してください'
              ]"
              variant="outlined"
              density="comfortable"
            />

            <!-- カラーピッカー -->
            <v-row align="center" class="mb-4">
              <v-col cols="auto">
                <v-label>カラー:</v-label>
              </v-col>
              <v-col>
                <div class="d-flex flex-wrap gap-2">
                  <v-btn
                    v-for="color in predefinedColors"
                    :key="color"
                    :color="color"
                    :variant="tagFormData.color === color ? 'elevated' : 'tonal'"
                    size="small"
                    icon
                    @click="tagFormData.color = color"
                  >
                    <v-icon v-if="tagFormData.color === color">mdi-check</v-icon>
                  </v-btn>
                </div>
              </v-col>
            </v-row>

            <!-- プレビュー -->
            <v-row align="center" class="mb-4">
              <v-col cols="auto">
                <v-label>プレビュー:</v-label>
              </v-col>
              <v-col>
                <v-chip
                  :color="tagFormData.color"
                  variant="elevated"
                >
                  {{ tagFormData.name || 'タグ名' }}
                </v-chip>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="cancelTagForm"
          >
            キャンセル
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="loading.createTag || loading.updateTag"
            @click="submitTag"
          >
            {{ editingTag ? '更新' : '作成' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 削除確認ダイアログ -->
    <v-dialog
      v-model="showDeleteDialog"
      max-width="400px"
    >
      <v-card>
        <v-card-title>タグ削除の確認</v-card-title>
        <v-card-text>
          タグ「{{ deletingTag?.name }}」を削除しますか？
          <br>
          <v-alert type="warning" variant="tonal" class="mt-2">
            このタグに関連する目標との連携も削除されます。
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteDialog = false">
            キャンセル
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="loading.deleteTag"
            @click="confirmDeleteTag"
          >
            削除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTagGoalStore } from '@/stores/tagGoal'
import { useAuthStore } from '@/stores/auth'
import type { Tag } from '@/types/tags'

// ストア
const tagGoalStore = useTagGoalStore()
const authStore = useAuthStore()

// リアクティブな参照
const { tags, loading, error } = tagGoalStore

// ローカル状態
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const editingTag = ref<Tag | null>(null)
const deletingTag = ref<Tag | null>(null)
const tagForm = ref()

// フォームデータ
const tagFormData = ref({
  name: '',
  description: '',
  color: '#2196F3'
})

// 定義済みカラーパレット
const predefinedColors = [
  '#2196F3', // Blue
  '#4CAF50', // Green
  '#FF9800', // Orange
  '#F44336', // Red
  '#9C27B0', // Purple
  '#607D8B', // Blue Grey
  '#795548', // Brown
  '#E91E63', // Pink
  '#00BCD4', // Cyan
  '#8BC34A'  // Light Green
]

// 計算プロパティ
const isDuplicateTagName = (name: string): boolean => {
  if (!name) return false
  return tags.some((tag: Tag) => 
    tag.name.toLowerCase() === name.toLowerCase() && 
    tag.id !== editingTag.value?.id
  )
}

// メソッド
const clearErrors = (): void => {
  tagGoalStore.setError('tags', null)
  tagGoalStore.setError('createTag', null)
  tagGoalStore.setError('updateTag', null)
}

const resetTagForm = (): void => {
  tagFormData.value = {
    name: '',
    description: '',
    color: '#2196F3'
  }
  editingTag.value = null
  if (tagForm.value) {
    tagForm.value.resetValidation()
  }
}

const editTag = (tag: Tag): void => {
  editingTag.value = tag
  tagFormData.value = {
    name: tag.name,
    description: tag.description || '',
    color: tag.color
  }
  showCreateDialog.value = true
}

const cancelTagForm = (): void => {
  showCreateDialog.value = false
  resetTagForm()
}

const submitTag = async (): Promise<void> => {
  if (!tagForm.value?.validate().valid) {
    return
  }

  try {
    const userId = authStore.user?.id
    if (!userId) {
      throw new Error('ユーザーが認証されていません')
    }

    if (editingTag.value) {
      // 編集モード（実装が必要な場合）
      console.log('タグ更新機能は今後実装予定です')
    } else {
      // 新規作成
      await tagGoalStore.createTag({
        user_id: userId,
        name: tagFormData.value.name.trim(),
        description: tagFormData.value.description.trim() || undefined,
        color: tagFormData.value.color
      })
    }

    showCreateDialog.value = false
    resetTagForm()
  } catch (err) {
    console.error('タグ操作エラー:', err)
  }
}

const deleteTag = (tagId: string): void => {
  const tag = tags.find((t: Tag) => t.id === tagId)
  if (tag) {
    deletingTag.value = tag
    showDeleteDialog.value = true
  }
}

const confirmDeleteTag = async (): Promise<void> => {
  if (!deletingTag.value) return

  try {
    // 削除機能は実装が必要
    console.log('タグ削除機能は今後実装予定です')
    showDeleteDialog.value = false
    deletingTag.value = null
  } catch (err) {
    console.error('タグ削除エラー:', err)
  }
}

// ライフサイクル
onMounted(async () => {
  const userId = authStore.user?.id
  if (userId) {
    try {
      await tagGoalStore.fetchTags(userId)
    } catch (err) {
      console.error('タグ取得エラー:', err)
    }
  }
})
</script>

<style scoped>
.tag-manager {
  height: 100%;
}

.tag-list {
  min-height: 60px;
  padding: 8px;
  border: 1px dashed #ccc;
  border-radius: 4px;
}
</style>