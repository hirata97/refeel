<template>
  <div class="emotion-tag-manager">
    <!-- 感情タグ一覧表示 -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>システム感情タグ</span>
        <v-btn
          color="primary"
          size="small"
          @click="refreshTags"
          :loading="!!(loading.fetchEmotionTags || refreshing)"
        >
          <v-icon start>mdi-refresh</v-icon>
          更新
        </v-btn>
      </v-card-title>

      <v-card-text>
        <div v-if="emotionTagGroups && emotionTagGroups.length > 0">
          <div v-for="group in emotionTagGroups" :key="group.category" class="mb-4">
            <div class="text-subtitle-1 font-weight-medium mb-2 text-medium-emphasis">
              {{ group.label }} ({{ group.tags.length }}個)
            </div>
            <div class="d-flex flex-wrap gap-2">
              <v-chip
                v-for="tag in group.tags"
                :key="tag.id"
                :color="tag.color"
                variant="elevated"
                size="small"
              >
                <v-icon start size="16">mdi-emoticon</v-icon>
                {{ tag.name }}
              </v-chip>
            </div>
          </div>
        </div>

        <v-alert v-else-if="!loading.fetchEmotionTags" type="info" variant="tonal">
          感情タグが読み込まれていません。「更新」ボタンを押してください。
        </v-alert>

        <div v-if="loading.fetchEmotionTags" class="text-center py-4">
          <v-progress-circular indeterminate color="primary" />
          <p class="mt-2">感情タグを読み込み中...</p>
        </div>
      </v-card-text>
    </v-card>

    <!-- 使用統計 -->
    <v-card variant="outlined">
      <v-card-title>
        <v-icon class="mr-2">mdi-chart-bar</v-icon>
        使用統計
      </v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-card variant="tonal" color="success">
              <v-card-text class="text-center">
                <div class="text-h4">{{ getTagCountByCategory('positive') }}</div>
                <div class="text-caption">ポジティブタグ</div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card variant="tonal" color="error">
              <v-card-text class="text-center">
                <div class="text-h4">{{ getTagCountByCategory('negative') }}</div>
                <div class="text-caption">ネガティブタグ</div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card variant="tonal" color="info">
              <v-card-text class="text-center">
                <div class="text-h4">{{ getTagCountByCategory('neutral') }}</div>
                <div class="text-caption">ニュートラルタグ</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- エラー表示 -->
    <v-alert
      v-if="error.fetchEmotionTags"
      type="error"
      variant="tonal"
      class="mt-4"
      dismissible
      @click:close="clearError"
    >
      {{ error.fetchEmotionTags }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useEmotionTagsStore } from '@/stores/emotionTags'

// ストア
const emotionTagsStore = useEmotionTagsStore()

// リアクティブな参照
const { emotionTagGroups, loading, error } = storeToRefs(emotionTagsStore)

// ローカル状態
const refreshing = ref(false)

// 計算プロパティ
const totalTags = computed(() => {
  if (!emotionTagGroups.value || emotionTagGroups.value.length === 0) return 0
  return emotionTagGroups.value.reduce((sum, group) => sum + group.tags.length, 0)
})

const getTagCountByCategory = (category: string): number => {
  if (!emotionTagGroups.value) return 0
  const group = emotionTagGroups.value.find((g) => g.category === category)
  return group?.tags.length || 0
}

// メソッド
const refreshTags = async (): Promise<void> => {
  try {
    refreshing.value = true
    await emotionTagsStore.fetchEmotionTags()
  } catch (err) {
    console.error('感情タグの更新に失敗:', err)
  } finally {
    refreshing.value = false
  }
}

const clearError = (): void => {
  // エラーをクリア
}

// ライフサイクル
onMounted(async () => {
  // 感情タグが未読み込みの場合のみフェッチ
  if (!emotionTagGroups.value || totalTags.value === 0) {
    await refreshTags()
  }
})
</script>

<style scoped>
.emotion-tag-manager {
  max-width: 100%;
}

.v-chip {
  margin: 2px;
}

.gap-2 {
  gap: 8px;
}
</style>
