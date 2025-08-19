import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import BaseCard from '../../src/components/base/BaseCard.vue'

const vuetify = createVuetify()

const createWrapper = (props = {}, slots = {}) => {
  return mount(BaseCard, {
    global: {
      plugins: [vuetify]
    },
    props,
    slots
  })
}

describe('BaseCard - 正常系', () => {
  it('デフォルトプロパティで正常にレンダリングされる', () => {
    const wrapper = createWrapper()
    
    expect(wrapper.find('.base-card').exists()).toBe(true)
    expect(wrapper.find('.v-card').exists()).toBe(true)
  })

  it('titleプロパティが正常に表示される', () => {
    const wrapper = createWrapper({ title: 'テストタイトル' })
    
    expect(wrapper.find('.base-card-title').exists()).toBe(true)
    expect(wrapper.find('.base-card-title').text()).toBe('テストタイトル')
  })

  it('subtitleプロパティが正常に表示される', () => {
    const wrapper = createWrapper({ subtitle: 'テストサブタイトル' })
    
    expect(wrapper.find('.base-card-subtitle').exists()).toBe(true)
    expect(wrapper.find('.base-card-subtitle').text()).toBe('テストサブタイトル')
  })

  it('elevationプロパティが正常に設定される', () => {
    const wrapper = createWrapper({ elevation: 5 })
    
    expect(wrapper.props('elevation')).toBe(5)
  })

  it('variantプロパティが正常に設定される', () => {
    const wrapper = createWrapper({ variant: 'outlined' })
    
    expect(wrapper.props('variant')).toBe('outlined')
  })

  it('colorプロパティが正常に設定される', () => {
    const wrapper = createWrapper({ color: 'primary' })
    
    expect(wrapper.props('color')).toBe('primary')
  })

  it('デフォルトスロットのコンテンツが正常に表示される', () => {
    const wrapper = createWrapper({}, {
      default: '<p>デフォルトスロットの内容</p>'
    })
    
    expect(wrapper.find('.base-card-content').exists()).toBe(true)
    expect(wrapper.find('.base-card-content p').text()).toBe('デフォルトスロットの内容')
  })

  it('titleスロットのコンテンツが正常に表示される', () => {
    const wrapper = createWrapper({}, {
      title: '<span>カスタムタイトル</span>'
    })
    
    expect(wrapper.find('.base-card-title').exists()).toBe(true)
    expect(wrapper.find('.base-card-title span').text()).toBe('カスタムタイトル')
  })

  it('subtitleスロットのコンテンツが正常に表示される', () => {
    const wrapper = createWrapper({}, {
      subtitle: '<span>カスタムサブタイトル</span>'
    })
    
    expect(wrapper.find('.base-card-subtitle').exists()).toBe(true)
    expect(wrapper.find('.base-card-subtitle span').text()).toBe('カスタムサブタイトル')
  })

  it('actionsスロットのコンテンツが正常に表示される', () => {
    const wrapper = createWrapper({}, {
      actions: '<button>アクションボタン</button>'
    })
    
    expect(wrapper.find('.base-card-actions').exists()).toBe(true)
    expect(wrapper.find('.base-card-actions button').text()).toBe('アクションボタン')
  })

  it('複数のスロットが同時に使用できる', () => {
    const wrapper = createWrapper({}, {
      title: 'スロットタイトル',
      subtitle: 'スロットサブタイトル',
      default: '<p>メインコンテンツ</p>',
      actions: '<button>アクション</button>'
    })
    
    expect(wrapper.find('.base-card-title').text()).toBe('スロットタイトル')
    expect(wrapper.find('.base-card-subtitle').text()).toBe('スロットサブタイトル')
    expect(wrapper.find('.base-card-content p').text()).toBe('メインコンテンツ')
    expect(wrapper.find('.base-card-actions button').text()).toBe('アクション')
  })

  it('titleプロパティよりもtitleスロットが優先される', () => {
    const wrapper = createWrapper(
      { title: 'プロパティタイトル' },
      { title: 'スロットタイトル' }
    )
    
    expect(wrapper.find('.base-card-title').text()).toBe('スロットタイトル')
  })

  it('subtitleプロパティよりもsubtitleスロットが優先される', () => {
    const wrapper = createWrapper(
      { subtitle: 'プロパティサブタイトル' },
      { subtitle: 'スロットサブタイトル' }
    )
    
    expect(wrapper.find('.base-card-subtitle').text()).toBe('スロットサブタイトル')
  })
})