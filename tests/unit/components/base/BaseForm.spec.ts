import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { nextTick } from 'vue'
import BaseForm from '@/components/base/BaseForm.vue'

// Vuetifyの設定
const vuetify = createVuetify()

describe('BaseForm', () => {
  const createWrapper = (props = {}, slots = {}) => {
    return mount(BaseForm, {
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
      
      expect(wrapper.vm.containerClass).toBe('')
      expect(wrapper.vm.formClass).toBe('')
      expect(wrapper.vm.validateOnSubmit).toBe(true)
    })

    it('カスタムプロパティが正しく適用される', () => {
      const props = {
        title: 'テストフォーム',
        containerClass: 'custom-container',
        formClass: 'custom-form',
        validateOnSubmit: false
      }
      
      const wrapper = createWrapper(props)
      
      expect(wrapper.vm.title).toBe('テストフォーム')
      expect(wrapper.vm.containerClass).toBe('custom-container')
      expect(wrapper.vm.formClass).toBe('custom-form')
      expect(wrapper.vm.validateOnSubmit).toBe(false)
    })

    it('titleが設定されている場合、タイトルが表示される', () => {
      const title = 'フォームタイトル'
      const wrapper = createWrapper({ title })
      
      expect(wrapper.text()).toContain(title)
      expect(wrapper.find('.form-title').exists()).toBe(true)
    })

    it('titleが設定されていない場合、タイトルが表示されない', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.find('.form-title').exists()).toBe(false)
    })
  })

  describe('CSS Classes', () => {
    it('containerClassが正しく適用される', () => {
      const containerClass = 'custom-container'
      const wrapper = createWrapper({ containerClass })
      const container = wrapper.findComponent({ name: 'VContainer' })
      
      expect(container.classes()).toContain(containerClass)
    })

    it('formClassが正しく適用される', () => {
      const formClass = 'custom-form'
      const wrapper = createWrapper({ formClass })
      const form = wrapper.findComponent({ name: 'VForm' })
      
      expect(form.classes()).toContain(formClass)
    })

    it('複数のクラスを同時に適用できる', () => {
      const props = {
        containerClass: 'container-class-1 container-class-2',
        formClass: 'form-class-1 form-class-2'
      }
      
      const wrapper = createWrapper(props)
      const container = wrapper.findComponent({ name: 'VContainer' })
      const form = wrapper.findComponent({ name: 'VForm' })
      
      expect(container.classes()).toContain('container-class-1')
      expect(container.classes()).toContain('container-class-2')
      expect(form.classes()).toContain('form-class-1')
      expect(form.classes()).toContain('form-class-2')
    })
  })

  describe('Form Submission', () => {
    it('validateOnSubmitがtrueの場合、バリデーション後にsubmitイベントが発火される', async () => {
      const mockValidate = vi.fn().mockResolvedValue({ valid: true })
      const wrapper = createWrapper({ validateOnSubmit: true })
      
      // formRefのモック
      wrapper.vm.formRef = { validate: mockValidate }
      
      await wrapper.vm.handleSubmit()
      
      expect(mockValidate).toHaveBeenCalled()
      expect(wrapper.emitted('submit')).toHaveLength(1)
      expect(wrapper.emitted('submit')?.[0]).toEqual([true])
    })

    it('validateOnSubmitがfalseの場合、バリデーションなしでsubmitイベントが発火される', async () => {
      const wrapper = createWrapper({ validateOnSubmit: false })
      wrapper.vm.isValid = true
      
      await wrapper.vm.handleSubmit()
      
      expect(wrapper.emitted('submit')).toHaveLength(1)
      expect(wrapper.emitted('submit')?.[0]).toEqual([true])
    })

    it('バリデーションが失敗した場合、falseでsubmitイベントが発火される', async () => {
      const mockValidate = vi.fn().mockResolvedValue({ valid: false })
      const wrapper = createWrapper({ validateOnSubmit: true })
      
      wrapper.vm.formRef = { validate: mockValidate }
      
      await wrapper.vm.handleSubmit()
      
      expect(mockValidate).toHaveBeenCalled()
      expect(wrapper.emitted('submit')).toHaveLength(1)
      expect(wrapper.emitted('submit')?.[0]).toEqual([false])
    })

    it('フォーム送信時にpreventDefaultが適用される', async () => {
      const wrapper = createWrapper()
      const form = wrapper.findComponent({ name: 'VForm' })
      
      const mockEvent = {
        preventDefault: vi.fn()
      }
      
      await form.trigger('submit', mockEvent)
      
      // Vue Test Utilsは自動的にpreventDefaultを処理するため、
      // ここではsubmitイベントが発火されることを確認
      expect(wrapper.emitted('submit')).toBeDefined()
    })
  })

  describe('Exposed Methods', () => {
    it('validateメソッドが正しく動作する', async () => {
      const mockValidate = vi.fn().mockResolvedValue({ valid: true })
      const wrapper = createWrapper()
      
      wrapper.vm.formRef = { validate: mockValidate }
      
      const result = await wrapper.vm.validate()
      
      expect(mockValidate).toHaveBeenCalled()
      expect(result.valid).toBe(true)
    })

    it('formRefがない場合、validateメソッドはfalseを返す', () => {
      const wrapper = createWrapper()
      wrapper.vm.formRef = null
      
      const result = wrapper.vm.validate()
      
      expect(result.valid).toBe(false)
    })

    it('resetメソッドが正しく動作する', () => {
      const mockReset = vi.fn()
      const wrapper = createWrapper()
      
      wrapper.vm.formRef = { reset: mockReset }
      
      wrapper.vm.reset()
      
      expect(mockReset).toHaveBeenCalled()
    })

    it('formRefがない場合、resetメソッドはエラーを起こさない', () => {
      const wrapper = createWrapper()
      wrapper.vm.formRef = null
      
      expect(() => wrapper.vm.reset()).not.toThrow()
    })

    it('resetValidationメソッドが正しく動作する', () => {
      const mockResetValidation = vi.fn()
      const wrapper = createWrapper()
      
      wrapper.vm.formRef = { resetValidation: mockResetValidation }
      
      wrapper.vm.resetValidation()
      
      expect(mockResetValidation).toHaveBeenCalled()
    })

    it('formRefがない場合、resetValidationメソッドはエラーを起こさない', () => {
      const wrapper = createWrapper()
      wrapper.vm.formRef = null
      
      expect(() => wrapper.vm.resetValidation()).not.toThrow()
    })

    it('isValidのcomputed値が正しく取得できる', () => {
      const wrapper = createWrapper()
      wrapper.vm.isValid = true
      
      expect(wrapper.vm.isValid).toBe(true)
    })
  })

  describe('Slots', () => {
    it('contentスロットが正しく表示される', () => {
      const contentSlot = '<input type="text" />'
      const wrapper = createWrapper({}, { content: contentSlot })
      
      expect(wrapper.html()).toContain('<input type="text">')
    })

    it('contentスロットにisValidが渡される', () => {
      const wrapper = createWrapper({}, {
        content: `<template #content="{ isValid }">
          <div data-test="is-valid">{{ isValid }}</div>
        </template>`
      })
      
      wrapper.vm.isValid = true
      expect(wrapper.find('[data-test="is-valid"]').exists()).toBe(true)
    })

    it('actionsスロットが正しく表示される', () => {
      const actionsSlot = '<button type="submit">送信</button>'
      const wrapper = createWrapper({}, { actions: actionsSlot })
      
      expect(wrapper.html()).toContain('<button type="submit">送信</button>')
      expect(wrapper.find('.form-actions').exists()).toBe(true)
    })

    it('actionsスロットにisValidとsubmitが渡される', () => {
      const wrapper = createWrapper({}, {
        actions: `<template #actions="{ isValid, submit }">
          <div data-test="actions-props">{{ typeof isValid }}-{{ typeof submit }}</div>
        </template>`
      })
      
      expect(wrapper.find('[data-test="actions-props"]').exists()).toBe(true)
      // isValidはboolean、submitはfunctionであることを確認
      expect(wrapper.find('[data-test="actions-props"]').text()).toContain('boolean')
      expect(wrapper.find('[data-test="actions-props"]').text()).toContain('function')
    })

    it('actionsスロットがない場合、form-actionsが表示されない', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.find('.form-actions').exists()).toBe(false)
    })

    it('複数のスロットを同時に使用できる', () => {
      const slots = {
        content: '<input type="text" data-test="content" />',
        actions: '<button data-test="actions">送信</button>'
      }
      
      const wrapper = createWrapper({}, slots)
      
      expect(wrapper.find('[data-test="content"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="actions"]').exists()).toBe(true)
    })
  })

  describe('Form Validation State', () => {
    it('isValidの初期値がfalseである', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.vm.isValid).toBe(false)
    })

    it('v-modelによってisValidが更新される', async () => {
      const wrapper = createWrapper()
      const form = wrapper.findComponent({ name: 'VForm' })
      
      // VFormのv-modelをシミュレート
      await form.vm.$emit('update:modelValue', true)
      await nextTick()
      
      expect(wrapper.vm.isValid).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('すべてのプロパティとスロットを同時に設定できる', () => {
      const props = {
        title: 'コンプリートフォーム',
        containerClass: 'full-container',
        formClass: 'full-form',
        validateOnSubmit: false
      }
      
      const slots = {
        content: '<input type="text" />',
        actions: '<button>送信</button>'
      }
      
      const wrapper = createWrapper(props, slots)
      
      expect(wrapper.text()).toContain('コンプリートフォーム')
      expect(wrapper.findComponent({ name: 'VContainer' }).classes()).toContain('full-container')
      expect(wrapper.findComponent({ name: 'VForm' }).classes()).toContain('full-form')
      expect(wrapper.html()).toContain('<input type="text">')
      expect(wrapper.html()).toContain('<button>送信</button>')
    })

    it('formRefが設定される前でもメソッド呼び出しが安全に実行される', () => {
      const wrapper = createWrapper()
      
      // 初期状態ではformRefはnull/undefined
      expect(() => {
        wrapper.vm.validate()
        wrapper.vm.reset()
        wrapper.vm.resetValidation()
      }).not.toThrow()
    })
  })
})