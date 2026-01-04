/**
 * レポート分析サービス - 正常系テスト
 * 
 * Issue #40: レポート機能の大幅拡張
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  analyzeFrequencyStats,
  analyzeContentStats,
  analyzeMoodStats,
  analyzeContinuityStats,
  analyzeTimeStats,
  analyzeKeywordStats
} from '@features/reports'

// モックデータの準備
const mockDiaries = [
  {
    id: '1',
    user_id: 'user1',
    title: 'テストタイトル1',
    content: 'これはテスト用の日記内容です。今日は良い天気で嬉しいです。',
    goal_category: 'general',
    progress_level: 80,
    created_at: '2025-08-20T09:00:00Z',
    updated_at: '2025-08-20T09:00:00Z'
  },
  {
    id: '2',
    user_id: 'user1',
    title: 'テストタイトル2',
    content: 'もう一つの日記です。昨日より調子が悪いですが頑張ります。',
    goal_category: 'health',
    progress_level: 60,
    created_at: '2025-08-21T14:30:00Z',
    updated_at: '2025-08-21T14:30:00Z'
  },
  {
    id: '3',
    user_id: 'user1',
    title: 'テストタイトル3',
    content: '短い内容',
    goal_category: 'work',
    progress_level: 90,
    created_at: '2025-08-22T18:45:00Z',
    updated_at: '2025-08-22T18:45:00Z'
  }
]

describe('レポート分析サービス - 正常系', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('投稿頻度統計分析', () => {
    it('曜日別の投稿パターンが正しく計算される', () => {
      const result = analyzeFrequencyStats(mockDiaries)
      
      expect(result).toBeDefined()
      expect(result.weeklyPattern).toBeDefined()
      expect(Object.keys(result.weeklyPattern)).toEqual(['月', '火', '水', '木', '金', '土', '日'])
      
      // 投稿数の合計は日記数と一致するはず
      const totalPosts = Object.values(result.weeklyPattern).reduce((sum, count) => sum + count, 0)
      expect(totalPosts).toBe(mockDiaries.length)
    })

    it('月別の投稿パターンが正しく計算される', () => {
      const result = analyzeFrequencyStats(mockDiaries)
      
      expect(result.monthlyPattern).toBeDefined()
      expect(result.monthlyPattern['2025-08']).toBe(3) // 8月の投稿数
    })

    it('日別の投稿パターンが正しく計算される', () => {
      const result = analyzeFrequencyStats(mockDiaries)
      
      expect(result.dailyPattern).toBeDefined()
      expect(result.dailyPattern['2025-08-20']).toBe(1)
      expect(result.dailyPattern['2025-08-21']).toBe(1)
      expect(result.dailyPattern['2025-08-22']).toBe(1)
    })

    it('空の日記配列で正しく動作する', () => {
      const result = analyzeFrequencyStats([])
      
      expect(result.weeklyPattern).toBeDefined()
      expect(Object.values(result.weeklyPattern)).toEqual([0, 0, 0, 0, 0, 0, 0])
      expect(Object.keys(result.monthlyPattern)).toHaveLength(0)
      expect(Object.keys(result.dailyPattern)).toHaveLength(0)
    })
  })

  describe('内容統計分析', () => {
    it('文字数統計が正しく計算される', () => {
      const result = analyzeContentStats(mockDiaries)
      
      expect(result).toBeDefined()
      expect(result.averageLength).toBeGreaterThan(0)
      expect(result.maxLength).toBeGreaterThanOrEqual(result.minLength)
      expect(result.minLength).toBeGreaterThan(0)
    })

    it('文字数分布が正しく作成される', () => {
      const result = analyzeContentStats(mockDiaries)
      
      expect(result.lengthDistribution).toBeDefined()
      expect(typeof result.lengthDistribution).toBe('object')
      
      // 分布の合計は日記数と一致するはず
      const totalCount = Object.values(result.lengthDistribution).reduce((sum, count) => sum + count, 0)
      expect(totalCount).toBe(mockDiaries.length)
    })

    it('空の日記配列で正しく動作する', () => {
      const result = analyzeContentStats([])
      
      expect(result.averageLength).toBe(0)
      expect(result.maxLength).toBe(0)
      expect(result.minLength).toBe(0)
      expect(Object.keys(result.lengthDistribution)).toHaveLength(0)
    })
  })

  describe('気分統計分析', () => {
    it('気分統計が正しく計算される', () => {
      const result = analyzeMoodStats(mockDiaries)
      
      expect(result).toBeDefined()
      expect(result.average).toBeGreaterThan(0)
      expect(result.max).toBeGreaterThanOrEqual(result.average)
      expect(result.min).toBeLessThanOrEqual(result.average)
    })

    it('曜日別平均気分が計算される', () => {
      const result = analyzeMoodStats(mockDiaries)
      
      expect(result.weeklyAverage).toBeDefined()
      expect(Object.keys(result.weeklyAverage)).toEqual(['月', '火', '水', '木', '金', '土', '日'])
    })

    it('月別平均気分が計算される', () => {
      const result = analyzeMoodStats(mockDiaries)
      
      expect(result.monthlyAverage).toBeDefined()
      expect(result.monthlyAverage['2025-08']).toBeGreaterThan(0)
    })

    it('空の日記配列で正しく動作する', () => {
      const result = analyzeMoodStats([])
      
      expect(result.average).toBe(0)
      expect(result.max).toBe(0)
      expect(result.min).toBe(0)
      expect(Object.values(result.weeklyAverage)).toEqual([0, 0, 0, 0, 0, 0, 0])
    })
  })

  describe('継続性統計分析', () => {
    it('継続性統計が正しく計算される', () => {
      const dateRange = {
        startDate: '2025-08-20',
        endDate: '2025-08-22'
      }
      const result = analyzeContinuityStats(mockDiaries, dateRange)
      
      expect(result).toBeDefined()
      expect(result.totalActiveDays).toBe(3)
      expect(result.currentStreak).toBeGreaterThanOrEqual(0)
      expect(result.longestStreak).toBeGreaterThanOrEqual(0)
      expect(result.averageFrequency).toBeGreaterThanOrEqual(0)
    })

    it('空の日記配列で正しく動作する', () => {
      const dateRange = {
        startDate: '2025-08-20',
        endDate: '2025-08-22'
      }
      const result = analyzeContinuityStats([], dateRange)
      
      expect(result.currentStreak).toBe(0)
      expect(result.longestStreak).toBe(0)
      expect(result.totalActiveDays).toBe(0)
      expect(result.averageFrequency).toBe(0)
    })
  })

  describe('時間統計分析', () => {
    it('時間帯別投稿パターンが計算される', () => {
      const result = analyzeTimeStats(mockDiaries)
      
      expect(result).toBeDefined()
      expect(result.hourlyPattern).toBeDefined()
      expect(Object.keys(result.hourlyPattern)).toHaveLength(24)
      
      // 合計投稿数は日記数と一致するはず
      const totalPosts = Object.values(result.hourlyPattern).reduce((sum, count) => sum + count, 0)
      expect(totalPosts).toBe(mockDiaries.length)
    })

    it('ピーク時間が特定される', () => {
      const result = analyzeTimeStats(mockDiaries)
      
      expect(result.peakHours).toBeDefined()
      expect(Array.isArray(result.peakHours)).toBe(true)
    })

    it('空の日記配列で正しく動作する', () => {
      const result = analyzeTimeStats([])
      
      expect(Object.values(result.hourlyPattern)).toEqual(new Array(24).fill(0))
      expect(result.peakHours).toEqual([])
    })
  })

  describe('キーワード統計分析', () => {
    it('頻出キーワードが抽出される', () => {
      const result = analyzeKeywordStats(mockDiaries)
      
      expect(result).toBeDefined()
      expect(result.topKeywords).toBeDefined()
      expect(Array.isArray(result.topKeywords)).toBe(true)
      expect(result.topKeywords.length).toBeLessThanOrEqual(20)
      
      // 各キーワードにwordとcountプロパティがある
      result.topKeywords.forEach(keyword => {
        expect(keyword).toHaveProperty('word')
        expect(keyword).toHaveProperty('count')
        expect(typeof keyword.word).toBe('string')
        expect(typeof keyword.count).toBe('number')
      })
    })

    it('感情キーワードが分析される', () => {
      const result = analyzeKeywordStats(mockDiaries)
      
      expect(result.emotionalKeywords).toBeDefined()
      expect(Array.isArray(result.emotionalKeywords)).toBe(true)
      expect(result.emotionalKeywords.length).toBeLessThanOrEqual(15)
      
      // 各感情キーワードに必要なプロパティがある
      result.emotionalKeywords.forEach(emotion => {
        expect(emotion).toHaveProperty('word')
        expect(emotion).toHaveProperty('count')
        expect(emotion).toHaveProperty('sentiment')
        expect(['positive', 'negative', 'neutral']).toContain(emotion.sentiment)
      })
    })

    it('空の日記配列で正しく動作する', () => {
      const result = analyzeKeywordStats([])
      
      expect(result.topKeywords).toEqual([])
      expect(result.emotionalKeywords).toEqual([])
    })
  })
})