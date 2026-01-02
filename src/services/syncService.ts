import { offlineStorage, type OfflineDiary } from './offlineStorage'
import { supabase } from '@core/lib/supabase'
import type { Database } from '@shared/types'
import { createLogger } from '@/utils/logger'

const logger = createLogger('SYNCSERVICE')

type DiaryInsert = Database['public']['Tables']['diaries']['Insert']
type DiaryUpdate = Database['public']['Tables']['diaries']['Update']

export interface SyncResult {
  success: boolean
  synced: number
  errors: string[]
  conflicts: number
}

export class SyncService {
  private isOnline(): boolean {
    return navigator.onLine
  }

  async syncData(userId: string): Promise<SyncResult> {
    if (!this.isOnline()) {
      return {
        success: false,
        synced: 0,
        errors: ['オフライン状態です'],
        conflicts: 0,
      }
    }

    const result: SyncResult = {
      success: true,
      synced: 0,
      errors: [],
      conflicts: 0,
    }

    try {
      // 1. ローカルの未同期データを取得
      const unsyncedDiaries = await offlineStorage.getUnsyncedDiaries(userId)

      // 2. 各日記を同期
      for (const diary of unsyncedDiaries) {
        try {
          await this.syncDiary(diary)
          result.synced++
        } catch (error) {
          result.errors.push(`日記同期エラー: ${error}`)
          result.success = false
        }
      }

      // 3. サーバーからの最新データを取得してローカルにマージ
      await this.fetchLatestFromServer(userId)

      // 4. 期限切れキャッシュをクリア
      await offlineStorage.clearExpiredCache()
    } catch (error) {
      result.success = false
      result.errors.push(`同期処理エラー: ${error}`)
    }

    return result
  }

  private async syncDiary(diary: OfflineDiary): Promise<void> {
    switch (diary.sync_action) {
      case 'create':
        await this.createDiaryOnServer(diary)
        break
      case 'update':
        await this.updateDiaryOnServer(diary)
        break
      case 'delete':
        await this.deleteDiaryOnServer(diary)
        break
      default:
        // 既存のローカルデータをサーバーに作成
        await this.createDiaryOnServer(diary)
    }
  }

  private async createDiaryOnServer(diary: OfflineDiary): Promise<void> {
    const insertData: DiaryInsert = {
      user_id: diary.user_id,
      title: diary.title,
      content: diary.content,
      tags: diary.tags,
      goal_category: 'general', // デフォルト値
      created_at: diary.created_at,
    }

    const { data, error } = await supabase.from('diaries').insert(insertData).select().single()

    if (error) {
      throw new Error(`Supabase作成エラー: ${error.message}`)
    }

    // ローカルDBを更新（Supabase IDを設定し、同期済みとマーク）
    await offlineStorage.markDiarySynced(diary.id!, data.id)
  }

  private async updateDiaryOnServer(diary: OfflineDiary): Promise<void> {
    if (!diary.supabaseId) {
      throw new Error('Supabase IDが不明です')
    }

    // サーバーでの競合チェック
    const { data: serverDiary, error: fetchError } = await supabase
      .from('diaries')
      .select('updated_at')
      .eq('id', diary.supabaseId)
      .single()

    if (fetchError) {
      throw new Error(`サーバーデータ取得エラー: ${fetchError.message}`)
    }

    // 競合検出（サーバーの更新時刻がローカルより新しい）
    if (serverDiary && new Date(serverDiary.updated_at) > new Date(diary.updated_at)) {
      // 競合解決: Last Write Wins（最後の書き込み優先）
      logger.warn('データ競合を検出、ローカル変更を適用します')
    }

    const updateData: DiaryUpdate = {
      title: diary.title,
      content: diary.content,
      tags: diary.tags,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('diaries').update(updateData).eq('id', diary.supabaseId)

    if (error) {
      throw new Error(`Supabase更新エラー: ${error.message}`)
    }

    // ローカルDBを同期済みとマーク
    await offlineStorage.markDiarySynced(diary.id!)
  }

  private async deleteDiaryOnServer(diary: OfflineDiary): Promise<void> {
    if (!diary.supabaseId) {
      // Supabase IDがない場合はローカルから削除のみ
      await offlineStorage.deleteDiaryOffline(diary.id!)
      return
    }

    const { error } = await supabase.from('diaries').delete().eq('id', diary.supabaseId)

    if (error) {
      throw new Error(`Supabase削除エラー: ${error.message}`)
    }

    // ローカルからも削除
    await offlineStorage.deleteDiaryOffline(diary.id!)
  }

  private async fetchLatestFromServer(userId: string): Promise<void> {
    // 最新のサーバーデータを取得
    const { data: serverDiaries, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`サーバーデータ取得エラー: ${error.message}`)
    }

    if (!serverDiaries) return

    // ローカルデータと比較してマージ
    for (const serverDiary of serverDiaries) {
      const localDiaries = await offlineStorage.getDiariesOffline(userId)
      const existingLocal = localDiaries.find((d) => d.supabaseId === serverDiary.id)

      if (!existingLocal) {
        // サーバーにのみ存在するデータをローカルに追加
        await offlineStorage.saveDiaryOffline({
          supabaseId: serverDiary.id,
          user_id: serverDiary.user_id,
          title: serverDiary.title,
          content: serverDiary.content,
          tags: serverDiary.tags || [],
          created_at: serverDiary.created_at,
          updated_at: serverDiary.updated_at,
          is_synced: true,
          sync_action: null,
        })
      } else if (
        existingLocal.is_synced &&
        new Date(serverDiary.updated_at) > new Date(existingLocal.updated_at)
      ) {
        // サーバーの方が新しい場合はローカルを更新
        await offlineStorage.updateDiaryOffline(existingLocal.id!, {
          title: serverDiary.title,
          content: serverDiary.content,
          tags: serverDiary.tags || [],
          updated_at: serverDiary.updated_at,
          is_synced: true,
        })
      }
    }
  }

  // バックグラウンド同期（Service Workerから呼び出し）
  async backgroundSync(userId: string): Promise<void> {
    try {
      const result = await this.syncData(userId)
      logger.debug('バックグラウンド同期完了:', result)

      // 同期結果をキャッシュに保存
      await offlineStorage.setCacheEntry('last_sync_result', result, 60)
    } catch (error) {
      logger.error('バックグラウンド同期エラー:', error)
    }
  }

  // 接続状態監視
  setupOnlineListener(userId: string): void {
    window.addEventListener('online', async () => {
      logger.debug('オンラインに復帰しました')
      await this.syncData(userId)
    })

    window.addEventListener('offline', () => {
      logger.debug('オフラインになりました')
    })
  }

  // 定期同期設定
  setupPeriodicSync(userId: string, intervalMinutes: number = 15): void {
    setInterval(
      async () => {
        if (this.isOnline()) {
          await this.syncData(userId)
        }
      },
      intervalMinutes * 60 * 1000,
    )
  }
}

export const syncService = new SyncService()
