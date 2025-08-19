import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from '../../src/components/base/BaseButton.vue'

describe('BaseButton - 正常系テスト', () => {
  it('基本的なレンダリングが正常に行われる', () => {
    const wrapper = mount(BaseButton, {
      slots: {
        default: 'テストボタン'
      }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.v-btn').exists()).toBe(true)
    expect(wrapper.text()).toContain('テストボタン')
  })

  it('デフォルトプロパティが正しく設定される', () => {
    const wrapper = mount(BaseButton, {})

    const btn = wrapper.find('.v-btn')
    expect(btn.classes()).toContain('v-btn--variant-elevated')
    expect(btn.classes()).toContain('v-btn--size-default')
  })

  it('colorプロパティが正しく反映される', () => {
    const wrapper = mount(BaseButton, {
      props: {
        color: 'secondary'
      }
    })

    const btn = wrapper.find('.v-btn')
    expect(btn.classes()).toContain('v-btn--color-secondary')
  })

  it('variantプロパティが正しく反映される', () => {
    const wrapper = mount(BaseButton, {
      props: {
        variant: 'outlined'
      }
    })

    const btn = wrapper.find('.v-btn')
    expect(btn.classes()).toContain('v-btn--variant-outlined')
  })

  it('sizeプロパティが正しく反映される', () => {
    const wrapper = mount(BaseButton, {
      props: {
        size: 'large'
      }
    })

    const btn = wrapper.find('.v-btn')
    expect(btn.classes()).toContain('v-btn--size-large')
  })

  it('loadingプロパティが正しく反映される', () => {
    const wrapper = mount(BaseButton, {
      props: {
        loading: true
      }
    })

    const btn = wrapper.find('.v-btn')
    expect(btn.classes()).toContain('v-btn--loading')
  })

  it('disabledプロパティが正しく反映される', () => {
    const wrapper = mount(BaseButton, {
      props: {
        disabled: true
      }
    })

    const btn = wrapper.find('.v-btn')
    expect(btn.classes()).toContain('v-btn--disabled')
  })

  it('blockプロパティが正しく反映される', () => {
    const wrapper = mount(BaseButton, {
      props: {
        block: true
      }
    })

    const btn = wrapper.find('.v-btn')
    expect(btn.classes()).toContain('v-btn--block')
  })

  it('typeプロパティが正しく反映される', () => {
    const wrapper = mount(BaseButton, {
      props: {
        type: 'submit'
      }
    })

    const btn = wrapper.find('.v-btn')
    expect(btn.attributes('type')).toBe('submit')
  })

  it('クリックイベントが正しく発火される', async () => {
    const wrapper = mount(BaseButton, {
      slots: {
        default: 'クリックテスト'
      }
    })

    await wrapper.find('.v-btn').trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('スロットコンテンツが正しく表示される', () => {
    const testContent = '<span class="test-content">カスタムコンテンツ</span>'
    const wrapper = mount(BaseButton, {
      slots: {
        default: testContent
      }
    })

    expect(wrapper.html()).toContain('カスタムコンテンツ')
    expect(wrapper.find('.test-content').exists()).toBe(true)
  })

  it('複数のプロパティが同時に適用される', () => {
    const wrapper = mount(BaseButton, {
      props: {
        color: 'error',
        variant: 'tonal',
        size: 'small',
        block: true
      },
      slots: {
        default: '複合テスト'
      }
    })

    const btn = wrapper.find('.v-btn')
    expect(btn.classes()).toContain('v-btn--color-error')
    expect(btn.classes()).toContain('v-btn--variant-tonal')
    expect(btn.classes()).toContain('v-btn--size-small')
    expect(btn.classes()).toContain('v-btn--block')
    expect(wrapper.text()).toContain('複合テスト')
  })
})