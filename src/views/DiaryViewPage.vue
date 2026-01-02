<template>
  <v-container class="diary-view-page">
    <h1 class="text-h4 mb-4">日記一覧</h1>

    <!-- フィルターコンポーネント -->
    <DiaryFilter
      :filters="filter"
      :loading="loading"
      @update:filters="filter = $event"
      @apply-filters="handleApplyFilters"
      @clear-filters="handleClearFilters"
    />

    <!-- データテーブル -->
    <v-data-table
      :headers="headers"
      :items="diaries || []"
      :loading="loading"
      hover
      class="mb-4"
      hide-default-footer
    >
      <template #[`item.created_at`]="{ item }">
        {{ formatDate(item.created_at) }}
      </template>
      <template #[`item.date`]="{ item }">
        {{ formatDate(item.date) }}
      </template>
      <template #[`item.mood`]="{ item }">
        <v-rating :model-value="item.mood" readonly size="small" color="amber" half-increments />
        <span class="ml-2">{{ item.mood }}/10</span>
      </template>

      <template #[`item.emotion_tags`]="{ item }">
        <EmotionTagChips
          :tags="(item as DiaryEntryWithEmotionTags).emotion_tags || []"
          :max-display="3"
          size="x-small"
          variant="outlined"
        />
      </template>

      <template #[`item.content`]="{ item }">
        <div
          class="diary-content-cell"
          @click="viewDiary(item)"
          tabindex="0"
          role="button"
          :aria-label="`日記「${item.title}」の詳細を表示`"
        >
          {{ item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content }}
        </div>
      </template>

      <template #[`item.actions`]="{ item }">
        <v-btn
          icon="mdi-eye"
          variant="text"
          color="primary"
          size="small"
          @click="viewDiary(item)"
          aria-label="詳細表示"
        />
        <v-btn
          icon="mdi-pencil"
          variant="text"
          color="warning"
          size="small"
          @click="editDiary(item)"
          aria-label="編集"
        />
        <v-btn
          icon="mdi-delete"
          variant="text"
          color="error"
          size="small"
          @click="handleDeleteDiary(item)"
          :loading="isDeleting"
          aria-label="削除"
        />
      </template>

      <!-- 空の状態 -->
      <template #no-data>
        <div class="no-data">
          <v-icon size="48" color="grey">mdi-notebook-outline</v-icon>
          <p>該当する日記が見つかりません</p>
          <v-btn color="primary" @click="clearFilters">フィルターをクリア</v-btn>
        </div>
      </template>
    </v-data-table>

    <!-- ページネーション -->
    <v-pagination
      v-if="pagination.totalPages > 1"
      v-model="pagination.page"
      :length="pagination.totalPages"
      :loading="loading"
      @update:model-value="handlePageChange"
    />

    <!-- 詳細モーダル -->
    <v-dialog v-model="showDetailDialog" max-width="800px">
      <v-card v-if="selectedDiary">
        <v-card-title>{{ selectedDiary.title }}</v-card-title>
        <v-card-subtitle>
          {{ formatDate(selectedDiary.date) }} | 気分: {{ selectedDiary.mood }}/10
          <span v-if="selectedDiary.mood_reason" class="ml-2"
            >（{{ selectedDiary.mood_reason }}）</span
          >
        </v-card-subtitle>
        <v-card-text>
          <!-- 感情タグ表示 -->
          <div
            v-if="
              (selectedDiary as DiaryEntryWithEmotionTags).emotion_tags &&
              (selectedDiary as DiaryEntryWithEmotionTags).emotion_tags!.length > 0
            "
            class="emotion-tags-section mb-4"
          >
            <h4 class="text-subtitle-2 mb-2">感情タグ</h4>
            <EmotionTagChips
              :tags="(selectedDiary as DiaryEntryWithEmotionTags).emotion_tags!"
              size="small"
              variant="tonal"
            />
          </div>

          <div class="diary-content">{{ selectedDiary.content }}</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="editDiary(selectedDiary)">編集</v-btn>
          <v-btn variant="outlined" @click="showDetailDialog = false">閉じる</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
import { useEmotionTagsStore } from '@/stores/emotionTags'
import { useDiaries } from '@/composables/useDataFetch'
import DiaryFilter from '@/components/diary/DiaryFilter.vue'
import EmotionTagChips from '@/components/mood/EmotionTagChips.vue'
import type { DiaryEntry, DiaryEntryWithEmotionTags } from '@/types/custom'
import { createLogger } from '@shared/utils'

const logger = createLogger('DIARYVIEWPAGE')

const router = useRouter()
const dataStore = useDataStore()
const authStore = useAuthStore()
const emotionTagsStore = useEmotionTagsStore()

// 認証チェックとデータ読み込み
onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  // 初期データ読み込み
  await refresh()

  // 日記データに感情タグ情報を追加
  await loadEmotionTagsForDiaries()
})

// サーバーサイドページネーション対応のデータ取得
const { diaries, loading, filter, pagination, changePage, applyFilters, clearFilters, refresh } =
  useDiaries({
    immediate: false, // 手動で初期化
    cache: true,
    debounceMs: 300,
  })

// UI状態
const isDeleting = ref(false)
const showDetailDialog = ref(false)
const selectedDiary = ref<DiaryEntry | null>(null)

// テーブルヘッダー
const headers = [
  {
    title: '作成日',
    key: 'created_at',
    align: 'start' as const,
    sortable: false,
    width: '120px',
  },
  {
    title: '日記日付',
    key: 'date',
    align: 'start' as const,
    sortable: false,
    width: '120px',
  },
  {
    title: 'タイトル',
    key: 'title',
    align: 'start' as const,
    sortable: false,
    width: '200px',
  },
  {
    title: '気分',
    key: 'mood',
    align: 'center' as const,
    sortable: false,
    width: '120px',
  },
  {
    title: '感情タグ',
    key: 'emotion_tags',
    align: 'start' as const,
    sortable: false,
    width: '200px',
  },
  {
    title: '内容',
    key: 'content',
    align: 'start' as const,
    sortable: false,
  },
  {
    title: '操作',
    key: 'actions',
    align: 'center' as const,
    sortable: false,
    width: '150px',
  },
]

// 感情タグ読み込み処理
const loadEmotionTagsForDiaries = async () => {
  if (!diaries.value || diaries.value.length === 0) return

  try {
    // 各日記の感情タグを取得して追加
    const diariesWithTags = await Promise.all(
      diaries.value.map(async (diary) => {
        const emotionTags = await emotionTagsStore.getDiaryEmotionTags(diary.id)
        return {
          ...diary,
          emotion_tags: emotionTags,
        } as DiaryEntryWithEmotionTags
      }),
    )

    // diariesを更新（リアクティブに）
    diaries.value = diariesWithTags
  } catch (error) {
    logger.error('感情タグの取得に失敗しました:', error)
  }
}

// ユーティリティ関数
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ja-JP')
}

// 日記詳細表示
const viewDiary = (diary: DiaryEntry) => {
  selectedDiary.value = diary
  showDetailDialog.value = true
}

// 日記編集
const editDiary = (diary: DiaryEntry) => {
  if (!diary?.id) return
  showDetailDialog.value = false
  router.push(`/diary-edit/${diary.id}`)
}

// ページネーションイベントハンドラー
const handlePageChange = async (page: number) => {
  changePage(page)
  // ページ変更後にも感情タグを読み込む
  await loadEmotionTagsForDiaries()
}

// フィルター適用処理
const handleApplyFilters = async () => {
  applyFilters()
  // フィルタ後にも感情タグを読み込む
  await loadEmotionTagsForDiaries()
}

const handleClearFilters = async () => {
  clearFilters()
  // フィルタクリア後にも感情タグを読み込む
  await loadEmotionTagsForDiaries()
}

// 削除処理
const handleDeleteDiary = async (item: DiaryEntry) => {
  if (!item?.id || isDeleting.value || !authStore.user?.id) return

  if (!confirm('本当にこの日記を削除しますか？')) return

  try {
    isDeleting.value = true
    await dataStore.deleteDiary(item.id, authStore.user.id)
    // データ再取得
    await refresh()
  } catch (error) {
    logger.error('日記削除エラー:', error)
    alert('日記の削除に失敗しました')
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
.diary-view-page {
  padding: 24px;
}

.progress-bar {
  border-radius: 4px;
}

.no-data {
  text-align: center;
  padding: 48px 24px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.no-data p {
  margin: 16px 0;
  font-size: 1.1rem;
}

.diary-content {
  white-space: pre-wrap;
  line-height: 1.6;
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
  background-color: rgba(var(--v-theme-surface), 0.5);
  border-radius: 4px;
}

/* プレビュー機能のスタイル */
.diary-content-cell {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.diary-content-cell:hover,
.diary-content-cell:focus {
  background-color: rgba(var(--v-theme-primary), 0.08);
  outline: none;
}

.diary-content-cell.preview-active {
  background-color: rgba(var(--v-theme-primary), 0.12);
  font-weight: 500;
}

.diary-content-cell:focus-visible {
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.5);
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .diary-view-page {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .diary-view-page {
    padding: 12px;
  }
}
</style>
