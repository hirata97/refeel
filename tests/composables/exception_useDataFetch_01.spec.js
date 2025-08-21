import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDataFetch } from '@/composables/useDataFetch'

// パフォーマンスモニターのモック
vi.mock('@/utils/performance', () => ({
  default: {
    start: vi.fn(),
    end: vi.fn()
  }
}))

// debounce と throttle のモック
vi.mock('lodash-es', () => ({
  debounce: vi.fn((fn) => fn),
  throttle: vi.fn((fn) => fn)
}))

describe('useDataFetch - 異常系・エラーハンドリング', () => {
  let mockFetcher
  let consoleSpy

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetcher = vi.fn()
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('ネットワークエラー', () => {
    it('ネットワークタイムアウトエラーを適切に処理する', async () => {
      const timeoutError = new Error('Request timeout')
      timeoutError.name = 'TimeoutError'
      mockFetcher.mockRejectedValue(timeoutError)

      const { error, data, loading, execute } = useDataFetch(
        mockFetcher,
        'timeout-test',
        { immediate: false }
      )

      await execute()

      expect(error.value).toBe('Request timeout')
      expect(data.value).toBeNull()
      expect(loading.value).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('Fetch error for timeout-test:', timeoutError)
    })

    it('接続エラーを適切に処理する', async () => {
      const connectionError = new Error('Failed to fetch')
      connectionError.name = 'NetworkError'
      mockFetcher.mockRejectedValue(connectionError)

      const { error, execute } = useDataFetch(
        mockFetcher,
        'connection-test',
        { immediate: false }
      )

      await execute()

      expect(error.value).toBe('Failed to fetch')
    })

    it('DNSエラーを適切に処理する', async () => {
      const dnsError = new Error('getaddrinfo ENOTFOUND')
      mockFetcher.mockRejectedValue(dnsError)

      const { error, execute } = useDataFetch(
        mockFetcher,
        'dns-test',
        { immediate: false }
      )

      await execute()

      expect(error.value).toBe('getaddrinfo ENOTFOUND')
    })
  })

  describe('サーバーエラー', () => {
    it('HTTP 500エラーを適切に処理する', async () => {
      const serverError = new Error('Internal Server Error')
      serverError.status = 500
      mockFetcher.mockRejectedValue(serverError)

      const { error, execute } = useDataFetch(
        mockFetcher,
        'server-error-test',
        { immediate: false }
      )

      await execute()

      expect(error.value).toBe('Internal Server Error')
    })

    it('HTTP 404エラーを適切に処理する', async () => {
      const notFoundError = new Error('Not Found')
      notFoundError.status = 404
      mockFetcher.mockRejectedValue(notFoundError)

      const { error, execute } = useDataFetch(
        mockFetcher,
        'not-found-test',
        { immediate: false }
      )

      await execute()

      expect(error.value).toBe('Not Found')
    })

    it('HTTP 401エラー（認証エラー）を適切に処理する', async () => {
      const authError = new Error('Unauthorized')
      authError.status = 401
      mockFetcher.mockRejectedValue(authError)

      const { error, execute } = useDataFetch(
        mockFetcher,
        'auth-error-test',
        { immediate: false }
      )

      await execute()

      expect(error.value).toBe('Unauthorized')
    })
  })

  describe('データ形式エラー', () => {
    it('JSON解析エラーを適切に処理する', async () => {
      const parseError = new SyntaxError('Unexpected token < in JSON at position 0')
      mockFetcher.mockRejectedValue(parseError)

      const { error, execute } = useDataFetch(
        mockFetcher,
        'parse-error-test',
        { immediate: false }
      )

      await execute()

      expect(error.value).toBe('Unexpected token < in JSON at position 0')
    })

    it('不正なレスポンス形式でもエラーが発生しない', async () => {
      // undefinedを返すfetcher
      mockFetcher.mockResolvedValue(undefined)

      const { data, error, execute } = useDataFetch(
        mockFetcher,
        'undefined-response-test',
        { immediate: false }
      )

      await execute()

      expect(data.value).toBeUndefined()
      expect(error.value).toBeNull()
    })

    it('空の文字列レスポンスを適切に処理する', async () => {
      mockFetcher.mockResolvedValue('')

      const { data, error, execute } = useDataFetch(
        mockFetcher,
        'empty-string-test',
        { immediate: false }
      )

      await execute()

      expect(data.value).toBe('')
      expect(error.value).toBeNull()
    })
  })

  describe('非同期処理のエラー', () => {
    it('Promise.reject()でエラーを適切に処理する', async () => {
      mockFetcher.mockImplementation(() => Promise.reject('Rejected promise'))

      const { error, execute } = useDataFetch(
        mockFetcher,
        'rejected-promise-test',
        { immediate: false }
      )

      await execute()

      expect(error.value).toBe('データ取得エラー') // 文字列エラーのため汎用メッセージ
    })

    it('非同期関数内でのthrowを適切に処理する', async () => {
      mockFetcher.mockImplementation(async () => {
        throw new Error('Async function error')
      })

      const { error, execute } = useDataFetch(
        mockFetcher,
        'async-error-test',
        { immediate: false }
      )

      await execute()

      expect(error.value).toBe('Async function error')
    })

    it('fetcherがPromiseを返さない場合のエラーを処理する', async () => {
      // 同期的にエラーを投げるfetcher
      mockFetcher.mockImplementation(() => {
        throw new Error('Synchronous error')
      })

      const { error, execute } = useDataFetch(
        mockFetcher,
        'sync-error-test',
        { immediate: false }
      )

      await execute()

      expect(error.value).toBe('Synchronous error')
    })
  })

  describe('状態の不整合', () => {
    it('連続したエラーでも状態が正しく管理される', async () => {
      mockFetcher.mockRejectedValueOnce(new Error('Error 1'))
      mockFetcher.mockRejectedValueOnce(new Error('Error 2'))
      mockFetcher.mockResolvedValueOnce({ success: true })

      const { error, data, loading, execute } = useDataFetch(
        mockFetcher,
        'multiple-errors-test',
        { immediate: false }
      )

      // 1回目のエラー
      await execute()
      expect(error.value).toBe('Error 1')
      expect(data.value).toBeNull()
      expect(loading.value).toBe(false)

      // 2回目のエラー
      await execute()
      expect(error.value).toBe('Error 2')
      expect(data.value).toBeNull()
      expect(loading.value).toBe(false)

      // 3回目は成功
      await execute()
      expect(error.value).toBeNull()
      expect(data.value).toEqual({ success: true })
      expect(loading.value).toBe(false)
    })

    it('ローディング中にコンポーネントがアンマウントされてもエラーが発生しない', async () => {
      let resolvePromise
      mockFetcher.mockReturnValue(new Promise(resolve => {
        resolvePromise = resolve
      }))

      const { loading, execute } = useDataFetch(
        mockFetcher,
        'unmount-test',
        { immediate: false }
      )

      // 実行開始
      const executePromise = execute()
      expect(loading.value).toBe(true)

      // プロミスを解決（アンマウント後の想定）
      resolvePromise({ data: 'late response' })
      await executePromise

      // エラーが発生しないことを確認
      expect(loading.value).toBe(false)
    })
  })

  describe('メモリリークとパフォーマンス', () => {
    it('大量のデータでもメモリエラーが発生しない', async () => {
      // 大きなオブジェクトを作成
      const largeData = {
        items: new Array(10000).fill(0).map((_, i) => ({
          id: i,
          data: `item-${i}`.repeat(100)
        }))
      }

      mockFetcher.mockResolvedValue(largeData)

      const { data, execute } = useDataFetch(
        mockFetcher,
        'large-data-test',
        { immediate: false }
      )

      await execute()

      expect(data.value?.items).toHaveLength(10000)
    })

    it('パフォーマンス監視でエラーが発生してもfetch処理は完了する', async () => {
      const { default: performanceMonitor } = await import('@/utils/performance')
      
      // パフォーマンス監視でエラーを発生させる
      performanceMonitor.start.mockImplementation(() => {
        throw new Error('Performance monitor error')
      })

      mockFetcher.mockResolvedValue({ test: 'data' })

      const { data, error, execute } = useDataFetch(
        mockFetcher,
        'performance-error',
        { immediate: false }
      )

      await execute()

      // パフォーマンス監視のエラーに関係なく、データ取得は成功するはず
      expect(data.value).toEqual({ test: 'data' })
      expect(error.value).toBeNull()
    })
  })

  describe('デバウンス・スロットルのエラー', () => {
    it('debounce設定でlodash-esが利用できない場合でもエラーが発生しない', async () => {
      // lodash-es のモックでエラーを発生させる
      const { debounce } = await import('lodash-es')
      debounce.mockImplementation(() => {
        throw new Error('Debounce not available')
      })

      expect(() => {
        useDataFetch(
          mockFetcher,
          'debounce-error-test',
          { debounceMs: 300, immediate: false }
        )
      }).not.toThrow()
    })

    it('throttle設定でlodash-esが利用できない場合でもエラーが発生しない', async () => {
      // lodash-es のモックでエラーを発生させる
      const { throttle } = await import('lodash-es')
      throttle.mockImplementation(() => {
        throw new Error('Throttle not available')
      })

      expect(() => {
        useDataFetch(
          mockFetcher,
          'throttle-error-test',
          { throttleMs: 500, immediate: false }
        )
      }).not.toThrow()
    })
  })

  describe('immediate実行でのエラー', () => {
    it('immediate: true でのエラーが適切に処理される', async () => {
      mockFetcher.mockRejectedValue(new Error('Immediate execution error'))

      const { error, data } = useDataFetch(
        mockFetcher,
        'immediate-error-test',
        { immediate: true }
      )

      // immediate実行の完了を待つ
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(error.value).toBe('Immediate execution error')
      expect(data.value).toBeNull()
    })

    it('immediate実行中に複数回execute()を呼んでもエラーが発生しない', async () => {
      mockFetcher.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: 'test' }), 50))
      )

      const { execute, loading } = useDataFetch(
        mockFetcher,
        'immediate-multiple-test',
        { immediate: true }
      )

      // immediate実行中に追加実行
      const executePromise = execute()
      expect(loading.value).toBe(true)

      await executePromise
      expect(loading.value).toBe(false)
    })
  })

  describe('エッジケース', () => {
    it('fetcherがnullやundefinedを返してもエラーが発生しない', async () => {
      mockFetcher.mockResolvedValueOnce(null)
      mockFetcher.mockResolvedValueOnce(undefined)

      const { data, error, execute } = useDataFetch(
        mockFetcher,
        'null-undefined-test',
        { immediate: false }
      )

      await execute()
      expect(data.value).toBeNull()
      expect(error.value).toBeNull()

      await execute()
      expect(data.value).toBeUndefined()
      expect(error.value).toBeNull()
    })

    it('fetcherが関数でない場合適切にエラーを処理する', async () => {
      const invalidFetcher = 'not a function'

      const { error, execute } = useDataFetch(
        invalidFetcher as unknown as () => Promise<unknown>,
        'invalid-fetcher-test',
        { immediate: false }
      )

      await execute()

      expect(error.value).toBe('データ取得エラー')
    })

    it('キーが空文字列でもエラーが発生しない', async () => {
      mockFetcher.mockResolvedValue({ test: 'data' })

      const { data, execute } = useDataFetch(
        mockFetcher,
        '',
        { immediate: false }
      )

      await execute()
      expect(data.value).toEqual({ test: 'data' })
    })

    it('非常に長いキーでもエラーが発生しない', async () => {
      const longKey = 'a'.repeat(10000)
      mockFetcher.mockResolvedValue({ test: 'data' })

      const { data, execute } = useDataFetch(
        mockFetcher,
        longKey,
        { immediate: false }
      )

      await execute()
      expect(data.value).toEqual({ test: 'data' })
    })
  })
})