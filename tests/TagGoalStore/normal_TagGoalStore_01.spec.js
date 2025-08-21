import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTagGoalStore } from '@/stores/tagGoal'

// Supabaseのモック
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [],
          error: null
        }))
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: null,
          error: null
        }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({
        error: null
      }))
    }))
  }))
}

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}))

// セキュリティ関数のモック
vi.mock('@/utils/sanitization', () => ({
  performSecurityCheck: vi.fn(() => ({
    isSecure: true,
    threats: []
  })),
  sanitizeInputData: vi.fn((data) => data)
}))

describe('TagGoalStore - 正常系テスト', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTagGoalStore()
    vi.clearAllMocks()
  })

  describe('初期状態の確認', () => {
    it('should initialize with empty state', () => {
      expect(store.tags).toEqual([])
      expect(store.goals).toEqual([])
      expect(store.tagGoals).toEqual([])
      expect(store.goalProgress).toEqual([])
      expect(store.diaryTags).toEqual([])
      expect(store.loading).toEqual({})
      expect(store.error).toEqual({})
    })

    it('should have computed properties initialized', () => {
      expect(store.tagsByCategory).toEqual({})
      expect(store.goalsByCategory).toEqual({})
      expect(store.activeGoals).toEqual([])
    })
  })

  describe('タグ機能のテスト', () => {
    const mockUserId = 'test-user-id'
    const mockTags = [
      {
        id: 'tag-1',
        user_id: mockUserId,
        name: 'work',
        color: '#FF9800',
        description: '仕事関連',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'tag-2',
        user_id: mockUserId,
        name: 'health',
        color: '#4CAF50',
        description: '健康関連',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    ]

    it('should fetch tags successfully', async () => {
      // Supabaseモックの設定
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: mockTags,
              error: null
            }))
          }))
        }))
      })

      const result = await store.fetchTags(mockUserId)

      expect(result).toEqual(mockTags)
      expect(store.tags).toEqual(mockTags)
      expect(store.loading.tags).toBe(false)
      expect(store.error.tags).toBe(null)
    })

    it('should create tag successfully', async () => {
      const newTagData = {
        user_id: mockUserId,
        name: 'learning',
        color: '#2196F3',
        description: '学習関連'
      }

      const mockCreatedTag = {
        id: 'tag-3',
        ...newTagData,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: mockCreatedTag,
              error: null
            }))
          }))
        }))
      })

      const result = await store.createTag(newTagData)

      expect(result).toEqual(mockCreatedTag)
      expect(store.tags).toContain(mockCreatedTag)
      expect(store.loading.createTag).toBe(false)
      expect(store.error.createTag).toBe(null)
    })
  })

  describe('目標機能のテスト', () => {
    const mockUserId = 'test-user-id'
    const mockGoals = [
      {
        id: 'goal-1',
        user_id: mockUserId,
        title: '体重減量',
        description: '5kg減量する',
        category: 'health',
        target_value: 5,
        current_value: 2,
        target_date: '2025-12-31',
        status: 'active',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'goal-2',
        user_id: mockUserId,
        title: 'TypeScript学習',
        description: 'TypeScriptを習得する',
        category: 'learning',
        target_value: 100,
        current_value: 75,
        target_date: null,
        status: 'active',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    ]

    beforeEach(() => {
      store.goals = mockGoals
    })

    it('should fetch goals successfully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: mockGoals,
              error: null
            }))
          }))
        }))
      })

      const result = await store.fetchGoals(mockUserId)

      expect(result).toEqual(mockGoals)
      expect(store.goals).toEqual(mockGoals)
      expect(store.loading.goals).toBe(false)
      expect(store.error.goals).toBe(null)
    })

    it('should create goal successfully', async () => {
      const newGoalData = {
        user_id: mockUserId,
        title: '読書習慣',
        description: '月10冊読む',
        category: 'learning',
        target_value: 10,
        current_value: 0,
        target_date: '2025-12-31',
        status: 'active'
      }

      const mockCreatedGoal = {
        id: 'goal-3',
        ...newGoalData,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: mockCreatedGoal,
              error: null
            }))
          }))
        }))
      })

      const result = await store.createGoal(newGoalData)

      expect(result).toEqual(mockCreatedGoal)
      expect(store.goals[0]).toEqual(mockCreatedGoal) // 配列の先頭に追加される
      expect(store.loading.createGoal).toBe(false)
      expect(store.error.createGoal).toBe(null)
    })

    it('should calculate activeGoals correctly', () => {
      expect(store.activeGoals).toHaveLength(2)
      expect(store.activeGoals.every(goal => goal.status === 'active')).toBe(true)
    })

    it('should group goals by category', () => {
      const grouped = store.goalsByCategory

      expect(grouped.health).toHaveLength(1)
      expect(grouped.health[0].title).toBe('体重減量')
      expect(grouped.learning).toHaveLength(1)
      expect(grouped.learning[0].title).toBe('TypeScript学習')
    })
  })

  describe('進捗計算機能のテスト', () => {
    const mockGoal = {
      id: 'goal-1',
      user_id: 'test-user-id',
      title: 'テスト目標',
      category: 'test',
      target_value: 10,
      current_value: 6,
      status: 'active',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    }

    const mockProgressEntries = [
      {
        goal_id: 'goal-1',
        diary_id: 'diary-1',
        progress_value: 2,
        recorded_at: '2025-01-01T00:00:00Z'
      },
      {
        goal_id: 'goal-1',
        diary_id: 'diary-2',
        progress_value: 3,
        recorded_at: '2025-01-02T00:00:00Z'
      },
      {
        goal_id: 'goal-1',
        diary_id: 'diary-3',
        progress_value: 1,
        recorded_at: '2025-01-03T00:00:00Z'
      }
    ]

    beforeEach(() => {
      store.goals = [mockGoal]
      store.goalProgress = mockProgressEntries
    })

    it('should calculate progress correctly', () => {
      const progress = store.calculateProgress('goal-1')

      expect(progress.goalId).toBe('goal-1')
      expect(progress.currentProgress).toBe(6)
      expect(progress.targetProgress).toBe(10)
      expect(progress.progressPercentage).toBe(60)
      expect(progress.dailyAverageProgress).toBe(2) // (2+3+1)/3 = 2
      expect(progress.estimatedCompletionDate).toBeDefined()
    })

    it('should handle goal without progress entries', () => {
      store.goalProgress = []
      
      const progress = store.calculateProgress('goal-1')

      expect(progress.dailyAverageProgress).toBe(0)
      expect(progress.estimatedCompletionDate).toBeUndefined()
    })

    it('should cap progress percentage at 100%', () => {
      const completedGoal = {
        ...mockGoal,
        current_value: 15 // 目標値を超えた場合
      }
      store.goals = [completedGoal]

      const progress = store.calculateProgress('goal-1')

      expect(progress.progressPercentage).toBe(100)
    })
  })

  describe('タグと目標の連携機能', () => {
    const mockTags = [
      { id: 'tag-1', name: 'health', color: '#4CAF50' },
      { id: 'tag-2', name: 'learning', color: '#2196F3' }
    ]

    const mockGoals = [
      { id: 'goal-1', category: 'health', title: '運動' },
      { id: 'goal-2', category: 'learning', title: '読書' }
    ]

    const mockTagGoals = [
      { tag_id: 'tag-1', goal_id: 'goal-1', weight: 1.0 },
      { tag_id: 'tag-2', goal_id: 'goal-2', weight: 1.5 }
    ]

    beforeEach(() => {
      store.tags = mockTags
      store.goals = mockGoals
      store.tagGoals = mockTagGoals
    })

    it('should get goals for tag correctly', () => {
      const healthGoals = store.getGoalsForTag('tag-1')
      
      expect(healthGoals).toHaveLength(1)
      expect(healthGoals[0].title).toBe('運動')
    })

    it('should get tags for goal correctly', () => {
      const learningTags = store.getTagsForGoal('goal-2')
      
      expect(learningTags).toHaveLength(1)
      expect(learningTags[0].name).toBe('learning')
    })

    it('should link tag to goal successfully', async () => {
      const mockLink = {
        tag_id: 'tag-1',
        goal_id: 'goal-2',
        weight: 2.0
      }

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: mockLink,
              error: null
            }))
          }))
        }))
      })

      const result = await store.linkTagToGoal('tag-1', 'goal-2', 2.0)

      expect(result).toEqual(mockLink)
      expect(store.tagGoals).toContain(mockLink)
    })
  })

  describe('データ初期化とリセット', () => {
    it('should reset state correctly', () => {
      // 初期状態を設定
      store.tags = [{ id: 'tag-1', name: 'test' }]
      store.goals = [{ id: 'goal-1', title: 'test' }]
      store.loading = { test: true }
      store.error = { test: 'error' }

      // リセット実行
      store.resetState()

      // 状態がリセットされることを確認
      expect(store.tags).toEqual([])
      expect(store.goals).toEqual([])
      expect(store.tagGoals).toEqual([])
      expect(store.goalProgress).toEqual([])
      expect(store.diaryTags).toEqual([])
      expect(store.loading).toEqual({})
      expect(store.error).toEqual({})
    })
  })
})