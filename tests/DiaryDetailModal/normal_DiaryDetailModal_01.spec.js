import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import DiaryDetailModal from '@/components/DiaryDetailModal.vue'

const vuetify = createVuetify({
  components,
  directives,
})

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

describe('DiaryDetailModal - 正常系', () => {
  let wrapper
  const mockDiary = {
    id: '1',
    user_id: 'user1',
    title: 'テスト日記',
    content: 'これはテストの日記内容です。\n\n複数行の内容を持つ日記です。',
    goal_category: 'テストカテゴリ',
    progress_level: 75,
    created_at: '2024-01-01T10:00:00.000Z',
    updated_at: '2024-01-02T10:00:00.000Z',
  }

  const mockDiaries = [
    mockDiary,
    {
      id: '2',
      user_id: 'user1',
      title: '次の日記',
      content: '次の日記の内容',
      goal_category: 'カテゴリ2',
      progress_level: 50,
      created_at: '2024-01-03T10:00:00.000Z',
      updated_at: '2024-01-03T10:00:00.000Z',
    },
  ]

  beforeEach(() => {
    wrapper = mount(DiaryDetailModal, {
      props: {
        modelValue: true,
        diary: mockDiary,
        diaries: mockDiaries,
        currentIndex: 0,
      },
      global: {
        plugins: [vuetify],
      },
    })
  })

  it('モーダルが正常に表示される', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'v-dialog' }).exists()).toBe(true)
  })

  it('日記のタイトルが表示される', () => {
    const title = wrapper.find('.diary-title')
    expect(title.text()).toBe('テスト日記')
  })

  it('日記の内容が適切にフォーマットされて表示される', () => {
    const content = wrapper.find('.diary-content')
    expect(content.exists()).toBe(true)
    // HTMLフォーマットされた内容が表示されること
    expect(content.element.innerHTML).toContain('<p>')
  })

  it('進捗レベルが正しく表示される', () => {
    const progressBar = wrapper.findComponent({ name: 'v-progress-linear' })
    expect(progressBar.exists()).toBe(true)
    expect(progressBar.props('modelValue')).toBe(75)
  })

  it('メタデータが正しく表示される', () => {
    const metadata = wrapper.find('.diary-metadata')
    expect(metadata.exists()).toBe(true)
    
    // カテゴリチップ
    const categoryChips = wrapper.findAll('.v-chip')
    const categoryChip = categoryChips.find(chip => 
      chip.text().includes('テストカテゴリ')
    )
    expect(categoryChip).toBeTruthy()
    
    // 進捗チップ
    const progressChip = categoryChips.find(chip => 
      chip.text().includes('進捗 75%')
    )
    expect(progressChip).toBeTruthy()
  })

  it('フォントサイズ調整機能が正常に動作する', async () => {
    const slider = wrapper.findComponent({ name: 'v-slider' })
    expect(slider.exists()).toBe(true)
    
    // フォントサイズを変更
    await slider.vm.$emit('update:modelValue', 20)
    await wrapper.vm.$nextTick()
    
    expect(wrapper.vm.fontSize).toBe(20)
  })

  it('フォントサイズリセットボタンが動作する', async () => {
    // フォントサイズを変更
    wrapper.vm.fontSize = 20
    await wrapper.vm.$nextTick()
    
    // リセットボタンをクリック
    const resetButton = wrapper.find('button').filter(btn => 
      btn.text().includes('リセット')
    )[0]
    await resetButton.trigger('click')
    
    expect(wrapper.vm.fontSize).toBe(16) // デフォルトサイズ
  })

  it('閉じるボタンでモーダルが閉じられる', async () => {
    const closeButton = wrapper.find('[aria-label="詳細モーダルを閉じる"]')
    await closeButton.trigger('click')
    
    expect(wrapper.emitted()['update:modelValue']).toBeTruthy()
    expect(wrapper.emitted()['update:modelValue'][0]).toEqual([false])
  })

  it('編集ボタンで編集イベントが発火される', async () => {
    const editButton = wrapper.find('button').filter(btn => 
      btn.text().includes('編集')
    )[0]
    await editButton.trigger('click')
    
    expect(wrapper.emitted().edit).toBeTruthy()
    expect(wrapper.emitted().edit[0]).toEqual([mockDiary])
  })

  it('コピー機能が正常に動作する', async () => {
    // navigator.clipboard.writeTextをモック
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })

    const copyButton = wrapper.find('button').filter(btn => 
      btn.text().includes('コピー')
    )[0]
    await copyButton.trigger('click')
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockDiary.content)
  })

  it('ナビゲーションボタンが適切に表示される', () => {
    // 前へボタン（最初の項目なので無効）
    const prevButton = wrapper.find('[aria-label="前の日記"]')
    expect(prevButton.exists()).toBe(true)
    expect(prevButton.attributes('disabled')).toBeDefined()
    
    // 次へボタン（次の項目があるので有効）
    const nextButton = wrapper.find('[aria-label="次の日記"]')
    expect(nextButton.exists()).toBe(true)
    expect(nextButton.attributes('disabled')).toBeUndefined()
  })

  it('次の日記へのナビゲーションが動作する', async () => {
    const nextButton = wrapper.find('[aria-label="次の日記"]')
    await nextButton.trigger('click')
    
    expect(wrapper.emitted().navigate).toBeTruthy()
    expect(wrapper.emitted().navigate[0]).toEqual(['next'])
  })

  it('文字数が正しく表示される', () => {
    const charCountChip = wrapper.findAll('.v-chip').find(chip => 
      chip.text().includes('文字')
    )
    expect(charCountChip).toBeTruthy()
    expect(charCountChip.text()).toContain('40文字') // mockDiaryの内容の文字数
  })

  it('更新日時が作成日時と異なる場合に表示される', () => {
    const updatedChip = wrapper.findAll('.v-chip').find(chip => 
      chip.text().includes('更新')
    )
    expect(updatedChip).toBeTruthy()
  })
})