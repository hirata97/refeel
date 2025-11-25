import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { createRouter, createWebHistory } from 'vue-router'
import WeeklyReflectionPage from '@/views/WeeklyReflectionPage.vue'

// Chart.jsのモック
vi.mock('vue-chartjs', () => ({
  Line: {
    name: 'Line',
    template: '<div class="mock-chart">Mock Line Chart</div>',
  },
}))

vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn(),
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  Filler: {},
}))

// コンポーネントのモック
vi.mock('@/components/dashboard/StatCard.vue', () => ({
  default: {
    name: 'StatCard',
    template: '<div class="mock-stat-card">{{ title }}: {{ value }}{{ unit }}</div>',
    props: ['title', 'value', 'unit', 'icon', 'iconColor', 'description'],
  },
}))

// useWeeklyAnalysisコンポーザブルのモック
const mockWeeklyAnalysis = {
  reflectionData: {
    value: {
      weekLabel: '今週',
      startDate: '2024-01-15',
      endDate: '2024-01-21',
      moodData: [
        { date: '2024-01-15', mood: 8, label: '1/15', dayOfWeek: '月' },
        { date: '2024-01-16', mood: 6, label: '1/16', dayOfWeek: '火' },
        { date: '2024-01-17', mood: 9, label: '1/17', dayOfWeek: '水' },
      ],
      emotionTags: [
        { name: '嬉しい', count: 3, category: 'positive', percentage: 50 },
        { name: '達成感', count: 2, category: 'positive', percentage: 33 },
      ],
      progressData: [
        { goalCategory: '健康', averageProgress: 8.0, entries: 2, trend: 'up' },
        { goalCategory: '学習', averageProgress: 5.0, entries: 1, trend: 'stable' },
      ],
      comments: [
        { type: 'mood', message: '今週は全体的に良い気分で過ごせました', icon: 'mdi-emoticon-happy', color: 'success' },
        { type: 'emotion', message: '「嬉しい」が最も多く記録されました', icon: 'mdi-tag-heart', color: 'info' },
      ],
      stats: {
        totalEntries: 3,
        averageMood: 7.7,
        highestMood: 9,
        lowestMood: 6,
        mostActiveDay: '水',
        dominantEmotion: '嬉しい',
      },
    },
  },
  loading: { value: { overall: false, moodData: false, emotionTags: false, progressData: false } },
  error: { value: { overall: null, moodData: null, emotionTags: null, progressData: null } },
  selectedWeekOffset: { value: 0 },
  hasData: { value: true },
  hasError: { value: false },
  isLoading: { value: false },
  chartData: {
    value: {
      labels: ['月(1/15)', '火(1/16)', '水(1/17)'],
      datasets: [{
        label: '気分スコア',
        data: [8, 6, 9],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        fill: true,
      }],
    },
  },
  chartOptions: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, title: { display: true, text: '今週の気分推移' } },
    scales: { y: { beginAtZero: true, max: 10, title: { display: true, text: '気分スコア' }, ticks: { stepSize: 1 } } },
  },
  fetchWeeklyReflection: vi.fn(),
  changeWeek: vi.fn(),
  refresh: vi.fn(),
}

vi.mock('@/composables/useWeeklyAnalysis', () => ({
  useWeeklyAnalysis: () => mockWeeklyAnalysis,
}))

// ルーターのモック
const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/dashboard', component: { template: '<div>Dashboard</div>' } },
    { path: '/diary-register', component: { template: '<div>Diary Register</div>' } },
  ],
})

describe('WeeklyReflectionPage - 正常系', () => {
  let wrapper
  let vuetify

  beforeEach(() => {
    vuetify = createVuetify()
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const createWrapper = (props = {}) => {
    return mount(WeeklyReflectionPage, {
      global: {
        plugins: [vuetify, mockRouter],
        stubs: {
          'v-container': { template: '<div class="v-container"><slot /></div>' },
          'v-icon': { template: '<i class="v-icon">{{ $slots.default }}</i>', props: ['color', 'size'] },
          'v-btn': { template: '<button class="v-btn" @click="$emit(\'click\')"><slot /></button>', props: ['icon', 'variant', 'loading', 'disabled', 'color', 'prependIcon'], emits: ['click'] },
          'v-alert': { template: '<div class="v-alert"><slot /></div>', props: ['type', 'variant', 'dismissible'] },
          'v-card': { template: '<div class="v-card"><slot /></div>', props: ['elevation', 'rounded'] },
          'v-card-title': { template: '<div class="v-card-title"><slot /></div>' },
          'v-card-text': { template: '<div class="v-card-text"><slot /></div>' },
          'v-spacer': { template: '<div class="v-spacer"></div>' },
          'v-chip': { template: '<span class="v-chip"><slot /></span>', props: ['color', 'variant', 'size', 'small'] },
          'v-progress-circular': { template: '<div class="v-progress-circular">Loading...</div>', props: ['indeterminate', 'size', 'color'] },
          'v-progress-linear': { template: '<div class="v-progress-linear"></div>', props: ['modelValue', 'height', 'color', 'bgColor', 'rounded'] },
          'Line': { template: '<div class="chart-mock">Chart</div>' },
          'StatCard': { template: '<div class="stat-card-mock">{{ title }}: {{ value }}{{ unit }}</div>', props: ['title', 'value', 'unit', 'icon', 'iconColor', 'description'] },
        },
      },
      ...props,
    })
  }

  it('コンポーネントが正しくマウントされる', () => {
    wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.weekly-reflection-page').exists()).toBe(true)
  })

  it('ページタイトルとヘッダーが正しく表示される', () => {
    wrapper = createWrapper()
    
    expect(wrapper.find('.page-title').text()).toBe('週間振り返り')
    expect(wrapper.find('.page-description').text()).toBe('1週間のモチベーション変化パターンを分析・確認できます')
  })

  it('週選択コントロールが表示される', () => {
    wrapper = createWrapper()
    
    expect(wrapper.find('.week-info').exists()).toBe(true)
    expect(wrapper.find('.week-label').text()).toBe('今週')
    expect(wrapper.find('.week-range').text()).toContain('1/15')
    expect(wrapper.find('.week-range').text()).toContain('1/21')
  })

  it('統計カードが正しく表示される', () => {
    wrapper = createWrapper()
    
    const statCards = wrapper.findAll('.stat-card-mock')
    expect(statCards).toHaveLength(4)
    
    expect(statCards[0].text()).toContain('総投稿数: 3件')
    expect(statCards[1].text()).toContain('平均気分: 7.7/10')
    expect(statCards[2].text()).toContain('最高気分: 9/10')
    expect(statCards[3].text()).toContain('最も活発な曜日: 水曜日')
  })

  it('気分推移チャートが表示される', () => {
    wrapper = createWrapper()
    
    expect(wrapper.find('.chart-container').exists()).toBe(true)
    expect(wrapper.find('.chart-mock').exists()).toBe(true)
  })

  it('感情タグ頻度が表示される', () => {
    wrapper = createWrapper()
    
    expect(wrapper.find('.emotion-tags-card').exists()).toBe(true)
    expect(wrapper.find('.emotion-tags-list').exists()).toBe(true)
  })

  it('進捗パターンが表示される', () => {
    wrapper = createWrapper()
    
    expect(wrapper.find('.progress-pattern-card').exists()).toBe(true)
    expect(wrapper.find('.progress-list').exists()).toBe(true)
  })

  it('分析コメントが表示される', () => {
    wrapper = createWrapper()
    
    expect(wrapper.find('.comments-list').exists()).toBe(true)
    const alerts = wrapper.findAll('.v-alert')
    expect(alerts.length).toBeGreaterThan(0)
  })

  it('リフレッシュボタンが動作する', async () => {
    wrapper = createWrapper()
    
    const refreshBtn = wrapper.find('[title="データを更新"]')
    expect(refreshBtn.exists()).toBe(true)
    
    await refreshBtn.trigger('click')
    expect(mockWeeklyAnalysis.refresh).toHaveBeenCalledTimes(1)
  })

  it('戻るボタンが動作する', async () => {
    wrapper = createWrapper()
    
    const backBtn = wrapper.find('button:contains("戻る")')
    expect(backBtn.exists()).toBe(true)
    
    const pushSpy = vi.spyOn(mockRouter, 'push')
    await backBtn.trigger('click')
    expect(pushSpy).toHaveBeenCalledWith('/dashboard')
  })

  it('週変更ボタンが動作する', async () => {
    wrapper = createWrapper()
    
    const prevWeekBtn = wrapper.find('[icon="mdi-chevron-left"]')
    const nextWeekBtn = wrapper.find('[icon="mdi-chevron-right"]')
    
    expect(prevWeekBtn.exists()).toBe(true)
    expect(nextWeekBtn.exists()).toBe(true)
    
    await prevWeekBtn.trigger('click')
    expect(mockWeeklyAnalysis.changeWeek).toHaveBeenCalledWith(1)
    
    await nextWeekBtn.trigger('click')
    expect(mockWeeklyAnalysis.changeWeek).toHaveBeenCalledWith(-1)
  })

  it('コンポーネントマウント時にデータが取得される', () => {
    wrapper = createWrapper()
    expect(mockWeeklyAnalysis.fetchWeeklyReflection).toHaveBeenCalledWith(0)
  })
})

describe('WeeklyReflectionPage - 状態別表示', () => {
  let wrapper
  let vuetify

  beforeEach(() => {
    vuetify = createVuetify()
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const createWrapper = (mockOverrides = {}) => {
    // モックをオーバーライド
    Object.keys(mockOverrides).forEach(key => {
      if (mockWeeklyAnalysis[key] && typeof mockWeeklyAnalysis[key] === 'object' && 'value' in mockWeeklyAnalysis[key]) {
        mockWeeklyAnalysis[key].value = { ...mockWeeklyAnalysis[key].value, ...mockOverrides[key] }
      } else {
        mockWeeklyAnalysis[key] = mockOverrides[key]
      }
    })

    return mount(WeeklyReflectionPage, {
      global: {
        plugins: [vuetify, mockRouter],
        stubs: {
          'v-container': { template: '<div class="v-container"><slot /></div>' },
          'v-icon': { template: '<i class="v-icon"></i>', props: ['color', 'size'] },
          'v-btn': { template: '<button class="v-btn"><slot /></button>', props: ['icon', 'variant', 'loading', 'disabled', 'color', 'prependIcon'] },
          'v-alert': { template: '<div class="v-alert"><slot /></div>', props: ['type', 'variant', 'dismissible'] },
          'v-card': { template: '<div class="v-card"><slot /></div>', props: ['elevation', 'rounded'] },
          'v-card-title': { template: '<div class="v-card-title"><slot /></div>' },
          'v-card-text': { template: '<div class="v-card-text"><slot /></div>' },
          'v-progress-circular': { template: '<div class="v-progress-circular">Loading...</div>', props: ['indeterminate', 'size', 'color'] },
          'StatCard': { template: '<div class="stat-card-mock"></div>', props: ['title', 'value', 'unit', 'icon', 'iconColor', 'description'] },
        },
      },
    })
  }

  it('ローディング状態が正しく表示される', () => {
    wrapper = createWrapper({
      isLoading: { value: true },
      hasData: { value: false },
    })
    
    expect(wrapper.find('.loading-container').exists()).toBe(true)
    expect(wrapper.find('.v-progress-circular').exists()).toBe(true)
    expect(wrapper.text()).toContain('週間データを分析中...')
  })

  it('エラー状態が正しく表示される', () => {
    wrapper = createWrapper({
      hasError: { value: true },
      isLoading: { value: false },
      hasData: { value: false },
    })
    
    expect(wrapper.find('.v-alert').exists()).toBe(true)
    expect(wrapper.text()).toContain('データの読み込みに失敗しました')
  })

  it('データなし状態が正しく表示される', () => {
    wrapper = createWrapper({
      hasData: { value: false },
      isLoading: { value: false },
      hasError: { value: false },
      reflectionData: {
        value: {
          ...mockWeeklyAnalysis.reflectionData.value,
          stats: { totalEntries: 0 },
        },
      },
    })
    
    expect(wrapper.find('.no-data-container').exists()).toBe(true)
    expect(wrapper.text()).toContain('のデータがありません')
  })

  it('感情タグなし状態が正しく表示される', () => {
    wrapper = createWrapper({
      reflectionData: {
        value: {
          ...mockWeeklyAnalysis.reflectionData.value,
          emotionTags: [],
        },
      },
    })
    
    expect(wrapper.text()).toContain('感情タグが記録されていません')
  })

  it('進捗データなし状態が正しく表示される', () => {
    wrapper = createWrapper({
      reflectionData: {
        value: {
          ...mockWeeklyAnalysis.reflectionData.value,
          progressData: [],
        },
      },
    })
    
    expect(wrapper.text()).toContain('進捗データが記録されていません')
  })
})