import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import BaseAlert from '@/components/base/BaseAlert.vue'

describe('BaseAlert', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const createWrapper = (props = {}, slots = {}) => {
    return mount(BaseAlert, {
      props,
      slots
    })
  }

  describe('Props', () => {
    it('デフォルトプロパティが正しく設定される', () => {
      const wrapper = createWrapper()
      const alert = wrapper.find('.v-alert')
      
      expect(alert.classes()).toContain('v-alert--type-info')
      expect(alert.classes()).toContain('v-alert--variant-tonal')
      expect(wrapper.vm.show).toBe(true)
    })

    it('カスタムプロパティが正しく適用される', () => {
      const props = {
        message: 'カスタムメッセージ',
        type: 'error' as const,
        variant: 'outlined' as const,
        closable: true,
        color: 'red',
        icon: 'mdi-alert',
        modelValue: true // アラートが表示されるようにtrueに変更
      }
      
      const wrapper = createWrapper(props)
      const alert = wrapper.find('.v-alert')
      
      expect(alert.classes()).toContain('v-alert--type-error')
      expect(alert.classes()).toContain('v-alert--variant-outlined')
      expect(alert.classes()).toContain('v-alert--color-red')
      expect(wrapper.text()).toContain('カスタムメッセージ')
      expect(wrapper.vm.show).toBe(true)
    })

    it('type プロパティのバリエーションが適用される', () => {
      const types = ['success', 'info', 'warning', 'error'] as const
      
      types.forEach(type => {
        const wrapper = createWrapper({ type })
        const alert = wrapper.find('.v-alert')
        expect(alert.classes()).toContain(`v-alert--type-${type}`)
      })
    })

    it('variant プロパティのバリエーションが適用される', () => {
      const variants = ['tonal', 'outlined', 'plain', 'elevated'] as const
      
      variants.forEach(variant => {
        const wrapper = createWrapper({ variant })
        const alert = wrapper.find('.v-alert')
        expect(alert.classes()).toContain(`v-alert--variant-${variant}`)
      })
    })
  })

  describe('Message Display', () => {
    it('messageプロパティが正しく表示される', () => {
      const message = 'テストメッセージ'
      const wrapper = createWrapper({ message })
      
      expect(wrapper.text()).toContain(message)
    })

    it('デフォルトスロットがメッセージをオーバーライドする', () => {
      const message = 'プロパティメッセージ'
      const slotContent = 'スロットメッセージ'
      
      const wrapper = createWrapper({ message }, { default: slotContent })
      
      expect(wrapper.text()).toContain(slotContent)
      expect(wrapper.text()).not.toContain(message)
    })
  })

  describe('Visibility Control', () => {
    it('modelValueがfalseの場合、アラートが表示されない', () => {
      const wrapper = createWrapper({ modelValue: false })
      const alert = wrapper.find('.v-alert')
      
      expect(alert.exists()).toBe(false)
    })

    it('modelValueがtrueの場合、アラートが表示される', () => {
      const wrapper = createWrapper({ modelValue: true })
      const alert = wrapper.find('.v-alert')
      
      expect(alert.exists()).toBe(true)
    })

    it('modelValueの変更に応じて表示状態が変わる', async () => {
      const wrapper = createWrapper({ modelValue: true })
      
      expect(wrapper.find('.v-alert').exists()).toBe(true)
      
      await wrapper.setProps({ modelValue: false })
      await nextTick()
      
      expect(wrapper.find('.v-alert').exists()).toBe(false)
    })
  })

  describe('Close Functionality', () => {
    it('closableがtrueの場合、クローズボタンが表示される', () => {
      const wrapper = createWrapper({ closable: true })
      const closeButton = wrapper.find('.v-alert__close')
      
      expect(closeButton.exists()).toBe(true)
    })

    it('クローズイベントが発生すると適切にハンドリングされる', async () => {
      const wrapper = createWrapper({ closable: true, modelValue: true })
      const closeButton = wrapper.find('.v-alert__close')
      
      await closeButton.trigger('click')
      
      expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
      expect(wrapper.emitted('close')).toHaveLength(1)
    })
  })

  describe('Auto Hide Functionality', () => {
    it('autoHideが有効な場合、指定時間後に自動で閉じる', async () => {
      const wrapper = createWrapper({
        autoHide: true,
        autoHideDelay: 1000,
        modelValue: true
      })
      
      expect(wrapper.vm.show).toBe(true)
      
      // 1秒経過をシミュレート
      vi.advanceTimersByTime(1000)
      await nextTick()
      
      expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('autoHideDelayのカスタム値が適用される', async () => {
      const wrapper = createWrapper({
        autoHide: true,
        autoHideDelay: 2000,
        modelValue: true
      })
      
      // 1秒経過では閉じない
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(wrapper.vm.show).toBe(true)
      
      // 2秒経過で閉じる
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('autoHideがfalseの場合、自動で閉じない', async () => {
      const wrapper = createWrapper({
        autoHide: false,
        autoHideDelay: 1000,
        modelValue: true
      })
      
      vi.advanceTimersByTime(2000)
      await nextTick()
      
      expect(wrapper.vm.show).toBe(true)
      expect(wrapper.emitted('close')).toBeFalsy()
    })
  })

  describe('Slots', () => {
    it('titleスロットが正しく表示される', () => {
      const titleContent = 'アラートタイトル'
      const wrapper = createWrapper({}, { title: titleContent })
      
      expect(wrapper.text()).toContain(titleContent)
    })

    it('appendスロットが正しく表示される', () => {
      const appendContent = 'アクションボタン'
      const wrapper = createWrapper({}, { append: appendContent })
      
      expect(wrapper.text()).toContain(appendContent)
    })

    it('複数のスロットを同時に使用できる', () => {
      const slots = {
        title: 'タイトル',
        default: 'メインコンテンツ',
        append: 'アクション'
      }
      
      const wrapper = createWrapper({}, slots)
      
      Object.values(slots).forEach(content => {
        expect(wrapper.text()).toContain(content)
      })
    })
  })

  describe('Events', () => {
    it('update:modelValueイベントが正しく発火される', async () => {
      const wrapper = createWrapper({ modelValue: true })
      
      wrapper.vm.show = false
      await nextTick()
      
      expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    })

    it('closeイベントが正しく発火される', async () => {
      const wrapper = createWrapper({ closable: true })
      
      wrapper.vm.handleClose()
      await nextTick()
      
      expect(wrapper.emitted('close')).toHaveLength(1)
    })
  })

  describe('Lifecycle', () => {
    it('コンポーネント破棄時にタイマーがクリアされる', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      
      const wrapper = createWrapper({
        autoHide: true,
        autoHideDelay: 5000,
        modelValue: true
      })
      
      wrapper.unmount()
      
      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('iconがfalseの場合でも適切にレンダリングされる', () => {
      const wrapper = createWrapper({ icon: false })
      const alert = wrapper.find('.v-alert')
      
      expect(alert.exists()).toBe(true)
    })

    it('すべてのプロパティを同時に設定できる', () => {
      const props = {
        message: 'フルオプションメッセージ',
        type: 'warning' as const,
        variant: 'elevated' as const,
        closable: true,
        color: 'orange',
        icon: 'mdi-warning',
        modelValue: true,
        autoHide: true,
        autoHideDelay: 2000
      }
      
      const wrapper = createWrapper(props)
      const alert = wrapper.find('.v-alert')
      
      expect(alert.classes()).toContain('v-alert--type-warning')
      expect(alert.classes()).toContain('v-alert--variant-elevated')
      expect(alert.classes()).toContain('v-alert--color-orange')
      expect(wrapper.find('.v-alert__close').exists()).toBe(true)
      expect(wrapper.text()).toContain('フルオプションメッセージ')
    })

    it('手動クローズ時にタイマーがクリアされる', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      
      const wrapper = createWrapper({
        autoHide: true,
        autoHideDelay: 5000,
        closable: true,
        modelValue: true
      })
      
      wrapper.vm.handleClose()
      await nextTick()
      
      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })
})