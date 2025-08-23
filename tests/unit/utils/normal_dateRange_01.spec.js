/**
 * 日付範囲ユーティリティ - 正常系テスト
 * 
 * Issue #40: レポート機能の期間選択機能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getToday,
  getDaysAgo,
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
  getMonthsAgo,
  dateRangePresets,
  getPresetRange,
  validateDateRange,
  getDaysBetween,
  formatDateRange
} from '@/utils/dateRange'

describe('日付範囲ユーティリティ - 正常系', () => {
  beforeEach(() => {
    // 2025年8月23日（金曜日）に固定
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-08-23T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('基本的な日付取得', () => {
    it('今日の日付を正しく取得する', () => {
      const today = getToday()
      expect(today).toBe('2025-08-23')
    })

    it('N日前の日付を正しく取得する', () => {
      expect(getDaysAgo(1)).toBe('2025-08-22')
      expect(getDaysAgo(7)).toBe('2025-08-16')
      expect(getDaysAgo(30)).toBe('2025-07-24')
    })

    it('N ヶ月前の日付を正しく取得する', () => {
      expect(getMonthsAgo(1)).toBe('2025-07-23')
      expect(getMonthsAgo(3)).toBe('2025-05-23')
      expect(getMonthsAgo(12)).toBe('2024-08-23')
    })
  })

  describe('週の開始・終了日取得', () => {
    it('週の開始日（月曜日）を正しく取得する', () => {
      const weekStart = getWeekStart()
      expect(weekStart).toBe('2025-08-18') // 2025-08-23（金）の週の月曜日
    })

    it('週の終了日（日曜日）を正しく取得する', () => {
      const weekEnd = getWeekEnd()
      expect(weekEnd).toBe('2025-08-24') // 2025-08-23（金）の週の日曜日
    })

    it('指定日の週の開始日を正しく取得する', () => {
      const specificDate = new Date('2025-08-01') // 木曜日
      const weekStart = getWeekStart(specificDate)
      expect(weekStart).toBe('2025-07-28') // その週の月曜日
    })

    it('指定日の週の終了日を正しく取得する', () => {
      const specificDate = new Date('2025-08-01') // 木曜日
      const weekEnd = getWeekEnd(specificDate)
      expect(weekEnd).toBe('2025-08-03') // その週の日曜日
    })
  })

  describe('月の開始・終了日取得', () => {
    it('月の開始日を正しく取得する', () => {
      const monthStart = getMonthStart()
      expect(monthStart).toBe('2025-08-01')
    })

    it('月の終了日を正しく取得する', () => {
      const monthEnd = getMonthEnd()
      expect(monthEnd).toBe('2025-08-31')
    })

    it('指定日の月の開始日を正しく取得する', () => {
      const specificDate = new Date('2025-02-15')
      const monthStart = getMonthStart(specificDate)
      expect(monthStart).toBe('2025-02-01')
    })

    it('指定日の月の終了日を正しく取得する', () => {
      const specificDate = new Date('2025-02-15')
      const monthEnd = getMonthEnd(specificDate)
      expect(monthEnd).toBe('2025-02-28')
    })
  })

  describe('プリセット期間', () => {
    it('dateRangePresetsが正しく定義されている', () => {
      expect(dateRangePresets).toBeDefined()
      expect(Array.isArray(dateRangePresets)).toBe(true)
      expect(dateRangePresets.length).toBeGreaterThan(0)
      
      dateRangePresets.forEach(preset => {
        expect(preset).toHaveProperty('id')
        expect(preset).toHaveProperty('label')
        expect(preset).toHaveProperty('getRange')
        expect(typeof preset.getRange).toBe('function')
      })
    })

    it('各プリセットが正しい期間を返す', () => {
      const todayPreset = getPresetRange('today')
      expect(todayPreset).toEqual({
        startDate: '2025-08-23',
        endDate: '2025-08-23'
      })

      const yesterdayPreset = getPresetRange('yesterday')
      expect(yesterdayPreset).toEqual({
        startDate: '2025-08-22',
        endDate: '2025-08-22'
      })

      const last7DaysPreset = getPresetRange('last7Days')
      expect(last7DaysPreset).toEqual({
        startDate: '2025-08-17',
        endDate: '2025-08-23'
      })

      const last30DaysPreset = getPresetRange('last30Days')
      expect(last30DaysPreset).toEqual({
        startDate: '2025-07-25',
        endDate: '2025-08-23'
      })
    })

    it('存在しないプリセットIDに対してnullを返す', () => {
      const invalidPreset = getPresetRange('nonexistent')
      expect(invalidPreset).toBeNull()
    })
  })

  describe('日付範囲の検証', () => {
    it('有効な日付範囲を正しく検証する', () => {
      const validRange = {
        startDate: '2025-08-01',
        endDate: '2025-08-31'
      }
      expect(validateDateRange(validRange)).toBe(true)
    })

    it('同じ開始日と終了日を有効として認識する', () => {
      const sameRange = {
        startDate: '2025-08-23',
        endDate: '2025-08-23'
      }
      expect(validateDateRange(sameRange)).toBe(true)
    })

    it('無効な日付形式を正しく検出する', () => {
      const invalidRange = {
        startDate: 'invalid-date',
        endDate: '2025-08-31'
      }
      expect(validateDateRange(invalidRange)).toBe(false)
    })

    it('開始日が終了日より後の場合を無効として認識する', () => {
      const invalidRange = {
        startDate: '2025-08-31',
        endDate: '2025-08-01'
      }
      expect(validateDateRange(invalidRange)).toBe(false)
    })
  })

  describe('期間内の日数計算', () => {
    it('期間内の日数を正しく計算する', () => {
      const range1 = {
        startDate: '2025-08-01',
        endDate: '2025-08-01'
      }
      expect(getDaysBetween(range1)).toBe(1)

      const range7 = {
        startDate: '2025-08-01',
        endDate: '2025-08-07'
      }
      expect(getDaysBetween(range7)).toBe(7)

      const range30 = {
        startDate: '2025-08-01',
        endDate: '2025-08-30'
      }
      expect(getDaysBetween(range30)).toBe(30)
    })

    it('無効な日付範囲で0を返す', () => {
      const invalidRange = {
        startDate: 'invalid-date',
        endDate: '2025-08-31'
      }
      expect(getDaysBetween(invalidRange)).toBe(0)
    })
  })

  describe('日付範囲のフォーマット', () => {
    it('異なる開始日と終了日を正しくフォーマットする', () => {
      const range = {
        startDate: '2025-08-01',
        endDate: '2025-08-31'
      }
      const formatted = formatDateRange(range)
      expect(formatted).toContain('2025')
      expect(formatted).toContain('8')
      expect(formatted).toContain('1')
      expect(formatted).toContain('31')
      expect(formatted).toContain('～')
    })

    it('同じ開始日と終了日を正しくフォーマットする', () => {
      const sameRange = {
        startDate: '2025-08-23',
        endDate: '2025-08-23'
      }
      const formatted = formatDateRange(sameRange)
      expect(formatted).toContain('2025')
      expect(formatted).toContain('8')
      expect(formatted).toContain('23')
      expect(formatted).not.toContain('～')
    })

    it('日本語ロケールで正しく表示される', () => {
      const range = {
        startDate: '2025-08-01',
        endDate: '2025-08-31'
      }
      const formatted = formatDateRange(range)
      expect(formatted).toMatch(/\d{4}年/)
      expect(formatted).toMatch(/\d+月/)
      expect(formatted).toMatch(/\d+日/)
    })
  })
})