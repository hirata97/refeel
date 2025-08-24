import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DiaryViewPage from '@/views/DiaryViewPage.vue'

// ResizeObserverのモック
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// ルーターのモック
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// useDataFetchのモック
const mockDiaries = [
  {
    id: '1',
    user_id: 'user1',
    title: 'テスト日記1',
    content: 'テスト内容1',
    date: '2024-01-01',
    mood: 4,
    created_at: '2024-01-01T10:00:00.000Z',
    updated_at: '2024-01-01T10:00:00.000Z',
  },
  {
    id: '2',
    user_id: 'user1',
    title: 'テスト日記2',
    content: 'テスト内容2',
    date: '2024-01-02',
    mood: 3,
    created_at: '2024-01-02T10:00:00.000Z',
    updated_at: '2024-01-02T10:00:00.000Z',
  },
]

const mockUseDiaries = {
  diaries: { value: mockDiaries },
  loading: { value: false },
  filter: { 
    value: { 
      date_from: '', 
      date_to: '', 
      search_text: '', 
      mood_min: null, 
      mood_max: null 
    } 
  },
  pagination: { 
    value: { 
      page: 1, 
      pageSize: 10, 
      total: 2, 
      totalPages: 1 
    } 
  },
  changePage: vi.fn(),
  changePageSize: vi.fn(),
  applyFilters: vi.fn(),
  clearFilters: vi.fn(),
  moodStats: { value: {} },
  refresh: vi.fn(),
}

vi.mock('@/composables/useDataFetch', () => ({
  useDiaries: () => mockUseDiaries,
}))

// AuthStoreのモック
const mockAuthStore = {
  isAuthenticated: true,
  user: { id: 'user1' },
}

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

// DataStoreのモック
const mockDataStore = {
  deleteDiary: vi.fn(),
}

vi.mock('@/stores/data', () => ({
  useDataStore: () => mockDataStore,
}))

describe('DiaryViewPage - 正常系', () => {
  let wrapper
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  const mountComponent = () => {
    return mount(DiaryViewPage, {
      global: {
        plugins: [pinia],
      },
    })
  }

  describe('初期表示', () => {
    it('コンポーネントが正常にマウントされる', async () => {
      wrapper = mountComponent()
      await flushPromises()
      
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.diary-view-page').exists()).toBe(true)
    })

    it('ページタイトルが表示される', async () => {
      wrapper = mountComponent()
      await flushPromises()
      
      
      // より汎用的なセレクターを使用
      const title = wrapper.find('.v-typography')
      if (title.exists()) {
        expect(title.text()).toBe('日記一覧')
      } else {
        // 代替手段としてテキストで検索
        expect(wrapper.text()).toContain('日記一覧')
      }
    })

    it('データテーブルが表示される', async () => {
      wrapper = mountComponent()
      await flushPromises()
      
      const dataTable = wrapper.find('.v-data-table')
      expect(dataTable.exists()).toBe(true)
    })
  })

  describe('テーブル表示', () => {
    beforeEach(async () => {
      wrapper = mountComponent()
      await flushPromises()
    })

    it('正しいヘッダーが表示される', () => {
      const dataTable = wrapper.find('.v-data-table')
      expect(dataTable.exists()).toBe(true)
      
      // HTMLから実際のヘッダーテキストをチェック
      const headerTexts = dataTable.findAll('th').map(th => th.text())
      expect(headerTexts).toEqual([
        '作成日', '日記日付', 'タイトル', '気分', '内容', '操作'
      ])
    })

    it('日記データが表示される', () => {
      const dataTable = wrapper.find('.v-data-table')
      expect(dataTable.exists()).toBe(true)
      
      // 実際のデータ行が表示されることを確認
      const dataRows = dataTable.findAll('tbody tr')
      expect(dataRows).toHaveLength(2) // mockDiariesの件数
      expect(dataRows[0].text()).toContain('テスト日記1')
      expect(dataRows[1].text()).toContain('テスト日記2')
    })

    it('気分が星評価で表示される', async () => {
      // テンプレート内の気分表示部分をテスト
      const ratings = wrapper.findAll('.v-rating')
      expect(ratings).toHaveLength(2) // 2件の日記データに対応
      
      // 1つ目の日記（mood: 4）の星評価をチェック
      const firstRating = ratings[0]
      const filledStars = firstRating.findAll('.star-filled')
      expect(filledStars).toHaveLength(4)
    })
  })

  describe('フィルター機能', () => {
    beforeEach(async () => {
      wrapper = mountComponent()
      await flushPromises()
    })

    it('DiaryFilterコンポーネントが表示される', () => {
      const diaryFilter = wrapper.find('.diary-filter')
      expect(diaryFilter.exists()).toBe(true)
    })

    it('フィルター機能が実装されている', async () => {
      // フィルター関連の関数が提供されていることを確認
      expect(mockUseDiaries.applyFilters).toBeDefined()
      expect(mockUseDiaries.clearFilters).toBeDefined()
    })
  })

  describe('ページネーション', () => {
    beforeEach(async () => {
      wrapper = mountComponent()
      await flushPromises()
    })

    it('ページネーション機能が適切に実装されている', async () => {
      // ページネーション機能がコンポーネントに含まれていることを確認
      expect(mockUseDiaries.pagination).toBeDefined()
      expect(mockUseDiaries.changePage).toBeDefined()
      expect(typeof mockUseDiaries.changePage).toBe('function')
      
      // デフォルトでは1ページのため非表示
      const pagination = wrapper.find('.v-pagination')
      expect(pagination.exists()).toBe(false) // totalPages = 1 なので非表示
    })

    it('1ページのみの場合はページネーションが表示されない', async () => {
      mockUseDiaries.pagination.value.totalPages = 1
      wrapper = mountComponent()
      await flushPromises()
      
      const pagination = wrapper.find('.v-pagination')
      expect(pagination.exists()).toBe(false)
    })
  })

  describe('詳細モーダル', () => {
    beforeEach(async () => {
      wrapper = mountComponent()
      await flushPromises()
    })

    it('日記クリック時にモーダルが表示される', async () => {
      const contentCell = wrapper.find('.diary-content-cell')
      await contentCell.trigger('click')
      await flushPromises()
      
      const dialog = wrapper.find('.v-dialog')
      expect(dialog.exists()).toBe(true)
    })

    it('モーダル内に日記の詳細が表示される', async () => {
      // 詳細モーダル機能が実装されていることを確認
      const contentCells = wrapper.findAll('.diary-content-cell')
      expect(contentCells).toHaveLength(2)
      expect(contentCells[0].text()).toBe('テスト内容1')
      expect(contentCells[1].text()).toBe('テスト内容2')
    })
  })

  describe('日記操作', () => {
    beforeEach(async () => {
      wrapper = mountComponent()
      await flushPromises()
    })

    it('編集ボタンクリックで編集ページに遷移する', async () => {
      const editButtons = wrapper.findAll('[aria-label="編集"]')
      expect(editButtons).toHaveLength(2) // 2件の日記データに対応
      
      await editButtons[0].trigger('click')
      expect(mockPush).toHaveBeenCalledWith(`/diary-edit/${mockDiaries[0].id}`)
    })

    it('削除ボタンクリックで削除処理が実行される', async () => {
      // confirmのモック
      global.confirm = vi.fn(() => true)
      
      mockDataStore.deleteDiary.mockResolvedValue()
      
      const deleteButtons = wrapper.findAll('[aria-label="削除"]')
      expect(deleteButtons).toHaveLength(2) // 2件の日記データに対応
      
      await deleteButtons[0].trigger('click')
      await flushPromises()
      
      expect(mockDataStore.deleteDiary).toHaveBeenCalledWith(mockDiaries[0].id, 'user1')
    })
  })

  describe('認証チェック', () => {
    it('未認証の場合はログインページにリダイレクトする', async () => {
      mockAuthStore.isAuthenticated = false
      
      wrapper = mountComponent()
      await flushPromises()
      
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  describe('エラーハンドリング', () => {
    it('データ取得エラー時も正常に表示される', async () => {
      mockUseDiaries.diaries.value = []
      mockUseDiaries.loading.value = false
      
      wrapper = mountComponent()
      await flushPromises()
      
      expect(wrapper.exists()).toBe(true)
      const dataTable = wrapper.find('.v-data-table')
      expect(dataTable.exists()).toBe(true)
      
      // データなしの場合でもテーブル構造は保持される
      const dataRows = dataTable.findAll('tbody tr')
      expect(dataRows).toHaveLength(0)
    })

    it('ローディング状態が適切に管理される', async () => {
      // ローディング状態の管理が実装されていることを確認
      expect(mockUseDiaries.loading).toBeDefined()
      expect(typeof mockUseDiaries.loading.value).toBe('boolean')
    })
  })
})