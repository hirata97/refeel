import Dexie, { type Table } from 'dexie'

// オフライン用の日記データ型
export interface OfflineDiary {
  id?: number
  supabaseId?: string // Supabaseでの実際のID
  user_id: string
  title: string
  content: string
  tags: string[]
  created_at: string
  updated_at: string
  is_synced: boolean // Supabaseと同期済みかどうか
  sync_action: 'create' | 'update' | 'delete' | null // 次回同期時のアクション
}

// オフライン用のユーザー設定型
export interface OfflineUserSettings {
  id?: number
  user_id: string
  settings: Record<string, unknown>
  updated_at: string
  is_synced: boolean
}

// オフライン用のキャッシュエントリ型
export interface OfflineCacheEntry {
  id?: number
  key: string
  data: unknown
  expires_at: string
  created_at: string
}

class OfflineDatabase extends Dexie {
  diaries!: Table<OfflineDiary>
  userSettings!: Table<OfflineUserSettings>
  cache!: Table<OfflineCacheEntry>

  constructor() {
    super('RefeelOfflineDB')

    this.version(1).stores({
      diaries: '++id, supabaseId, user_id, created_at, is_synced, sync_action',
      userSettings: '++id, user_id, is_synced',
      cache: '++id, key, expires_at'
    })
  }
}

export const offlineDB = new OfflineDatabase()

export class OfflineStorageService {

  // 日記関連
  async saveDiaryOffline(diary: Omit<OfflineDiary, 'id'>): Promise<number> {
    return await offlineDB.diaries.add(diary)
  }

  async updateDiaryOffline(id: number, updates: Partial<OfflineDiary>): Promise<void> {
    await offlineDB.diaries.update(id, {
      ...updates,
      updated_at: new Date().toISOString(),
      is_synced: false
    })
  }

  async getDiariesOffline(userId: string): Promise<OfflineDiary[]> {
    return await offlineDB.diaries
      .where('user_id')
      .equals(userId)
      .reverse()
      .sortBy('created_at')
  }

  async getUnsyncedDiaries(userId: string): Promise<OfflineDiary[]> {
    return await offlineDB.diaries
      .where('user_id')
      .equals(userId)
      .and(diary => !diary.is_synced)
      .toArray()
  }

  async markDiarySynced(id: number, supabaseId?: string): Promise<void> {
    const updates: Partial<OfflineDiary> = {
      is_synced: true,
      sync_action: null
    }

    if (supabaseId) {
      updates.supabaseId = supabaseId
    }

    await offlineDB.diaries.update(id, updates)
  }

  async deleteDiaryOffline(id: number): Promise<void> {
    const diary = await offlineDB.diaries.get(id)
    if (diary?.supabaseId) {
      // Supabaseに存在する場合は削除をマーク
      await offlineDB.diaries.update(id, {
        sync_action: 'delete',
        is_synced: false
      })
    } else {
      // ローカルのみの場合は直接削除
      await offlineDB.diaries.delete(id)
    }
  }

  // ユーザー設定関連
  async saveUserSettingsOffline(settings: Omit<OfflineUserSettings, 'id'>): Promise<void> {
    const existing = await offlineDB.userSettings
      .where('user_id')
      .equals(settings.user_id)
      .first()

    if (existing) {
      await offlineDB.userSettings.update(existing.id!, {
        settings: settings.settings,
        updated_at: new Date().toISOString(),
        is_synced: false
      })
    } else {
      await offlineDB.userSettings.add(settings)
    }
  }

  async getUserSettingsOffline(userId: string): Promise<OfflineUserSettings | undefined> {
    return await offlineDB.userSettings
      .where('user_id')
      .equals(userId)
      .first()
  }

  // キャッシュ関連
  async setCacheEntry(key: string, data: unknown, expiresInMinutes: number = 60): Promise<void> {
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes)

    const existing = await offlineDB.cache.where('key').equals(key).first()

    if (existing) {
      await offlineDB.cache.update(existing.id!, {
        data,
        expires_at: expiresAt.toISOString()
      })
    } else {
      await offlineDB.cache.add({
        key,
        data,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      })
    }
  }

  async getCacheEntry(key: string): Promise<unknown | null> {
    const entry = await offlineDB.cache.where('key').equals(key).first()

    if (!entry) return null

    if (new Date(entry.expires_at) < new Date()) {
      // 期限切れのキャッシュを削除
      await offlineDB.cache.delete(entry.id!)
      return null
    }

    return entry.data
  }

  async clearExpiredCache(): Promise<void> {
    const now = new Date().toISOString()
    await offlineDB.cache.where('expires_at').below(now).delete()
  }

  // データベース管理
  async clearAllData(): Promise<void> {
    await Promise.all([
      offlineDB.diaries.clear(),
      offlineDB.userSettings.clear(),
      offlineDB.cache.clear()
    ])
  }

  async getStorageUsage(): Promise<{
    diaries: number
    userSettings: number
    cache: number
    total: number
  }> {
    const [diariesCount, userSettingsCount, cacheCount] = await Promise.all([
      offlineDB.diaries.count(),
      offlineDB.userSettings.count(),
      offlineDB.cache.count()
    ])

    return {
      diaries: diariesCount,
      userSettings: userSettingsCount,
      cache: cacheCount,
      total: diariesCount + userSettingsCount + cacheCount
    }
  }
}

export const offlineStorage = new OfflineStorageService()