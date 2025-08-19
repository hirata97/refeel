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

describe('BaseAlert - 異常系・エッジケーステスト', () => {
  it('無効なtypeプロパティでもエラーが発生しない', () => {
    expect(() => {
      mount(BaseAlert, {
        props: {
          type: 'invalid-type'
        }
      })
    }).not.toThrow()
  })

  it('無効なvariantプロパティでもエラーが発生しない', () => {
    expect(() => {
      mount(BaseAlert, {
        props: {
          variant: 'invalid-variant'
        }
      })
    }).not.toThrow()
  })

  it('null値のプロパティでもエラーが発生しない', () => {
    expect(() => {
      mount(BaseAlert, {
        props: {
          message: null,
          type: null,
          variant: null,
          color: null
        }
      })
    }).not.toThrow()
  })

  it('undefined値のプロパティでもエラーが発生しない', () => {
    expect(() => {
      mount(BaseAlert, {
        props: {
          message: undefined,
          type: undefined,
          variant: undefined,
          color: undefined
        }
      })
    }).not.toThrow()
  })

  it('空文字列のmessageでもエラーが発生しない', () => {
    const wrapper = mount(BaseAlert, {
      props: {
        message: ''
      }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.v-alert').exists()).toBe(true)
  })

  it('空のスロットでもエラーが発生しない', () => {
    expect(() => {
      mount(BaseAlert, {
        slots: {
          title: '',
          default: '',
          append: ''
        }
      })
    }).not.toThrow()
  })

  it('極端に長いメッセージでもレンダリングエラーが発生しない', () => {
    const longMessage = 'A'.repeat(10000)
    
    expect(() => {
      mount(BaseAlert, {
        props: {
          message: longMessage
        }
      })
    }).not.toThrow()
  })

  it('HTMLタグを含むメッセージが正しく処理される', () => {
    const htmlMessage = '<script>alert("XSS")</script><strong>Bold</strong> Text'
    
    const wrapper = mount(BaseAlert, {
      props: {
        message: htmlMessage
      }
    })

    // HTMLはエスケープされて表示される
    expect(wrapper.text()).toContain('<script>')
    expect(wrapper.text()).toContain('<strong>Bold</strong>')
  })

  it('autoHideDelayが0の場合の動作', async () => {
    const wrapper = mount(BaseAlert, {
      props: {
        autoHide: true,
        autoHideDelay: 0,
        message: '即時非表示'
      }
    })

    // 0秒で即座に非表示になる
    vi.advanceTimersByTime(0)
    await nextTick()

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('autoHideDelayが負の数の場合の動作', () => {
    expect(() => {
      mount(BaseAlert, {
        props: {
          autoHide: true,
          autoHideDelay: -1000,
          message: '負の遅延'
        }
      })
    }).not.toThrow()
  })

  it('autoHideがfalseの場合はタイマーが設定されない', async () => {
    const wrapper = mount(BaseAlert, {
      props: {
        autoHide: false,
        autoHideDelay: 1000,
        message: '自動非表示なし'
      }
    })

    // 1秒経過しても非表示にならない
    vi.advanceTimersByTime(1000)
    await nextTick()

    expect(wrapper.find('.v-alert').exists()).toBe(true)
    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('コンポーネント破棄時にタイマーがクリアされる', async () => {
    const wrapper = mount(BaseAlert, {
      props: {
        autoHide: true,
        autoHideDelay: 5000,
        message: '破棄テスト'
      }
    })

    // タイマー設定後、コンポーネントを破棄
    wrapper.unmount()

    // タイマー経過後もエラーが発生しない
    expect(() => {
      vi.advanceTimersByTime(5000)
    }).not.toThrow()
  })

  it('クローズ後に再度表示された場合の動作', async () => {
    const wrapper = mount(BaseAlert, {
      props: {
        closable: true,
        modelValue: true,
        message: '再表示テスト'
      }
    })

    // 初期状態では表示されている
    expect(wrapper.find('.v-alert').exists()).toBe(true)

    // クローズボタンをクリック
    await wrapper.find('.v-alert__close').trigger('click')
    
    // close イベントが発火されることを確認
    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()

    // modelValue が false になったことで非表示になる
    await wrapper.setProps({ modelValue: false })
    expect(wrapper.find('.v-alert').exists()).toBe(false)

    // 再度表示
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.find('.v-alert').exists()).toBe(true)
  })

  it('autoHideとclosableが同時に有効な場合の動作', async () => {
    const wrapper = mount(BaseAlert, {
      props: {
        autoHide: true,
        autoHideDelay: 1000,
        closable: true,
        message: '自動非表示＆クローズ可能'
      }
    })

    // クローズボタンが表示されている
    expect(wrapper.find('.v-alert__close').exists()).toBe(true)

    // 手動でクローズ
    await wrapper.find('.v-alert__close').trigger('click')
    
    // クローズイベントが発火される
    expect(wrapper.emitted('close')).toBeTruthy()
    
    // 自動非表示タイマーも正常に動作する（エラーなし）
    vi.advanceTimersByTime(1000)
    await nextTick()
  })

  it('modelValueの変更が連続して行われた場合の動作', async () => {
    const wrapper = mount(BaseAlert, {
      props: {
        modelValue: true,
        message: '連続変更テスト'
      }
    })

    // 連続してmodelValueを変更
    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })

    expect(wrapper.find('.v-alert').exists()).toBe(true)
  })

  it('iconプロパティがfalseの場合の動作', () => {
    const wrapper = mount(BaseAlert, {
      props: {
        icon: false,
        message: 'アイコンなし'
      }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.v-alert').exists()).toBe(true)
  })

  it('複数の無効な値が同時に設定された場合の動作', () => {
    expect(() => {
      mount(BaseAlert, {
        props: {
          message: null,
          type: 'invalid',
          variant: undefined,
          color: '',
          icon: null,
          autoHideDelay: -1,
          closable: undefined
        }
      })
    }).not.toThrow()
  })

  it('v-modelのupdate:modelValueイベントが適切に発火される', async () => {
    const wrapper = mount(BaseAlert, {
      props: {
        modelValue: true,
        closable: true,
        message: 'v-modelテスト'
      }
    })

    // クローズボタンをクリック
    await wrapper.find('.v-alert__close').trigger('click')

    // update:modelValueイベントがfalseで発火されることを確認
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0][0]).toBe(false)
  })

  it('スロット内にイベントハンドラーがある場合の動作', async () => {
    const clickHandler = vi.fn()
    
    const wrapper = mount(BaseAlert, {
      props: {
        message: 'イベントテスト'
      },
      slots: {
        append: '<button @click="clickHandler">テストボタン</button>'
      },
      global: {
        mocks: {
          clickHandler
        }
      }
    })

    // スロット内のボタンクリックは正常に動作する
    expect(() => {
      wrapper.find('button').trigger('click')
    }).not.toThrow()
  })
})