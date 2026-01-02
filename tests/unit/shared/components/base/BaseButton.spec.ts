import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from '@shared/components/base/BaseButton.vue'

describe('BaseButton', () => {
  const createWrapper = (props = {}, slots = {}) => {
    return mount(BaseButton, {
      props,
      slots
    })
  }

  describe('Props', () => {
    it('デフォルトプロパティが正しく設定される', () => {
      const wrapper = createWrapper()
      const button = wrapper.find('.v-btn')
      
      expect(button.classes()).toContain('v-btn--color-primary')
      expect(button.classes()).toContain('v-btn--variant-elevated')
      expect(button.classes()).toContain('v-btn--size-default')
      expect(button.attributes('type')).toBe('button')
      expect(button.attributes('disabled')).toBeUndefined()
    })

    it('カスタムプロパティが正しく適用される', () => {
      const props = {
        color: 'secondary' as const,
        variant: 'outlined' as const,
        size: 'large' as const,
        loading: true,
        disabled: true,
        block: true,
        type: 'submit' as const
      }
      
      const wrapper = createWrapper(props)
      const button = wrapper.find('.v-btn')
      
      expect(button.classes()).toContain('v-btn--color-secondary')
      expect(button.classes()).toContain('v-btn--variant-outlined')
      expect(button.classes()).toContain('v-btn--size-large')
      expect(button.classes()).toContain('v-btn--loading')
      expect(button.classes()).toContain('v-btn--disabled')
      expect(button.classes()).toContain('v-btn--block')
      expect(button.attributes('type')).toBe('submit')
    })

    it('color プロパティのバリエーションが適用される', () => {
      const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info'] as const
      
      colors.forEach(color => {
        const wrapper = createWrapper({ color })
        const button = wrapper.find('.v-btn')
        expect(button.classes()).toContain(`v-btn--color-${color}`)
      })
    })

    it('variant プロパティのバリエーションが適用される', () => {
      const variants = ['elevated', 'flat', 'tonal', 'outlined', 'text', 'plain'] as const
      
      variants.forEach(variant => {
        const wrapper = createWrapper({ variant })
        const button = wrapper.find('.v-btn')
        expect(button.classes()).toContain(`v-btn--variant-${variant}`)
      })
    })

    it('size プロパティのバリエーションが適用される', () => {
      const sizes = ['x-small', 'small', 'default', 'large', 'x-large'] as const
      
      sizes.forEach(size => {
        const wrapper = createWrapper({ size })
        const button = wrapper.find('.v-btn')
        expect(button.classes()).toContain(`v-btn--size-${size}`)
      })
    })
  })

  describe('Events', () => {
    it('クリックイベントが正しく発火される', async () => {
      const wrapper = createWrapper()
      const button = wrapper.find('.v-btn')
      
      await button.trigger('click')
      
      expect(wrapper.emitted('click')).toHaveLength(1)
      expect(wrapper.emitted('click')?.[0]).toHaveLength(1)
      expect(wrapper.emitted('click')?.[0][0]).toBeInstanceOf(Event)
    })

    it('disabled状態ではクリックイベントが発火されない', async () => {
      const wrapper = createWrapper({ disabled: true })
      const button = wrapper.find('.v-btn')
      
      // disabled状態ではクリックイベントが発火されないことを確認
      await button.trigger('click')
      expect(wrapper.emitted('click')).toBeUndefined()
      expect(button.classes()).toContain('v-btn--disabled')
    })

    it('loading状態でもクリックイベントは処理される', async () => {
      const wrapper = createWrapper({ loading: true })
      const button = wrapper.find('.v-btn')
      
      await button.trigger('click')
      
      expect(wrapper.emitted('click')).toHaveLength(1)
      expect(button.classes()).toContain('v-btn--loading')
    })
  })

  describe('Slots', () => {
    it('デフォルトスロットの内容が正しく表示される', () => {
      const slotContent = 'テストボタン'
      const wrapper = createWrapper({}, { default: slotContent })
      
      expect(wrapper.text()).toContain(slotContent)
    })

    it('HTML要素をスロットに渡せる', () => {
      const wrapper = createWrapper({}, {
        default: '<span class="test-icon">アイコン</span> テキスト'
      })
      
      expect(wrapper.html()).toContain('<span class="test-icon">アイコン</span>')
      expect(wrapper.text()).toContain('テキスト')
    })

    it('空のスロットでも正常に動作する', () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Loading State', () => {
    it('loading状態が正しく反映される', () => {
      const wrapper = createWrapper({ loading: true })
      const button = wrapper.find('.v-btn')
      
      expect(button.classes()).toContain('v-btn--loading')
    })

    it('loading状態が解除される', () => {
      const wrapper = createWrapper({ loading: false })
      const button = wrapper.find('.v-btn')
      
      expect(button.classes()).not.toContain('v-btn--loading')
    })
  })

  describe('Accessibility', () => {
    it('適切なtype属性が設定される', () => {
      const types = ['button', 'submit', 'reset'] as const
      
      types.forEach(type => {
        const wrapper = createWrapper({ type })
        const button = wrapper.find('.v-btn')
        expect(button.attributes('type')).toBe(type)
      })
    })

    it('disabled状態が正しく設定される', () => {
      const wrapper = createWrapper({ disabled: true })
      const button = wrapper.find('.v-btn')
      
      expect(button.classes()).toContain('v-btn--disabled')
      expect(button.attributes('disabled')).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('すべてのプロパティを同時に設定できる', () => {
      const props = {
        color: 'error' as const,
        variant: 'tonal' as const,
        size: 'x-small' as const,
        loading: true,
        disabled: true,
        block: true,
        type: 'reset' as const
      }
      
      const wrapper = createWrapper(props, { default: 'Complex Button' })
      const button = wrapper.find('.v-btn')
      
      expect(button.classes()).toContain('v-btn--color-error')
      expect(button.classes()).toContain('v-btn--variant-tonal')
      expect(button.classes()).toContain('v-btn--size-x-small')
      expect(button.classes()).toContain('v-btn--loading')
      expect(button.classes()).toContain('v-btn--disabled')
      expect(button.classes()).toContain('v-btn--block')
      expect(button.attributes('type')).toBe('reset')
      expect(wrapper.text()).toContain('Complex Button')
    })

    it('プロパティの動的変更に対応する', async () => {
      const wrapper = createWrapper({ loading: false })
      let button = wrapper.find('.v-btn')
      
      expect(button.classes()).not.toContain('v-btn--loading')
      
      await wrapper.setProps({ loading: true })
      button = wrapper.find('.v-btn')
      expect(button.classes()).toContain('v-btn--loading')
    })
  })
})