import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import { useEmotionTagsStore } from '@/stores/emotionTags'
import { usePerformanceMonitor } from '@/utils/performance'
import { createLogger } from '@/utils/logger'
import type { DiaryEntry } from '@/stores/data'

const logger = createLogger('DIARYEDITOR')

export interface DiaryUpdateData {
  title: string
  content: string
  mood: number
  updated_at: string
}

export interface SaveResult {
  success: boolean
  message: string
  warning?: string
}

/**
 * 日記編集操作のComposable
 * 日記の更新・削除・削除確認ダイアログを管理します
 */
export function useDiaryEditor() {
  const router = useRouter()
  const dataStore = useDataStore()
  const emotionTagsStore = useEmotionTagsStore()
  const performance = usePerformanceMonitor()

  // 保存・削除状態
  const isSubmitting = ref(false)
  const isDeleting = ref(false)

  // 削除確認ダイアログ
  const deleteDialog = ref(false)

  /**
   * 日記を更新する
   * @param diaryId - 更新する日記のID
   * @param updateData - 更新データ
   * @param emotionTagIds - 感情タグIDの配列
   * @returns 更新結果
   */
  const updateDiary = async (
    diaryId: string,
    updateData: DiaryUpdateData,
    emotionTagIds: string[],
  ): Promise<SaveResult> => {
    let retryCount = 0
    const maxRetries = 3

    const attemptUpdate = async (): Promise<SaveResult> => {
      try {
        isSubmitting.value = true
        performance.start('update_diary')

        // データストアを使用した更新処理
        await dataStore.updateDiary(diaryId, updateData)

        // 感情タグを更新
        try {
          await emotionTagsStore.linkDiaryEmotionTags(diaryId, emotionTagIds)
        } catch (emotionTagError) {
          logger.error('感情タグの更新エラー:', emotionTagError)
          performance.end('update_diary')
          // 感情タグ更新失敗でも日記更新は成功扱いとし、警告メッセージを表示
          return {
            success: true,
            message: '日記は更新されましたが、感情タグの更新に失敗しました',
            warning: '感情タグの更新に失敗しました',
          }
        }

        performance.end('update_diary')

        return {
          success: true,
          message: '日記が正常に更新されました！',
        }
      } catch (error: unknown) {
        logger.error('日記更新エラー:', error)
        const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました'

        // ネットワークエラーの場合は自動リトライ
        if (
          retryCount < maxRetries &&
          (errorMessage.includes('network') || errorMessage.includes('fetch'))
        ) {
          retryCount++
          logger.info(`接続エラーが発生しました。再試行中... (${retryCount}/${maxRetries})`)

          // 指数バックオフで再試行
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
          return attemptUpdate()
        }

        return {
          success: false,
          message: `日記の更新に失敗しました: ${errorMessage}`,
        }
      } finally {
        isSubmitting.value = false
      }
    }

    return attemptUpdate()
  }

  /**
   * 削除確認ダイアログを表示
   */
  const showDeleteConfirmation = (): void => {
    deleteDialog.value = true
  }

  /**
   * 削除をキャンセル
   */
  const cancelDelete = (): void => {
    deleteDialog.value = false
  }

  /**
   * 日記を削除する
   * @param diaryId - 削除する日記のID
   * @param userId - ユーザーID
   * @returns 削除結果
   */
  const deleteDiary = async (diaryId: string, userId: string): Promise<SaveResult> => {
    let retryCount = 0
    const maxRetries = 3

    const attemptDelete = async (): Promise<SaveResult> => {
      try {
        isDeleting.value = true
        performance.start('delete_diary')

        await dataStore.deleteDiary(diaryId, userId)

        performance.end('delete_diary')

        // ダイアログを閉じる
        deleteDialog.value = false

        return {
          success: true,
          message: '日記が正常に削除されました。',
        }
      } catch (error: unknown) {
        logger.error('日記削除エラー:', error)
        const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました'

        // ネットワークエラーの場合は自動リトライ
        if (
          retryCount < maxRetries &&
          (errorMessage.includes('network') || errorMessage.includes('fetch'))
        ) {
          retryCount++
          logger.info(`接続エラーが発生しました。再試行中... (${retryCount}/${maxRetries})`)

          // 指数バックオフで再試行
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
          return attemptDelete()
        }

        return {
          success: false,
          message: `日記の削除に失敗しました: ${errorMessage}`,
        }
      } finally {
        isDeleting.value = false
      }
    }

    return attemptDelete()
  }

  /**
   * 編集ページから戻る（未保存変更チェック付き）
   * @param currentData - 現在のフォームデータ
   * @param originalDiary - 元の日記データ
   */
  const goBackWithConfirmation = (
    currentData: { title: string; content: string; date: string; mood: number },
    originalDiary: DiaryEntry | null,
  ): void => {
    // フォームが変更されている場合は確認
    const hasUnsavedChanges =
      originalDiary &&
      (currentData.title !== originalDiary.title ||
        currentData.content !== originalDiary.content ||
        currentData.date !== new Date(originalDiary.created_at).toISOString().split('T')[0] ||
        currentData.mood !== (originalDiary.mood || 5))

    if (hasUnsavedChanges) {
      if (confirm('未保存の変更があります。本当にページを離れますか？')) {
        router.back()
      }
    } else {
      router.back()
    }
  }

  /**
   * 成功時のリダイレクト
   * @param delay - リダイレクトまでの遅延（ミリ秒）
   */
  const redirectToDiaryView = (delay: number = 1500): void => {
    setTimeout(() => {
      router.push('/diary-view')
    }, delay)
  }

  return {
    // 状態
    isSubmitting,
    isDeleting,
    deleteDialog,

    // メソッド
    updateDiary,
    deleteDiary,
    showDeleteConfirmation,
    cancelDelete,
    goBackWithConfirmation,
    redirectToDiaryView,
  }
}
