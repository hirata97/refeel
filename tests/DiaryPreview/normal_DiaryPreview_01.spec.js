import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import DiaryPreview from '@/components/diary/DiaryPreview.vue'

const vuetify = createVuetify({
  components,
  directives,
})

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

describe('DiaryPreview - 正常系', () => {
  let wrapper
  const mockDiary = {
    id: '1',
    user_id: 'user1',
    title: 'プレビューテスト日記',
    content: 'これはプレビュー機能のテスト用の長い日記内容です。この内容は150文字を超えているため、適切に切り詰められることを確認するためのテキストです。続きを読むリンクが表示されるはずです。',
    goal_category: 'テストカテゴリ',
    progress_level: 60,
    created_at: '2024-01-01T10:00:00.000Z',
    updated_at: '2024-01-01T10:00:00.000Z',
  }

  const shortContentDiary = {
    ...mockDiary,
    content: '短い内容',
  }

  beforeEach(() => {
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  it('プレビューラッパーが正常に表示される', () => {
    wrapper = mount(DiaryPreview, {
      props: {
        diary: mockDiary,
      },
      global: {
        plugins: [vuetify],
      },
      slots: {
        default: '<div class="trigger-element">トリガー要素</div>',
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.diary-preview-wrapper').exists()).toBe(true)
    expect(wrapper.find('.trigger-element').exists()).toBe(true)
  })

  it('長いコンテンツが適切に切り詰められる', () => {
    wrapper = mount(DiaryPreview, {
      props: {
        diary: mockDiary,
        maxLength: 50,
      },
      global: {
        plugins: [vuetify],
      },
      slots: {
        default: '<div class="trigger-element">トリガー要素</div>',
      },
    })

    expect(wrapper.vm.truncatedContent).toBeTruthy()
    expect(wrapper.vm.truncatedContent.length).toBeLessThanOrEqual(50)
    expect(wrapper.vm.isTruncated).toBe(true)
  })

  it('短いコンテンツは切り詰められない', () => {
    wrapper = mount(DiaryPreview, {
      props: {
        diary: shortContentDiary,
        maxLength: 150,
      },
      global: {
        plugins: [vuetify],
      },
      slots: {
        default: '<div class="trigger-element">トリガー要素</div>',
      },
    })

    expect(wrapper.vm.truncatedContent).toBe('短い内容')
    expect(wrapper.vm.isTruncated).toBe(false)
  })

  it('マウスオーバーでプレビューが表示される', async () => {
    wrapper = mount(DiaryPreview, {
      props: {
        diary: mockDiary,
        previewDelay: 100,
      },
      global: {
        plugins: [vuetify],
      },
      slots: {
        default: '<div class="trigger-element">トリガー要素</div>',
      },
    })

    const previewWrapper = wrapper.find('.diary-preview-wrapper')
    
    // マウスオーバーイベント
    await previewWrapper.trigger('mouseenter')
    
    // 遅延時間後にプレビューが表示される
    vi.advanceTimersByTime(100)
    await wrapper.vm.$nextTick()
    
    expect(wrapper.vm.isVisible).toBe(true)
  })

  it('マウスリーブでプレビューが非表示になる', async () => {
    wrapper = mount(DiaryPreview, {
      props: {
        diary: mockDiary,
        previewDelay: 100,
        hideDelay: 50,
      },
      global: {
        plugins: [vuetify],
      },
      slots: {
        default: '<div class="trigger-element">トリガー要素</div>',
      },
    })

    const previewWrapper = wrapper.find('.diary-preview-wrapper')
    
    // プレビューを表示
    await previewWrapper.trigger('mouseenter')
    vi.advanceTimersByTime(100)
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.isVisible).toBe(true)
    
    // マウスリーブ
    await previewWrapper.trigger('mouseleave')
    vi.advanceTimersByTime(50)
    await wrapper.vm.$nextTick()
    
    expect(wrapper.vm.isVisible).toBe(false)
  })

  it('詳細表示ボタンで詳細イベントが発火される', async () => {
    wrapper = mount(DiaryPreview, {
      props: {
        diary: mockDiary,
      },
      global: {
        plugins: [vuetify],
      },
      slots: {
        default: '<div class="trigger-element">トリガー要素</div>',
      },
    })

    // プレビューを強制的に表示
    wrapper.vm.isVisible = true
    await wrapper.vm.$nextTick()

    const detailButton = wrapper.find('button').filter(btn => 
      btn.text().includes('詳細表示')
    )[0]
    
    await detailButton.trigger('click')
    
    expect(wrapper.emitted().detail).toBeTruthy()
    expect(wrapper.emitted().detail[0]).toEqual([mockDiary])
    expect(wrapper.vm.isVisible).toBe(false) // プレビューが閉じられる
  })

  it('編集ボタンで編集イベントが発火される', async () => {
    wrapper = mount(DiaryPreview, {
      props: {
        diary: mockDiary,
      },
      global: {
        plugins: [vuetify],
      },
      slots: {
        default: '<div class="trigger-element">トリガー要素</div>',
      },
    })

    // プレビューを強制的に表示
    wrapper.vm.isVisible = true
    await wrapper.vm.$nextTick()

    const editButton = wrapper.find('button').filter(btn => 
      btn.text().includes('編集')
    )[0]
    
    await editButton.trigger('click')
    
    expect(wrapper.emitted().edit).toBeTruthy()
    expect(wrapper.emitted().edit[0]).toEqual([mockDiary])
    expect(wrapper.vm.isVisible).toBe(false) // プレビューが閉じられる
  })

  it('日付が適切にフォーマットされる', () => {
    wrapper = mount(DiaryPreview, {
      props: {
        diary: mockDiary,
      },
      global: {
        plugins: [vuetify],
      },
      slots: {
        default: '<div class="trigger-element">トリガー要素</div>',
      },
    })

    const formattedDate = wrapper.vm.formatDate('2024-01-01T10:00:00.000Z')
    expect(formattedDate).toBe('1月1日')
  })

  it('進捗レベルに応じた色が返される', () => {
    wrapper = mount(DiaryPreview, {
      props: {
        diary: mockDiary,
      },
      global: {
        plugins: [vuetify],
      },
      slots: {
        default: '<div class="trigger-element">トリガー要素</div>',
      },
    })

    expect(wrapper.vm.getProgressColor(90)).toBe('success')
    expect(wrapper.vm.getProgressColor(60)).toBe('warning')
    expect(wrapper.vm.getProgressColor(30)).toBe('error')
  })

  it('フォーカスイベントでプレビューが表示される', async () => {
    wrapper = mount(DiaryPreview, {
      props: {
        diary: mockDiary,
        previewDelay: 100,
      },
      global: {
        plugins: [vuetify],
      },
      slots: {
        default: '<div class="trigger-element">トリガー要素</div>',
      },
    })

    const previewWrapper = wrapper.find('.diary-preview-wrapper')
    
    // フォーカスイベント
    await previewWrapper.trigger('focus')
    
    vi.advanceTimersByTime(100)
    await wrapper.vm.$nextTick()
    
    expect(wrapper.vm.isVisible).toBe(true)
  })

  it('コンポーネントアンマウント時にタイムアウトがクリアされる', () => {
    wrapper = mount(DiaryPreview, {
      props: {
        diary: mockDiary,
      },
      global: {
        plugins: [vuetify],
      },
      slots: {
        default: '<div class="trigger-element">トリガー要素</div>',
      },
    })

    // タイムアウトを設定
    wrapper.vm.showTimeout = 123
    wrapper.vm.hideTimeout = 456
    
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
    
    // コンポーネントをアンマウント
    wrapper.unmount()
    
    expect(clearTimeoutSpy).toHaveBeenCalledWith(123)
    expect(clearTimeoutSpy).toHaveBeenCalledWith(456)
  })
})