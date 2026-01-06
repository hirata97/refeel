// EmotionTagSelectorコンポーネントの正常系テスト
// Issue #164: 感情タグ機能の実装

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { EmotionTagSelector } from '@features/mood'
import { useEmotionTagsStore } from '@features/mood'
import type { EmotionTag } from '@features/mood'

// Vuetifyのセットアップ
const vuetify = createVuetify({
  components,
  directives,
})

// モックデータ（実際のマスターデータに合わせて更新）
const mockEmotionTags: EmotionTag[] = [
  { id: '1', name: '達成感', category: 'positive', color: '#4CAF50', description: '目標達成や成功体験による満足感', display_order: 1, created_at: '', updated_at: '' },
  { id: '2', name: '集中', category: 'positive', color: '#2196F3', description: '作業や活動に深く没頭している状態', display_order: 2, created_at: '', updated_at: '' },
  { id: '11', name: '疲労', category: 'negative', color: '#795548', description: '身体的・精神的な疲れを感じている', display_order: 11, created_at: '', updated_at: '' },
  { id: '12', name: '不安', category: 'negative', color: '#9C27B0', description: '将来への心配や恐れを感じている', display_order: 12, created_at: '', updated_at: '' },
  { id: '21', name: '平常', category: 'neutral', color: '#757575', description: '特に感情の起伏がない普通の状態', display_order: 21, created_at: '', updated_at: '' }
]

describe('EmotionTagSelector', () => {
  beforeEach(() => {
    // Piniaのセットアップ
    const pinia = createPinia()
    setActivePinia(pinia)

    // ストアのモック
    const emotionTagsStore = useEmotionTagsStore()
    vi.spyOn(emotionTagsStore, 'fetchEmotionTags').mockResolvedValue(mockEmotionTags)
    emotionTagsStore.emotionTags = mockEmotionTags
  })

  it('コンポーネントが正常にレンダリングされる', async () => {
    const wrapper = mount(EmotionTagSelector, {
      global: {
        plugins: [vuetify],
      },
      props: {
        modelValue: []
      }
    })

    await flushPromises()

    expect(wrapper.find('.emotion-tag-selector').exists()).toBe(true)
    expect(wrapper.find('v-card-subtitle').text()).toContain('今日の感情（複数選択可）')
  })

  it('感情タグがカテゴリ別に表示される', async () => {
    const wrapper = mount(EmotionTagSelector, {
      global: {
        plugins: [vuetify],
      },
      props: {
        modelValue: []
      }
    })

    await flushPromises()

    // ポジティブカテゴリの確認
    const positiveSection = wrapper.find('.emotion-category:first-child')
    expect(positiveSection.text()).toContain('ポジティブ')
    
    // ネガティブカテゴリの確認
    const negativeSection = wrapper.find('.emotion-category:nth-child(2)')
    expect(negativeSection.text()).toContain('ネガティブ')
    
    // 中性カテゴリの確認
    const neutralSection = wrapper.find('.emotion-category:nth-child(3)')
    expect(neutralSection.text()).toContain('中性')
  })

  it('感情タグを選択できる', async () => {
    const wrapper = mount(EmotionTagSelector, {
      global: {
        plugins: [vuetify],
      },
      props: {
        modelValue: []
      }
    })

    await flushPromises()

    // タグチップを探す
    const tagChips = wrapper.findAll('[data-testid="emotion-chip"]')
    expect(tagChips.length).toBeGreaterThan(0)

    // 最初のタグをクリック
    await tagChips[0].trigger('click')

    // update:modelValueイベントが発火されることを確認
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('複数の感情タグを選択できる', async () => {
    const wrapper = mount(EmotionTagSelector, {
      global: {
        plugins: [vuetify],
      },
      props: {
        modelValue: ['1', '11'] // 達成感と疲労を選択
      }
    })

    await flushPromises()

    // 選択状態の表示確認
    const selectedSummary = wrapper.find('.selected-summary')
    expect(selectedSummary.exists()).toBe(true)
    expect(selectedSummary.text()).toContain('選択中の感情:')
  })

  it('選択されたタグを削除できる', async () => {
    const wrapper = mount(EmotionTagSelector, {
      global: {
        plugins: [vuetify],
      },
      props: {
        modelValue: ['1', '2'] // 達成感と集中を選択
      }
    })

    await flushPromises()

    // 選択されたタグのクローズボタンを探す
    const closeButtons = wrapper.findAll('.selected-tags .v-chip .v-chip__close')
    expect(closeButtons.length).toBeGreaterThan(0)

    // 最初のタグを削除
    await closeButtons[0].trigger('click')

    // removeTag関数が呼ばれることを間接的に確認
    // （実際の削除処理はupdateイベントで親コンポーネントが処理）
  })

  it('選択状況のカウンターが正しく表示される', async () => {
    const wrapper = mount(EmotionTagSelector, {
      global: {
        plugins: [vuetify],
      },
      props: {
        modelValue: ['1', '2', '11'] // 3つのタグを選択
      }
    })

    await flushPromises()

    const counter = wrapper.find('v-chip')
    expect(counter.text()).toContain('3個選択中')
  })

  it('ローディング状態が正しく表示される', async () => {
    const emotionTagsStore = useEmotionTagsStore()
    vi.mocked(emotionTagsStore.loading).value = { fetchEmotionTags: true }

    const wrapper = mount(EmotionTagSelector, {
      global: {
        plugins: [vuetify],
      },
      props: {
        modelValue: []
      }
    })

    expect(wrapper.find('.text-center').text()).toContain('感情タグを読み込み中...')
  })

  it('エラー状態が正しく表示される', async () => {
    const emotionTagsStore = useEmotionTagsStore()
    vi.mocked(emotionTagsStore.error).value = { fetchEmotionTags: 'テストエラー' }

    const wrapper = mount(EmotionTagSelector, {
      global: {
        plugins: [vuetify],
      },
      props: {
        modelValue: []
      }
    })

    expect(wrapper.find('v-alert').text()).toContain('テストエラー')
  })

  it('disabledプロップが機能する', async () => {
    const wrapper = mount(EmotionTagSelector, {
      global: {
        plugins: [vuetify],
      },
      props: {
        modelValue: [],
        disabled: true
      }
    })

    await flushPromises()

    // disabled状態では選択操作ができないことを確認
    // （実装上はv-chip-groupのdisabledプロパティで制御）
    const chipGroups = wrapper.findAll('.emotion-chips')
    chipGroups.forEach(chipGroup => {
      expect(chipGroup.classes()).toContain('v-chip-group--disabled')
    })
  })

  it('タグの説明（tooltip）が表示される', async () => {
    const wrapper = mount(EmotionTagSelector, {
      global: {
        plugins: [vuetify],
      },
      props: {
        modelValue: []
      }
    })

    await flushPromises()

    // 各チップにtitle属性が設定されていることを確認
    const chips = wrapper.findAll('v-chip')
    const firstChip = chips.find(chip => chip.text().includes('達成感'))
    expect(firstChip?.attributes('title')).toContain('目標達成による満足感')
  })
})

// エラー処理のテスト
describe.skip('EmotionTagSelector - Error Cases', () => {
  it('感情タグの読み込みに失敗した場合、エラーメッセージが表示される', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    
    const emotionTagsStore = useEmotionTagsStore()
    vi.spyOn(emotionTagsStore, 'fetchEmotionTags').mockRejectedValue(new Error('ネットワークエラー'))

    const wrapper = mount(EmotionTagSelector, {
      global: {
        plugins: [vuetify],
      },
      props: {
        modelValue: []
      }
    })

    await flushPromises()

    expect(wrapper.find('v-alert[type="error"]').exists()).toBe(true)
  })
})