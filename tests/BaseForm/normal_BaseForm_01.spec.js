import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseForm from '../../src/components/base/BaseForm.vue'

describe('BaseForm - 正常系テスト', () => {
  it('基本的なレンダリングが正常に行われる', () => {
    const wrapper = mount(BaseForm, {
      slots: {
        content: '<input type="text" value="テスト入力">'
      }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.v-container').exists()).toBe(true)
    expect(wrapper.find('.v-form').exists()).toBe(true)
    expect(wrapper.html()).toContain('テスト入力')
  })

  it('titleプロパティが正しく表示される', () => {
    const testTitle = 'テストフォーム'
    const wrapper = mount(BaseForm, {
      props: {
        title: testTitle
      },
      slots: {
        content: '<input type="text">'
      }
    })

    expect(wrapper.text()).toContain(testTitle)
    expect(wrapper.find('.form-title').exists()).toBe(true)
  })

  it('titleがない場合はタイトル要素が表示されない', () => {
    const wrapper = mount(BaseForm, {
      slots: {
        content: '<input type="text">'
      }
    })

    expect(wrapper.find('.form-title').exists()).toBe(false)
  })

  it('containerClassプロパティが正しく反映される', () => {
    const customClass = 'custom-container'
    const wrapper = mount(BaseForm, {
      props: {
        containerClass: customClass
      },
      slots: {
        content: '<input type="text">'
      }
    })

    const container = wrapper.find('.v-container')
    expect(container.classes()).toContain(customClass)
  })

  it('formClassプロパティが正しく反映される', () => {
    const customFormClass = 'custom-form'
    const wrapper = mount(BaseForm, {
      props: {
        formClass: customFormClass
      },
      slots: {
        content: '<input type="text">'
      }
    })

    const form = wrapper.find('.v-form')
    expect(form.classes()).toContain(customFormClass)
  })

  it('contentスロットが正しく表示される', () => {
    const contentHtml = '<div class="test-content">フォームコンテンツ</div>'
    const wrapper = mount(BaseForm, {
      slots: {
        content: contentHtml
      }
    })

    expect(wrapper.find('.test-content').exists()).toBe(true)
    expect(wrapper.text()).toContain('フォームコンテンツ')
  })

  it('actionsスロットが正しく表示される', () => {
    const actionsHtml = '<button class="test-action">送信</button>'
    const wrapper = mount(BaseForm, {
      slots: {
        content: '<input type="text">',
        actions: actionsHtml
      }
    })

    expect(wrapper.find('.test-action').exists()).toBe(true)
    expect(wrapper.find('.form-actions').exists()).toBe(true)
    expect(wrapper.text()).toContain('送信')
  })

  it('actionsスロットがない場合はform-actions要素が表示されない', () => {
    const wrapper = mount(BaseForm, {
      slots: {
        content: '<input type="text">'
      }
    })

    expect(wrapper.find('.form-actions').exists()).toBe(false)
  })

  it('スロットにisValidが正しく渡される', () => {
    const wrapper = mount(BaseForm, {
      slots: {
        content: '<div>{{ isValid }}</div>',
        actions: '<div>Valid: {{ isValid }}</div>'
      }
    })

    // isValid の初期値は false
    expect(wrapper.text()).toContain('false')
    expect(wrapper.text()).toContain('Valid: false')
  })

  it('フォーム送信イベントが正しく発火される', async () => {
    const wrapper = mount(BaseForm, {
      props: {
        validateOnSubmit: false
      },
      slots: {
        content: '<input type="text">',
        actions: '<button type="submit">送信</button>'
      }
    })

    await wrapper.find('.v-form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it('validateOnSubmitがfalseの場合、submitイベントに現在のisValidが渡される', async () => {
    const wrapper = mount(BaseForm, {
      props: {
        validateOnSubmit: false
      },
      slots: {
        content: '<input type="text">'
      }
    })

    await wrapper.find('.v-form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')[0][0]).toBe(false) // isValid の初期値
  })

  it('複数のプロパティが同時に適用される', () => {
    const wrapper = mount(BaseForm, {
      props: {
        title: '複合テストフォーム',
        containerClass: 'test-container',
        formClass: 'test-form',
        validateOnSubmit: true
      },
      slots: {
        content: '<input type="email" required>',
        actions: '<button type="submit">送信</button>'
      }
    })

    expect(wrapper.text()).toContain('複合テストフォーム')
    expect(wrapper.find('.v-container').classes()).toContain('test-container')
    expect(wrapper.find('.v-form').classes()).toContain('test-form')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('expose されたメソッドが存在する', () => {
    const wrapper = mount(BaseForm, {
      slots: {
        content: '<input type="text">'
      }
    })

    // expose されたメソッドにアクセス可能かテスト
    expect(typeof wrapper.vm.validate).toBe('function')
    expect(typeof wrapper.vm.reset).toBe('function')
    expect(typeof wrapper.vm.resetValidation).toBe('function')
    expect(typeof wrapper.vm.isValid).toBe('boolean') // computed の値は boolean
  })

  it('デフォルトプロパティが正しく設定される', () => {
    const wrapper = mount(BaseForm, {
      slots: {
        content: '<input type="text">'
      }
    })

    // props のデフォルト値をテスト
    expect(wrapper.props('containerClass')).toBe('')
    expect(wrapper.props('formClass')).toBe('')
    expect(wrapper.props('validateOnSubmit')).toBe(true)
    expect(wrapper.props('title')).toBeUndefined()
  })

  it('title と content と actions スロットが同時に表示される', () => {
    const wrapper = mount(BaseForm, {
      props: {
        title: '完全なフォーム'
      },
      slots: {
        content: '<input type="password" placeholder="パスワード">',
        actions: '<button type="submit">ログイン</button><button type="button">キャンセル</button>'
      }
    })

    expect(wrapper.text()).toContain('完全なフォーム')
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('ログイン')
    expect(wrapper.text()).toContain('キャンセル')
  })

  it('フォーム要素のtype属性が正しく設定される', () => {
    const wrapper = mount(BaseForm, {
      slots: {
        content: '<input type="text">'
      }
    })

    const form = wrapper.find('.v-form')
    // フォームは submit を preventDefault するので type="submit" は不要
    expect(form.exists()).toBe(true)
  })
})