<template>
  <v-container class="diary-page" max-width="600">
    <!-- 新しい日記作成セクション -->
    <v-sheet class="form-section pa-4 my-4" elevation="2">
      <h2>新しい日記を追加する</h2>
      <v-form @submit.prevent="addDiary">
        <v-text-field
          v-model="title"
          :error-messages="titleError ? [titleError] : []"
          @blur="validateField('title')"
          label="タイトル"
          outlined
          required
        />
        <v-textarea
          v-model="content"
          :error-messages="contentError ? [contentError] : []"
          @blur="validateField('content')"
          label="内容"
          outlined
          rows="3"
          required
        />
        <v-text-field
          v-model="date"
          :error-messages="dateError ? [dateError] : []"
          @blur="validateField('date')"
          label="日付"
          type="date"
          outlined
          required
        />
        <v-card variant="outlined" class="mood-selector">
          <v-card-subtitle class="pb-2">気分</v-card-subtitle>
          <v-card-text class="pt-0">
            <v-btn-toggle
              v-model="mood"
              color="primary"
              variant="outlined"
              divided
              mandatory
              class="mood-buttons"
            >
              <v-btn :value="1" size="small" class="mood-btn">
                <v-icon size="small">mdi-emoticon-dead</v-icon>
                <span class="ml-1">1</span>
              </v-btn>
              <v-btn :value="2" size="small" class="mood-btn">
                <v-icon size="small">mdi-emoticon-sad</v-icon>
                <span class="ml-1">2</span>
              </v-btn>
              <v-btn :value="3" size="small" class="mood-btn">
                <v-icon size="small">mdi-emoticon-cry</v-icon>
                <span class="ml-1">3</span>
              </v-btn>
              <v-btn :value="4" size="small" class="mood-btn">
                <v-icon size="small">mdi-emoticon-neutral</v-icon>
                <span class="ml-1">4</span>
              </v-btn>
              <v-btn :value="5" size="small" class="mood-btn">
                <v-icon size="small">mdi-emoticon</v-icon>
                <span class="ml-1">5</span>
              </v-btn>
              <v-btn :value="6" size="small" class="mood-btn">
                <v-icon size="small">mdi-emoticon-happy</v-icon>
                <span class="ml-1">6</span>
              </v-btn>
              <v-btn :value="7" size="small" class="mood-btn">
                <v-icon size="small">mdi-emoticon-excited</v-icon>
                <span class="ml-1">7</span>
              </v-btn>
              <v-btn :value="8" size="small" class="mood-btn">
                <v-icon size="small">mdi-emoticon-cool</v-icon>
                <span class="ml-1">8</span>
              </v-btn>
              <v-btn :value="9" size="small" class="mood-btn">
                <v-icon size="small">mdi-emoticon-kiss</v-icon>
                <span class="ml-1">9</span>
              </v-btn>
              <v-btn :value="10" size="small" class="mood-btn">
                <v-icon size="small">mdi-emoticon-lol</v-icon>
                <span class="ml-1">10</span>
              </v-btn>
            </v-btn-toggle>
          </v-card-text>
        </v-card>

        <!-- 気分理由入力フィールド（気分が選択された場合に表示） -->
        <v-text-field
          v-if="mood"
          v-model="moodReason"
          label="その気分の理由は？（任意）"
          placeholder="例：目標達成できた、疲れている、良いことがあった"
          outlined
          clearable
          counter="50"
          maxlength="50"
          class="mt-4"
        />

        <!-- 感情タグ選択コンポーネント -->
        <EmotionTagSelector v-model="selectedEmotionTags" class="mt-4" />

        <v-btn
          type="submit"
          color="primary"
          block
          :loading="isSubmitting || loadingStore.isLoading('create_diary')"
        >
          日記を追加
        </v-btn>
      </v-form>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDataStore } from '@/stores/data'
import { useNotificationStore } from '@/stores/notification'
import { useLoadingStore } from '@core/stores/loading'
import { useEmotionTagsStore } from '@/stores/emotionTags'
import { usePerformanceMonitor } from '@/utils/performance'
import { useSimpleDiaryForm } from '@/composables/useSimpleForm'
import EmotionTagSelector from '@/components/mood/EmotionTagSelector.vue'
import { createLogger } from '@/utils/logger'

const logger = createLogger('DIARYREGISTERPAGE')

const router = useRouter()
const authStore = useAuthStore()
const dataStore = useDataStore()
const notificationStore = useNotificationStore()
const loadingStore = useLoadingStore()
const emotionTagsStore = useEmotionTagsStore()
const performance = usePerformanceMonitor()

// 新しい気分理由フィールド（すべてのテンプレートで使用）
const moodReason = ref<string>('')

// 感情タグ選択状態
const selectedEmotionTags = ref<string[]>([])

// シンプルなフォーム管理を使用
const {
  title,
  content,
  date,
  mood,
  titleError,
  contentError,
  dateError,
  isSubmitting,
  validateField,
  handleSubmit,
  resetForm,
} = useSimpleDiaryForm()

// 古いコードは削除し、バリデーションフィールドを使用

// デバウンス処理されたオートセーブ（実装例）
// const debouncedAutoSave = debounce(async () => {
//   if (isValid.value && authStore.user?.id) {
//     try {
//       // オートセーブロジック（必要に応じて実装）
//       logger.debug('Auto-saving draft...')
//     } catch (error) {
//       logger.error('オートセーブエラー:', error)
//     }
//   }
// }, 2000)

// 認証チェックとユーザー初期化
onMounted(() => {
  // 認証状態をチェック
  if (!authStore.isAuthenticated) {
    // 認証されていない場合はログインページにリダイレクト
    router.push('/login')
    return
  }
})

// 最適化された日記作成処理
const addDiary = async (): Promise<void> => {
  // 認証状態を再確認
  if (!authStore.isAuthenticated || !authStore.user) {
    notificationStore.showError('認証が必要です', 'ログインしてください。')
    router.push('/login')
    return
  }

  try {
    await loadingStore.withLoading('create_diary', async () => {
      // バリデーションとサニタイゼーションを実行
      const sanitizedData = await handleSubmit()
      if (!sanitizedData) return

      performance.start('create_diary')

      // データストアを使用した最適化された作成処理
      const diaryData = {
        user_id: authStore.user!.id, // 上で既にチェック済み
        title: sanitizedData.title || '',
        content: sanitizedData.content || '',
        date: sanitizedData.date || new Date().toISOString().split('T')[0], // YYYY-MM-DD形式
        mood: Number(sanitizedData.mood) || 5, // 1-10の値をそのまま使用、デフォルトは5
        mood_reason: moodReason.value || undefined, // 気分理由（任意）
        goal_category: 'general',
        progress_level: 0,
      }

      const newDiary = await dataStore.createDiary(diaryData)

      // 感情タグがある場合は関連付けを保存
      if (selectedEmotionTags.value.length > 0) {
        try {
          await emotionTagsStore.linkDiaryEmotionTags(newDiary.id, selectedEmotionTags.value)
        } catch (emotionTagError) {
          logger.error('感情タグの保存エラー:', emotionTagError)
          // 感情タグ保存失敗でも日記作成は成功扱いとする
          notificationStore.showError(
            '感情タグの保存に失敗しました',
            '日記は作成されましたが、感情タグの保存に失敗しました。',
          )
        }
      }

      performance.end('create_diary')

      // 成功メッセージ
      notificationStore.showSuccess('日記が登録されました！', 'ダッシュボードに移動します。')

      // フォームリセット
      resetForm()
      moodReason.value = '' // 気分理由フィールドをリセット
      selectedEmotionTags.value = [] // 感情タグ選択もリセット

      // オプション: ダッシュボードにリダイレクト
      router.push('/dashboard')
    })
  } catch (error: unknown) {
    logger.error('日記作成エラー:', error)
    notificationStore.showError(
      '日記の作成に失敗しました',
      error instanceof Error ? error.message : 'Unknown error',
    )
  }
}
</script>

<style scoped>
.diary-page {
  margin: 0 auto;
}

.mood-selector {
  margin: 16px 0;
}

.mood-buttons {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.mood-btn {
  flex: 1;
  margin: 0 1px;
  min-height: 48px;
  flex-direction: column;
  font-size: 0.75rem;
}

@media (max-width: 600px) {
  .mood-btn {
    min-height: 40px;
    font-size: 0.7rem;
  }
}
</style>
