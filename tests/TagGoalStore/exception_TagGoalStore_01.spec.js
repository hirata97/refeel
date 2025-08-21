import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTagGoalStore } from '@/stores/tagGoal'

// Supabaseのモック（エラーケース用）
const mockSupabaseError = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          data: null,
          error: { message: 'Database connection failed' }
        }))
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: null,
          error: { message: 'Insert failed', code: 'UNIQUE_VIOLATION' }
        }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: { message: 'Update failed' }
          }))
        }))
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({
        error: { message: 'Delete failed' }
      }))
    }))
  }))
}

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseError
}))

// セキュリティ関数のモック（脅威検出版）
const mockSecurityCheckFail = vi.fn(() => ({
  isSecure: false,
  threats: ['XSS', 'SQL Injection']
}))

// const mockSecurityCheckPass = vi.fn(() => ({
//   isSecure: true,
//   threats: []
// }))

vi.mock('@/utils/sanitization', () => ({
  performSecurityCheck: mockSecurityCheckFail,
  sanitizeInputData: vi.fn((data) => data)
}))

describe('TagGoalStore - 異常系テスト', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTagGoalStore()
    vi.clearAllMocks()
  })

  describe('タグ機能のエラーハンドリング', () => {
    const mockUserId = 'test-user-id'

    it('should handle fetch tags error', async () => {
      await expect(store.fetchTags(mockUserId)).rejects.toThrow()
      
      expect(store.loading.tags).toBe(false)
      expect(store.error.tags).toBe('Database connection failed')
      expect(store.tags).toEqual([])
    })

    it('should handle create tag with security threats', async () => {
      const maliciousTagData = {
        user_id: mockUserId,
        name: '<script>alert("XSS")</script>',
        color: '#FF0000',
        description: 'DROP TABLE users;'
      }

      await expect(store.createTag(maliciousTagData)).rejects.toThrow(
        'タグ名に不正な内容が含まれています: XSS, SQL Injection'
      )

      expect(store.loading.createTag).toBe(false)
      expect(store.error.createTag).toContain('タグ名に不正な内容が含まれています')
    })

    it('should handle create tag with description security threats', async () => {
      // 名前は安全だが説明が危険な場合
      mockSecurityCheckFail
        .mockReturnValueOnce({ isSecure: true, threats: [] }) // name check passes
        .mockReturnValueOnce({ isSecure: false, threats: ['Script Injection'] }) // description check fails

      const tagData = {
        user_id: mockUserId,
        name: 'valid-tag',
        color: '#FF0000',
        description: '<script>malicious()</script>'
      }

      await expect(store.createTag(tagData)).rejects.toThrow(
        '説明に不正な内容が含まれています: Script Injection'
      )
    })

    it('should handle database insert failure', async () => {
      // セキュリティチェックはパスするがDBエラー
      vi.mocked(mockSecurityCheckFail).mockReturnValue({
        isSecure: true,
        threats: []
      })

      const tagData = {
        user_id: mockUserId,
        name: 'valid-tag',
        color: '#FF0000',
        description: 'valid description'
      }

      await expect(store.createTag(tagData)).rejects.toThrow()
      
      expect(store.loading.createTag).toBe(false)
      expect(store.error.createTag).toBe('Insert failed')
    })
  })

  describe('目標機能のエラーハンドリング', () => {
    const mockUserId = 'test-user-id'

    it('should handle fetch goals error', async () => {
      await expect(store.fetchGoals(mockUserId)).rejects.toThrow()
      
      expect(store.loading.goals).toBe(false)
      expect(store.error.goals).toBe('Database connection failed')
      expect(store.goals).toEqual([])
    })

    it('should handle create goal with security threats', async () => {
      const maliciousGoalData = {
        user_id: mockUserId,
        title: '<img src=x onerror=alert("XSS")>',
        description: 'Valid description',
        category: 'test',
        target_value: 10,
        current_value: 0,
        status: 'active'
      }

      await expect(store.createGoal(maliciousGoalData)).rejects.toThrow(
        '目標タイトルに不正な内容が含まれています: XSS, SQL Injection'
      )

      expect(store.loading.createGoal).toBe(false)
      expect(store.error.createGoal).toContain('目標タイトルに不正な内容が含まれています')
    })

    it('should handle update goal with invalid ID', async () => {
      const nonExistentGoalId = 'invalid-goal-id'
      const updates = { title: 'Updated title' }

      // セキュリティチェックはパスするがDBエラー
      vi.mocked(mockSecurityCheckFail).mockReturnValue({
        isSecure: true,
        threats: []
      })

      await expect(store.updateGoal(nonExistentGoalId, updates)).rejects.toThrow()
      
      expect(store.loading.updateGoal).toBe(false)
      expect(store.error.updateGoal).toBe('Update failed')
    })
  })

  describe('進捗計算のエラーハンドリング', () => {
    it('should throw error for non-existent goal', () => {
      expect(() => store.calculateProgress('non-existent-goal')).toThrow(
        '目標が見つかりません'
      )
    })

    it('should handle division by zero in progress calculation', () => {
      const zeroTargetGoal = {
        id: 'goal-1',
        user_id: 'test-user-id',
        title: 'Zero target goal',
        category: 'test',
        target_value: 0,
        current_value: 0,
        status: 'active',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      store.goals = [zeroTargetGoal]

      const progress = store.calculateProgress('goal-1')
      
      // target_value が 0 の場合の処理
      expect(progress.progressPercentage).toBeNaN() // または適切な処理を期待
    })
  })

  describe('連携機能のエラーハンドリング', () => {
    it('should handle tag-goal link creation failure', async () => {
      await expect(store.linkTagToGoal('tag-1', 'goal-1', 1.0)).rejects.toThrow()
      
      expect(store.loading.linkTagGoal).toBe(false)
      expect(store.error.linkTagGoal).toBe('Insert failed')
    })

    it('should handle diary tag addition failure', async () => {
      await expect(store.addTagToDiary('diary-1', 'tag-1')).rejects.toThrow()
      
      expect(store.loading.addDiaryTag).toBe(false)
      expect(store.error.addDiaryTag).toBe('Insert failed')
    })

    it('should handle progress recording failure', async () => {
      await expect(store.recordProgress('goal-1', 'diary-1', 5)).rejects.toThrow()
      
      expect(store.loading.recordProgress).toBe(false)
      expect(store.error.recordProgress).toBe('Insert failed')
    })
  })

  describe('分析機能の境界ケース', () => {
    it('should handle category analysis with no diaries', () => {
      const emptyDiaries = []
      const analysis = store.analyzeCategory('test-category', emptyDiaries)

      expect(analysis.totalDiaries).toBe(0)
      expect(analysis.averageProgress).toBe(0)
      expect(analysis.tags).toEqual([])
      expect(analysis.progressTrend).toEqual([])
    })

    it('should handle getGoalsForTag with non-existent tag', () => {
      const goals = store.getGoalsForTag('non-existent-tag')
      expect(goals).toEqual([])
    })

    it('should handle getTagsForGoal with non-existent goal', () => {
      const tags = store.getTagsForGoal('non-existent-goal')
      expect(tags).toEqual([])
    })
  })

  describe('ネットワークエラーのシミュレーション', () => {
    it('should handle network timeout during fetch', async () => {
      // ネットワークタイムアウトをシミュレート
      mockSupabaseError.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => {
              throw new Error('Network timeout')
            })
          }))
        }))
      })

      await expect(store.fetchTags('user-id')).rejects.toThrow('Network timeout')
      
      expect(store.loading.tags).toBe(false)
      expect(store.error.tags).toBe('Network timeout')
    })

    it('should handle partial data corruption', async () => {
      // 部分的なデータ破損をシミュレート
      const corruptedData = [
        { id: 'tag-1', name: 'valid' },
        { id: null, name: undefined }, // 破損データ
        { id: 'tag-3', name: 'also-valid' }
      ]

      mockSupabaseError.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: corruptedData,
              error: null
            }))
          }))
        }))
      })

      const result = await store.fetchTags('user-id')
      
      // データ検証ロジックが実装されている場合
      expect(result).toEqual(corruptedData)
      expect(store.tags).toEqual(corruptedData)
    })
  })

  describe('リソース制限のテスト', () => {
    it('should handle large dataset efficiently', () => {
      // 大量のタグをセット
      const largeTags = Array.from({ length: 1000 }, (_, i) => ({
        id: `tag-${i}`,
        name: `tag-${i}`,
        color: '#000000',
        user_id: 'user-id'
      }))

      const largeGoals = Array.from({ length: 500 }, (_, i) => ({
        id: `goal-${i}`,
        title: `goal-${i}`,
        category: `category-${i % 10}`,
        target_value: 100,
        current_value: i,
        status: 'active'
      }))

      store.tags = largeTags
      store.goals = largeGoals

      // パフォーマンステスト
      const start = performance.now()
      const categories = store.goalsByCategory
      const end = performance.now()

      expect(Object.keys(categories)).toHaveLength(10)
      expect(end - start).toBeLessThan(100) // 100ms以内で処理完了
    })
  })
})