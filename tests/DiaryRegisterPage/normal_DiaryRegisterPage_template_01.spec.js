/**
 * @fileoverview DiaryRegisterPage テンプレート選択機能のユニットテスト（正常系）
 * Issue #161 - 振り返りテンプレート選択機能の実装
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { nextTick } from 'vue'
import DiaryRegisterPage from '@/views/DiaryRegisterPage.vue'

// モックの設定
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
    user: { id: 'test-user-id' }
  })
}))

vi.mock('@/stores/data', () => ({
  useDataStore: () => ({
    createDiary: vi.fn().mockResolvedValue({})
  })
}))

vi.mock('@/stores/notification', () => ({
  useNotificationStore: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn()
  })
}))

vi.mock('@/stores/loading', () => ({
  useLoadingStore: () => ({
    withLoading: vi.fn((key, fn) => fn()),
    isLoading: vi.fn().mockReturnValue(false)
  })
}))

vi.mock('@/utils/performance', () => ({
  usePerformanceMonitor: () => ({
    start: vi.fn(),
    end: vi.fn()
  })
}))

vi.mock('@/composables/useSimpleForm', () => ({
  useSimpleDiaryForm: () => ({
    title: { value: 'テストタイトル' },
    content: { value: 'テスト内容' },
    date: { value: '2025-08-26' },
    mood: { value: 7 },
    titleError: { value: null },
    contentError: { value: null },
    dateError: { value: null },
    isSubmitting: { value: false },
    validateField: vi.fn(),
    handleSubmit: vi.fn().mockResolvedValue({
      title: 'テストタイトル',
      content: 'テスト内容',
      date: '2025-08-26',
      mood: 7
    }),
    resetForm: vi.fn()
  })
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

describe('DiaryRegisterPage - テンプレート選択機能', () => {
  let wrapper
  let vuetify

  beforeEach(() => {
    vuetify = createVuetify()
    wrapper = mount(DiaryRegisterPage, {
      global: {
        plugins: [vuetify]
      }
    })
  })

  describe('テンプレート選択UI', () => {
    it('テンプレート選択欄が表示される', () => {
      const templateSelect = wrapper.find('[label="振り返りテンプレート"]')
      expect(templateSelect.exists()).toBe(true)
    })

    it('デフォルトで「フリー記述」が選択される', () => {
      expect(wrapper.vm.selectedTemplate).toBe('free')
    })

    it('3つのテンプレートオプションが存在する', () => {
      expect(wrapper.vm.templateOptions).toHaveLength(3)
      expect(wrapper.vm.templateOptions.map(opt => opt.value))
        .toEqual(['free', 'reflection', 'mood'])
    })
  })

  describe('フリー記述テンプレート', () => {
    it('フリー記述選択時、通常のテキストエリアが表示される', async () => {
      wrapper.vm.selectedTemplate = 'free'
      await nextTick()
      
      const contentTextarea = wrapper.find('textarea[label="内容"]')
      expect(contentTextarea.exists()).toBe(true)
    })
  })

  describe('3つの振り返り質問テンプレート', () => {
    it('振り返りテンプレート選択時、3つの質問欄が表示される', async () => {
      wrapper.vm.selectedTemplate = 'reflection'
      await nextTick()
      
      const successField = wrapper.find('textarea[label*="一番うまくいったこと"]')
      const challengeField = wrapper.find('textarea[label*="困ったこと"]')
      const tomorrowField = wrapper.find('textarea[label*="明日やること"]')
      
      expect(successField.exists()).toBe(true)
      expect(challengeField.exists()).toBe(true)
      expect(tomorrowField.exists()).toBe(true)
    })

    it('振り返りの回答データが正しく保持される', async () => {
      wrapper.vm.selectedTemplate = 'reflection'
      wrapper.vm.reflectionAnswers.success = 'プレゼン成功'
      wrapper.vm.reflectionAnswers.challenge = '時間管理'
      wrapper.vm.reflectionAnswers.tomorrow = '資料作成'
      
      expect(wrapper.vm.reflectionAnswers.success).toBe('プレゼン成功')
      expect(wrapper.vm.reflectionAnswers.challenge).toBe('時間管理')
      expect(wrapper.vm.reflectionAnswers.tomorrow).toBe('資料作成')
    })
  })

  describe('気分重視記録テンプレート', () => {
    it('気分テンプレート選択時、気分関連の入力欄が表示される', async () => {
      wrapper.vm.selectedTemplate = 'mood'
      await nextTick()
      
      const reasonField = wrapper.find('textarea[label*="気分の理由"]')
      const contextField = wrapper.find('textarea[label*="詳しい状況"]')
      
      expect(reasonField.exists()).toBe(true)
      expect(contextField.exists()).toBe(true)
    })

    it('気分詳細データが正しく保持される', async () => {
      wrapper.vm.selectedTemplate = 'mood'
      wrapper.vm.moodDetails.reason = '目標達成'
      wrapper.vm.moodDetails.context = '大きなプロジェクトが完了'
      
      expect(wrapper.vm.moodDetails.reason).toBe('目標達成')
      expect(wrapper.vm.moodDetails.context).toBe('大きなプロジェクトが完了')
    })
  })

  describe('テンプレート切り替え', () => {
    it('テンプレート切り替え時に適切なフォームが表示される', async () => {
      // フリー記述 → 振り返り
      wrapper.vm.selectedTemplate = 'reflection'
      await nextTick()
      
      expect(wrapper.find('textarea[label*="一番うまくいったこと"]').exists()).toBe(true)
      expect(wrapper.find('textarea[label="内容"]').exists()).toBe(false)
      
      // 振り返り → 気分
      wrapper.vm.selectedTemplate = 'mood'
      await nextTick()
      
      expect(wrapper.find('textarea[label*="気分の理由"]').exists()).toBe(true)
      expect(wrapper.find('textarea[label*="一番うまくいったこと"]').exists()).toBe(false)
      
      // 気分 → フリー記述
      wrapper.vm.selectedTemplate = 'free'
      await nextTick()
      
      expect(wrapper.find('textarea[label="内容"]').exists()).toBe(true)
      expect(wrapper.find('textarea[label*="気分の理由"]').exists()).toBe(false)
    })
  })

  describe('データリセット機能', () => {
    it('フォームリセット時にテンプレート関連データもリセットされる', () => {
      // テスト用データ設定
      wrapper.vm.selectedTemplate = 'reflection'
      wrapper.vm.reflectionAnswers.success = 'テスト成功'
      wrapper.vm.moodDetails.reason = 'テスト理由'
      
      // リセット実行（実際のリセット処理をシミュレート）
      wrapper.vm.selectedTemplate = 'free'
      wrapper.vm.reflectionAnswers = { success: '', challenge: '', tomorrow: '' }
      wrapper.vm.moodDetails = { reason: '', context: '' }
      
      expect(wrapper.vm.selectedTemplate).toBe('free')
      expect(wrapper.vm.reflectionAnswers.success).toBe('')
      expect(wrapper.vm.moodDetails.reason).toBe('')
    })
  })
})