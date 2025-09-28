import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDataStore } from '@/stores/data'

// モックの設定
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => ({
              then: vi.fn()
            }))
          })),
          single: vi.fn(),
          gte: vi.fn(),
          lte: vi.fn(),
          or: vi.fn()
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn()
            }))
          }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn()
        }))
      }))
    }))
  }
}))

vi.mock('@/utils/sanitization', () => ({
  performSecurityCheck: vi.fn(),
  sanitizeInputData: vi.fn((data) => data)
}))

describe('DataStore - 異常系・エラーハンドリング', () => {
  let dataStore

  beforeEach(() => {
    setActivePinia(createPinia())
    dataStore = useDataStore()
    vi.clearAllMocks()
  })

  describe('セキュリティチェックのエラーハンドリング', () => {
    it('createDiary - タイトルのセキュリティチェック失敗でエラーを投げる', async () => {
      const { performSecurityCheck } = await import('@/utils/sanitization')
      performSecurityCheck.mockReturnValueOnce({
        isSecure: false,
        threats: ['XSS', 'Script Injection']
      })

      const diaryData = {
        title: '<script>alert("malicious")</script>',
        content: 'Safe content',
        goal_category: 'work',
        user_id: 'user1',
        progress_level: 3
      }

      await expect(dataStore.createDiary(diaryData)).rejects.toThrow(
        'タイトルに不正な内容が含まれています: XSS, Script Injection'
      )
      expect(dataStore.error.createDiary).toContain('不正な内容が含まれています')
    })

    it('createDiary - コンテンツのセキュリティチェック失敗でエラーを投げる', async () => {
      const { performSecurityCheck } = await import('@/utils/sanitization')
      
      // タイトルは安全、コンテンツが危険
      performSecurityCheck
        .mockReturnValueOnce({ isSecure: true, threats: [] })  // タイトル
        .mockReturnValueOnce({ isSecure: false, threats: ['SQL Injection'] })  // コンテンツ

      const diaryData = {
        title: 'Safe title',
        content: "'; DROP TABLE users; --",
        goal_category: 'work',
        user_id: 'user1',
        progress_level: 3
      }

      await expect(dataStore.createDiary(diaryData)).rejects.toThrow(
        '内容に不正な内容が含まれています: SQL Injection'
      )
    })

    it('updateDiary - タイトル更新時のセキュリティチェック失敗でエラーを投げる', async () => {
      const { performSecurityCheck } = await import('@/utils/sanitization')
      performSecurityCheck.mockReturnValue({
        isSecure: false,
        threats: ['XSS']
      })

      const updates = {
        title: '<img src="x" onerror="alert(1)">'
      }

      await expect(dataStore.updateDiary('diary-1', updates)).rejects.toThrow(
        'タイトルに不正な内容が含まれています: XSS'
      )
    })

    it('updateDiary - コンテンツ更新時のセキュリティチェック失敗でエラーを投げる', async () => {
      const { performSecurityCheck } = await import('@/utils/sanitization')
      
      // タイトルは安全（または存在しない）、コンテンツが危険
      performSecurityCheck.mockReturnValue({
        isSecure: false,
        threats: ['Script Injection']
      })

      const updates = {
        content: '<script>fetch("/steal-data", {method: "POST", body: document.cookie})</script>'
      }

      await expect(dataStore.updateDiary('diary-1', updates)).rejects.toThrow(
        '内容に不正な内容が含まれています: Script Injection'
      )
    })
  })

  describe('Supabaseエラーハンドリング', () => {
    it('fetchDiaries - Supabaseエラーでエラーを投げる', async () => {
      const { default: supabase } = await import('@/lib/supabase')
      const { performSecurityCheck } = await import('@/utils/sanitization')
      
      performSecurityCheck.mockReturnValue({ isSecure: true, threats: [] })

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis()
      }
      const mockSelect = {
        select: vi.fn().mockReturnValue(mockQuery)
      }
      supabase.from.mockReturnValue(mockSelect)
      
      mockQuery.order.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'DB_ERROR' },
        count: null
      })

      await expect(dataStore.fetchDiaries('user1')).rejects.toThrow('Database connection failed')
      expect(dataStore.error.diaries).toBe('Database connection failed')
      expect(dataStore.loading.diaries).toBe(false)
    })

    it('createDiary - Supabase挿入エラーでエラーを投げる', async () => {
      const { performSecurityCheck } = await import('@/utils/sanitization')
      const { default: supabase } = await import('@/lib/supabase')
      
      performSecurityCheck.mockReturnValue({ isSecure: true, threats: [] })

      const mockInsert = {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Unique constraint violation', code: 'CONSTRAINT_ERROR' }
            })
          }))
        }))
      }
      supabase.from.mockReturnValue(mockInsert)

      const diaryData = {
        title: 'Duplicate Title',
        content: 'Content',
        goal_category: 'work',
        user_id: 'user1',
        progress_level: 3
      }

      await expect(dataStore.createDiary(diaryData)).rejects.toThrow('Unique constraint violation')
      expect(dataStore.error.createDiary).toBe('Unique constraint violation')
      expect(dataStore.loading.createDiary).toBe(false)
    })

    it('updateDiary - Supabase更新エラーでエラーを投げる', async () => {
      const { performSecurityCheck } = await import('@/utils/sanitization')
      const { default: supabase } = await import('@/lib/supabase')
      
      performSecurityCheck.mockReturnValue({ isSecure: true, threats: [] })

      const mockUpdate = {
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Record not found', code: 'NOT_FOUND' }
              })
            }))
          }))
        }))
      }
      supabase.from.mockReturnValue(mockUpdate)

      const updates = { title: 'Updated Title' }

      await expect(dataStore.updateDiary('nonexistent-id', updates)).rejects.toThrow('Record not found')
      expect(dataStore.error.updateDiary).toBe('Record not found')
    })

    it('deleteDiary - Supabase削除エラーでエラーを投げる', async () => {
      const { default: supabase } = await import('@/lib/supabase')

      const mockDelete = {
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Permission denied', code: 'ACCESS_DENIED' }
          })
        }))
      }
      supabase.from.mockReturnValue(mockDelete)

      await expect(dataStore.deleteDiary('diary-1', 'user1')).rejects.toThrow('Permission denied')
      expect(dataStore.error.deleteDiary).toBe('Permission denied')
    })

    it('getDiaryById - 日記が見つからない場合nullを返す', async () => {
      const { default: supabase } = await import('@/lib/supabase')
      
      // ローカルにもない
      dataStore.diaries = []

      const mockSelect = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'No rows returned' }
              })
            }))
          }))
        }))
      }
      supabase.from.mockReturnValue(mockSelect)

      const result = await dataStore.getDiaryById('nonexistent-id', 'user1')
      
      expect(result).toBeNull()
      expect(dataStore.loading.getDiaryById).toBe(false)
    })

    it('getDiaryById - Supabaseエラーでエラーを投げる', async () => {
      const { default: supabase } = await import('@/lib/supabase')
      
      dataStore.diaries = []

      const mockSelect = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Network error', code: 'NETWORK_ERROR' }
              })
            }))
          }))
        }))
      }
      supabase.from.mockReturnValue(mockSelect)

      await expect(dataStore.getDiaryById('diary-1', 'user1')).rejects.toThrow('Network error')
    })

    it('fetchAccounts - Supabaseエラーでエラーを投げる', async () => {
      const { default: supabase } = await import('@/lib/supabase')

      const mockSelect = {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Table not found', code: 'TABLE_ERROR' }
          })
        }))
      }
      supabase.from.mockReturnValue(mockSelect)

      await expect(dataStore.fetchAccounts('user1')).rejects.toThrow('Table not found')
      expect(dataStore.error.accounts).toBe('Table not found')
    })

    it('createAccount - Supabase挿入エラーでエラーを投げる', async () => {
      const { default: supabase } = await import('@/lib/supabase')

      const mockInsert = {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Invalid data format', code: 'FORMAT_ERROR' }
            })
          }))
        }))
      }
      supabase.from.mockReturnValue(mockInsert)

      const accountData = {
        name: 'Test Account',
        user_id: 'user1'
      }

      await expect(dataStore.createAccount(accountData)).rejects.toThrow('Invalid data format')
      expect(dataStore.error.createAccount).toBe('Invalid data format')
    })
  })

  describe('ネットワークエラーとタイムアウト', () => {
    it('fetchDiaries - ネットワークエラーでエラーを投げる', async () => {
      const { default: supabase } = await import('@/lib/supabase')

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockRejectedValue(new Error('Network timeout'))
      }
      const mockSelect = {
        select: vi.fn().mockReturnValue(mockQuery)
      }
      supabase.from.mockReturnValue(mockSelect)

      await expect(dataStore.fetchDiaries('user1')).rejects.toThrow('Network timeout')
      expect(dataStore.loading.diaries).toBe(false)
    })

    it('createDiary - ネットワークエラーでエラーを投げる', async () => {
      const { performSecurityCheck } = await import('@/utils/sanitization')
      const { default: supabase } = await import('@/lib/supabase')
      
      performSecurityCheck.mockReturnValue({ isSecure: true, threats: [] })

      const mockInsert = {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockRejectedValue(new Error('Connection lost'))
          }))
        }))
      }
      supabase.from.mockReturnValue(mockInsert)

      const diaryData = {
        title: 'Test',
        content: 'Test',
        goal_category: 'work',
        user_id: 'user1',
        progress_level: 3
      }

      await expect(dataStore.createDiary(diaryData)).rejects.toThrow('Connection lost')
      expect(dataStore.loading.createDiary).toBe(false)
    })
  })

  describe('データ整合性エラー', () => {
    it('updateDiary - 存在しない日記の更新でローカル状態が不整合にならない', async () => {
      const { performSecurityCheck } = await import('@/utils/sanitization')
      const { default: supabase } = await import('@/lib/supabase')
      
      performSecurityCheck.mockReturnValue({ isSecure: true, threats: [] })

      // 既存のデータを設定
      const existingDiary = { id: 'diary-1', title: 'Original' }
      dataStore.diaries = [existingDiary]

      const mockUpdate = {
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Record not found' }
              })
            }))
          }))
        }))
      }
      supabase.from.mockReturnValue(mockUpdate)

      const updates = { title: 'Updated Title' }

      await expect(dataStore.updateDiary('nonexistent-id', updates)).rejects.toThrow('Record not found')
      
      // ローカル状態は変更されていないことを確認
      expect(dataStore.diaries[0]).toEqual(existingDiary)
    })

    it('deleteDiary - 削除失敗でローカル状態が不整合にならない', async () => {
      const { default: supabase } = await import('@/lib/supabase')

      // 既存のデータを設定
      const diary = { id: 'diary-1', title: 'To Delete' }
      dataStore.diaries = [diary]

      const mockDelete = {
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Delete failed' }
          })
        }))
      }
      supabase.from.mockReturnValue(mockDelete)

      await expect(dataStore.deleteDiary('diary-1', 'user1')).rejects.toThrow('Delete failed')
      
      // ローカル状態は変更されていないことを確認
      expect(dataStore.diaries).toContain(diary)
    })
  })

  describe('キャッシュとページネーションのエラー', () => {
    it('fetchDiaries - 無効なページネーションパラメータでもエラーが発生しない', async () => {
      const { default: supabase } = await import('@/lib/supabase')

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis()
      }
      const mockSelect = {
        select: vi.fn().mockReturnValue(mockQuery)
      }
      supabase.from.mockReturnValue(mockSelect)
      
      mockQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      // 無効なページネーション（負の数、0など）
      const invalidPagination = { page: -1, pageSize: 0 }
      
      const result = await dataStore.fetchDiaries('user1', false, invalidPagination)
      
      expect(result.data).toEqual([])
      expect(result.totalPages).toBe(0) // 0 / 0 の場合は安全に処理される想定
    })

    it('fetchDiaries - フィルターにnull値があってもエラーが発生しない', async () => {
      const { default: supabase } = await import('@/lib/supabase')

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis()
      }
      const mockSelect = {
        select: vi.fn().mockReturnValue(mockQuery)
      }
      supabase.from.mockReturnValue(mockSelect)
      
      mockQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      const pagination = {
        page: 1,
        pageSize: 10,
        filters: {
          goal_category: null,
          progress_level_min: undefined,
          search_text: '',
          date_from: null
        }
      }
      
      const result = await dataStore.fetchDiaries('user1', false, pagination)
      
      expect(result.data).toEqual([])
      // null/undefined/空文字のフィルターは適用されないことを確認
      expect(mockQuery.eq).not.toHaveBeenCalledWith('goal_category', null)
    })
  })

  describe('初期化エラー', () => {
    it('initializeData - 部分的失敗でも処理が完了する', async () => {
      const { default: supabase } = await import('@/lib/supabase')

      // 日記取得は成功、アカウント取得は失敗のシナリオ
      let callCount = 0
      const mockSelect = {
        select: vi.fn(() => ({
          eq: vi.fn(() => {
            callCount++
            if (callCount === 1) {
              // 日記取得（成功）
              return {
                order: vi.fn().mockResolvedValue({
                  data: [{ id: '1', title: 'Test' }],
                  error: null,
                  count: 1
                })
              }
            } else {
              // アカウント取得（失敗）
              return Promise.reject(new Error('Account fetch failed'))
            }
          })
        }))
      }
      supabase.from.mockReturnValue(mockSelect)

      // エラーが発生してもプロミスは解決される（内部でcatchされる）
      await dataStore.initializeData('user1')
      
      // 成功した部分のデータは設定されていることを確認
      expect(dataStore.diaries).toHaveLength(1)
    })
  })

  describe('エッジケース', () => {
    it('sortedDiaries - 不正な日付でもエラーが発生しない', () => {
      const diaries = [
        { id: '1', title: 'Valid', created_at: '2023-01-01T00:00:00Z' },
        { id: '2', title: 'Invalid Date', created_at: 'invalid-date' },
        { id: '3', title: 'Null Date', created_at: null },
        { id: '4', title: 'Undefined Date', created_at: undefined }
      ]
      
      dataStore.diaries = diaries
      
      // エラーが発生せずに配列が返されることを確認
      const sorted = dataStore.sortedDiaries
      expect(Array.isArray(sorted)).toBe(true)
      expect(sorted).toHaveLength(4)
    })

    it('diariesByCategory - goal_categoryがnull/undefinedでもエラーが発生しない', () => {
      const diaries = [
        { id: '1', title: 'With Category', goal_category: 'work' },
        { id: '2', title: 'Null Category', goal_category: null },
        { id: '3', title: 'Undefined Category', goal_category: undefined },
        { id: '4', title: 'Empty Category', goal_category: '' }
      ]
      
      dataStore.diaries = diaries
      
      const grouped = dataStore.diariesByCategory
      
      expect(grouped.work).toHaveLength(1)
      expect(grouped.null).toBeDefined() // null もキーとして扱われる
      expect(grouped.undefined).toBeDefined() // undefined もキーとして扱われる
      expect(grouped['']).toBeDefined() // 空文字もキーとして扱われる
    })
  })
})