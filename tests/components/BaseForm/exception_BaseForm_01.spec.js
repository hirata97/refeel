import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseForm from '../../src/components/base/BaseForm.vue'

describe('BaseForm - 異常系・エッジケーステスト', () => {
  it('null値のプロパティでもエラーが発生しない', () => {
    expect(() => {
      mount(BaseForm, {
        props: {
          title: null,
          containerClass: null,
          formClass: null
        },
        slots: {
          content: '<input type="text">'
        }
      })
    }).not.toThrow()
  })

  it('undefined値のプロパティでもエラーが発生しない', () => {
    expect(() => {
      mount(BaseForm, {
        props: {
          title: undefined,
          containerClass: undefined,
          formClass: undefined,
          validateOnSubmit: undefined
        },
        slots: {
          content: '<input type="text">'
        }
      })
    }).not.toThrow()
  })

  it('空文字列のプロパティでもエラーが発生しない', () => {
    const wrapper = mount(BaseForm, {
      props: {
        title: '',
        containerClass: '',
        formClass: ''
      },
      slots: {
        content: '<input type="text">'
      }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.v-form').exists()).toBe(true)
  })

  it('空のスロットでもエラーが発生しない', () => {
    expect(() => {
      mount(BaseForm, {
        slots: {
          content: '',
          actions: ''
        }
      })
    }).not.toThrow()
  })

  it('スロットが全くない場合でもエラーが発生しない', () => {
    expect(() => {
      mount(BaseForm)
    }).not.toThrow()
  })

  it('極端に長いtitleでもレンダリングエラーが発生しない', () => {
    const longTitle = 'A'.repeat(1000)
    
    expect(() => {
      mount(BaseForm, {
        props: {
          title: longTitle
        },
        slots: {
          content: '<input type="text">'
        }
      })
    }).not.toThrow()
  })

  it('HTMLタグを含むtitleが正しく処理される', () => {
    const htmlTitle = '<script>alert("XSS")</script><strong>安全なタイトル</strong>'
    
    const wrapper = mount(BaseForm, {
      props: {
        title: htmlTitle
      },
      slots: {
        content: '<input type="text">'
      }
    })

    // HTMLはエスケープされて表示される
    expect(wrapper.text()).toContain('<script>')
    expect(wrapper.text()).toContain('<strong>安全なタイトル</strong>')
  })

  it('不正なcontainerClassでもエラーが発生しない', () => {
    expect(() => {
      mount(BaseForm, {
        props: {
          containerClass: 123 // 数値
        },
        slots: {
          content: '<input type="text">'
        }
      })
    }).not.toThrow()
  })

  it('不正なformClassでもエラーが発生しない', () => {
    expect(() => {
      mount(BaseForm, {
        props: {
          formClass: ['invalid', 'array'] // 配列
        },
        slots: {
          content: '<input type="text">'
        }
      })
    }).not.toThrow()
  })

  it('validateOnSubmitがnullの場合のデフォルト動作', async () => {
    const wrapper = mount(BaseForm, {
      props: {
        validateOnSubmit: null
      },
      slots: {
        content: '<input type="text">'
      }
    })

    await wrapper.find('.v-form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeTruthy()
  })

  it('複数の不正な値が同時に設定された場合の動作', () => {
    expect(() => {
      mount(BaseForm, {
        props: {
          title: null,
          containerClass: 123,
          formClass: undefined,
          validateOnSubmit: 'invalid'
        },
        slots: {
          content: null
        }
      })
    }).not.toThrow()
  })

  it('スロット内にイベントハンドラーがある場合の動作', async () => {
    const clickHandler = vi.fn()
    
    const wrapper = mount(BaseForm, {
      slots: {
        content: '<button @click="clickHandler">テストボタン</button>'
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

  it('formRefが存在しない場合のvalidateメソッド', async () => {
    const wrapper = mount(BaseForm, {
      slots: {
        content: '<input type="text">'
      }
    })

    // コンポーネントがマウントされてからテスト
    await wrapper.vm.$nextTick()

    // formRefにアクセスしてvalidateを実行
    const result = wrapper.vm.validate()
    expect(result).toEqual({ valid: false })
  })

  it('formRefが存在しない場合のresetメソッド', async () => {
    const wrapper = mount(BaseForm, {
      slots: {
        content: '<input type="text">'
      }
    })

    await wrapper.vm.$nextTick()

    // エラーが発生しないことを確認
    expect(() => {
      wrapper.vm.reset()
    }).not.toThrow()
  })

  it('formRefが存在しない場合のresetValidationメソッド', async () => {
    const wrapper = mount(BaseForm, {
      slots: {
        content: '<input type="text">'
      }
    })

    await wrapper.vm.$nextTick()

    // エラーが発生しないことを確認
    expect(() => {
      wrapper.vm.resetValidation()
    }).not.toThrow()
  })

  it('isValid computed プロパティの初期値', () => {
    const wrapper = mount(BaseForm, {
      slots: {
        content: '<input type="text">'
      }
    })

    // isValid の初期値は false
    expect(wrapper.vm.isValid).toBe(false)
  })

  it('nested なコンポーネント構造でもエラーが発生しない', () => {
    expect(() => {
      mount(BaseForm, {
        props: {
          title: 'ネストテスト'
        },
        slots: {
          content: `
            <div>
              <fieldset>
                <legend>個人情報</legend>
                <input type="text" placeholder="名前">
                <input type="email" placeholder="メール">
              </fieldset>
              <fieldset>
                <legend>住所</legend>
                <input type="text" placeholder="郵便番号">
                <textarea placeholder="住所"></textarea>
              </fieldset>
            </div>
          `,
          actions: `
            <div>
              <button type="submit">保存</button>
              <button type="button">キャンセル</button>
              <button type="reset">リセット</button>
            </div>
          `
        }
      })
    }).not.toThrow()
  })

  it('大量のフォーム要素でもパフォーマンス問題が発生しない', () => {
    const manyInputs = Array.from({ length: 100 }, (_, i) => 
      `<input type="text" name="field${i}" placeholder="フィールド${i}">`
    ).join('')

    expect(() => {
      mount(BaseForm, {
        props: {
          title: '大量フォーム'
        },
        slots: {
          content: manyInputs
        }
      })
    }).not.toThrow()
  })

  it('特殊文字を含むクラス名でもエラーが発生しない', () => {
    expect(() => {
      mount(BaseForm, {
        props: {
          containerClass: 'test-class_123 another@class #special',
          formClass: 'form-class~special %test'
        },
        slots: {
          content: '<input type="text">'
        }
      })
    }).not.toThrow()
  })

  it('複雑なHTML構造のスロットが正常に動作する', () => {
    expect(() => {
      mount(BaseForm, {
        slots: {
          content: '<div><input type="text" /></div>',
          actions: '<div><button type="submit">送信</button></div>'
        }
      })
    }).not.toThrow()
  })
})