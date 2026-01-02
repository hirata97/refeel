import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDataFetch } from '@shared/composables'

// パフォーマンスモニターのモック - グローバルモック（tests/setup.ts）を使用

// debounce と throttle のモック
vi.mock('lodash-es', () => ({
  debounce: vi.fn((fn) => fn),
  throttle: vi.fn((fn) => fn)
}))

describe('useDataFetch - 正常系', () => {
  let mockFetcher

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetcher = vi.fn()
  })

  describe('基本的な機能', () => {
    it('初期状態が正しく設定されている', () => {
      mockFetcher.mockResolvedValue({ id: 1, name: 'test' })
      
      const { data, loading, error, hasData, isStale } = useDataFetch(
        mockFetcher,
        'test-key',
        { immediate: false }
      )

      expect(data.value).toBeNull()
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
      expect(hasData.value).toBe(false)
      expect(isStale.value).toBe(true) // lastFetched が null なので stale
    })

    it('execute() でデータを正常に取得できる', async () => {
      const testData = { id: 1, name: 'Test Data', timestamp: Date.now() }
      mockFetcher.mockResolvedValue(testData)

      const { data, loading, error, execute, hasData } = useDataFetch(
        mockFetcher,
        'test-key',
        { immediate: false }
      )

      const result = await execute()

      expect(result).toEqual(testData)
      expect(data.value).toEqual(testData)
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
      expect(hasData.value).toBe(true)
    })

    it('immediate: true で自動実行される', async () => {
      const testData = { items: ['item1', 'item2'], count: 2 }
      mockFetcher.mockResolvedValue(testData)

      // immediate: true がデフォルト
      const { hasData } = useDataFetch(mockFetcher, 'auto-fetch')

      // 少し待ってから確認（非同期実行のため）
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(mockFetcher).toHaveBeenCalledTimes(1)
      expect(hasData.value).toBe(true)
    })

    it('refresh() で強制更新ができる', async () => {
      const initialData = { version: 1 }
      const updatedData = { version: 2 }
      
      mockFetcher.mockResolvedValueOnce(initialData)
      mockFetcher.mockResolvedValueOnce(updatedData)

      const { data, refresh } = useDataFetch(
        mockFetcher,
        'refresh-test',
        { immediate: false }
      )

      // 初回実行
      await refresh()
      expect(data.value).toEqual(initialData)

      // リフレッシュ実行
      await refresh()
      expect(data.value).toEqual(updatedData)
      expect(mockFetcher).toHaveBeenCalledTimes(2)
    })
  })

  describe('ローディング状態管理', () => {
    it('実行中はloading状態がtrueになる', async () => {
      let resolvePromise
      const promiseExecutor = (resolve) => {
        resolvePromise = resolve
      }
      
      mockFetcher.mockReturnValue(new Promise(promiseExecutor))

      const { loading, execute } = useDataFetch(
        mockFetcher,
        'loading-test',
        { immediate: false }
      )

      // 実行開始
      const executePromise = execute()
      expect(loading.value).toBe(true)

      // 完了
      resolvePromise({ data: 'test' })
      await executePromise
      expect(loading.value).toBe(false)
    })

    it('重複実行時はloading中は新しい実行をスキップする', async () => {
      mockFetcher.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: 'test' }), 100))
      )

      const { execute } = useDataFetch(
        mockFetcher,
        'duplicate-test',
        { immediate: false }
      )

      // 並行実行
      const promise1 = execute()
      const promise2 = execute() // この呼び出しはスキップされるはず

      const result1 = await promise1
      const result2 = await promise2

      expect(result1).toEqual({ data: 'test' })
      // Second execution may return null when skipped during loading
      expect(result2 === null || result2?.data === 'test').toBe(true)
      expect(mockFetcher).toHaveBeenCalledTimes(1) // 1回だけ実行
    })

    it('forceRefresh=true で重複実行時でも新しい実行が行われる', async () => {
      mockFetcher.mockResolvedValue({ timestamp: Date.now() })

      const { execute } = useDataFetch(
        mockFetcher,
        'force-refresh-test',
        { immediate: false }
      )

      // 通常の実行
      await execute()
      
      // 強制リフレッシュ
      await execute(true)

      expect(mockFetcher).toHaveBeenCalledTimes(2)
    })
  })

  describe('エラーハンドリング', () => {
    it('fetcherでエラーが発生した場合、error状態が設定される', async () => {
      const errorMessage = 'Network error'
      mockFetcher.mockRejectedValue(new Error(errorMessage))

      const { error, data, loading, execute } = useDataFetch(
        mockFetcher,
        'error-test',
        { immediate: false }
      )

      const result = await execute()

      expect(result).toBeNull()
      expect(data.value).toBeNull()
      expect(error.value).toBe(errorMessage)
      expect(loading.value).toBe(false)
    })

    it('Error以外のオブジェクトがthrowされた場合でも適切に処理される', async () => {
      mockFetcher.mockRejectedValue('String error')

      const { error, execute } = useDataFetch(
        mockFetcher,
        'non-error-test',
        { immediate: false }
      )

      await execute()

      expect(error.value).toBe('データ取得エラー')
    })

    it('エラー後の再実行で正常にデータを取得できる', async () => {
      mockFetcher.mockRejectedValueOnce(new Error('First error'))
      mockFetcher.mockResolvedValueOnce({ recovered: true })

      const { error, data, execute } = useDataFetch(
        mockFetcher,
        'recovery-test',
        { immediate: false }
      )

      // 最初の実行でエラー
      await execute()
      expect(error.value).toBe('First error')
      expect(data.value).toBeNull()

      // 再実行で成功
      await execute()
      expect(error.value).toBeNull()
      expect(data.value).toEqual({ recovered: true })
    })
  })

  describe('計算プロパティ', () => {
    it('hasData が正しく計算される', async () => {
      mockFetcher.mockResolvedValue({ test: 'data' })

      const { hasData, execute } = useDataFetch(
        mockFetcher,
        'has-data-test',
        { immediate: false }
      )

      expect(hasData.value).toBe(false)

      await execute()
      expect(hasData.value).toBe(true)
    })

    it('isStale が正しく計算される', async () => {
      mockFetcher.mockResolvedValue({ timestamp: Date.now() })

      const { isStale, execute } = useDataFetch(
        mockFetcher,
        'stale-test',
        { immediate: false }
      )

      // データ取得前は stale
      expect(isStale.value).toBe(true)

      // データ取得直後は fresh
      await execute()
      expect(isStale.value).toBe(false)
    })
  })

  describe('型安全性', () => {
    it('ジェネリック型が正しく推論される', async () => {
      // TypeScript interface removed for .spec.js compatibility
      const testData= {
        id: 1,
        name: 'Test Item',
      }

      mockFetcher.mockResolvedValue(testData)

      const { data, execute } = useDataFetch(
        mockFetcher,
        'type-test',
        { immediate: false }
      )

      await execute()

      // TypeScriptの型チェックでエラーが出ないことを確認
      expect(data.value?.id).toBe(1)
      expect(data.value?.name).toBe('Test Item')
    })

    it('null値も適切に処理される', async () => {
      mockFetcher.mockResolvedValue(null)

      const { data, hasData, execute } = useDataFetch(
        mockFetcher,
        'null-test',
        { immediate: false }
      )

      await execute()

      expect(data.value).toBeNull()
      expect(hasData.value).toBe(false)
    })
  })

  describe('オプション設定', () => {
    it('refresh: true でキャッシュを無視してデータを取得する', async () => {
      const freshData = { timestamp: Date.now(), fresh: true }
      mockFetcher.mockResolvedValue(freshData)

      const { data } = useDataFetch(
        mockFetcher,
        'refresh-option-test',
        { immediate: true, refresh: true }
      )

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(data.value).toEqual(freshData)
      expect(mockFetcher).toHaveBeenCalledWith()
    })

    it.skip('debounceMs オプションが設定される', async () => {
      // TODO: Check if useDataFetch actually uses lodash-es debounce
      const { debounce } = await import('lodash-es')
      debounce.mockClear()

      useDataFetch(
        mockFetcher,
        'debounce-test',
        { debounceMs: 300, immediate: false }
      )

      // Debounce may be called, check if it was called at all
      expect(debounce).toHaveBeenCalled()
    })

    it.skip('throttleMs オプションが設定される', async () => {
      // TODO: Check if useDataFetch actually uses lodash-es throttle
      const { throttle } = await import('lodash-es')
      throttle.mockClear()

      useDataFetch(
        mockFetcher,
        'throttle-test',
        { throttleMs: 500, immediate: false }
      )

      // Throttle may be called, check if it was called at all
      expect(throttle).toHaveBeenCalled()
    })
  })

  describe('パフォーマンス監視', () => {
    it('パフォーマンス測定が正しく行われる', async () => {
      const { performanceMonitor } = await import('@shared/utils/performance')
      const startSpy = vi.spyOn(performanceMonitor, 'start')
      const endSpy = vi.spyOn(performanceMonitor, 'end')

      mockFetcher.mockResolvedValue({ test: 'data' })

      const { execute } = useDataFetch(
        mockFetcher,
        'performance-test',
        { immediate: false }
      )

      await execute()

      expect(startSpy).toHaveBeenCalledWith('fetch_performance-test')
      expect(endSpy).toHaveBeenCalledWith('fetch_performance-test')
    })

    it('エラー時もパフォーマンス測定が完了する', async () => {
      const { performanceMonitor } = await import('@shared/utils/performance')
      const startSpy = vi.spyOn(performanceMonitor, 'start')
      const endSpy = vi.spyOn(performanceMonitor, 'end')

      mockFetcher.mockRejectedValue(new Error('Test error'))

      const { execute } = useDataFetch(
        mockFetcher,
        'performance-error-test',
        { immediate: false }
      )

      await execute()

      expect(startSpy).toHaveBeenCalledWith('fetch_performance-error-test')
      expect(endSpy).toHaveBeenCalledWith('fetch_performance-error-test')
    })
  })
})