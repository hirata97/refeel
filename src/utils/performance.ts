// パフォーマンス計測ユーティリティ

export interface PerformanceMetrics {
  label: string
  startTime: number
  endTime?: number
  duration?: number
  memory?: {
    used: number
    total: number
  }
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map()
  private isEnabled: boolean = process.env.NODE_ENV === 'development'

  // 計測開始
  start(label: string): void {
    if (!this.isEnabled) return

    const startTime = performance.now()
    this.metrics.set(label, {
      label,
      startTime,
      memory: this.getMemoryUsage(),
    })
  }

  // 計測終了
  end(label: string): PerformanceMetrics | null {
    if (!this.isEnabled) return null

    const metric = this.metrics.get(label)
    if (!metric) {
      console.warn(`Performance metric '${label}' not found`)
      return null
    }

    const endTime = performance.now()
    const duration = endTime - metric.startTime

    const finalMetric: PerformanceMetrics = {
      ...metric,
      endTime,
      duration,
      memory: this.getMemoryUsage(),
    }

    this.metrics.set(label, finalMetric)

    // 開発環境でのログ出力
    if (duration > 100) {
      // 100ms以上の場合のみ警告
      console.warn(`⚠️ Slow operation: ${label} took ${duration.toFixed(2)}ms`)
    } else {
      console.log(`✅ ${label}: ${duration.toFixed(2)}ms`)
    }

    return finalMetric
  }

  // メモリ使用量取得
  private getMemoryUsage() {
    if ('memory' in performance) {
      const memory = (
        performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }
      ).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
      }
    }
    return { used: 0, total: 0 }
  }

  // 全メトリクス取得
  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values())
  }

  // メトリクスクリア
  clear(): void {
    this.metrics.clear()
  }

  // パフォーマンスレポート生成
  generateReport(): string {
    const metrics = this.getAllMetrics()
    if (metrics.length === 0) return 'No performance metrics available'

    let report = '📊 Performance Report\n'
    report += '==================\n\n'

    metrics
      .filter((m) => m.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .forEach((metric) => {
        report += `${metric.label}: ${metric.duration?.toFixed(2)}ms\n`
        if (metric.memory && metric.memory.used > 0) {
          report += `  Memory: ${(metric.memory.used / 1024 / 1024).toFixed(2)}MB\n`
        }
      })

    return report
  }
}

// シングルトンインスタンス
export const performanceMonitor = new PerformanceMonitor()

// デコレータ関数（関数の実行時間を自動計測）
export function measurePerformance<T extends (...args: unknown[]) => unknown>(
  target: T,
  label?: string,
): T {
  return ((...args: unknown[]) => {
    const functionLabel = label || target.name || 'anonymous'
    performanceMonitor.start(functionLabel)

    try {
      const result = target(...args)

      // Promise の場合は非同期で計測終了
      if (result instanceof Promise) {
        return result.finally(() => {
          performanceMonitor.end(functionLabel)
        })
      }

      performanceMonitor.end(functionLabel)
      return result
    } catch (error) {
      performanceMonitor.end(functionLabel)
      throw error
    }
  }) as T
}

// Vueコンポーネント用のパフォーマンス計測フック
export function usePerformanceMonitor() {
  return {
    start: (label: string) => performanceMonitor.start(label),
    end: (label: string) => performanceMonitor.end(label),
    measure: measurePerformance,
    getReport: () => performanceMonitor.generateReport(),
    clear: () => performanceMonitor.clear(),
  }
}

// Debounce ユーティリティ
export function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout>

  return ((...args: unknown[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

// Throttle ユーティリティ
export function throttle<T extends (...args: unknown[]) => unknown>(func: T, limit: number): T {
  let inThrottle: boolean

  return ((...args: unknown[]) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }) as T
}

// メモ化ユーティリティ
export function memoize<T extends (...args: unknown[]) => unknown>(
  func: T,
  getKey?: (...args: Parameters<T>) => string,
): T & { cache: Map<string, ReturnType<T>>; clear: () => void } {
  const cache = new Map<string, ReturnType<T>>()

  const memoized = ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = func(...args) as ReturnType<T>
    cache.set(key, result)
    return result
  }) as T & { cache: Map<string, ReturnType<T>>; clear: () => void }

  memoized.cache = cache
  memoized.clear = () => cache.clear()

  return memoized
}

// バッチ処理ユーティリティ
export function batchProcess<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  batchSize: number = 10,
): Promise<R[]> {
  const batches: T[][] = []

  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize))
  }

  return Promise.all(batches.map((batch) => processor(batch))).then((results) => results.flat())
}

// リソース使用量監視
export function monitorResourceUsage() {
  if (!('memory' in performance)) {
    console.warn('Memory monitoring not supported in this browser')
    return null
  }

  const memory = (
    performance as unknown as {
      memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number }
    }
  ).memory
  const usage = {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
  }

  if (usage.usagePercentage > 80) {
    console.warn('⚠️ High memory usage detected:', usage)
  }

  return usage
}
