import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { performSecurityCheck, sanitizeInputData } from '@/utils/sanitization'

// データ型定義
export interface DiaryEntry {
  id: string
  user_id: string
  title: string
  content: string
  goal_category: string
  progress_level: number
  created_at: string
  updated_at: string
}

export interface Account {
  id: string
  user_id: string
  email: string
  username?: string
  created_at: string
  updated_at: string
}

// キャッシュ設定
interface CacheEntry<T> {
  data: T
  timestamp: number
  expires: number
}

type CacheKey = 'diaries' | 'accounts' | 'user_profile'

export const useDataStore = defineStore('data', () => {
  // キャッシュストレージ
  const cache = ref<Map<string, CacheEntry<unknown>>>(new Map())
  const CACHE_DURATION = 5 * 60 * 1000 // 5分

  // 状態
  const diaries = ref<DiaryEntry[]>([])
  const accounts = ref<Account[]>([])
  const loading = ref<Record<string, boolean>>({})
  const error = ref<Record<string, string | null>>({})

  // 計算プロパティ
  const sortedDiaries = computed(() =>
    [...diaries.value].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
  )

  const diariesByCategory = computed(() => {
    const grouped: Record<string, DiaryEntry[]> = {}
    diaries.value.forEach((diary) => {
      if (!grouped[diary.goal_category]) {
        grouped[diary.goal_category] = []
      }
      grouped[diary.goal_category].push(diary)
    })
    return grouped
  })

  // キャッシュヘルパー関数
  const getCacheKey = (key: CacheKey, userId?: string): string => {
    return userId ? `${key}_${userId}` : key
  }

  const isValidCache = (cacheEntry: CacheEntry<unknown> | undefined): boolean => {
    if (!cacheEntry) return false
    return Date.now() < cacheEntry.expires
  }

  const setCache = <T>(key: string, data: T): void => {
    cache.value.set(key, {
      data,
      timestamp: Date.now(),
      expires: Date.now() + CACHE_DURATION,
    })
  }

  const getCache = <T>(key: string): T | null => {
    const cacheEntry = cache.value.get(key)
    if (isValidCache(cacheEntry)) {
      return cacheEntry!.data as T
    }
    // 期限切れキャッシュは削除
    cache.value.delete(key)
    return null
  }

  const invalidateCache = (pattern?: string): void => {
    if (pattern) {
      // パターンマッチングで特定のキャッシュを削除
      const keysToDelete = Array.from(cache.value.keys()).filter((key) => key.includes(pattern))
      keysToDelete.forEach((key) => cache.value.delete(key))
    } else {
      // 全キャッシュクリア
      cache.value.clear()
    }
  }

  // ローディング状態管理
  const setLoading = (key: string, isLoading: boolean): void => {
    loading.value = { ...loading.value, [key]: isLoading }
  }

  const setError = (key: string, errorMessage: string | null): void => {
    error.value = { ...error.value, [key]: errorMessage }
  }

  // 日記データの取得（サーバーサイドページネーション対応）
  const fetchDiaries = async (
    userId: string,
    forceRefresh = false,
    pagination?: {
      page: number
      pageSize: number
      filters?: Record<string, string | number | null>
    },
  ): Promise<{ data: DiaryEntry[]; count: number; totalPages: number }> => {
    const cacheKey = pagination
      ? `${getCacheKey('diaries', userId)}_p${pagination.page}_s${pagination.pageSize}_${JSON.stringify(pagination.filters || {})}`
      : getCacheKey('diaries', userId)

    // キャッシュチェック（ページネーション使用時は個別キャッシュ）
    if (!forceRefresh && !pagination) {
      const cachedData = getCache<DiaryEntry[]>(cacheKey)
      if (cachedData) {
        diaries.value = cachedData
        return { data: cachedData, count: cachedData.length, totalPages: 1 }
      }
    }

    try {
      setLoading('diaries', true)
      setError('diaries', null)

      let query = supabase.from('diaries').select('*', { count: 'exact' }).eq('user_id', userId)

      // フィルター適用
      if (pagination?.filters) {
        Object.entries(pagination.filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            switch (key) {
              case 'goal_category':
                query = query.eq('goal_category', value)
                break
              case 'progress_level_min':
                query = query.gte('progress_level', value)
                break
              case 'progress_level_max':
                query = query.lte('progress_level', value)
                break
              case 'date_from':
                query = query.gte('created_at', value)
                break
              case 'date_to':
                query = query.lte('created_at', value)
                break
              case 'search_text':
                query = query.or(`title.ilike.%${value}%,content.ilike.%${value}%`)
                break
            }
          }
        })
      }

      // ソート
      query = query.order('created_at', { ascending: false })

      // ページネーション適用
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.pageSize
        query = query.range(offset, offset + pagination.pageSize - 1)
      }

      const { data, error: fetchError, count } = await query

      if (fetchError) {
        throw fetchError
      }

      const diaryData = data || []
      const totalCount = count || 0
      const totalPages = pagination ? Math.ceil(totalCount / pagination.pageSize) : 1

      // 全件取得の場合のみ状態を更新
      if (!pagination) {
        diaries.value = diaryData
        setCache(cacheKey, diaryData)
      }

      return { data: diaryData, count: totalCount, totalPages }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '日記データの取得に失敗しました'
      setError('diaries', errorMessage)
      throw err
    } finally {
      setLoading('diaries', false)
    }
  }

  // アカウントデータの取得
  const fetchAccounts = async (userId: string, forceRefresh = false): Promise<Account[]> => {
    const cacheKey = getCacheKey('accounts', userId)

    if (!forceRefresh) {
      const cachedData = getCache<Account[]>(cacheKey)
      if (cachedData) {
        accounts.value = cachedData
        return cachedData
      }
    }

    try {
      setLoading('accounts', true)
      setError('accounts', null)

      const { data, error: fetchError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)

      if (fetchError) {
        throw fetchError
      }

      const accountData = data || []
      accounts.value = accountData
      setCache(cacheKey, accountData)

      return accountData
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'アカウントデータの取得に失敗しました'
      setError('accounts', errorMessage)
      throw err
    } finally {
      setLoading('accounts', false)
    }
  }

  // 日記の作成
  const createDiary = async (
    diaryData: Omit<DiaryEntry, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<DiaryEntry> => {
    try {
      setLoading('createDiary', true)
      setError('createDiary', null)

      // セキュリティチェックを実行
      const titleCheck = performSecurityCheck(diaryData.title)
      const contentCheck = performSecurityCheck(diaryData.content)

      if (!titleCheck.isSecure) {
        throw new Error(`タイトルに不正な内容が含まれています: ${titleCheck.threats.join(', ')}`)
      }

      if (!contentCheck.isSecure) {
        throw new Error(`内容に不正な内容が含まれています: ${contentCheck.threats.join(', ')}`)
      }

      // データをサニタイズ
      const sanitizedData = sanitizeInputData(diaryData) as Omit<
        DiaryEntry,
        'id' | 'created_at' | 'updated_at'
      >

      const { data, error: insertError } = await supabase
        .from('diaries')
        .insert([sanitizedData])
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // ローカル状態とキャッシュを更新
      const newDiary = data as DiaryEntry
      diaries.value.unshift(newDiary)

      // 関連キャッシュを無効化
      invalidateCache(`diaries_${diaryData.user_id}`)

      return newDiary
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '日記の作成に失敗しました'
      setError('createDiary', errorMessage)
      throw err
    } finally {
      setLoading('createDiary', false)
    }
  }

  // 日記の更新
  const updateDiary = async (id: string, updates: Partial<DiaryEntry>): Promise<DiaryEntry> => {
    try {
      setLoading('updateDiary', true)
      setError('updateDiary', null)

      // 更新データのセキュリティチェック
      if (updates.title) {
        const titleCheck = performSecurityCheck(updates.title)
        if (!titleCheck.isSecure) {
          throw new Error(`タイトルに不正な内容が含まれています: ${titleCheck.threats.join(', ')}`)
        }
      }

      if (updates.content) {
        const contentCheck = performSecurityCheck(updates.content)
        if (!contentCheck.isSecure) {
          throw new Error(`内容に不正な内容が含まれています: ${contentCheck.threats.join(', ')}`)
        }
      }

      // データをサニタイズ
      const sanitizedUpdates = sanitizeInputData(updates) as Partial<DiaryEntry>

      const { data, error: updateError } = await supabase
        .from('diaries')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      // ローカル状態を更新
      const updatedDiary = data as DiaryEntry
      const index = diaries.value.findIndex((d) => d.id === id)
      if (index !== -1) {
        diaries.value[index] = updatedDiary
      }

      // 関連キャッシュを無効化
      invalidateCache(`diaries_${updatedDiary.user_id}`)

      return updatedDiary
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '日記の更新に失敗しました'
      setError('updateDiary', errorMessage)
      throw err
    } finally {
      setLoading('updateDiary', false)
    }
  }

  // IDで特定の日記を取得
  const getDiaryById = async (id: string, userId: string): Promise<DiaryEntry | null> => {
    try {
      setLoading('getDiaryById', true)
      setError('getDiaryById', null)

      // まずローカル状態から探す
      const localDiary = diaries.value.find((d) => d.id === id && d.user_id === userId)
      if (localDiary) {
        return localDiary
      }

      // ローカルに見つからない場合はSupabaseから取得
      const { data, error: fetchError } = await supabase
        .from('diaries')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // レコードが見つからない場合
          return null
        }
        throw fetchError
      }

      const diary = data as DiaryEntry

      // ローカル状態に追加（重複チェック）
      const existingIndex = diaries.value.findIndex((d) => d.id === id)
      if (existingIndex === -1) {
        diaries.value.push(diary)
      }

      return diary
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '日記の取得に失敗しました'
      setError('getDiaryById', errorMessage)
      throw err
    } finally {
      setLoading('getDiaryById', false)
    }
  }

  // 日記の削除
  const deleteDiary = async (id: string, userId: string): Promise<void> => {
    try {
      setLoading('deleteDiary', true)
      setError('deleteDiary', null)

      const { error: deleteError } = await supabase.from('diaries').delete().eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      // ローカル状態を更新
      diaries.value = diaries.value.filter((d) => d.id !== id)

      // 関連キャッシュを無効化
      invalidateCache(`diaries_${userId}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '日記の削除に失敗しました'
      setError('deleteDiary', errorMessage)
      throw err
    } finally {
      setLoading('deleteDiary', false)
    }
  }

  // アカウントの作成
  const createAccount = async (
    accountData: Omit<Account, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Account> => {
    try {
      setLoading('createAccount', true)
      setError('createAccount', null)

      const { data, error: insertError } = await supabase
        .from('accounts')
        .insert([accountData])
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      const newAccount = data as Account
      accounts.value.push(newAccount)

      // 関連キャッシュを無効化
      invalidateCache(`accounts_${accountData.user_id}`)

      return newAccount
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'アカウントの作成に失敗しました'
      setError('createAccount', errorMessage)
      throw err
    } finally {
      setLoading('createAccount', false)
    }
  }

  // データの初期化
  const initializeData = async (userId: string): Promise<void> => {
    try {
      await Promise.all([fetchDiaries(userId), fetchAccounts(userId)])
    } catch (err) {
      console.error('データ初期化エラー:', err)
    }
  }

  // 状態のリセット
  const resetState = (): void => {
    diaries.value = []
    accounts.value = []
    loading.value = {}
    error.value = {}
    invalidateCache()
  }

  return {
    // 状態
    diaries,
    accounts,
    loading,
    error,

    // 計算プロパティ
    sortedDiaries,
    diariesByCategory,

    // データ取得
    fetchDiaries,
    fetchAccounts,
    getDiaryById,

    // データ操作
    createDiary,
    updateDiary,
    deleteDiary,
    createAccount,

    // ユーティリティ
    initializeData,
    resetState,
    invalidateCache,

    // キャッシュ情報（デバッグ用）
    getCacheInfo: computed(() => ({
      size: cache.value.size,
      keys: Array.from(cache.value.keys()),
    })),
  }
})
