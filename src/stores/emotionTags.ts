// 感情タグ管理ストア
// Issue #164: 感情タグ機能の実装

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { 
  EmotionTag, 
  EmotionTagGroup,
  EmotionTagStats,
  EmotionTagFilter,
  EmotionCategory
} from '@/types/emotion-tags'

export const useEmotionTagsStore = defineStore('emotionTags', () => {
  // 状態
  const emotionTags = ref<EmotionTag[]>([])
  const loading = ref<Record<string, boolean>>({})
  const error = ref<Record<string, string | null>>({})
  
  // キャッシュ状態
  const lastFetch = ref<number | null>(null)
  const CACHE_DURATION = 5 * 60 * 1000 // 5分

  // 計算プロパティ
  const emotionTagsGrouped = computed((): Record<EmotionCategory, EmotionTag[]> => {
    return {
      positive: emotionTags.value
        .filter(tag => tag.category === 'positive')
        .sort((a, b) => a.display_order - b.display_order),
      negative: emotionTags.value
        .filter(tag => tag.category === 'negative')
        .sort((a, b) => a.display_order - b.display_order),
      neutral: emotionTags.value
        .filter(tag => tag.category === 'neutral')
        .sort((a, b) => a.display_order - b.display_order)
    }
  })

  const emotionTagGroups = computed((): EmotionTagGroup[] => {
    const grouped = emotionTagsGrouped.value
    return [
      {
        category: 'positive',
        label: 'ポジティブ',
        tags: grouped.positive,
        color: '#4CAF50'
      },
      {
        category: 'negative',
        label: 'ネガティブ', 
        tags: grouped.negative,
        color: '#F44336'
      },
      {
        category: 'neutral',
        label: '中性',
        tags: grouped.neutral,
        color: '#757575'
      }
    ]
  })

  // ローディング状態管理
  const setLoading = (key: string, isLoading: boolean): void => {
    loading.value = { ...loading.value, [key]: isLoading }
  }

  const setError = (key: string, errorMessage: string | null): void => {
    error.value = { ...error.value, [key]: errorMessage }
  }

  // キャッシュ有効性チェック
  const isCacheValid = (): boolean => {
    if (!lastFetch.value) return false
    return Date.now() - lastFetch.value < CACHE_DURATION
  }

  // 感情タグマスタ取得
  const fetchEmotionTags = async (forceRefresh = false): Promise<EmotionTag[]> => {
    // キャッシュチェック
    if (!forceRefresh && emotionTags.value.length > 0 && isCacheValid()) {
      return emotionTags.value
    }

    try {
      setLoading('fetchEmotionTags', true)
      setError('fetchEmotionTags', null)

      const { data, error: fetchError } = await supabase
        .from('emotion_tags')
        .select('*')
        .order('display_order', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      emotionTags.value = (data || []) as EmotionTag[]
      lastFetch.value = Date.now()
      
      return emotionTags.value
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '感情タグの取得に失敗しました'
      setError('fetchEmotionTags', errorMessage)
      
      // エラー時はモックデータを返す
      emotionTags.value = getMockEmotionTags()
      return emotionTags.value
    } finally {
      setLoading('fetchEmotionTags', false)
    }
  }

  // 日記に感情タグを関連付け
  const linkDiaryEmotionTags = async (diaryId: string, emotionTagIds: string[]): Promise<void> => {
    try {
      setLoading('linkDiaryEmotionTags', true)
      setError('linkDiaryEmotionTags', null)

      // 既存の関連付けを削除
      const { error: deleteError } = await supabase
        .from('diary_emotion_tags')
        .delete()
        .eq('diary_id', diaryId)

      if (deleteError) {
        throw deleteError
      }

      // 新しい関連付けを挿入
      if (emotionTagIds.length > 0) {
        const insertData = emotionTagIds.map(emotionTagId => ({
          diary_id: diaryId,
          emotion_tag_id: emotionTagId
        }))

        const { error: insertError } = await supabase
          .from('diary_emotion_tags')
          .insert(insertData)

        if (insertError) {
          throw insertError
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '感情タグの関連付けに失敗しました'
      setError('linkDiaryEmotionTags', errorMessage)
      throw err
    } finally {
      setLoading('linkDiaryEmotionTags', false)
    }
  }

  // 日記の感情タグを取得
  const getDiaryEmotionTags = async (diaryId: string): Promise<EmotionTag[]> => {
    try {
      setLoading('getDiaryEmotionTags', true)
      setError('getDiaryEmotionTags', null)

      const { data, error: fetchError } = await supabase
        .from('diary_emotion_tags')
        .select(`
          emotion_tag_id,
          emotion_tags (*)
        `)
        .eq('diary_id', diaryId)

      if (fetchError) {
        throw fetchError
      }

      return (data || [])
        .map((item: Record<string, unknown>) => (item.emotion_tags as EmotionTag))
        .filter(Boolean)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '日記の感情タグ取得に失敗しました'
      setError('getDiaryEmotionTags', errorMessage)
      return []
    } finally {
      setLoading('getDiaryEmotionTags', false)
    }
  }

  // 複数日記の感情タグを一括取得
  const getBatchDiaryEmotionTags = async (diaryIds: string[]): Promise<Record<string, EmotionTag[]>> => {
    if (diaryIds.length === 0) return {}

    try {
      setLoading('getBatchDiaryEmotionTags', true)
      setError('getBatchDiaryEmotionTags', null)

      const { data, error: fetchError } = await supabase
        .from('diary_emotion_tags')
        .select(`
          diary_id,
          emotion_tag_id,
          emotion_tags (*)
        `)
        .in('diary_id', diaryIds)

      if (fetchError) {
        throw fetchError
      }

      const result: Record<string, EmotionTag[]> = {}
      diaryIds.forEach(id => {
        result[id] = []
      })

      ;(data || []).forEach((item: Record<string, unknown>) => {
        const diaryId = item.diary_id as string
        const emotionTag = item.emotion_tags as EmotionTag
        if (emotionTag && diaryId) {
          if (!result[diaryId]) {
            result[diaryId] = []
          }
          result[diaryId].push(emotionTag)
        }
      })

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '感情タグ一括取得に失敗しました'
      setError('getBatchDiaryEmotionTags', errorMessage)
      return {}
    } finally {
      setLoading('getBatchDiaryEmotionTags', false)
    }
  }

  // 感情タグ統計情報取得
  const getEmotionTagStats = async (
    _userId: string,
    _filter?: EmotionTagFilter
  ): Promise<EmotionTagStats[]> => {
    try {
      setLoading('getEmotionTagStats', true)
      setError('getEmotionTagStats', null)

      // TODO: 実際のクエリ実装
      // 現在はモックデータを返す
      await new Promise(resolve => setTimeout(resolve, 500))
      
      return []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '感情タグ統計取得に失敗しました'
      setError('getEmotionTagStats', errorMessage)
      return []
    } finally {
      setLoading('getEmotionTagStats', false)
    }
  }

  // IDで感情タグを取得
  const getEmotionTagById = (id: string): EmotionTag | undefined => {
    return emotionTags.value.find(tag => tag.id === id)
  }

  // カテゴリで感情タグを取得
  const getEmotionTagsByCategory = (category: EmotionCategory): EmotionTag[] => {
    return emotionTags.value.filter(tag => tag.category === category)
  }

  // 状態リセット
  const resetState = (): void => {
    emotionTags.value = []
    loading.value = {}
    error.value = {}
    lastFetch.value = null
  }

  // モックデータ（開発用）
  const getMockEmotionTags = (): EmotionTag[] => [
    // ポジティブ感情
    { id: '1', name: '達成感', category: 'positive', color: '#4CAF50', description: '目標達成や成功体験による満足感', display_order: 1, created_at: '', updated_at: '' },
    { id: '2', name: '集中', category: 'positive', color: '#2196F3', description: '作業や活動に深く没頭している状態', display_order: 2, created_at: '', updated_at: '' },
    { id: '3', name: 'やりがい', category: 'positive', color: '#FF9800', description: '仕事や活動に意味や価値を感じている', display_order: 3, created_at: '', updated_at: '' },
    { id: '4', name: '安心', category: 'positive', color: '#009688', description: '心配や不安がなく落ち着いている状態', display_order: 4, created_at: '', updated_at: '' },
    { id: '5', name: '充実', category: 'positive', color: '#8BC34A', description: '満足感と生きがいを感じている', display_order: 5, created_at: '', updated_at: '' },
    { id: '6', name: '興奮', category: 'positive', color: '#E91E63', description: '高揚感や期待感に満ちている状態', display_order: 6, created_at: '', updated_at: '' },
    
    // ネガティブ感情
    { id: '11', name: '疲労', category: 'negative', color: '#795548', description: '身体的・精神的な疲れを感じている', display_order: 11, created_at: '', updated_at: '' },
    { id: '12', name: '不安', category: 'negative', color: '#9C27B0', description: '将来への心配や恐れを感じている', display_order: 12, created_at: '', updated_at: '' },
    { id: '13', name: '焦り', category: 'negative', color: '#F44336', description: '時間や結果に対する切迫感', display_order: 13, created_at: '', updated_at: '' },
    { id: '14', name: '失望', category: 'negative', color: '#607D8B', description: '期待が裏切られた時の落胆', display_order: 14, created_at: '', updated_at: '' },
    { id: '15', name: '孤独', category: 'negative', color: '#424242', description: '他者とのつながりを感じられない状態', display_order: 15, created_at: '', updated_at: '' },
    { id: '16', name: '退屈', category: 'negative', color: '#9E9E9E', description: 'つまらなさや刺激の不足を感じている', display_order: 16, created_at: '', updated_at: '' },
    
    // 中性感情
    { id: '21', name: '平常', category: 'neutral', color: '#757575', description: '特に感情の起伏がない普通の状態', display_order: 21, created_at: '', updated_at: '' },
    { id: '22', name: '淡々', category: 'neutral', color: '#90A4AE', description: '感情的にならず事務的に進めている', display_order: 22, created_at: '', updated_at: '' },
    { id: '23', name: '思考中', category: 'neutral', color: '#5D4037', description: '何かについて深く考えている状態', display_order: 23, created_at: '', updated_at: '' },
    { id: '24', name: '準備中', category: 'neutral', color: '#37474F', description: '次の行動や段階への準備をしている', display_order: 24, created_at: '', updated_at: '' }
  ]

  return {
    // 状態
    emotionTags,
    loading,
    error,

    // 計算プロパティ
    emotionTagsGrouped,
    emotionTagGroups,

    // アクション
    fetchEmotionTags,
    linkDiaryEmotionTags,
    getDiaryEmotionTags,
    getBatchDiaryEmotionTags,
    getEmotionTagStats,
    getEmotionTagById,
    getEmotionTagsByCategory,
    resetState,

    // ユーティリティ
    isCacheValid,
    getMockEmotionTags
  }
})