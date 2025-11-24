import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from '../../src/components/base/BaseButton.vue'

describe('BaseButton - 異常系・エッジケーステスト', () => {
  it('disabledが true の場合、クリックイベントが発火されない', async () => {
    const wrapper = mount(BaseButton, {
      props: {
        disabled: true
      },
      slots: {
        default: 'Disabled Button'
      }
    })

    // disabled状態の確認
    const btn = wrapper.find('.v-btn')
    expect(btn.classes()).toContain('v-btn--disabled')

    // クリックを試行
    await wrapper.find('.v-btn').trigger('click')
    
    // Vuetifyのv-btnはdisabled状態でクリックイベントを発火しないか確認
    // この動作はVuetifyの仕様に依存する
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('loadingが true の場合でもクリックイベントは発火される', async () => {
    const wrapper = mount(BaseButton, {
      props: {
        loading: true
      },
      slots: {
        default: 'Loading Button'
      }
    })

    const btn = wrapper.find('.v-btn')
    expect(btn.classes()).toContain('v-btn--loading')

    await wrapper.find('.v-btn').trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('無効なcolorプロパティでもエラーが発生しない', () => {
    expect(() => {
      mount(BaseButton, {
        props: {
          color: 'invalid-color'
        }
      })
    }).not.toThrow()
  })

  it('無効なvariantプロパティでもエラーが発生しない', () => {
    expect(() => {
      mount(BaseButton, {
        props: {
          variant: 'invalid-variant'
        }
      })
    }).not.toThrow()
  })

  it('無効なsizeプロパティでもエラーが発生しない', () => {
    expect(() => {
      mount(BaseButton, {
        props: {
          size: 'invalid-size'
        }
      })
    }).not.toThrow()
  })

  it('無効なtypeプロパティでもエラーが発生しない', () => {
    expect(() => {
      mount(BaseButton, {
        props: {
          type: 'invalid-type'
        }
      })
    }).not.toThrow()
  })

  it('空のスロットでもエラーが発生しない', () => {
    expect(() => {
      mount(BaseButton, {})
    }).not.toThrow()
  })

  it('null値のプロパティでもエラーが発生しない', () => {
    expect(() => {
      mount(BaseButton, {
        props: {
          color: null,
          variant: null,
          size: null
        }
      })
    }).not.toThrow()
  })

  it('undefined値のプロパティでもエラーが発生しない', () => {
    expect(() => {
      mount(BaseButton, {
        props: {
          color: undefined,
          variant: undefined,
          size: undefined
        }
      })
    }).not.toThrow()
  })

  it('loading と disabled が同時に true の場合の動作', () => {
    const wrapper = mount(BaseButton, {
      props: {
        loading: true,
        disabled: true
      },
      slots: {
        default: 'Loading & Disabled'
      }
    })

    const btn = wrapper.find('.v-btn')
    expect(btn.classes()).toContain('v-btn--loading')
    expect(btn.classes()).toContain('v-btn--disabled')
  })

  it('極端に長いテキストでもレンダリングエラーが発生しない', () => {
    const longText = 'A'.repeat(1000)
    
    expect(() => {
      mount(BaseButton, {
        slots: {
          default: longText
        }
      })
    }).not.toThrow()
  })

  it('HTMLタグを含むスロットコンテンツが正しく処理される', () => {
    const htmlContent = '<strong>Bold</strong> <em>Italic</em> Text'
    
    const wrapper = mount(BaseButton, {
      slots: {
        default: htmlContent
      }
    })

    expect(wrapper.html()).toContain('<strong>Bold</strong>')
    expect(wrapper.html()).toContain('<em>Italic</em>')
  })
})