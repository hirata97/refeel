import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseCard from '@shared/components/base/BaseCard.vue'

describe('BaseCard', () => {
  const createWrapper = (props = {}, slots = {}) => {
    return mount(BaseCard, {
      props,
      slots
    })
  }

  describe('Props', () => {
    it('デフォルトプロパティが正しく設定される', () => {
      const wrapper = createWrapper()
      const card = wrapper.find('.v-card')
      
      expect(card.exists()).toBe(true)
      expect(card.classes()).toContain('v-card')
    })

    it('カスタムプロパティが正しく適用される', () => {
      const props = {
        title: 'カードタイトル',
        subtitle: 'カードサブタイトル',
        elevation: 4,
        variant: 'outlined' as const,
        color: 'primary'
      }
      
      const wrapper = createWrapper(props)
      const card = wrapper.find('.v-card')
      
      expect(card.exists()).toBe(true)
      expect(wrapper.text()).toContain('カードタイトル')
      expect(wrapper.text()).toContain('カードサブタイトル')
    })

    it('elevation プロパティが正しく処理される', () => {
      const wrapper = createWrapper({ elevation: 4 })
      const card = wrapper.find('.v-card')
      expect(card.exists()).toBe(true)
    })

    it('variant プロパティが正しく処理される', () => {
      const wrapper = createWrapper({ variant: 'outlined' })
      const card = wrapper.find('.v-card')
      expect(card.exists()).toBe(true)
    })

    it('color プロパティが正しく処理される', () => {
      const wrapper = createWrapper({ color: 'primary' })
      const card = wrapper.find('.v-card')
      expect(card.exists()).toBe(true)
    })
  })

  describe('Title Display', () => {
    it('titleプロパティが設定されている場合、タイトルが表示される', () => {
      const title = 'テストタイトル'
      const wrapper = createWrapper({ title })
      
      const cardTitle = wrapper.find('.v-card-title')
      expect(cardTitle.exists()).toBe(true)
      expect(cardTitle.text()).toBe(title)
    })

    it('titleプロパティが設定されていない場合、タイトルが表示されない', () => {
      const wrapper = createWrapper()
      
      const cardTitle = wrapper.find('.v-card-title')
      expect(cardTitle.exists()).toBe(false)
    })

    it('titleスロットがある場合、タイトルが表示される', () => {
      const titleContent = 'スロットタイトル'
      const wrapper = createWrapper({}, { title: titleContent })
      
      const cardTitle = wrapper.find('.v-card-title')
      expect(cardTitle.exists()).toBe(true)
      expect(cardTitle.text()).toBe(titleContent)
    })

    it('titleスロットがtitleプロパティをオーバーライドする', () => {
      const titleProp = 'プロパティタイトル'
      const titleSlot = 'スロットタイトル'
      
      const wrapper = createWrapper({ title: titleProp }, { title: titleSlot })
      
      const cardTitle = wrapper.find('.v-card-title')
      expect(cardTitle.text()).toBe(titleSlot)
      expect(cardTitle.text()).not.toBe(titleProp)
    })
  })

  describe('Subtitle Display', () => {
    it('subtitleプロパティが設定されている場合、サブタイトルが表示される', () => {
      const subtitle = 'テストサブタイトル'
      const wrapper = createWrapper({ subtitle })
      
      const cardSubtitle = wrapper.find('.v-card-subtitle')
      expect(cardSubtitle.exists()).toBe(true)
      expect(cardSubtitle.text()).toBe(subtitle)
    })

    it('subtitleプロパティが設定されていない場合、サブタイトルが表示されない', () => {
      const wrapper = createWrapper()
      
      const cardSubtitle = wrapper.find('.v-card-subtitle')
      expect(cardSubtitle.exists()).toBe(false)
    })

    it('subtitleスロットがある場合、サブタイトルが表示される', () => {
      const subtitleContent = 'スロットサブタイトル'
      const wrapper = createWrapper({}, { subtitle: subtitleContent })
      
      const cardSubtitle = wrapper.find('.v-card-subtitle')
      expect(cardSubtitle.exists()).toBe(true)
      expect(cardSubtitle.text()).toBe(subtitleContent)
    })

    it('subtitleスロットがsubtitleプロパティをオーバーライドする', () => {
      const subtitleProp = 'プロパティサブタイトル'
      const subtitleSlot = 'スロットサブタイトル'
      
      const wrapper = createWrapper({ subtitle: subtitleProp }, { subtitle: subtitleSlot })
      
      const cardSubtitle = wrapper.find('.v-card-subtitle')
      expect(cardSubtitle.text()).toBe(subtitleSlot)
      expect(cardSubtitle.text()).not.toBe(subtitleProp)
    })
  })

  describe('Content Display', () => {
    it('デフォルトスロットがある場合、コンテンツが表示される', () => {
      const content = 'カードコンテンツ'
      const wrapper = createWrapper({}, { default: content })
      
      const cardText = wrapper.find('.v-card-text')
      expect(cardText.exists()).toBe(true)
      expect(cardText.text()).toBe(content)
    })

    it('デフォルトスロットがない場合、コンテンツが表示されない', () => {
      const wrapper = createWrapper()
      
      const cardText = wrapper.find('.v-card-text')
      expect(cardText.exists()).toBe(false)
    })

    it('HTML要素をコンテンツに含めることができる', () => {
      const htmlContent = '<p>段落テキスト</p><ul><li>リスト項目</li></ul>'
      const wrapper = createWrapper({}, { default: htmlContent })
      
      expect(wrapper.html()).toContain('<p>段落テキスト</p>')
      expect(wrapper.html()).toContain('<li>リスト項目</li>')
    })
  })

  describe('Actions Display', () => {
    it('actionsスロットがある場合、アクションが表示される', () => {
      const actions = '<button>アクション</button>'
      const wrapper = createWrapper({}, { actions })
      
      const cardActions = wrapper.find('.v-card-actions')
      expect(cardActions.exists()).toBe(true)
      expect(cardActions.html()).toContain('<button>アクション</button>')
    })

    it('actionsスロットがない場合、アクションが表示されない', () => {
      const wrapper = createWrapper()
      
      const cardActions = wrapper.find('.v-card-actions')
      expect(cardActions.exists()).toBe(false)
    })

    it('複数のアクションボタンを含めることができる', () => {
      const actions = `
        <button>キャンセル</button>
        <button>保存</button>
      `
      const wrapper = createWrapper({}, { actions })
      
      expect(wrapper.html()).toContain('<button>キャンセル</button>')
      expect(wrapper.html()).toContain('<button>保存</button>')
    })
  })

  describe('CSS Classes and Styles', () => {
    it('base-cardクラスが適用される', () => {
      const wrapper = createWrapper()
      const card = wrapper.find('.v-card')
      
      expect(card.exists()).toBe(true)
    })

    it('コンポーネントが正しくレンダリングされる', () => {
      const wrapper = createWrapper({ 
        title: 'タイトル',
        subtitle: 'サブタイトル'
      }, { 
        default: 'コンテンツ',
        actions: '<button>アクション</button>'
      })
      
      expect(wrapper.find('.v-card-title').exists()).toBe(true)
      expect(wrapper.find('.v-card-subtitle').exists()).toBe(true)
      expect(wrapper.find('.v-card-text').exists()).toBe(true)
      expect(wrapper.find('.v-card-actions').exists()).toBe(true)
    })
  })

  describe('Slots Combination', () => {
    it('すべてのスロットを同時に使用できる', () => {
      const slots = {
        title: 'スロットタイトル',
        subtitle: 'スロットサブタイトル',
        default: 'スロットコンテンツ',
        actions: '<button>スロットアクション</button>'
      }
      
      const wrapper = createWrapper({}, slots)
      
      expect(wrapper.find('.v-card-title').text()).toBe('スロットタイトル')
      expect(wrapper.find('.v-card-subtitle').text()).toBe('スロットサブタイトル')
      expect(wrapper.find('.v-card-text').text()).toBe('スロットコンテンツ')
      expect(wrapper.find('.v-card-actions').html()).toContain('<button>スロットアクション</button>')
    })

    it('プロパティとスロットを組み合わせて使用できる', () => {
      const props = {
        title: 'プロパティタイトル',
        subtitle: 'プロパティサブタイトル'
      }
      
      const slots = {
        default: 'スロットコンテンツ',
        actions: '<button>スロットアクション</button>'
      }
      
      const wrapper = createWrapper(props, slots)
      
      expect(wrapper.find('.v-card-title').text()).toBe('プロパティタイトル')
      expect(wrapper.find('.v-card-subtitle').text()).toBe('プロパティサブタイトル')
      expect(wrapper.find('.v-card-text').text()).toBe('スロットコンテンツ')
      expect(wrapper.find('.v-card-actions').html()).toContain('<button>スロットアクション</button>')
    })
  })

  describe('Edge Cases', () => {
    it('すべてのプロパティを同時に設定できる', () => {
      const props = {
        title: 'フルカード',
        subtitle: 'すべての機能',
        elevation: 8,
        variant: 'tonal' as const,
        color: 'secondary'
      }
      
      const wrapper = createWrapper(props)
      const card = wrapper.find('.v-card')
      
      expect(card.exists()).toBe(true)
      expect(wrapper.text()).toContain('フルカード')
      expect(wrapper.text()).toContain('すべての機能')
    })

    it('空の文字列プロパティでも正常に動作する', () => {
      const props = {
        title: '',
        subtitle: '',
        color: ''
      }
      
      const wrapper = createWrapper(props)
      
      // 空文字列ではタイトル要素は表示されない
      expect(wrapper.find('.v-card-title').exists()).toBe(false)
      expect(wrapper.find('.v-card-subtitle').exists()).toBe(false)
    })

    it('スロットと対応するプロパティが両方ある場合、スロットが優先される', () => {
      const props = {
        title: 'プロパティタイトル',
        subtitle: 'プロパティサブタイトル'
      }
      
      const slots = {
        title: 'スロットタイトル',
        subtitle: 'スロットサブタイトル'
      }
      
      const wrapper = createWrapper(props, slots)
      
      expect(wrapper.find('.v-card-title').text()).toBe('スロットタイトル')
      expect(wrapper.find('.v-card-subtitle').text()).toBe('スロットサブタイトル')
    })
  })
})