import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger, createLogger } from '../logger'

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Environment-based behavior', () => {
    it('should not output logs in test environment', () => {
      // In test environment, logger should be disabled
      logger.debug('test debug')
      logger.info('test info')
      logger.warn('test warn')

      expect(consoleLogSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should output error logs even in test environment', () => {
      logger.error('test error')

      expect(consoleErrorSpy).toHaveBeenCalledOnce()
      expect(consoleErrorSpy.mock.calls[0][0]).toMatch(/\[ERROR\]/)
      expect(consoleErrorSpy.mock.calls[0][1]).toBe('test error')
    })
  })

  describe('Log formatting', () => {
    it('should format error messages with timestamp and level', () => {
      logger.error('error message')

      expect(consoleErrorSpy).toHaveBeenCalledOnce()
      const formattedMessage = consoleErrorSpy.mock.calls[0][0]

      // Check format: [ISO timestamp] [ERROR]
      expect(formattedMessage).toMatch(
        /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[ERROR\]$/,
      )
    })

    it('should preserve additional arguments', () => {
      const testObject = { key: 'value' }
      logger.error('error message', testObject, 123)

      expect(consoleErrorSpy).toHaveBeenCalledOnce()
      expect(consoleErrorSpy.mock.calls[0][1]).toBe('error message')
      expect(consoleErrorSpy.mock.calls[0][2]).toEqual(testObject)
      expect(consoleErrorSpy.mock.calls[0][3]).toBe(123)
    })
  })

  describe('createLogger with prefix', () => {
    it('should create logger with custom prefix', () => {
      const authLogger = createLogger('AUTH')
      authLogger.error('authentication failed')

      expect(consoleErrorSpy).toHaveBeenCalledOnce()
      const formattedMessage = consoleErrorSpy.mock.calls[0][0]

      // Check format: [ISO timestamp] [AUTH] [ERROR]
      expect(formattedMessage).toMatch(
        /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[AUTH\] \[ERROR\]$/,
      )
    })

    it('should create multiple independent loggers', () => {
      const authLogger = createLogger('AUTH')
      const dbLogger = createLogger('DATABASE')

      authLogger.error('auth error')
      dbLogger.error('db error')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2)
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[AUTH]')
      expect(consoleErrorSpy.mock.calls[1][0]).toContain('[DATABASE]')
    })
  })

  describe('Log level filtering', () => {
    it('should respect log level hierarchy in test environment', () => {
      // In test environment, only error level is active
      logger.debug('debug message')
      logger.info('info message')
      logger.warn('warn message')
      logger.error('error message')

      expect(consoleLogSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalledOnce()
    })
  })

  describe('Edge cases', () => {
    it('should handle undefined and null values', () => {
      logger.error('error', undefined, null)

      expect(consoleErrorSpy).toHaveBeenCalledOnce()
      expect(consoleErrorSpy.mock.calls[0][1]).toBe('error')
      expect(consoleErrorSpy.mock.calls[0][2]).toBeUndefined()
      expect(consoleErrorSpy.mock.calls[0][3]).toBeNull()
    })

    it('should handle empty arguments', () => {
      logger.error()

      expect(consoleErrorSpy).toHaveBeenCalledOnce()
    })

    it('should handle complex objects', () => {
      const complexObject = {
        nested: { deep: { value: 42 } },
        array: [1, 2, 3],
        date: new Date(),
      }

      logger.error('complex', complexObject)

      expect(consoleErrorSpy).toHaveBeenCalledOnce()
      expect(consoleErrorSpy.mock.calls[0][2]).toEqual(complexObject)
    })
  })
})
