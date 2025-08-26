/**
 * ComparisonCard 異常系テスト01
 * Issue #163: 前日比較表示機能のエラーハンドリングテスト
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

describe('ComparisonCard - 異常系', () => {
  it('比較データがnullの場合にデータなし状態を表示する', () => {
    const wrapper = createWrapper({ comparison: null })

    // データなしメッセージが表示される
    expect(wrapper.text()).toContain('昨日のデータがありません')
    expect(wrapper.text()).toContain('日記を継続して記録すると、変化を確認できます')
    
    // 比較コンテンツは表示されない
    const comparisonContent = wrapper.find('.comparison-content')
    expect(comparisonContent.exists()).toBe(false)
  })

  it('ローディング状態が正しく表示される', () => {
    const wrapper = createWrapper({ loading: true })

    // ローディング表示が表示される
    expect(wrapper.text()).toContain('比較データを取得中...')
    
    // ローディング状態が表示される
    const loadingState = wrapper.find('.loading-state')
    expect(loadingState.exists()).toBe(true)
    
    // 比較コンテンツは表示されない
    const comparisonContent = wrapper.find('.comparison-content')
    expect(comparisonContent.exists()).toBe(false)
  })

  it('エラー状態が正しく表示される', () => {
    const errorMessage = 'データ取得に失敗しました'
    const wrapper = createWrapper({ error: errorMessage })

    // エラーメッセージが表示される
    expect(wrapper.text()).toContain(errorMessage)
    
    // エラー状態が表示される
    const errorState = wrapper.find('.error-state')
    expect(errorState.exists()).toBe(true)
    
    // 比較コンテンツは表示されない
    const comparisonContent = wrapper.find('.comparison-content')
    expect(comparisonContent.exists()).toBe(false)
  })

  it('比較データが存在するがローディング中の場合はローディング状態を優先する', () => {
    const comparison = {
      previousMood: 6,
      currentMood: 8,
      streakDays: 3,
    }

    const wrapper = createWrapper({ 
      comparison,
      loading: true 
    })

    // ローディング状態が優先される
    expect(wrapper.text()).toContain('比較データを取得中...')
    
    // ローディング状態のCSSクラスが存在する
    const loadingState = wrapper.find('.loading-state')
    expect(loadingState.exists()).toBe(true)
    
    // 比較コンテンツは表示されない
    const comparisonContent = wrapper.find('.comparison-content')
    expect(comparisonContent.exists()).toBe(false)
  })

  it('比較データが存在するがエラーがある場合はエラー状態を優先する', () => {
    const comparison = {
      previousMood: 6,
      currentMood: 8,
      streakDays: 3,
    }

    const errorMessage = 'ネットワークエラーが発生しました'
    const wrapper = createWrapper({ 
      comparison,
      error: errorMessage 
    })

    // エラー状態が優先される
    expect(wrapper.text()).toContain(errorMessage)
    
    // エラー状態のCSSクラスが存在する
    const errorState = wrapper.find('.error-state')
    expect(errorState.exists()).toBe(true)
    
    // 比較コンテンツは表示されない
    const comparisonContent = wrapper.find('.comparison-content')
    expect(comparisonContent.exists()).toBe(false)
  })

  it('無効な気分スコア値でも適切に処理される', () => {
    const comparison = {
      previousMood: 0,
      currentMood: 11,
      streakDays: 1,
    }

    const wrapper = createWrapper({ comparison })

    // 無効な値でも表示される（バリデーションは親コンポーネントで行う想定）
    expect(wrapper.text()).toContain('0')
    expect(wrapper.text()).toContain('11')
    expect(wrapper.text()).toContain('(+11)')
  })

  it('負の連続記録日数でも適切に処理される', () => {
    const comparison = {
      previousMood: 5,
      currentMood: 7,
      streakDays: -1,
    }

    const wrapper = createWrapper({ comparison })

    // 負の値でも表示される（バリデーションは親コンポーネントで行う想定）
    expect(wrapper.text()).toContain('-1日連続記録中')
  })

  it('極端に長い理由テキストが適切に表示される', () => {
    const longReason = 'これは非常に長い理由のテキストです。'.repeat(10)
    
    const comparison = {
      previousMood: 5,
      currentMood: 7,
      previousReason: longReason,
      currentReason: longReason,
      streakDays: 1,
    }

    const wrapper = createWrapper({ comparison })

    // 長いテキストも表示される（CSSで制御）
    expect(wrapper.text()).toContain(longReason)
  })

  it('空文字の理由は理由セクションに表示されない', () => {
    const comparison = {
      previousMood: 5,
      currentMood: 7,
      previousReason: '',
      currentReason: '',
      streakDays: 1,
    }

    const wrapper = createWrapper({ comparison })

    // 空文字は理由として扱われない（v-ifでチェック）
    const reasonSection = wrapper.find('.reason-comparison')
    expect(reasonSection.exists()).toBe(false)
  })

  it('undefinedのプロパティが含まれていても正常に動作する', () => {
    const comparison = {
      previousMood: 6,
      currentMood: 8,
      previousReason: undefined,
      currentReason: undefined,
      streakDays: 2,
    }

    const wrapper = createWrapper({ comparison })

    // 基本的な表示は正常に動作する
    expect(wrapper.text()).toContain('6')
    expect(wrapper.text()).toContain('8')
    expect(wrapper.text()).toContain('2日連続記録中')
    
    // undefinedの理由は表示されない
    const reasonSection = wrapper.find('.reason-comparison')
    expect(reasonSection.exists()).toBe(false)
  })
})