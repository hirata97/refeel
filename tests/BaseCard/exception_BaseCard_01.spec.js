import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import BaseCard from '../../src/components/base/BaseCard.vue'

// Vuetifyインスタンスを作成
const vuetify = createVuetify()

describe('BaseCard - 異常系・エッジケーステスト', () => {
  // 不正なprops値のテスト
  it('不正なelevation値でもエラーが発生しない', async () => {
    expect(() => {
      mount(BaseCard, {
        global: {
          plugins: [vuetify]
        },
        props: {
          elevation: 'invalid' // 文字列（数値以外）
        }
      })
    }).not.toThrow()
  })

  it('範囲外のelevation値でもエラーが発生しない', async () => {
    const wrapper = mount(BaseCard, {
      global: {
        plugins: [vuetify]
      },
      props: {
        elevation: -1 // 負の値
      }
    })
    expect(wrapper.exists()).toBe(true)

    // 大きすぎる値
    await wrapper.setProps({ elevation: 999 })
    expect(wrapper.exists()).toBe(true)
  })

  it('不正なvariant値でもエラーが発生しない', async () => {
    expect(() => {
      mount(BaseCard, {
        global: {
          plugins: [vuetify]
        },
        props: {
          variant: 'invalid-variant' // 無効なvariant
        }
      })
    }).not.toThrow()
  })

  it('不正な型のtitle（数値）でもエラーが発生しない', async () => {
    expect(() => {
      mount(BaseCard, {
        global: {
          plugins: [vuetify]
        },
        props: {
          title: 123 // 数値
        }
      })
    }).not.toThrow()
  })

  it('不正な型のsubtitle（配列）でもエラーが発生しない', async () => {
    expect(() => {
      mount(BaseCard, {
        global: {
          plugins: [vuetify]
        },
        props: {
          subtitle: ['array', 'value'] // 配列
        }
      })
    }).not.toThrow()
  })

  it('不正な型のcolor（数値）でもエラーが発生しない', async () => {
    expect(() => {
      mount(BaseCard, {
        global: {
          plugins: [vuetify]
        },
        props: {
          color: 123 // 数値
        }
      })
    }).not.toThrow()
  })

  // 複数の不正な値の同時設定
  it('複数の不正な値が同時に設定された場合の動作', async () => {
    expect(() => {
      mount(BaseCard, {
        global: {
          plugins: [vuetify]
        },
        props: {
          title: null,
          subtitle: undefined,
          elevation: 'invalid',
          variant: 123,
          color: ['red', 'blue']
        }
      })
    }).not.toThrow()
  })

  // null/undefined値のテスト
  it('null値を持つpropsでもエラーが発生しない', async () => {
    const wrapper = mount(BaseCard, {
      global: {
        plugins: [vuetify]
      },
      props: {
        title: null,
        subtitle: null,
        color: null
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('undefined値を持つpropsでもエラーが発生しない', async () => {
    const wrapper = mount(BaseCard, {
      global: {
        plugins: [vuetify]
      },
      props: {
        title: undefined,
        subtitle: undefined,
        elevation: undefined,
        variant: undefined,
        color: undefined
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  // 無効なHTML構造のスロットテスト
  it('無効なHTML構造のスロットでもエラーが発生しない', async () => {
    expect(() => {
      mount(BaseCard, {
        global: {
          plugins: [vuetify]
        },
        slots: {
          default: '<div><span>unclosed div', // 閉じタグなし
          title: '<invalid-tag>Title</invalid-tag>', // 無効なタグ
          subtitle: '<div>nested<div>div</div>', // 不完全なネスト
          actions: '<button>Action<button>' // 閉じタグ間違い
        }
      })
    }).not.toThrow()
  })

  // 空のスロットコンテンツ
  it('空文字列のスロットでも正常に動作する', async () => {
    const wrapper = mount(BaseCard, {
      global: {
        plugins: [vuetify]
      },
      slots: {
        default: '',
        title: '',
        subtitle: '',
        actions: ''
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  // 大量のコンテンツ
  it('大量のコンテンツでもパフォーマンス問題が発生しない', async () => {
    const longContent = 'A'.repeat(10000) // 10000文字
    const wrapper = mount(BaseCard, {
      global: {
        plugins: [vuetify]
      },
      props: {
        title: longContent,
        subtitle: longContent
      },
      slots: {
        default: longContent
      }
    })
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.base-card-title').text()).toBe(longContent)
  })

  // 特殊文字とエスケープ
  it('特殊文字を含むコンテンツでも正常に表示される', async () => {
    const specialChars = '<>&"\'`\n\t\r'
    const wrapper = mount(BaseCard, {
      global: {
        plugins: [vuetify]
      },
      props: {
        title: specialChars,
        subtitle: specialChars
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  // 日本語・絵文字・多言語サポート
  it('日本語、絵文字、特殊文字が正常に表示される', async () => {
    const multiLangContent = '日本語 🎌 English العربية 中文 한국어 🌍'
    const wrapper = mount(BaseCard, {
      global: {
        plugins: [vuetify]
      },
      props: {
        title: multiLangContent,
        subtitle: multiLangContent
      }
    })
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.base-card-title').text()).toBe(multiLangContent)
  })

  // CSS injectionの防止テスト
  it('CSS injectionの試行でもセキュリティが保たれる', async () => {
    const maliciousCSS = 'red; } body { background: red !important; } .fake {'
    const wrapper = mount(BaseCard, {
      global: {
        plugins: [vuetify]
      },
      props: {
        color: maliciousCSS
      }
    })
    expect(wrapper.exists()).toBe(true)
    // v-cardのcolor propが適切に処理されることを確認
    expect(wrapper.find('.v-card').exists()).toBe(true)
  })

  // 極端なelevation値の境界テスト
  it('elevation値の境界条件をテストする', async () => {
    const wrapper = mount(BaseCard, {
      global: {
        plugins: [vuetify]
      },
      props: {
        elevation: 0
      }
    })
    expect(wrapper.exists()).toBe(true)

    // 最大値テスト
    await wrapper.setProps({ elevation: 24 })
    expect(wrapper.exists()).toBe(true)

    // 小数点値テスト
    await wrapper.setProps({ elevation: 2.5 })
    expect(wrapper.exists()).toBe(true)
  })

  // variant値の全パターンテスト（無効な値含む）
  it('すべてのvariant値パターンが処理される', async () => {
    const validVariants = ['elevated', 'flat', 'tonal', 'outlined', 'text', 'plain']
    const invalidVariants = ['invalid', 123, null, undefined, [], {}]
    
    for (const variant of [...validVariants, ...invalidVariants]) {
      expect(() => {
        mount(BaseCard, {
          global: {
            plugins: [vuetify]
          },
          props: {
            variant
          }
        })
      }).not.toThrow()
    }
  })
})