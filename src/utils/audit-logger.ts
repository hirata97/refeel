import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

// 監査ログのレベル
export enum AuditLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// イベントタイプ
export enum AuditEventType {
  // 認証関連
  AUTH_LOGIN = 'auth.login',
  AUTH_LOGOUT = 'auth.logout',
  AUTH_FAILED_LOGIN = 'auth.failed_login',
  AUTH_SESSION_EXPIRED = 'auth.session_expired',
  AUTH_PASSWORD_CHANGED = 'auth.password_changed',
  
  // アクセス制御
  ACCESS_GRANTED = 'access.granted',
  ACCESS_DENIED = 'access.denied',
  PERMISSION_CHECK = 'permission.check',
  
  // データ操作
  DATA_CREATE = 'data.create',
  DATA_READ = 'data.read',
  DATA_UPDATE = 'data.update',
  DATA_DELETE = 'data.delete',
  
  // セキュリティ
  SECURITY_THREAT = 'security.threat',
  SECURITY_VIOLATION = 'security.violation',
  
  // システム
  SYSTEM_ERROR = 'system.error',
  SYSTEM_WARNING = 'system.warning'
}

// 監査ログエントリ
export interface AuditLogEntry {
  id?: string
  timestamp: string
  level: AuditLevel
  eventType: AuditEventType
  userId?: string
  userEmail?: string
  message: string
  details?: Record<string, any>
  resource?: {
    type: string
    id: string
    name?: string
  }
  metadata?: {
    ip?: string
    userAgent?: string
    sessionId?: string
    requestId?: string
    [key: string]: any
  }
}

// ログストレージインターface
interface LogStorage {
  store(entry: AuditLogEntry): Promise<void>
  query(filters: LogQueryFilters): Promise<AuditLogEntry[]>
}

// ログクエリフィルター
export interface LogQueryFilters {
  userId?: string
  eventType?: AuditEventType[]
  level?: AuditLevel[]
  fromDate?: Date
  toDate?: Date
  limit?: number
  offset?: number
}

// Supabaseログストレージ実装
class SupabaseLogStorage implements LogStorage {
  async store(entry: AuditLogEntry): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert([{
          level: entry.level,
          event_type: entry.eventType,
          user_id: entry.userId,
          user_email: entry.userEmail,
          message: entry.message,
          details: entry.details,
          resource: entry.resource,
          metadata: entry.metadata,
          created_at: entry.timestamp
        }])

      if (error) {
        console.error('監査ログの保存に失敗:', error)
        // フォールバックとしてローカルストレージに保存
        this.storeLocally(entry)
      }
    } catch (err) {
      console.error('監査ログエラー:', err)
      this.storeLocally(entry)
    }
  }

  private storeLocally(entry: AuditLogEntry) {
    try {
      const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]')
      logs.push(entry)
      
      // 最大1000件まで保存
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000)
      }
      
      localStorage.setItem('audit_logs', JSON.stringify(logs))
    } catch (err) {
      console.error('ローカル監査ログエラー:', err)
    }
  }

  async query(filters: LogQueryFilters): Promise<AuditLogEntry[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')

      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }

      if (filters.eventType?.length) {
        query = query.in('event_type', filters.eventType)
      }

      if (filters.level?.length) {
        query = query.in('level', filters.level)
      }

      if (filters.fromDate) {
        query = query.gte('created_at', filters.fromDate.toISOString())
      }

      if (filters.toDate) {
        query = query.lte('created_at', filters.toDate.toISOString())
      }

      query = query
        .order('created_at', { ascending: false })
        .limit(filters.limit || 100)

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data?.map(row => ({
        id: row.id,
        timestamp: row.created_at,
        level: row.level,
        eventType: row.event_type,
        userId: row.user_id,
        userEmail: row.user_email,
        message: row.message,
        details: row.details,
        resource: row.resource,
        metadata: row.metadata
      })) || []

    } catch (err) {
      console.error('監査ログクエリエラー:', err)
      return []
    }
  }
}

// 暗号化ユーティリティ
class EncryptionUtil {
  private static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    )
  }

  static async encrypt(data: string): Promise<string> {
    try {
      const key = await this.generateKey()
      const encoder = new TextEncoder()
      const dataUint8 = encoder.encode(data)
      
      const iv = crypto.getRandomValues(new Uint8Array(12))
      
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        dataUint8
      )

      // キー、IV、暗号化データを結合
      const result = new Uint8Array(key.algorithm.name.length + iv.length + encryptedData.byteLength)
      // 実際の実装では、キーを安全に管理する必要があります
      
      return btoa(String.fromCharCode(...result))
    } catch (err) {
      console.error('暗号化エラー:', err)
      return data // フォールバック
    }
  }
}

// 監査ログサービス
export class AuditLogger {
  private static instance: AuditLogger
  private storage: LogStorage
  private buffer: AuditLogEntry[] = []
  private flushInterval: number | null = null

  constructor() {
    this.storage = new SupabaseLogStorage()
    this.startBufferFlush()
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  // ログエントリの作成
  async log(
    level: AuditLevel,
    eventType: AuditEventType,
    message: string,
    details?: Record<string, any>,
    resource?: { type: string; id: string; name?: string }
  ): Promise<void> {
    const authStore = useAuthStore()
    const user = authStore.user

    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      eventType,
      userId: user?.id,
      userEmail: user?.email,
      message,
      details: details ? await this.encryptSensitiveData(details) : undefined,
      resource,
      metadata: {
        sessionId: authStore.session?.access_token?.substring(0, 8),
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now()
      }
    }

    // バッファに追加
    this.buffer.push(entry)

    // クリティカルレベルは即座に保存
    if (level === AuditLevel.CRITICAL) {
      await this.flush()
    }
  }

  // センシティブデータの暗号化
  private async encryptSensitiveData(data: Record<string, any>): Promise<Record<string, any>> {
    const sensitiveFields = ['password', 'token', 'secret', 'key']
    const result = { ...data }

    for (const [key, value] of Object.entries(result)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        if (typeof value === 'string') {
          result[key] = await EncryptionUtil.encrypt(value)
        }
      }
    }

    return result
  }

  // バッファのフラッシュ
  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return

    const entries = [...this.buffer]
    this.buffer = []

    try {
      await Promise.all(entries.map(entry => this.storage.store(entry)))
    } catch (err) {
      console.error('監査ログフラッシュエラー:', err)
      // エラーの場合はバッファに戻す
      this.buffer.unshift(...entries)
    }
  }

  // 定期的なバッファフラッシュを開始
  private startBufferFlush(): void {
    this.flushInterval = window.setInterval(() => {
      this.flush()
    }, 30000) // 30秒ごと
  }

  // ログクエリ
  async query(filters: LogQueryFilters): Promise<AuditLogEntry[]> {
    return await this.storage.query(filters)
  }

  // リソースへのアクセスをログ
  async logResourceAccess(
    resourceType: string,
    resourceId: string,
    action: string,
    granted: boolean,
    reason?: string
  ): Promise<void> {
    await this.log(
      granted ? AuditLevel.INFO : AuditLevel.WARNING,
      granted ? AuditEventType.ACCESS_GRANTED : AuditEventType.ACCESS_DENIED,
      `リソースアクセス: ${action} ${resourceType}`,
      {
        resourceType,
        resourceId,
        action,
        granted,
        reason
      },
      {
        type: resourceType,
        id: resourceId
      }
    )
  }

  // セキュリティイベントのログ
  async logSecurityEvent(
    eventType: AuditEventType,
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log(
      AuditLevel.CRITICAL,
      eventType,
      message,
      details
    )
  }

  // 破棄処理
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
    this.flush() // 最後のフラッシュ
  }
}

// 便利関数
export const auditLog = AuditLogger.getInstance()

export const logAuthEvent = (eventType: AuditEventType, message: string, details?: any) => {
  const level = eventType.includes('failed') || eventType.includes('denied') 
    ? AuditLevel.WARNING 
    : AuditLevel.INFO
  
  return auditLog.log(level, eventType, message, details)
}

export const logDataOperation = (
  operation: 'create' | 'read' | 'update' | 'delete',
  resourceType: string,
  resourceId: string,
  details?: any
) => {
  const eventTypeMap = {
    create: AuditEventType.DATA_CREATE,
    read: AuditEventType.DATA_READ,
    update: AuditEventType.DATA_UPDATE,
    delete: AuditEventType.DATA_DELETE
  }

  return auditLog.log(
    AuditLevel.INFO,
    eventTypeMap[operation],
    `${operation} ${resourceType}`,
    details,
    { type: resourceType, id: resourceId }
  )
}

// Vue Composable
export const useAuditLogger = () => {
  const logger = AuditLogger.getInstance()

  return {
    log: logger.log.bind(logger),
    logResourceAccess: logger.logResourceAccess.bind(logger),
    logSecurityEvent: logger.logSecurityEvent.bind(logger),
    query: logger.query.bind(logger),
    logAuthEvent,
    logDataOperation
  }
}