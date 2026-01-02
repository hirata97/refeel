import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLoadingStore } from '@core/stores/loading'

describe('LoadingStore - 正常系テスト', () => {
  let loadingStore

  beforeEach(() => {
    setActivePinia(createPinia())
    loadingStore = useLoadingStore()
  })

  it('ローディング状態を正常に設定・取得できる', () => {
    loadingStore.setLoading('test-operation', true)

    expect(loadingStore.isLoading('test-operation')).toBe(true)
    expect(loadingStore.hasAnyLoading).toBe(true)
  })

  it('ローディング状態を正常に解除できる', () => {
    loadingStore.setLoading('test-operation', true)
    expect(loadingStore.isLoading('test-operation')).toBe(true)

    loadingStore.setLoading('test-operation', false)
    expect(loadingStore.isLoading('test-operation')).toBe(false)
    expect(loadingStore.hasAnyLoading).toBe(false)
  })

  it('グローバルローディングを正常に設定・取得できる', () => {
    loadingStore.setGlobalLoading(true)

    expect(loadingStore.globalLoading).toBe(true)
    expect(loadingStore.hasAnyLoading).toBe(true)

    loadingStore.setGlobalLoading(false)

    expect(loadingStore.globalLoading).toBe(false)
    expect(loadingStore.hasAnyLoading).toBe(false)
  })

  it('複数のローディング状態を並行して管理できる', () => {
    loadingStore.setLoading('operation1', true)
    loadingStore.setLoading('operation2', true)

    expect(loadingStore.isLoading('operation1')).toBe(true)
    expect(loadingStore.isLoading('operation2')).toBe(true)
    expect(loadingStore.hasAnyLoading).toBe(true)

    loadingStore.setLoading('operation1', false)

    expect(loadingStore.isLoading('operation1')).toBe(false)
    expect(loadingStore.isLoading('operation2')).toBe(true)
    expect(loadingStore.hasAnyLoading).toBe(true)

    loadingStore.setLoading('operation2', false)

    expect(loadingStore.hasAnyLoading).toBe(false)
  })

  it('withLoading - 成功時にローディング状態が正しく管理される', async () => {
    const mockOperation = vi.fn().mockResolvedValue('成功')

    const result = await loadingStore.withLoading('test-op', mockOperation)

    expect(result).toBe('成功')
    expect(mockOperation).toHaveBeenCalledOnce()
    expect(loadingStore.isLoading('test-op')).toBe(false)
  })

  it('withLoading - エラー時でもローディング状態がクリアされる', async () => {
    const mockOperation = vi.fn().mockRejectedValue(new Error('失敗'))

    await expect(
      loadingStore.withLoading('test-op', mockOperation)
    ).rejects.toThrow('失敗')

    expect(loadingStore.isLoading('test-op')).toBe(false)
  })

  it('withGlobalLoading - 成功時にグローバルローディングが正しく管理される', async () => {
    const mockOperation = vi.fn().mockResolvedValue('成功')

    const result = await loadingStore.withGlobalLoading(mockOperation)

    expect(result).toBe('成功')
    expect(mockOperation).toHaveBeenCalledOnce()
    expect(loadingStore.globalLoading).toBe(false)
  })

  it('withGlobalLoading - エラー時でもグローバルローディング状態がクリアされる', async () => {
    const mockOperation = vi.fn().mockRejectedValue(new Error('失敗'))

    await expect(
      loadingStore.withGlobalLoading(mockOperation)
    ).rejects.toThrow('失敗')

    expect(loadingStore.globalLoading).toBe(false)
  })

  it('withMultipleLoading - 複数操作を並行実行してローディング管理できる', async () => {
    const operation1 = vi.fn().mockResolvedValue('結果1')
    const operation2 = vi.fn().mockResolvedValue('結果2')

    const operations = [
      { key: 'op1', operation: operation1 },
      { key: 'op2', operation: operation2 }
    ]

    const results = await loadingStore.withMultipleLoading(operations)

    expect(results).toEqual(['結果1', '結果2'])
    expect(operation1).toHaveBeenCalledOnce()
    expect(operation2).toHaveBeenCalledOnce()
    expect(loadingStore.isLoading('op1')).toBe(false)
    expect(loadingStore.isLoading('op2')).toBe(false)
  })

  it('getLoadingStates - 現在のローディング状態をデバッグ用に取得できる', () => {
    loadingStore.setLoading('operation1', true)
    loadingStore.setLoading('operation2', true)
    loadingStore.setGlobalLoading(true)

    const states = loadingStore.getLoadingStates

    expect(states).toEqual({
      global: true,
      specific: {
        operation1: true,
        operation2: true
      }
    })
  })

  it('存在しないキーのローディング状態はfalseを返す', () => {
    expect(loadingStore.isLoading('non-existent-key')).toBe(false)
  })

  it('ローディング状態の削除が正しく動作する', () => {
    loadingStore.setLoading('test-key', true)
    expect(loadingStore.isLoading('test-key')).toBe(true)

    loadingStore.setLoading('test-key', false)
    expect(loadingStore.isLoading('test-key')).toBe(false)

    // 削除後はloadingStatesからキーが削除される
    expect('test-key' in loadingStore.loadingStates).toBe(false)
  })

  it('グローバルローディングと特定ローディングが両方有効な場合hasAnyLoadingがtrue', () => {
    loadingStore.setGlobalLoading(true)
    loadingStore.setLoading('test', true)

    expect(loadingStore.hasAnyLoading).toBe(true)

    loadingStore.setGlobalLoading(false)
    expect(loadingStore.hasAnyLoading).toBe(true)

    loadingStore.setLoading('test', false)
    expect(loadingStore.hasAnyLoading).toBe(false)
  })
})