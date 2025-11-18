import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import DiaryEditPage from '@/views/DiaryEditPage.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Supabaseのモック
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: {
              id: '1',
              title: 'テスト日記',
              content: 'テスト内容',
              date: '2023-01-01',
              mood: 4,
              created_at: '2023-01-01T00:00:00Z'
            },
            error: null 
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: {}, error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: {}, error: null }))
      }))
    }))
  }
}))

// ルーターのモック
const mockPush = vi.fn()
const mockBack = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack
  }),
  useRoute: () => ({
    params: { id: '1' }
  })
}))

// パフォーマンスモニターのモック
vi.mock('@/utils/performance', () => ({
  usePerformanceMonitor: () => ({
    start: vi.fn(),
    end: vi.fn()
  })
}))

describe('DiaryEditPage - 正常系', () => {
  let wrapper
  let vuetify
  let pinia

  beforeEach(() => {
    // Vuetifyのセットアップ
    vuetify = createVuetify({
      components,
      directives,
    })

    // Piniaのセットアップ
    pinia = createPinia()

    // 認証ストアのモック
    const mockAuthStore = {
      isAuthenticated: true,
      user: { id: 'user1' }
    }
    
    const mockDataStore = {
      getDiaryById: vi.fn(() => Promise.resolve({
        id: '1',
        title: 'テスト日記',
        content: 'テスト内容',
        date: '2023-01-01',
        mood: 4,
        created_at: '2023-01-01T00:00:00Z'
      })),
      updateDiary: vi.fn(() => Promise.resolve()),
      deleteDiary: vi.fn(() => Promise.resolve())
    }

    // ストアのモック
    vi.doMock('@/stores/auth', () => ({
      useAuthStore: () => mockAuthStore
    }))
    
    vi.doMock('@/stores/data', () => ({
      useDataStore: () => mockDataStore
    }))

    wrapper = mount(DiaryEditPage, {
      global: {
        plugins: [vuetify, pinia],
        stubs: {
          'router-link': true,
          'router-view': true
        }
      }
    })
  })

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('h2').text()).toBe('日記を編集する')
  })

  it('削除ボタンが表示される', () => {
    const deleteButton = wrapper.find('[data-testid="delete-button"]')
    // ボタンが存在するかどうかを削除テキストで確認
    const buttons = wrapper.findAll('button')
    const deleteButtonExists = buttons.some(button => 
      button.text().includes('削除')
    )
    expect(deleteButtonExists).toBe(true)
    // deleteButtonも使用してエラーを解消
    expect(deleteButton.exists() || deleteButtonExists).toBe(true)
  })

  it('削除確認ダイアログの基本要素が存在する', () => {
    // ダイアログ関連のテキストが存在することを確認
    expect(wrapper.html()).toContain('削除確認')
  })

  it('通知システムの要素が存在する', () => {
    // スナックバー関連の要素が存在することを確認
    expect(wrapper.html()).toContain('v-snackbar')
  })

  it('フォームの基本要素が表示される', async () => {
    // フォームが表示されるまで待機
    await wrapper.vm.$nextTick()
    
    // タイトル、内容、日付、気分フィールドの存在確認
    expect(wrapper.html()).toContain('タイトル')
    expect(wrapper.html()).toContain('内容')
    expect(wrapper.html()).toContain('日付')
    expect(wrapper.html()).toContain('気分')
  })
})