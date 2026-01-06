// useEmotionTagsStoreの正常系テスト
// Issue #164: 感情タグ機能の実装

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { EmotionTag } from '@features/mood'

// Supabaseクライアントのモック（vi.mockはファイルトップにホイストされる）
vi.mock('@core/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
  }
}))

import { useEmotionTagsStore } from '@features/mood'
import { supabase as mockSupabase } from '@core/lib/supabase'

// モックデータ（実際のマスターデータに合わせて更新）
const mockEmotionTags: EmotionTag[] = [
  { id: '1', name: '達成感', category: 'positive', color: '#4CAF50', description: '目標達成や成功体験による満足感', display_order: 1, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '2', name: '集中', category: 'positive', color: '#2196F3', description: '作業や活動に深く没頭している状態', display_order: 2, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '11', name: '疲労', category: 'negative', color: '#795548', description: '身体的・精神的な疲れを感じている', display_order: 11, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '12', name: '不安', category: 'negative', color: '#9C27B0', description: '将来への心配や恐れを感じている', display_order: 12, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '21', name: '平常', category: 'neutral', color: '#757575', description: '特に感情の起伏がない普通の状態', display_order: 21, created_at: '2024-01-01', updated_at: '2024-01-01' }
]

describe('useEmotionTagsStore', () => {
  beforeEach(() => {
    // Piniaのセットアップ
    setActivePinia(createPinia())
    
    // モックのリセット
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('初期化', () => {
    it('ストアが正常に初期化される', () => {
      const store = useEmotionTagsStore()
      
      expect(store.emotionTags).toEqual([])
      expect(store.loading).toEqual({})
      expect(store.error).toEqual({})
    })

    it('計算プロパティが正しく動作する', () => {
      const store = useEmotionTagsStore()
      store.emotionTags = mockEmotionTags
      
      // カテゴリ別グループ化の確認
      expect(store.emotionTagsGrouped.positive).toHaveLength(2)
      expect(store.emotionTagsGrouped.negative).toHaveLength(2)
      expect(store.emotionTagsGrouped.neutral).toHaveLength(1)
      
      // 感情タググループの確認
      expect(store.emotionTagGroups).toHaveLength(3)
      expect(store.emotionTagGroups[0].category).toBe('positive')
      expect(store.emotionTagGroups[1].category).toBe('negative')
      expect(store.emotionTagGroups[2].category).toBe('neutral')
    })
  })

  describe('fetchEmotionTags', () => {
    it('感情タグを正常に取得できる', async () => {
      // Supabaseのレスポンスをモック（order()の戻り値として設定）
      vi.mocked(mockSupabase.order).mockResolvedValueOnce({
        data: mockEmotionTags,
        error: null
      } as unknown as ReturnType<typeof mockSupabase.order>)

      const store = useEmotionTagsStore()
      const result = await store.fetchEmotionTags()

      expect(result).toEqual(mockEmotionTags)
      expect(store.emotionTags).toEqual(mockEmotionTags)
      expect(store.loading.fetchEmotionTags).toBe(false)
      expect(store.error.fetchEmotionTags).toBe(null)
    })

    it('キャッシュが有効な場合、APIコールしない', async () => {
      const store = useEmotionTagsStore()

      // 初回取得
      vi.mocked(mockSupabase.order).mockResolvedValueOnce({
        data: mockEmotionTags,
        error: null
      } as unknown as ReturnType<typeof mockSupabase.order>)
      await store.fetchEmotionTags()

      // キャッシュから取得（APIコールされないことを確認）
      const callCount = vi.mocked(mockSupabase.from).mock.calls.length
      const result = await store.fetchEmotionTags()

      expect(vi.mocked(mockSupabase.from).mock.calls.length).toBe(callCount)
      expect(result).toEqual(mockEmotionTags)
    })

    it('forceRefreshフラグでキャッシュを無視する', async () => {
      const store = useEmotionTagsStore()

      // 初回取得
      vi.mocked(mockSupabase.order).mockResolvedValueOnce({
        data: mockEmotionTags,
        error: null
      } as unknown as ReturnType<typeof mockSupabase.order>)
      await store.fetchEmotionTags()

      // 強制リフレッシュ
      vi.mocked(mockSupabase.order).mockResolvedValueOnce({
        data: mockEmotionTags,
        error: null
      } as unknown as ReturnType<typeof mockSupabase.order>)
      const callCount = vi.mocked(mockSupabase.from).mock.calls.length
      await store.fetchEmotionTags(true)

      expect(vi.mocked(mockSupabase.from).mock.calls.length).toBeGreaterThan(callCount)
    })

    it('エラー時はモックデータを返す', async () => {
      vi.mocked(mockSupabase.order).mockResolvedValueOnce({
        data: null,
        error: { message: 'ネットワークエラー' }
      } as unknown as ReturnType<typeof mockSupabase.order>)

      const store = useEmotionTagsStore()
      const result = await store.fetchEmotionTags()

      expect(result).toEqual(store.getMockEmotionTags())
      expect(store.error.fetchEmotionTags).toBeTruthy()
    })
  })

  describe('linkDiaryEmotionTags', () => {
    it('日記と感情タグを正常に関連付けできる', async () => {
      const store = useEmotionTagsStore()
      const diaryId = 'diary-123'
      const emotionTagIds = ['1', '2', '11']

      // 削除処理のモック（eq()の戻り値として設定）
      vi.mocked(mockSupabase.eq).mockResolvedValueOnce({
        data: null,
        error: null
      } as unknown as ReturnType<typeof mockSupabase.eq>)

      // 挿入処理のモック（insert()の戻り値として設定）
      vi.mocked(mockSupabase.insert).mockResolvedValueOnce({
        data: null,
        error: null
      } as unknown as ReturnType<typeof mockSupabase.insert>)

      await expect(store.linkDiaryEmotionTags(diaryId, emotionTagIds)).resolves.toBeUndefined()

      // 削除処理の呼び出し確認
      expect(mockSupabase.from).toHaveBeenCalledWith('diary_emotion_tags')
      expect(mockSupabase.delete).toHaveBeenCalled()
      expect(mockSupabase.eq).toHaveBeenCalledWith('diary_id', diaryId)

      // 挿入処理の呼び出し確認
      expect(mockSupabase.insert).toHaveBeenCalledWith([
        { diary_id: diaryId, emotion_tag_id: '1' },
        { diary_id: diaryId, emotion_tag_id: '2' },
        { diary_id: diaryId, emotion_tag_id: '11' }
      ])
    })

    it('空の感情タグIDの場合は削除のみ行う', async () => {
      const store = useEmotionTagsStore()
      const diaryId = 'diary-123'
      const emotionTagIds: string[] = []

      // 削除処理のモック
      vi.mocked(mockSupabase.eq).mockResolvedValueOnce({
        data: null,
        error: null
      } as unknown as ReturnType<typeof mockSupabase.eq>)

      await store.linkDiaryEmotionTags(diaryId, emotionTagIds)

      // 削除は実行されるが挿入は実行されない
      expect(mockSupabase.delete).toHaveBeenCalled()
      expect(mockSupabase.insert).not.toHaveBeenCalled()
    })

    it('削除処理でエラーが発生した場合、例外がスローされる', async () => {
      const store = useEmotionTagsStore()
      const diaryId = 'diary-123'
      const emotionTagIds = ['1', '2']

      // エラーを返すモック設定
      vi.mocked(mockSupabase.eq).mockResolvedValueOnce({
        data: null,
        error: { message: '削除エラー' }
      } as unknown as ReturnType<typeof mockSupabase.eq>)

      await expect(store.linkDiaryEmotionTags(diaryId, emotionTagIds)).rejects.toThrow()
      expect(store.error.linkDiaryEmotionTags).toBeTruthy()
    })
  })

  describe('getDiaryEmotionTags', () => {
    it('日記の感情タグを正常に取得できる', async () => {
      const mockResponse = [
        { emotion_tag_id: '1', emotion_tags: mockEmotionTags[0] },
        { emotion_tag_id: '2', emotion_tags: mockEmotionTags[1] }
      ]

      const store = useEmotionTagsStore()
      const diaryId = 'diary-123'

      // eq()の戻り値として設定
      vi.mocked(mockSupabase.eq).mockResolvedValueOnce({
        data: mockResponse,
        error: null
      } as unknown as ReturnType<typeof mockSupabase.eq>)

      const result = await store.getDiaryEmotionTags(diaryId)

      expect(result).toEqual([mockEmotionTags[0], mockEmotionTags[1]])
      expect(mockSupabase.eq).toHaveBeenCalledWith('diary_id', diaryId)
    })

    it('該当する感情タグがない場合、空配列を返す', async () => {
      const store = useEmotionTagsStore()
      const diaryId = 'diary-123'

      // 空配列を返すモック
      vi.mocked(mockSupabase.eq).mockResolvedValueOnce({
        data: [],
        error: null
      } as unknown as ReturnType<typeof mockSupabase.eq>)

      const result = await store.getDiaryEmotionTags(diaryId)

      expect(result).toEqual([])
    })

    it('エラー時は空配列を返す', async () => {
      const store = useEmotionTagsStore()
      const diaryId = 'diary-123'

      // エラーを返すモック
      vi.mocked(mockSupabase.eq).mockResolvedValueOnce({
        data: null,
        error: { message: '取得エラー' }
      } as unknown as ReturnType<typeof mockSupabase.eq>)

      const result = await store.getDiaryEmotionTags(diaryId)

      expect(result).toEqual([])
      expect(store.error.getDiaryEmotionTags).toBeTruthy()
    })
  })

  describe('ユーティリティメソッド', () => {
    it('getEmotionTagByIdが正常に動作する', () => {
      const store = useEmotionTagsStore()
      store.emotionTags = mockEmotionTags
      
      const tag = store.getEmotionTagById('1')
      expect(tag).toEqual(mockEmotionTags[0])
      
      const notFound = store.getEmotionTagById('999')
      expect(notFound).toBeUndefined()
    })

    it('getEmotionTagsByCategoryが正常に動作する', () => {
      const store = useEmotionTagsStore()
      store.emotionTags = mockEmotionTags
      
      const positiveTags = store.getEmotionTagsByCategory('positive')
      expect(positiveTags).toHaveLength(2)
      expect(positiveTags.every(tag => tag.category === 'positive')).toBe(true)
      
      const negativeTags = store.getEmotionTagsByCategory('negative')
      expect(negativeTags).toHaveLength(2)
      
      const neutralTags = store.getEmotionTagsByCategory('neutral')
      expect(neutralTags).toHaveLength(1)
    })

    it('resetStateが正常に動作する', () => {
      const store = useEmotionTagsStore()
      
      // データを設定
      store.emotionTags = mockEmotionTags
      store.loading = { fetchEmotionTags: true }
      store.error = { fetchEmotionTags: 'エラー' }
      
      // リセット実行
      store.resetState()
      
      // 全て初期値に戻ることを確認
      expect(store.emotionTags).toEqual([])
      expect(store.loading).toEqual({})
      expect(store.error).toEqual({})
    })

    it('isCacheValidが正常に動作する', async () => {
      // フェイクタイマーを使用
      vi.useFakeTimers()
      const store = useEmotionTagsStore()

      // キャッシュ無効状態
      expect(store.isCacheValid()).toBe(false)

      // キャッシュ有効状態（現在時刻設定）
      // fetchEmotionTagsを実行してlastFetchを更新
      vi.mocked(mockSupabase.order).mockResolvedValueOnce({
        data: mockEmotionTags,
        error: null
      } as unknown as ReturnType<typeof mockSupabase.order>)

      await store.fetchEmotionTags()
      expect(store.isCacheValid()).toBe(true)

      // キャッシュ期限切れ状態のテスト
      // 6分経過をシミュレート
      vi.advanceTimersByTime(6 * 60 * 1000)
      expect(store.isCacheValid()).toBe(false)

      // タイマーをリセット
      vi.useRealTimers()
    })
  })
})