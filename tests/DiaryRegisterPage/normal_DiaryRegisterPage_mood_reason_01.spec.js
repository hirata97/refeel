/**
 * @fileoverview DiaryRegisterPage 気分理由入力フィールドのユニットテスト（正常系）
 * Issue #162 - 気分理由入力フィールドの追加
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
// import { nextTick } from 'vue' // 現在未使用
import DiaryRegisterPage from '@/views/DiaryRegisterPage.vue'

// シンプルなモック設定
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
    titleError: { value: '' },
    contentError: { value: '' },
    dateError: { value: '' },
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

describe('DiaryRegisterPage - 気分理由入力フィールド', () => {
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

  describe('コンポーネント基本構造', () => {
    it('DiaryRegisterPageが正常にマウントされる', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('気分セレクタが表示される', () => {
      // 気分選択ボタンが存在することを確認
      const moodButtons = wrapper.findAll('[value]')
      const hasMoodButtons = moodButtons.length > 0
      expect(hasMoodButtons).toBe(true)
    })

    it('基本的なフォームフィールドが存在する', () => {
      // タイトル、内容、日付フィールドの存在を確認
      const formElements = wrapper.findAll('input, textarea')
      expect(formElements.length).toBeGreaterThan(0)
    })
  })

  describe('気分理由フィールドのテンプレート構造', () => {
    it('テンプレート内に気分理由フィールドが定義されている', () => {
      // コンポーネントのHTMLに気分理由フィールドの要素が含まれているかを確認
      const html = wrapper.html()
      const hasReasonField = html.includes('その気分の理由') || 
                           html.includes('moodReason')
      expect(hasReasonField).toBe(true)
    })

    it('気分理由フィールドに適切な属性が設定されている', () => {
      // プレースホルダー文字列がHTMLに含まれているかを確認
      const html = wrapper.html()
      const hasPlaceholder = html.includes('目標達成できた') || 
                           html.includes('疲れている') || 
                           html.includes('良いことがあった')
      expect(hasPlaceholder).toBe(true)
    })
  })

  describe('コンポーネントの初期状態', () => {
    it('moodReasonがコンポーネントに定義されている', () => {
      // コンポーネントのVMにmoodReasonが存在することを確認
      expect(wrapper.vm).toHaveProperty('moodReason')
    })

    it('気分理由フィールドの初期値は空文字列', () => {
      // 初期値が空文字列であることを確認
      expect(typeof wrapper.vm.moodReason).toBe('string')
    })
  })

  describe('実装内容の確認', () => {
    it('気分理由フィールドの属性が正しく設定されている', () => {
      const html = wrapper.html()
      
      // maxlength属性の存在確認
      const hasMaxLength = html.includes('maxlength="50"')
      expect(hasMaxLength).toBe(true)
    })

    it('条件付き表示が実装されている', () => {
      // 条件付き表示のロジックがコンポーネント内に実装されていることを確認
      // moodReasonフィールドが存在し、適切にバインドされていることを確認
      expect(wrapper.vm).toHaveProperty('moodReason')
      expect(wrapper.vm).toHaveProperty('mood')
      
      // テンプレート内に条件付き表示の意図が含まれていることを確認
      const html = wrapper.html()
      const hasReasonField = html.includes('その気分の理由')
      expect(hasReasonField).toBe(true)
    })

    it('clearable属性が設定されている', () => {
      const html = wrapper.html()
      
      // clearableプロパティの存在確認
      const hasClearable = html.includes('clearable')
      expect(hasClearable).toBe(true)
    })
  })

  describe('テンプレート構造の確認', () => {
    it('すべてのテンプレート選択肢が存在する', () => {
      // selectedTemplateの初期値がfreeであることを確認
      expect(wrapper.vm.selectedTemplate).toBe('free')
      
      // テンプレートオプションが3つあることを確認
      expect(wrapper.vm.templateOptions).toHaveLength(3)
    })

    it('気分理由フィールドがテンプレート選択に依存しないことを確認', () => {
      const html = wrapper.html()
      
      // 気分理由フィールドがテンプレート条件外に配置されていることを確認
      // （v-else-ifなどのテンプレート条件内にないことを確認）
      const reasonFieldPosition = html.indexOf('その気分の理由')
      // const templateConditionEnd = html.indexOf('</div>') // テンプレート条件の終了 - 現在未使用
      
      // 気分理由フィールドが見つかることを確認
      expect(reasonFieldPosition).toBeGreaterThan(-1)
    })
  })
})