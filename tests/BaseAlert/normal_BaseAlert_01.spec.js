import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import BaseAlert from '../../src/components/base/BaseAlert.vue'

// タイマーのモック
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.clearAllTimers()
})

describe('BaseAlert - 正常系テスト', () => {
  it('基本的なレンダリングが正常に行われる', () => {
    const wrapper = mount(BaseAlert, {
      props: {
        message: 'テストメッセージ'
      }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.v-alert').exists()).toBe(true)
    expect(wrapper.text()).toContain('テストメッセージ')
  })

  it('デフォルトプロパティが正しく設定される', () => {
    const wrapper = mount(BaseAlert, {})

    const alert = wrapper.find('.v-alert')
    expect(alert.classes()).toContain('v-alert--type-info')
    expect(alert.classes()).toContain('v-alert--variant-tonal')
  })

  it('messageプロパティが正しく表示される', () => {
    const testMessage = 'カスタムメッセージ'
    const wrapper = mount(BaseAlert, {
      props: {
        message: testMessage
      }
    })

    expect(wrapper.text()).toContain(testMessage)
  })

  it('typeプロパティが正しく反映される - success', () => {
    const wrapper = mount(BaseAlert, {
      props: {
        type: 'success'
      }
    })

    const alert = wrapper.find('.v-alert')
    expect(alert.classes()).toContain('v-alert--type-success')
  })

  it('typeプロパティが正しく反映される - warning', () => {
    const wrapper = mount(BaseAlert, {
      props: {
        type: 'warning'
      }
    })

    const alert = wrapper.find('.v-alert')
    expect(alert.classes()).toContain('v-alert--type-warning')
  })

  it('typeプロパティが正しく反映される - error', () => {
    const wrapper = mount(BaseAlert, {
      props: {
        type: 'error'
      }
    })

    const alert = wrapper.find('.v-alert')
    expect(alert.classes()).toContain('v-alert--type-error')
  })

  it('variantプロパティが正しく反映される', () => {
    const wrapper = mount(BaseAlert, {
      props: {
        variant: 'outlined'
      }
    })

    const alert = wrapper.find('.v-alert')
    expect(alert.classes()).toContain('v-alert--variant-outlined')
  })

  it('colorプロパティが正しく反映される', () => {
    const wrapper = mount(BaseAlert, {
      props: {
        color: 'blue'
      }
    })

    const alert = wrapper.find('.v-alert')
    expect(alert.classes()).toContain('v-alert--color-blue')
  })

  it('closableプロパティが正しく動作する', async () => {
    const wrapper = mount(BaseAlert, {
      props: {
        closable: true,
        message: 'クローズ可能なアラート'
      }
    })

    const closeButton = wrapper.find('.v-alert__close')
    expect(closeButton.exists()).toBe(true)

    await closeButton.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('modelValueによる表示制御が正しく動作する', async () => {
    const wrapper = mount(BaseAlert, {
      props: {
        modelValue: false,
        message: '非表示アラート'
      }
    })

    // modelValue が false の場合は表示されない
    expect(wrapper.find('.v-alert').exists()).toBe(false)

    // modelValue を true に変更
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.find('.v-alert').exists()).toBe(true)
  })

  it('titleスロットが正しく表示される', () => {
    const wrapper = mount(BaseAlert, {
      props: {
        message: 'コンテンツ'
      },
      slots: {
        title: '<h3>アラートタイトル</h3>'
      }
    })

    expect(wrapper.html()).toContain('<h3>アラートタイトル</h3>')
    expect(wrapper.text()).toContain('アラートタイトル')
  })

  it('デフォルトスロットが正しく表示される', () => {
    const wrapper = mount(BaseAlert, {
      slots: {
        default: '<strong>カスタムコンテンツ</strong>'
      }
    })

    expect(wrapper.html()).toContain('<strong>カスタムコンテンツ</strong>')
    expect(wrapper.text()).toContain('カスタムコンテンツ')
  })

  it('appendスロットが正しく表示される', () => {
    const wrapper = mount(BaseAlert, {
      props: {
        message: 'メインコンテンツ'
      },
      slots: {
        append: '<button>追加ボタン</button>'
      }
    })

    expect(wrapper.html()).toContain('<button>追加ボタン</button>')
    expect(wrapper.text()).toContain('追加ボタン')
  })

  it('複数のスロットが同時に表示される', () => {
    const wrapper = mount(BaseAlert, {
      slots: {
        title: 'タイトル',
        default: 'メインコンテンツ',
        append: 'アペンド'
      }
    })

    expect(wrapper.text()).toContain('タイトル')
    expect(wrapper.text()).toContain('メインコンテンツ')
    expect(wrapper.text()).toContain('アペンド')
  })

  it('messageプロパティとデフォルトスロットの併用', () => {
    const wrapper = mount(BaseAlert, {
      props: {
        message: 'プロパティメッセージ'
      },
      slots: {
        default: 'スロットコンテンツ'
      }
    })

    // スロットがある場合はスロットコンテンツが表示される
    expect(wrapper.text()).toContain('スロットコンテンツ')
    // messageプロパティは表示されない（スロットが優先される）
    expect(wrapper.text()).not.toContain('プロパティメッセージ')
  })

  it('自動非表示機能が正しく動作する', async () => {
    const wrapper = mount(BaseAlert, {
      props: {
        autoHide: true,
        autoHideDelay: 1000,
        message: '自動非表示アラート'
      }
    })

    // 初期状態では表示されている
    expect(wrapper.find('.v-alert').exists()).toBe(true)

    // 1秒経過
    vi.advanceTimersByTime(1000)
    await nextTick()

    // 自動非表示されている
    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('複数のプロパティが同時に適用される', () => {
    const wrapper = mount(BaseAlert, {
      props: {
        type: 'warning',
        variant: 'outlined',
        color: 'orange',
        closable: true,
        message: '複合テスト'
      }
    })

    const alert = wrapper.find('.v-alert')
    expect(alert.classes()).toContain('v-alert--type-warning')
    expect(alert.classes()).toContain('v-alert--variant-outlined')
    expect(alert.classes()).toContain('v-alert--color-orange')
    expect(wrapper.find('.v-alert__close').exists()).toBe(true)
    expect(wrapper.text()).toContain('複合テスト')
  })
})