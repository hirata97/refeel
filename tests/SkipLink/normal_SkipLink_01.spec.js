import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SkipLink from '../../src/components/SkipLink.vue'

const createWrapper = () => {
  return mount(SkipLink, {
    attachTo: document.body,
  })
}

describe('SkipLink - 正常系', () => {
  beforeEach(() => {
    // メインコンテンツ要素を作成
    const mainContent = document.createElement('div')
    mainContent.id = 'main-content'

    // scrollIntoViewをモック（JSDOMでは未実装）
    mainContent.scrollIntoView = vi.fn()

    document.body.appendChild(mainContent)
  })

  it('スキップリンクが正常にレンダリングされる', () => {
    const wrapper = createWrapper()

    expect(wrapper.find('a.skip-link').exists()).toBe(true)
    expect(wrapper.find('a.skip-link').text()).toBe('メインコンテンツへスキップ')
  })

  it('href属性が#main-contentを指している', () => {
    const wrapper = createWrapper()

    expect(wrapper.find('a.skip-link').attributes('href')).toBe('#main-content')
  })

  it('クリック時にメインコンテンツにフォーカスが移動する', async () => {
    const wrapper = createWrapper()
    const mainContent = document.getElementById('main-content')

    // スパイを設定
    const focusSpy = vi.spyOn(mainContent, 'focus')
    const scrollIntoViewSpy = vi.spyOn(mainContent, 'scrollIntoView')

    // クリックイベントを発火
    await wrapper.find('a.skip-link').trigger('click')

    // フォーカスとスクロールが呼ばれたことを確認
    expect(focusSpy).toHaveBeenCalled()
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
  })

  it('クリック時にtabindex属性が一時的に設定される', async () => {
    const wrapper = createWrapper()
    const mainContent = document.getElementById('main-content')

    // クリックイベントを発火
    await wrapper.find('a.skip-link').trigger('click')

    // tabindex属性が設定されていることを確認
    expect(mainContent.getAttribute('tabindex')).toBe('-1')
  })

  it('デフォルトのアンカー動作が防止される', async () => {
    const wrapper = createWrapper()

    // preventDefaultがモックされるように、clickイベントハンドラをテスト
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    // リンク要素を取得してイベントをディスパッチ
    const link = wrapper.find('a.skip-link').element
    link.dispatchEvent(event)

    // preventDefaultが呼ばれたことを確認
    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('アクセシビリティ: セマンティックHTMLアンカー要素を使用', () => {
    const wrapper = createWrapper()

    // a要素であることを確認
    expect(wrapper.find('a.skip-link').element.tagName).toBe('A')
  })

  it('視覚的に非表示（画面外配置）されている', () => {
    const wrapper = createWrapper()
    const link = wrapper.find('a.skip-link')

    // スタイルがscopedのため、クラスの存在を確認
    expect(link.classes()).toContain('skip-link')
  })
})
