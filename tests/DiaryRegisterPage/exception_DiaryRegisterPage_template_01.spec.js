/**
 * @fileoverview DiaryRegisterPage テンプレート選択機能のユニットテスト（異常系）
 * Issue #161 - 振り返りテンプレート選択機能の実装
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { nextTick } from 'vue'
import DiaryRegisterPage from '@/views/DiaryRegisterPage.vue'

// モックの設定（異常系用）
const mockDataStore = {
  createDiary: vi.fn()
}

const mockNotificationStore = {
  showSuccess: vi.fn(),
  showError: vi.fn()
}

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
    user: { id: 'test-user-id' }
  })
}))

vi.mock('@/stores/data', () => ({
  useDataStore: () => mockDataStore
}))

vi.mock('@/stores/notification', () => ({
  useNotificationStore: () => mockNotificationStore
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

const mockForm = {
  title: { value: 'テストタイトル' },
  content: { value: 'テスト内容' },
  date: { value: '2025-08-26' },
  mood: { value: 7 },
  titleError: { value: null },
  contentError: { value: null },
  dateError: { value: null },
  isSubmitting: { value: false },
  validateField: vi.fn(),
  handleSubmit: vi.fn(),
  resetForm: vi.fn()
}

vi.mock('@/composables/useSimpleForm', () => ({
  useSimpleDiaryForm: () => mockForm
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

describe('DiaryRegisterPage - テンプレート選択機能（異常系）', () => {
  let wrapper
  let vuetify

  beforeEach(() => {
    vuetify = createVuetify()
    wrapper = mount(DiaryRegisterPage, {
      global: {
        plugins: [vuetify]
      }
    })
    vi.clearAllMocks()
  })

  describe('無効なテンプレート値の処理', () => {
    it('無効なテンプレート値が設定された場合もエラーにならない', async () => {
      // TypeScriptでは型チェックが効くが、ランタイムでの挙動をテスト
      wrapper.vm.selectedTemplate = 'invalid_template'
      await nextTick()
      
      // 無効な値でもコンポーネントがクラッシュしないことを確認
      expect(wrapper.vm.selectedTemplate).toBe('invalid_template')
      
      // デフォルトのフリー記述フォームが表示されることを確認
      const freeTextarea = wrapper.find('textarea[label="内容"]')
      expect(freeTextarea.exists()).toBe(true)
    })
  })

  describe('テンプレートデータの初期化失敗', () => {
    it('reflectionAnswersが未定義でもエラーにならない', async () => {
      wrapper.vm.reflectionAnswers = undefined
      wrapper.vm.selectedTemplate = 'reflection'
      await nextTick()
      
      // エラーが発生せずに振り返りフォームが表示される
      const reflectionForm = wrapper.find('textarea[label*="一番うまくいったこと"]')
      expect(reflectionForm.exists()).toBe(true)
    })

    it('moodDetailsが未定義でもエラーにならない', async () => {
      wrapper.vm.moodDetails = undefined
      wrapper.vm.selectedTemplate = 'mood'
      await nextTick()
      
      // エラーが発生せずに気分フォームが表示される
      const moodForm = wrapper.find('textarea[label*="気分の理由"]')
      expect(moodForm.exists()).toBe(true)
    })
  })

  describe('日記作成エラー処理', () => {
    it('振り返りテンプレートでの作成エラー時にエラーメッセージが表示される', async () => {
      // 振り返りテンプレートの設定
      wrapper.vm.selectedTemplate = 'reflection'
      wrapper.vm.reflectionAnswers = {
        success: 'テスト成功',
        challenge: 'テスト課題',
        tomorrow: 'テスト予定'
      }
      
      // フォーム送信の成功をモック
      mockForm.handleSubmit.mockResolvedValueOnce({
        title: 'テストタイトル',
        content: 'テスト内容',
        date: '2025-08-26',
        mood: 7
      })
      
      // データベース作成の失敗をモック
      const testError = new Error('データベースエラー')
      mockDataStore.createDiary.mockRejectedValueOnce(testError)
      
      // 日記作成処理を実行
      await expect(wrapper.vm.addDiary()).rejects.toThrow('データベースエラー')
      
      // エラーメッセージが表示されることを確認
      expect(mockNotificationStore.showError).toHaveBeenCalledWith(
        '日記の作成に失敗しました',
        'データベースエラー'
      )
    })

    it('気分テンプレートでの作成エラー時にエラーメッセージが表示される', async () => {
      // 気分テンプレートの設定
      wrapper.vm.selectedTemplate = 'mood'
      wrapper.vm.moodDetails = {
        reason: 'テスト理由',
        context: 'テスト状況'
      }
      
      // フォーム送信の成功をモック
      mockForm.handleSubmit.mockResolvedValueOnce({
        title: 'テストタイトル',
        content: 'テスト内容',
        date: '2025-08-26',
        mood: 7
      })
      
      // データベース作成の失敗をモック
      const testError = new Error('ネットワークエラー')
      mockDataStore.createDiary.mockRejectedValueOnce(testError)
      
      // 日記作成処理を実行
      await expect(wrapper.vm.addDiary()).rejects.toThrow('ネットワークエラー')
      
      // エラーメッセージが表示されることを確認
      expect(mockNotificationStore.showError).toHaveBeenCalledWith(
        '日記の作成に失敗しました',
        'ネットワークエラー'
      )
    })
  })

  describe('フォームバリデーションエラー', () => {
    it('バリデーション失敗時にtemplate_typeが含まれていても処理が停止する', async () => {
      wrapper.vm.selectedTemplate = 'reflection'
      
      // バリデーション失敗をモック
      mockForm.handleSubmit.mockResolvedValueOnce(null) // バリデーション失敗
      
      await wrapper.vm.addDiary()
      
      // createDiaryが呼ばれないことを確認
      expect(mockDataStore.createDiary).not.toHaveBeenCalled()
    })
  })

  describe('空データでの処理', () => {
    it('振り返りの回答が空でもマークダウン形式で保存される', async () => {
      wrapper.vm.selectedTemplate = 'reflection'
      wrapper.vm.reflectionAnswers = {
        success: '',
        challenge: '',
        tomorrow: ''
      }
      
      mockForm.handleSubmit.mockResolvedValueOnce({
        title: 'テストタイトル',
        content: '',
        date: '2025-08-26',
        mood: 7
      })
      
      mockDataStore.createDiary.mockResolvedValueOnce({})
      
      await wrapper.vm.addDiary()
      
      expect(mockDataStore.createDiary).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('## 今日の振り返り'),
          template_type: 'reflection'
        })
      )
    })

    it('気分詳細が空でもマークダウン形式で保存される', async () => {
      wrapper.vm.selectedTemplate = 'mood'
      wrapper.vm.moodDetails = {
        reason: '',
        context: ''
      }
      
      mockForm.handleSubmit.mockResolvedValueOnce({
        title: 'テストタイトル',
        content: '',
        date: '2025-08-26',
        mood: 7
      })
      
      mockDataStore.createDiary.mockResolvedValueOnce({})
      
      await wrapper.vm.addDiary()
      
      expect(mockDataStore.createDiary).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('## 今日の気分記録'),
          template_type: 'mood'
        })
      )
    })
  })
})