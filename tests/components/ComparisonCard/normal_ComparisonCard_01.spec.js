/**
 * ComparisonCard 正常系テスト01
 * Issue #163: 前日比較表示機能のテスト
 */

import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ComparisonCard from '@/components/dashboard/ComparisonCard.vue'

// テスト用のコンポーネント作成ヘルパー
const createWrapper = (props = {}) => {
  const defaultProps = {
    comparison: null,
    loading: false,
    error: null,
    ...props
  }
  return shallowMount(ComparisonCard, {
    props: defaultProps,
    global: {
      stubs: {
        'v-card': { template: '<div class="v-card"><slot /></div>' },
        'v-card-title': { template: '<div class="v-card-title"><slot /></div>' },
        'v-card-text': { template: '<div class="v-card-text"><slot /></div>' },
        'v-icon': { template: '<i class="v-icon" :icon="icon"><slot /></i>', props: ['icon'] },
        'v-progress-circular': { template: '<div class="v-progress-circular" />' },
      }
    }
  })
}

describe('ComparisonCard - 正常系', () => {
  it('前日比較データが正しく表示される', () => {
    const comparison = {
      previousMood: 6,
      currentMood: 8,
      previousReason: '疲れていた',
      currentReason: '目標達成できた',
      streakDays: 3,
    }

    const wrapper = createWrapper({ comparison })

    // カードタイトルの表示確認
    expect(wrapper.text()).toContain('昨日からの変化')
    
    // 気分スコア比較の表示確認
    expect(wrapper.text()).toContain('6')
    expect(wrapper.text()).toContain('8')
    expect(wrapper.text()).toContain('(+2)')
    
    // 理由の表示確認
    expect(wrapper.text()).toContain('疲れていた')
    expect(wrapper.text()).toContain('目標達成できた')
    
    // 連続記録の表示確認
    expect(wrapper.text()).toContain('3日連続記録中')
  })

  it('気分向上時に適切なアイコンと色が表示される', () => {
    const comparison = {
      previousMood: 5,
      currentMood: 8,
      streakDays: 1,
    }

    const wrapper = createWrapper({ comparison })

    // 向上を示すアイコン（mdi-trending-up）が表示される
    const icon = wrapper.find('.change-icon')
    expect(icon.exists()).toBe(true)
    
    // 成功色（success）が適用される
    expect(wrapper.text()).toContain('(+3)')
  })

  it('気分悪化時に適切なアイコンと色が表示される', () => {
    const comparison = {
      previousMood: 8,
      currentMood: 5,
      streakDays: 2,
    }

    const wrapper = createWrapper({ comparison })

    // 悪化を示すアイコン（mdi-trending-down）が表示される
    const icon = wrapper.find('.change-icon')
    expect(icon.exists()).toBe(true)
    
    // エラー色の変化量が表示される
    expect(wrapper.text()).toContain('(-3)')
  })

  it('気分変化なしの場合に適切な表示がされる', () => {
    const comparison = {
      previousMood: 7,
      currentMood: 7,
      streakDays: 5,
    }

    const wrapper = createWrapper({ comparison })

    // 変化なしを示すアイコン（mdi-minus）が表示される
    const icon = wrapper.find('.change-icon')
    expect(icon.exists()).toBe(true)
    
    // 変化なしを示すテキストが表示される
    expect(wrapper.text()).toContain('(±0)')
  })

  it('理由が存在しない場合に理由セクションが表示されない', () => {
    const comparison = {
      previousMood: 6,
      currentMood: 8,
      streakDays: 1,
    }

    const wrapper = createWrapper({ comparison })

    // 理由比較セクションが表示されない
    const reasonSection = wrapper.find('.reason-comparison')
    expect(reasonSection.exists()).toBe(false)
  })

  it('片方の理由のみ存在する場合に適切に表示される', () => {
    const comparison = {
      previousMood: 6,
      currentMood: 8,
      currentReason: '今日は調子が良い',
      streakDays: 1,
    }

    const wrapper = createWrapper({ comparison })

    // 理由比較セクションが表示される
    const reasonSection = wrapper.find('.reason-comparison')
    expect(reasonSection.exists()).toBe(true)
    
    // 今日の理由のみ表示される
    expect(wrapper.text()).toContain('今日は調子が良い')
    expect(wrapper.text()).not.toContain('昨日:')
  })

  it('連続記録日数が0日の場合も適切に表示される', () => {
    const comparison = {
      previousMood: 5,
      currentMood: 7,
      streakDays: 0,
    }

    const wrapper = createWrapper({ comparison })

    expect(wrapper.text()).toContain('0日連続記録中')
  })

  it('大きな連続記録日数が適切に表示される', () => {
    const comparison = {
      previousMood: 6,
      currentMood: 8,
      streakDays: 365,
    }

    const wrapper = createWrapper({ comparison })

    expect(wrapper.text()).toContain('365日連続記録中')
  })
})