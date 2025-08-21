import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { performSecurityCheck, sanitizeInputData } from '@/utils/sanitization'
import type { 
  Tag, 
  Goal, 
  TagGoal, 
  GoalProgress, 
  DiaryTag,
  ProgressCalculation,
  CategoryAnalysis
} from '@/types/tags'
import type { DiaryEntry } from '@/stores/data'

export const useTagGoalStore = defineStore('tagGoal', () => {
  // 状態
  const tags = ref<Tag[]>([])
  const goals = ref<Goal[]>([])
  const tagGoals = ref<TagGoal[]>([])
  const goalProgress = ref<GoalProgress[]>([])
  const diaryTags = ref<DiaryTag[]>([])
  const loading = ref<Record<string, boolean>>({})
  const error = ref<Record<string, string | null>>({})

  // 計算プロパティ
  const tagsByCategory = computed(() => {
    const grouped: Record<string, Tag[]> = {}
    tags.value.forEach(tag => {
      // タグに関連する目標を取得
      const relatedGoals = getGoalsForTag(tag.id)
      const categories = [...new Set(relatedGoals.map(goal => goal.category))]
      
      categories.forEach(category => {
        if (!grouped[category]) {
          grouped[category] = []
        }
        if (!grouped[category].some(t => t.id === tag.id)) {
          grouped[category].push(tag)
        }
      })
    })
    return grouped
  })

  const goalsByCategory = computed(() => {
    const grouped: Record<string, Goal[]> = {}
    goals.value.forEach(goal => {
      if (!grouped[goal.category]) {
        grouped[goal.category] = []
      }
      grouped[goal.category].push(goal)
    })
    return grouped
  })

  const activeGoals = computed(() => 
    goals.value.filter(goal => goal.status === 'active')
  )

  // ヘルパー関数
  const setLoading = (key: string, isLoading: boolean): void => {
    loading.value = { ...loading.value, [key]: isLoading }
  }

  const setError = (key: string, errorMessage: string | null): void => {
    error.value = { ...error.value, [key]: errorMessage }
  }

  const getGoalsForTag = (tagId: string): Goal[] => {
    const relatedGoalIds = tagGoals.value
      .filter(tg => tg.tag_id === tagId)
      .map(tg => tg.goal_id)
    
    return goals.value.filter(goal => relatedGoalIds.includes(goal.id))
  }

  const getTagsForGoal = (goalId: string): Tag[] => {
    const relatedTagIds = tagGoals.value
      .filter(tg => tg.goal_id === goalId)
      .map(tg => tg.tag_id)
    
    return tags.value.filter(tag => relatedTagIds.includes(tag.id))
  }

  // タグ操作
  const fetchTags = async (userId: string): Promise<Tag[]> => {
    try {
      setLoading('tags', true)
      setError('tags', null)

      const { data, error: fetchError } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      const tagData = data || []
      tags.value = tagData
      return tagData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'タグの取得に失敗しました'
      setError('tags', errorMessage)
      throw err
    } finally {
      setLoading('tags', false)
    }
  }

  const createTag = async (tagData: Omit<Tag, 'id' | 'created_at' | 'updated_at'>): Promise<Tag> => {
    try {
      setLoading('createTag', true)
      setError('createTag', null)

      // セキュリティチェック
      const nameCheck = performSecurityCheck(tagData.name)
      if (!nameCheck.isSecure) {
        throw new Error(`タグ名に不正な内容が含まれています: ${nameCheck.threats.join(', ')}`)
      }

      if (tagData.description) {
        const descCheck = performSecurityCheck(tagData.description)
        if (!descCheck.isSecure) {
          throw new Error(`説明に不正な内容が含まれています: ${descCheck.threats.join(', ')}`)
        }
      }

      // データをサニタイズ
      const sanitizedData = sanitizeInputData(tagData) as Omit<Tag, 'id' | 'created_at' | 'updated_at'>

      const { data, error: insertError } = await supabase
        .from('tags')
        .insert([sanitizedData])
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      const newTag = data as Tag
      tags.value.push(newTag)
      return newTag
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'タグの作成に失敗しました'
      setError('createTag', errorMessage)
      throw err
    } finally {
      setLoading('createTag', false)
    }
  }

  // 目標操作
  const fetchGoals = async (userId: string): Promise<Goal[]> => {
    try {
      setLoading('goals', true)
      setError('goals', null)

      const { data, error: fetchError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      const goalData = data || []
      goals.value = goalData
      return goalData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '目標の取得に失敗しました'
      setError('goals', errorMessage)
      throw err
    } finally {
      setLoading('goals', false)
    }
  }

  const createGoal = async (goalData: Omit<Goal, 'id' | 'created_at' | 'updated_at'>): Promise<Goal> => {
    try {
      setLoading('createGoal', true)
      setError('createGoal', null)

      // セキュリティチェック
      const titleCheck = performSecurityCheck(goalData.title)
      if (!titleCheck.isSecure) {
        throw new Error(`目標タイトルに不正な内容が含まれています: ${titleCheck.threats.join(', ')}`)
      }

      // データをサニタイズ
      const sanitizedData = sanitizeInputData(goalData) as Omit<Goal, 'id' | 'created_at' | 'updated_at'>

      const { data, error: insertError } = await supabase
        .from('goals')
        .insert([sanitizedData])
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      const newGoal = data as Goal
      goals.value.unshift(newGoal)
      return newGoal
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '目標の作成に失敗しました'
      setError('createGoal', errorMessage)
      throw err
    } finally {
      setLoading('createGoal', false)
    }
  }

  // タグと目標の連携
  const linkTagToGoal = async (tagId: string, goalId: string, weight = 1.0): Promise<TagGoal> => {
    try {
      setLoading('linkTagGoal', true)
      setError('linkTagGoal', null)

      const linkData = {
        tag_id: tagId,
        goal_id: goalId,
        weight
      }

      const { data, error: insertError } = await supabase
        .from('tag_goals')
        .insert([linkData])
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      const newLink = data as TagGoal
      tagGoals.value.push(newLink)
      return newLink
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'タグと目標の連携に失敗しました'
      setError('linkTagGoal', errorMessage)
      throw err
    } finally {
      setLoading('linkTagGoal', false)
    }
  }

  // 日記にタグを追加
  const addTagToDiary = async (diaryId: string, tagId: string): Promise<DiaryTag> => {
    try {
      setLoading('addDiaryTag', true)
      setError('addDiaryTag', null)

      const linkData = {
        diary_id: diaryId,
        tag_id: tagId
      }

      const { data, error: insertError } = await supabase
        .from('diary_tags')
        .insert([linkData])
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      const newLink = data as DiaryTag
      diaryTags.value.push(newLink)
      return newLink
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '日記へのタグ追加に失敗しました'
      setError('addDiaryTag', errorMessage)
      throw err
    } finally {
      setLoading('addDiaryTag', false)
    }
  }

  // 進捗記録
  const recordProgress = async (goalId: string, diaryId: string, progressValue: number): Promise<GoalProgress> => {
    try {
      setLoading('recordProgress', true)
      setError('recordProgress', null)

      const progressData = {
        goal_id: goalId,
        diary_id: diaryId,
        progress_value: progressValue
      }

      const { data, error: insertError } = await supabase
        .from('goal_progress')
        .insert([progressData])
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      const newProgress = data as GoalProgress
      goalProgress.value.push(newProgress)

      // 目標の現在値を更新
      const goal = goals.value.find(g => g.id === goalId)
      if (goal) {
        goal.current_value = Math.min(goal.current_value + progressValue, goal.target_value)
        
        // 目標達成チェック
        if (goal.current_value >= goal.target_value && goal.status === 'active') {
          await updateGoal(goalId, { status: 'completed' })
        }
      }

      return newProgress
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '進捗記録に失敗しました'
      setError('recordProgress', errorMessage)
      throw err
    } finally {
      setLoading('recordProgress', false)
    }
  }

  // 目標更新
  const updateGoal = async (goalId: string, updates: Partial<Goal>): Promise<Goal> => {
    try {
      setLoading('updateGoal', true)
      setError('updateGoal', null)

      // セキュリティチェック
      if (updates.title) {
        const titleCheck = performSecurityCheck(updates.title)
        if (!titleCheck.isSecure) {
          throw new Error(`目標タイトルに不正な内容が含まれています: ${titleCheck.threats.join(', ')}`)
        }
      }

      const sanitizedUpdates = sanitizeInputData(updates) as Partial<Goal>

      const { data, error: updateError } = await supabase
        .from('goals')
        .update(sanitizedUpdates)
        .eq('id', goalId)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      const updatedGoal = data as Goal
      const index = goals.value.findIndex(g => g.id === goalId)
      if (index !== -1) {
        goals.value[index] = updatedGoal
      }

      return updatedGoal
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '目標の更新に失敗しました'
      setError('updateGoal', errorMessage)
      throw err
    } finally {
      setLoading('updateGoal', false)
    }
  }

  // 進捗計算
  const calculateProgress = (goalId: string): ProgressCalculation => {
    const goal = goals.value.find(g => g.id === goalId)
    if (!goal) {
      throw new Error('目標が見つかりません')
    }

    const progressEntries = goalProgress.value.filter(p => p.goal_id === goalId)
    const progressPercentage = (goal.current_value / goal.target_value) * 100

    // 日次平均進捗を計算
    const dailyProgress = progressEntries.reduce((acc, entry) => acc + entry.progress_value, 0)
    const dayCount = progressEntries.length > 0 ? progressEntries.length : 1
    const dailyAverageProgress = dailyProgress / dayCount

    // 完了予想日を計算
    let estimatedCompletionDate: string | undefined
    if (dailyAverageProgress > 0) {
      const remainingProgress = goal.target_value - goal.current_value
      const daysToComplete = Math.ceil(remainingProgress / dailyAverageProgress)
      const estimatedDate = new Date()
      estimatedDate.setDate(estimatedDate.getDate() + daysToComplete)
      estimatedCompletionDate = estimatedDate.toISOString().split('T')[0]
    }

    return {
      goalId,
      currentProgress: goal.current_value,
      targetProgress: goal.target_value,
      progressPercentage: Math.min(progressPercentage, 100),
      estimatedCompletionDate,
      dailyAverageProgress
    }
  }

  // カテゴリ分析
  const analyzeCategory = (category: string, diaries: DiaryEntry[]): CategoryAnalysis => {
    const categoryDiaries = diaries.filter(d => d.goal_category === category)
    const averageProgress = categoryDiaries.length > 0
      ? categoryDiaries.reduce((acc, d) => acc + d.progress_level, 0) / categoryDiaries.length
      : 0

    // カテゴリに関連するタグ使用状況
    const categoryTags = tags.value.filter(tag => {
      const relatedGoals = getGoalsForTag(tag.id)
      return relatedGoals.some(goal => goal.category === category)
    })

    const tagUsage = categoryTags.map(tag => {
      const tagDiaries = diaryTags.value
        .filter(dt => dt.tag_id === tag.id)
        .map(dt => categoryDiaries.find(d => d.id === dt.diary_id))
        .filter(Boolean) as DiaryEntry[]

      const avgProgress = tagDiaries.length > 0
        ? tagDiaries.reduce((acc, d) => acc + d.progress_level, 0) / tagDiaries.length
        : 0

      return {
        tag,
        usageCount: tagDiaries.length,
        averageProgress: avgProgress
      }
    })

    // 進捗トレンド（過去30日）
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentDiaries = categoryDiaries.filter(d => 
      new Date(d.created_at) >= thirtyDaysAgo
    )

    const progressTrend = recentDiaries
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(d => ({
        date: d.created_at.split('T')[0],
        value: d.progress_level
      }))

    return {
      category,
      totalDiaries: categoryDiaries.length,
      averageProgress,
      tags: tagUsage,
      progressTrend
    }
  }

  // データ初期化
  const initializeTagGoalData = async (userId: string): Promise<void> => {
    try {
      await Promise.all([
        fetchTags(userId),
        fetchGoals(userId)
      ])

      // 関連データを取得
      const [tagGoalsData, progressData, diaryTagsData] = await Promise.all([
        supabase.from('tag_goals').select('*'),
        supabase.from('goal_progress').select('*'),
        supabase.from('diary_tags').select('*')
      ])

      if (tagGoalsData.data) tagGoals.value = tagGoalsData.data
      if (progressData.data) goalProgress.value = progressData.data
      if (diaryTagsData.data) diaryTags.value = diaryTagsData.data
    } catch (err) {
      console.error('タグ・目標データ初期化エラー:', err)
    }
  }

  // 状態リセット
  const resetState = (): void => {
    tags.value = []
    goals.value = []
    tagGoals.value = []
    goalProgress.value = []
    diaryTags.value = []
    loading.value = {}
    error.value = {}
  }

  return {
    // 状態
    tags,
    goals,
    tagGoals,
    goalProgress,
    diaryTags,
    loading,
    error,

    // 計算プロパティ
    tagsByCategory,
    goalsByCategory,
    activeGoals,

    // タグ操作
    fetchTags,
    createTag,

    // 目標操作
    fetchGoals,
    createGoal,
    updateGoal,

    // 連携操作
    linkTagToGoal,
    addTagToDiary,
    recordProgress,

    // 分析・計算
    calculateProgress,
    analyzeCategory,
    getGoalsForTag,
    getTagsForGoal,

    // ユーティリティ
    initializeTagGoalData,
    resetState,
    setError,
    setLoading
  }
})