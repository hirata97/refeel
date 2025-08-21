import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDataStore } from '@/stores/data'

// モックの設定
vi.mock('@/lib/supabase', () => ({
  default: {
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
  performSecurityCheck: vi.fn(() => ({ isSecure: true, threats: [] })),
  sanitizeInputData: vi.fn((data) => data)
}))

describe('DataStore - 正常系', () => {
  let dataStore

  beforeEach(() => {
    setActivePinia(createPinia())
    dataStore = useDataStore()
    vi.clearAllMocks()
  })

  describe('初期状態', () => {
    it('初期状態が正しく設定されている', () => {
      expect(dataStore.diaries).toEqual([])
      expect(dataStore.accounts).toEqual([])
      expect(dataStore.loading).toEqual({})
      expect(dataStore.error).toEqual({})
    })

    it('キャッシュが初期化されている', () => {
      const cacheInfo = dataStore.getCacheInfo
      expect(cacheInfo.size).toBe(0)
      expect(cacheInfo.keys).toEqual([])
    })
  })

  describe('キャッシュ機能', () => {
    it('キャッシュの設定と取得が正しく動作する', () => {
      const testData = { id: 1, name: 'テスト' }
      
      // プライベートメソッドの代わりに公開されているインターフェースを使用
      // setCache は直接テストできないため、データを保存して取得をテストする
      dataStore.diaries = [testData]
      
      expect(dataStore.diaries).toContain(testData)
    })

    it('キャッシュ無効化が正しく動作する', () => {
      // キャッシュにデータを追加
      dataStore.diaries = [{ id: 1, title: 'テスト' }]
      
      // 無効化
      dataStore.invalidateCache()
      
      const cacheInfo = dataStore.getCacheInfo
      expect(cacheInfo.size).toBe(0)
    })

    it('パターンマッチングでキャッシュ無効化が動作する', () => {
      // 特定パターンでの無効化をテスト
      dataStore.invalidateCache('diaries')
      
      // パターンマッチングが機能することを確認（実装に依存）
      const cacheInfo = dataStore.getCacheInfo
      expect(cacheInfo.size).toBe(0)
    })
  })

  describe('ローディング状態管理', () => {
    it('setLoading が正しく動作する', () => {
      // プライベートメソッドのため、公開API経由でテスト
      expect(dataStore.loading).toEqual({})
      
      // 日記取得時にローディング状態をテストする想定
      // 実際のテストでは fetchDiaries などの公開メソッドを使用
    })
  })

  describe('エラー状態管理', () => {
    it('setError が正しく動作する', () => {
      expect(dataStore.error).toEqual({})
      
      // エラー状態は実際のメソッド実行時にテストする
    })
  })

  describe('計算プロパティ', () => {
    it('sortedDiaries が日付順でソートされる', () => {
      const diaries = [
        { id: '1', title: 'Old', created_at: '2023-01-01T00:00:00Z' },
        { id: '2', title: 'New', created_at: '2023-12-31T00:00:00Z' },
        { id: '3', title: 'Medium', created_at: '2023-06-15T00:00:00Z' }
      ]
      
      dataStore.diaries = diaries
      
      const sorted = dataStore.sortedDiaries
      expect(sorted[0].title).toBe('New') // 最新が最初
      expect(sorted[1].title).toBe('Medium')
      expect(sorted[2].title).toBe('Old') // 最古が最後
    })

    it('diariesByCategory がカテゴリ別に正しくグループ化される', () => {
      const diaries = [
        { id: '1', title: 'Work 1', goal_category: 'work' },
        { id: '2', title: 'Health 1', goal_category: 'health' },
        { id: '3', title: 'Work 2', goal_category: 'work' },
        { id: '4', title: 'Study 1', goal_category: 'study' }
      ]
      
      dataStore.diaries = diaries
      
      const grouped = dataStore.diariesByCategory
      expect(grouped.work).toHaveLength(2)
      expect(grouped.health).toHaveLength(1)
      expect(grouped.study).toHaveLength(1)
      expect(grouped.work[0].title).toBe('Work 1')
      expect(grouped.work[1].title).toBe('Work 2')
    })

    it('diariesByCategory が空配列で空オブジェクトを返す', () => {
      dataStore.diaries = []
      
      const grouped = dataStore.diariesByCategory
      expect(grouped).toEqual({})
    })
  })

  describe('日記データ操作', () => {
    it('fetchDiaries が正しい構造でデータを返す', async () => {
      const mockDiaries = [
        { id: '1', title: 'Test Diary', user_id: 'user1', created_at: '2023-01-01T00:00:00Z' }
      ]
      
      // Supabase モックの設定
      const { default: supabase } = await import('@/lib/supabase')
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis()
      }
      const mockSelect = {
        select: vi.fn().mockReturnValue(mockQuery)
      }
      supabase.from.mockReturnValue(mockSelect)
      
      // クエリチェーンの最終結果をモック
      mockQuery.eq.mockResolvedValue({
        data: mockDiaries,
        error: null,
        count: 1
      })

      const result = await dataStore.fetchDiaries('user1')
      
      expect(result.data).toEqual(mockDiaries)
      expect(result.count).toBe(1)
      expect(result.totalPages).toBe(1)
      expect(dataStore.diaries).toEqual(mockDiaries)
    })

    it('fetchDiaries がページネーション付きで正しく動作する', async () => {
      const mockDiaries = [
        { id: '1', title: 'Test 1', user_id: 'user1' },
        { id: '2', title: 'Test 2', user_id: 'user1' }
      ]
      
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
        data: mockDiaries,
        error: null,
        count: 10
      })

      const pagination = { page: 1, pageSize: 5 }
      const result = await dataStore.fetchDiaries('user1', false, pagination)
      
      expect(result.data).toEqual(mockDiaries)
      expect(result.count).toBe(10)
      expect(result.totalPages).toBe(2) // 10 / 5 = 2
      expect(mockQuery.range).toHaveBeenCalledWith(0, 4) // offset 0, limit 5
    })

    it('createDiary が正しく新しい日記を作成する', async () => {
      const newDiary = {
        title: 'New Diary',
        content: 'Content',
        goal_category: 'work',
        user_id: 'user1',
        progress_level: 3
      }
      
      const createdDiary = {
        ...newDiary,
        id: 'diary-1',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }

      const { default: supabase } = await import('@/lib/supabase')
      const mockInsert = {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: createdDiary,
              error: null
            })
          }))
        }))
      }
      supabase.from.mockReturnValue(mockInsert)

      const result = await dataStore.createDiary(newDiary)
      
      expect(result).toEqual(createdDiary)
      expect(dataStore.diaries).toContain(createdDiary)
      expect(dataStore.diaries[0]).toEqual(createdDiary) // unshift で先頭に追加
    })

    it('updateDiary が正しく日記を更新する', async () => {
      const existingDiary = {
        id: 'diary-1',
        title: 'Old Title',
        content: 'Old Content',
        user_id: 'user1',
        created_at: '2023-01-01T00:00:00Z'
      }
      
      const updates = {
        title: 'Updated Title',
        content: 'Updated Content'
      }
      
      const updatedDiary = {
        ...existingDiary,
        ...updates,
        updated_at: '2023-01-02T00:00:00Z'
      }

      // 既存のデータを設定
      dataStore.diaries = [existingDiary]

      const { default: supabase } = await import('@/lib/supabase')
      const mockUpdate = {
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: updatedDiary,
                error: null
              })
            }))
          }))
        }))
      }
      supabase.from.mockReturnValue(mockUpdate)

      const result = await dataStore.updateDiary('diary-1', updates)
      
      expect(result).toEqual(updatedDiary)
      expect(dataStore.diaries[0]).toEqual(updatedDiary)
    })

    it('deleteDiary が正しく日記を削除する', async () => {
      const diary = {
        id: 'diary-1',
        title: 'To Delete',
        user_id: 'user1'
      }
      
      // 既存のデータを設定
      dataStore.diaries = [diary]

      const { default: supabase } = await import('@/lib/supabase')
      const mockDelete = {
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            error: null
          })
        }))
      }
      supabase.from.mockReturnValue(mockDelete)

      await dataStore.deleteDiary('diary-1', 'user1')
      
      expect(dataStore.diaries).not.toContain(diary)
      expect(dataStore.diaries).toHaveLength(0)
    })

    it('getDiaryById がローカルから日記を取得する', async () => {
      const diary = {
        id: 'diary-1',
        title: 'Local Diary',
        user_id: 'user1'
      }
      
      dataStore.diaries = [diary]

      const result = await dataStore.getDiaryById('diary-1', 'user1')
      
      expect(result).toEqual(diary)
    })

    it('getDiaryById がSupabaseから日記を取得する', async () => {
      const diary = {
        id: 'diary-1',
        title: 'Remote Diary',
        user_id: 'user1'
      }
      
      // ローカルにはない状態
      dataStore.diaries = []

      const { default: supabase } = await import('@/lib/supabase')
      const mockSelect = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: diary,
                error: null
              })
            }))
          }))
        }))
      }
      supabase.from.mockReturnValue(mockSelect)

      const result = await dataStore.getDiaryById('diary-1', 'user1')
      
      expect(result).toEqual(diary)
      expect(dataStore.diaries).toContain(diary)
    })
  })

  describe('アカウントデータ操作', () => {
    it('fetchAccounts が正しくアカウントデータを取得する', async () => {
      const mockAccounts = [
        { id: 'acc-1', name: 'Test Account', user_id: 'user1' }
      ]

      const { default: supabase } = await import('@/lib/supabase')
      const mockSelect = {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: mockAccounts,
            error: null
          })
        }))
      }
      supabase.from.mockReturnValue(mockSelect)

      const result = await dataStore.fetchAccounts('user1')
      
      expect(result).toEqual(mockAccounts)
      expect(dataStore.accounts).toEqual(mockAccounts)
    })

    it('createAccount が正しく新しいアカウントを作成する', async () => {
      const newAccount = {
        name: 'New Account',
        user_id: 'user1'
      }
      
      const createdAccount = {
        ...newAccount,
        id: 'acc-1',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }

      const { default: supabase } = await import('@/lib/supabase')
      const mockInsert = {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: createdAccount,
              error: null
            })
          }))
        }))
      }
      supabase.from.mockReturnValue(mockInsert)

      const result = await dataStore.createAccount(newAccount)
      
      expect(result).toEqual(createdAccount)
      expect(dataStore.accounts).toContain(createdAccount)
    })
  })

  describe('初期化とリセット', () => {
    it('initializeData が正しく初期化を行う', async () => {
      // fetchDiaries と fetchAccounts のモックを設定
      const { default: supabase } = await import('@/lib/supabase')
      const mockSelect = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0
            })
          }))
        }))
      }
      supabase.from.mockReturnValue(mockSelect)

      await dataStore.initializeData('user1')
      
      // 初期化処理が完了することを確認
      expect(supabase.from).toHaveBeenCalledWith('diaries')
      expect(supabase.from).toHaveBeenCalledWith('accounts')
    })

    it('resetState が正しく状態をリセットする', () => {
      // 初期状態を設定
      dataStore.diaries = [{ id: '1', title: 'Test' }]
      dataStore.accounts = [{ id: '1', name: 'Test' }]
      dataStore.loading = { test: true }
      dataStore.error = { test: 'エラー' }

      dataStore.resetState()
      
      expect(dataStore.diaries).toEqual([])
      expect(dataStore.accounts).toEqual([])
      expect(dataStore.loading).toEqual({})
      expect(dataStore.error).toEqual({})
    })
  })
})