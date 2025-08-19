import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import BaseCard from '@/components/base/BaseCard.vue'

// Vuetifyの設定
const vuetify = createVuetify()

describe('BaseCard', () => {
  const createWrapper = (props = {}, slots = {}) => {
    return mount(BaseCard, {
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
      const card = wrapper.findComponent({ name: 'VCard' })
      
      expect(card.props('elevation')).toBe(2)
      expect(card.props('variant')).toBe('elevated')
      expect(card.props('color')).toBeUndefined()
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
      const card = wrapper.findComponent({ name: 'VCard' })
      
      expect(card.props('elevation')).toBe(4)
      expect(card.props('variant')).toBe('outlined')
      expect(card.props('color')).toBe('primary')
    })

    it('elevation プロパティのバリエーションが適用される', () => {
      const elevations = [0, 1, 2, 4, 8, 12, 16, 24]
      
      elevations.forEach(elevation => {
        const wrapper = createWrapper({ elevation })
        const card = wrapper.findComponent({ name: 'VCard' })
        expect(card.props('elevation')).toBe(elevation)
      })
    })

    it('variant プロパティのバリエーションが適用される', () => {
      const variants = ['elevated', 'flat', 'tonal', 'outlined', 'text', 'plain'] as const
      
      variants.forEach(variant => {
        const wrapper = createWrapper({ variant })
        const card = wrapper.findComponent({ name: 'VCard' })
        expect(card.props('variant')).toBe(variant)
      })
    })

    it('color プロパティが適用される', () => {
      const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info']
      
      colors.forEach(color => {
        const wrapper = createWrapper({ color })
        const card = wrapper.findComponent({ name: 'VCard' })
        expect(card.props('color')).toBe(color)
      })
    })
  })

  describe('Title Display', () => {
    it('titleプロパティが設定されている場合、タイトルが表示される', () => {
      const title = 'テストタイトル'
      const wrapper = createWrapper({ title })
      
      const cardTitle = wrapper.findComponent({ name: 'VCardTitle' })
      expect(cardTitle.exists()).toBe(true)
      expect(cardTitle.text()).toBe(title)
      expect(cardTitle.classes()).toContain('base-card-title')
    })

    it('titleプロパティが設定されていない場合、タイトルが表示されない', () => {
      const wrapper = createWrapper()
      
      const cardTitle = wrapper.findComponent({ name: 'VCardTitle' })
      expect(cardTitle.exists()).toBe(false)
    })

    it('titleスロットがある場合、タイトルが表示される', () => {
      const titleContent = 'スロットタイトル'
      const wrapper = createWrapper({}, { title: titleContent })
      
      const cardTitle = wrapper.findComponent({ name: 'VCardTitle' })
      expect(cardTitle.exists()).toBe(true)
      expect(cardTitle.text()).toBe(titleContent)
    })

    it('titleスロットがtitleプロパティをオーバーライドする', () => {
      const titleProp = 'プロパティタイトル'
      const titleSlot = 'スロットタイトル'
      
      const wrapper = createWrapper({ title: titleProp }, { title: titleSlot })
      
      const cardTitle = wrapper.findComponent({ name: 'VCardTitle' })
      expect(cardTitle.text()).toBe(titleSlot)
      expect(cardTitle.text()).not.toBe(titleProp)
    })
  })

  describe('Subtitle Display', () => {
    it('subtitleプロパティが設定されている場合、サブタイトルが表示される', () => {
      const subtitle = 'テストサブタイトル'
      const wrapper = createWrapper({ subtitle })
      
      const cardSubtitle = wrapper.findComponent({ name: 'VCardSubtitle' })
      expect(cardSubtitle.exists()).toBe(true)
      expect(cardSubtitle.text()).toBe(subtitle)
      expect(cardSubtitle.classes()).toContain('base-card-subtitle')
    })

    it('subtitleプロパティが設定されていない場合、サブタイトルが表示されない', () => {
      const wrapper = createWrapper()
      
      const cardSubtitle = wrapper.findComponent({ name: 'VCardSubtitle' })
      expect(cardSubtitle.exists()).toBe(false)
    })

    it('subtitleスロットがある場合、サブタイトルが表示される', () => {
      const subtitleContent = 'スロットサブタイトル'
      const wrapper = createWrapper({}, { subtitle: subtitleContent })
      
      const cardSubtitle = wrapper.findComponent({ name: 'VCardSubtitle' })
      expect(cardSubtitle.exists()).toBe(true)
      expect(cardSubtitle.text()).toBe(subtitleContent)
    })

    it('subtitleスロットがsubtitleプロパティをオーバーライドする', () => {
      const subtitleProp = 'プロパティサブタイトル'
      const subtitleSlot = 'スロットサブタイトル'
      
      const wrapper = createWrapper({ subtitle: subtitleProp }, { subtitle: subtitleSlot })
      
      const cardSubtitle = wrapper.findComponent({ name: 'VCardSubtitle' })
      expect(cardSubtitle.text()).toBe(subtitleSlot)
      expect(cardSubtitle.text()).not.toBe(subtitleProp)
    })
  })

  describe('Content Display', () => {
    it('デフォルトスロットがある場合、コンテンツが表示される', () => {
      const content = 'カードコンテンツ'
      const wrapper = createWrapper({}, { default: content })
      
      const cardText = wrapper.findComponent({ name: 'VCardText' })
      expect(cardText.exists()).toBe(true)
      expect(cardText.text()).toBe(content)
      expect(cardText.classes()).toContain('base-card-content')
    })

    it('デフォルトスロットがない場合、コンテンツが表示されない', () => {
      const wrapper = createWrapper()
      
      const cardText = wrapper.findComponent({ name: 'VCardText' })
      expect(cardText.exists()).toBe(false)
    })

    it('HTML要素をコンテンツに含めることができる', () => {
      const htmlContent = '<p>段落テキスト</p><ul><li>リスト項目</li></ul>'
      const wrapper = createWrapper({}, { default: htmlContent })
      
      expect(wrapper.html()).toContain('<p>段落テキスト</p>')
      expect(wrapper.html()).toContain('<ul><li>リスト項目</li></ul>')
    })
  })

  describe('Actions Display', () => {
    it('actionsスロットがある場合、アクションが表示される', () => {
      const actions = '<button>アクション</button>'
      const wrapper = createWrapper({}, { actions })
      
      const cardActions = wrapper.findComponent({ name: 'VCardActions' })
      expect(cardActions.exists()).toBe(true)
      expect(cardActions.html()).toContain('<button>アクション</button>')
      expect(cardActions.classes()).toContain('base-card-actions')
    })

    it('actionsスロットがない場合、アクションが表示されない', () => {
      const wrapper = createWrapper()
      
      const cardActions = wrapper.findComponent({ name: 'VCardActions' })
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
      const card = wrapper.findComponent({ name: 'VCard' })
      
      expect(card.classes()).toContain('base-card')
    })

    it('タイトルにbase-card-titleクラスが適用される', () => {
      const wrapper = createWrapper({ title: 'タイトル' })
      const cardTitle = wrapper.findComponent({ name: 'VCardTitle' })
      
      expect(cardTitle.classes()).toContain('base-card-title')
    })

    it('サブタイトルにbase-card-subtitleクラスが適用される', () => {
      const wrapper = createWrapper({ subtitle: 'サブタイトル' })
      const cardSubtitle = wrapper.findComponent({ name: 'VCardSubtitle' })
      
      expect(cardSubtitle.classes()).toContain('base-card-subtitle')
    })

    it('コンテンツにbase-card-contentクラスが適用される', () => {
      const wrapper = createWrapper({}, { default: 'コンテンツ' })
      const cardText = wrapper.findComponent({ name: 'VCardText' })
      
      expect(cardText.classes()).toContain('base-card-content')
    })

    it('アクションにbase-card-actionsクラスが適用される', () => {
      const wrapper = createWrapper({}, { actions: '<button>アクション</button>' })
      const cardActions = wrapper.findComponent({ name: 'VCardActions' })
      
      expect(cardActions.classes()).toContain('base-card-actions')
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
      
      expect(wrapper.findComponent({ name: 'VCardTitle' }).text()).toBe('スロットタイトル')
      expect(wrapper.findComponent({ name: 'VCardSubtitle' }).text()).toBe('スロットサブタイトル')
      expect(wrapper.findComponent({ name: 'VCardText' }).text()).toBe('スロットコンテンツ')
      expect(wrapper.findComponent({ name: 'VCardActions' }).html()).toContain('<button>スロットアクション</button>')
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
      
      expect(wrapper.findComponent({ name: 'VCardTitle' }).text()).toBe('プロパティタイトル')
      expect(wrapper.findComponent({ name: 'VCardSubtitle' }).text()).toBe('プロパティサブタイトル')
      expect(wrapper.findComponent({ name: 'VCardText' }).text()).toBe('スロットコンテンツ')
      expect(wrapper.findComponent({ name: 'VCardActions' }).html()).toContain('<button>スロットアクション</button>')
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
      const card = wrapper.findComponent({ name: 'VCard' })
      
      expect(card.props('elevation')).toBe(8)
      expect(card.props('variant')).toBe('tonal')
      expect(card.props('color')).toBe('secondary')
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
      
      // 空文字列でもタイトル要素は表示される（v-ifの条件により）
      expect(wrapper.findComponent({ name: 'VCardTitle' }).exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'VCardSubtitle' }).exists()).toBe(false)
    })

    it('elevationが0の場合も正常に動作する', () => {
      const wrapper = createWrapper({ elevation: 0 })
      const card = wrapper.findComponent({ name: 'VCard' })
      
      expect(card.props('elevation')).toBe(0)
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
      
      expect(wrapper.findComponent({ name: 'VCardTitle' }).text()).toBe('スロットタイトル')
      expect(wrapper.findComponent({ name: 'VCardSubtitle' }).text()).toBe('スロットサブタイトル')
    })
  })
})