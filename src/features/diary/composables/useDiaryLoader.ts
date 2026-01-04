import { ref } from 'vue'
import { useDataStore } from '@/stores/data'
import { useEmotionTagsStore } from '@features/mood'
import { usePerformanceMonitor } from '@shared/utils'
import { createLogger } from '@shared/utils'
import type { DiaryEntry } from '@/stores/data'

const logger = createLogger('DIARYLOADER')

/**
 * 日記データ読み込みのComposable
 * 日記の取得と感情タグの読み込みを管理します
 */
export function useDiaryLoader() {
  const dataStore = useDataStore()
  const emotionTagsStore = useEmotionTagsStore()
  const performance = usePerformanceMonitor()

  const diary = ref<DiaryEntry | null>(null)
  const loading = ref(false)
  const selectedEmotionTags = ref<string[]>([])
  const loadError = ref<string | null>(null)

  /**
   * 日記データを読み込む
   * @param diaryId - 読み込む日記のID
   * @param userId - ユーザーID
   * @returns 読み込みに成功した場合はtrue
   */
  const loadDiary = async (diaryId: string, userId: string): Promise<boolean> => {
    try {
      loading.value = true
      loadError.value = null
      performance.start('load_diary_for_edit')

      // データストアから日記を取得
      const diaryData = await dataStore.getDiaryById(diaryId, userId)

      if (!diaryData) {
        loadError.value = '日記が見つかりませんでした。'
        return false
      }

      diary.value = diaryData

      // 既存感情タグを取得して設定
      try {
        const emotionTags = await emotionTagsStore.getDiaryEmotionTags(diaryData.id)
        selectedEmotionTags.value = emotionTags.map((tag) => tag.id)
      } catch (emotionTagError) {
        logger.error('感情タグの取得エラー:', emotionTagError)
        // 感情タグ取得失敗でも日記編集は可能とする
        selectedEmotionTags.value = []
      }

      performance.end('load_diary_for_edit')
      return true
    } catch (error) {
      logger.error('日記読み込みエラー:', error)
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました'
      loadError.value = `日記の読み込みに失敗しました: ${errorMessage}`
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * データをリセット
   */
  const resetData = (): void => {
    diary.value = null
    selectedEmotionTags.value = []
    loadError.value = null
    loading.value = false
  }

  return {
    diary,
    loading,
    selectedEmotionTags,
    loadError,
    loadDiary,
    resetData,
  }
}
