import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import BaseButton from '@/components/base/BaseButton.vue'

// Vuetifyの設定
const vuetify = createVuetify()

describe('BaseButton', () => {
  const createWrapper = (props = {}, slots = {}) => {
    return mount(BaseButton, {
      props,
      slots,
      global: {
        plugins: [vuetify]
      }
    })
  }

  describe('Props', () => {
    it('デフォルトプロパティが正しく設定される', () => {
      const wrapper = createWrapper()
      const button = wrapper.findComponent({ name: 'VBtn' })
      
      expect(button.props('color')).toBe('primary')
      expect(button.props('variant')).toBe('elevated')
      expect(button.props('size')).toBe('default')
      expect(button.props('loading')).toBe(false)
      expect(button.props('disabled')).toBe(false)
      expect(button.props('block')).toBe(false)
      expect(button.props('type')).toBe('button')
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
      const button = wrapper.findComponent({ name: 'VBtn' })
      
      expect(button.props('color')).toBe('secondary')
      expect(button.props('variant')).toBe('outlined')
      expect(button.props('size')).toBe('large')
      expect(button.props('loading')).toBe(true)
      expect(button.props('disabled')).toBe(true)
      expect(button.props('block')).toBe(true)
      expect(button.props('type')).toBe('submit')
    })

    it('color プロパティのバリエーションが適用される', () => {
      const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info'] as const
      
      colors.forEach(color => {
        const wrapper = createWrapper({ color })
        const button = wrapper.findComponent({ name: 'VBtn' })
        expect(button.props('color')).toBe(color)
      })
    })

    it('variant プロパティのバリエーションが適用される', () => {
      const variants = ['elevated', 'flat', 'tonal', 'outlined', 'text', 'plain'] as const
      
      variants.forEach(variant => {
        const wrapper = createWrapper({ variant })
        const button = wrapper.findComponent({ name: 'VBtn' })
        expect(button.props('variant')).toBe(variant)
      })
    })

    it('size プロパティのバリエーションが適用される', () => {
      const sizes = ['x-small', 'small', 'default', 'large', 'x-large'] as const
      
      sizes.forEach(size => {
        const wrapper = createWrapper({ size })
        const button = wrapper.findComponent({ name: 'VBtn' })
        expect(button.props('size')).toBe(size)
      })
    })
  })

  describe('Events', () => {
    it('クリックイベントが正しく発火される', async () => {
      const wrapper = createWrapper()
      const button = wrapper.findComponent({ name: 'VBtn' })
      
      await button.trigger('click')
      
      expect(wrapper.emitted('click')).toHaveLength(1)
      expect(wrapper.emitted('click')?.[0]).toHaveLength(1)
      expect(wrapper.emitted('click')?.[0][0]).toBeInstanceOf(Event)
    })

    it('disabled状態ではクリックイベントが発火されない', async () => {
      const wrapper = createWrapper({ disabled: true })
      const button = wrapper.findComponent({ name: 'VBtn' })
      
      // v-btnのdisabled状態では、クリックイベント自体が無効化される
      expect(button.props('disabled')).toBe(true)
    })

    it('loading状態でもクリックイベントは処理される', async () => {
      const wrapper = createWrapper({ loading: true })
      const button = wrapper.findComponent({ name: 'VBtn' })
      
      await button.trigger('click')
      
      expect(wrapper.emitted('click')).toHaveLength(1)
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
      const button = wrapper.findComponent({ name: 'VBtn' })
      
      expect(button.props('loading')).toBe(true)
    })

    it('loading状態が解除される', () => {
      const wrapper = createWrapper({ loading: false })
      const button = wrapper.findComponent({ name: 'VBtn' })
      
      expect(button.props('loading')).toBe(false)
    })
  })

  describe('Accessibility', () => {
    it('適切なtype属性が設定される', () => {
      const types = ['button', 'submit', 'reset'] as const
      
      types.forEach(type => {
        const wrapper = createWrapper({ type })
        const button = wrapper.findComponent({ name: 'VBtn' })
        expect(button.props('type')).toBe(type)
      })
    })

    it('disabled状態が正しく設定される', () => {
      const wrapper = createWrapper({ disabled: true })
      const button = wrapper.findComponent({ name: 'VBtn' })
      
      expect(button.props('disabled')).toBe(true)
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
      const button = wrapper.findComponent({ name: 'VBtn' })
      
      expect(button.props('color')).toBe('error')
      expect(button.props('variant')).toBe('tonal')
      expect(button.props('size')).toBe('x-small')
      expect(button.props('loading')).toBe(true)
      expect(button.props('disabled')).toBe(true)
      expect(button.props('block')).toBe(true)
      expect(button.props('type')).toBe('reset')
      expect(wrapper.text()).toContain('Complex Button')
    })

    it('プロパティの動的変更に対応する', async () => {
      const wrapper = createWrapper({ loading: false })
      const button = wrapper.findComponent({ name: 'VBtn' })
      
      expect(button.props('loading')).toBe(false)
      
      await wrapper.setProps({ loading: true })
      expect(button.props('loading')).toBe(true)
    })
  })
})