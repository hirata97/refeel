/**
 * Logger Utility
 *
 * Environment-aware logging utility that controls log output based on environment mode.
 * - Production: Only error logs
 * - Test: No logs (prevents EPIPE errors)
 * - Development: All log levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerConfig {
  level: LogLevel
  enabled: boolean
  prefix?: string
}

class Logger {
  private config: LoggerConfig

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: this.getDefaultLevel(),
      enabled: this.isEnabled(),
      prefix: '',
      ...config,
    }
  }

  private getDefaultLevel(): LogLevel {
    if (import.meta.env.MODE === 'production') return 'error'
    if (import.meta.env.MODE === 'test') return 'error'
    return 'debug'
  }

  private isEnabled(): boolean {
    return import.meta.env.MODE !== 'test'
  }

  debug(...args: unknown[]): void {
    if (!this.config.enabled || !this.shouldLog('debug')) return
    console.log(this.formatMessage('DEBUG'), ...args)
  }

  info(...args: unknown[]): void {
    if (!this.config.enabled || !this.shouldLog('info')) return
    console.info(this.formatMessage('INFO'), ...args)
  }

  warn(...args: unknown[]): void {
    if (!this.config.enabled || !this.shouldLog('warn')) return
    console.warn(this.formatMessage('WARN'), ...args)
  }

  error(...args: unknown[]): void {
    if (!this.shouldLog('error')) return
    console.error(this.formatMessage('ERROR'), ...args)
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.config.level)
  }

  private formatMessage(level: string): string {
    const timestamp = new Date().toISOString()
    const prefix = this.config.prefix ? `[${this.config.prefix}] ` : ''
    return `[${timestamp}] ${prefix}[${level}]`
  }
}

// Default logger instance
export const logger = new Logger()

// Create module-specific logger
export const createLogger = (prefix: string, config?: Partial<LoggerConfig>) => {
  return new Logger({ ...config, prefix })
}
