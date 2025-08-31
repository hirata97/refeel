import { supabase } from '@/lib/supabase'
import type { 
  PrivacySettings, 
  PrivacyAuditLog,
  ConsentRecord,
  ConsentType,
  PrivacyAction,
  GDPR 
} from '@/types/encryption'

/**
 * プライバシー設定管理クラス
 */
export class PrivacyManager {
  private static readonly DEFAULT_SETTINGS: Omit<PrivacySettings, 'userId' | 'updatedAt'> = {
    dataEncryption: true,
    shareAnalytics: false,
    shareUsageData: false,
    allowCookies: true,
    dataRetentionPeriod: 730, // 2年
    publicProfile: false,
    shareProgress: false,
    emailNotifications: true,
    dataExport: true,
    dataDelete: true,
    version: 1
  }

  /**
   * ユーザーのプライバシー設定を取得
   */
  static async getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
    try {
      const { data, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!data) {
        // デフォルト設定で新規作成
        return await this.createDefaultPrivacySettings(userId)
      }

      return {
        userId: data.user_id,
        dataEncryption: data.data_encryption,
        shareAnalytics: data.share_analytics,
        shareUsageData: data.share_usage_data,
        allowCookies: data.allow_cookies,
        dataRetentionPeriod: data.data_retention_period,
        publicProfile: data.public_profile,
        shareProgress: data.share_progress,
        emailNotifications: data.email_notifications,
        dataExport: data.data_export,
        dataDelete: data.data_delete,
        updatedAt: data.updated_at,
        version: data.version
      }
    } catch (error) {
      console.error('Failed to get privacy settings:', error)
      throw new Error('Privacy settings retrieval failed')
    }
  }

  /**
   * プライバシー設定を更新
   */
  static async updatePrivacySettings(
    userId: string, 
    settings: Partial<PrivacySettings>
  ): Promise<PrivacySettings> {
    try {
      const updatedSettings = {
        user_id: userId,
        data_encryption: settings.dataEncryption,
        share_analytics: settings.shareAnalytics,
        share_usage_data: settings.shareUsageData,
        allow_cookies: settings.allowCookies,
        data_retention_period: settings.dataRetentionPeriod,
        public_profile: settings.publicProfile,
        share_progress: settings.shareProgress,
        email_notifications: settings.emailNotifications,
        data_export: settings.dataExport,
        data_delete: settings.dataDelete,
        updated_at: new Date().toISOString(),
        version: (settings.version || 1) + 1
      }

      const { data, error } = await supabase
        .from('privacy_settings')
        .upsert(updatedSettings, { onConflict: 'user_id' })
        .select()
        .single()

      if (error) throw error

      // 監査ログに記録
      await this.logPrivacyAction(userId, 'privacy_settings_update', {
        changes: settings,
        version: updatedSettings.version
      })

      return {
        userId: data.user_id,
        dataEncryption: data.data_encryption,
        shareAnalytics: data.share_analytics,
        shareUsageData: data.share_usage_data,
        allowCookies: data.allow_cookies,
        dataRetentionPeriod: data.data_retention_period,
        publicProfile: data.public_profile,
        shareProgress: data.share_progress,
        emailNotifications: data.email_notifications,
        dataExport: data.data_export,
        dataDelete: data.data_delete,
        updatedAt: data.updated_at,
        version: data.version
      }
    } catch (error) {
      console.error('Failed to update privacy settings:', error)
      throw new Error('Privacy settings update failed')
    }
  }

  /**
   * デフォルトプライバシー設定を作成
   */
  private static async createDefaultPrivacySettings(userId: string): Promise<PrivacySettings> {
    const settings = {
      ...this.DEFAULT_SETTINGS,
      userId,
      updatedAt: new Date().toISOString()
    }

    await this.updatePrivacySettings(userId, settings)
    return settings
  }

  /**
   * プライバシー監査ログを記録
   */
  static async logPrivacyAction(
    userId: string,
    action: PrivacyAction,
    details: Record<string, unknown> = {},
    result: 'success' | 'failure' | 'partial' = 'success'
  ): Promise<void> {
    try {
      const auditLog: Omit<PrivacyAuditLog, 'id'> = {
        userId,
        action,
        details,
        timestamp: new Date().toISOString(),
        ipAddress: await this.getCurrentIP(),
        userAgent: navigator.userAgent,
        result
      }

      const { error } = await supabase
        .from('privacy_audit_log')
        .insert({
          user_id: auditLog.userId,
          action: auditLog.action,
          details: auditLog.details,
          timestamp: auditLog.timestamp,
          ip_address: auditLog.ipAddress,
          user_agent: auditLog.userAgent,
          result: auditLog.result
        })

      if (error) {
        console.error('Failed to log privacy action:', error)
      }
    } catch (error) {
      console.error('Privacy audit logging failed:', error)
    }
  }

  /**
   * 現在のIPアドレスを取得（簡易実装）
   */
  private static async getCurrentIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip || 'unknown'
    } catch {
      return 'unknown'
    }
  }
}

/**
 * 同意管理クラス
 */
export class ConsentManager {
  /**
   * 同意を記録
   */
  static async recordConsent(
    userId: string,
    consentType: ConsentType,
    granted: boolean,
    version: string = '1.0'
  ): Promise<void> {
    try {
      const consentRecord = {
        user_id: userId,
        consent_type: consentType,
        granted,
        granted_at: new Date().toISOString(),
        withdrawn_at: granted ? null : new Date().toISOString(),
        version,
        ip_address: await PrivacyManager['getCurrentIP'](),
        user_agent: navigator.userAgent,
        evidence: `User ${granted ? 'granted' : 'withdrew'} consent for ${consentType}`
      }

      const { error } = await supabase
        .from('consent_records')
        .insert(consentRecord)

      if (error) throw error

      // 監査ログに記録
      await PrivacyManager.logPrivacyAction(
        userId,
        granted ? 'consent_given' : 'consent_withdrawn',
        { consentType, version }
      )
    } catch (error) {
      console.error('Failed to record consent:', error)
      throw new Error('Consent recording failed')
    }
  }

  /**
   * ユーザーの同意状況を取得
   */
  static async getConsentStatus(userId: string): Promise<ConsentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('consent_records')
        .select('*')
        .eq('user_id', userId)
        .order('granted_at', { ascending: false })

      if (error) throw error

      return data.map(record => ({
        userId: record.user_id,
        consentType: record.consent_type,
        granted: record.granted,
        grantedAt: record.granted_at,
        withdrawnAt: record.withdrawn_at,
        version: record.version,
        ipAddress: record.ip_address,
        userAgent: record.user_agent,
        evidence: record.evidence
      }))
    } catch (error) {
      console.error('Failed to get consent status:', error)
      throw new Error('Consent status retrieval failed')
    }
  }

  /**
   * 特定の同意タイプの最新状況を確認
   */
  static async hasValidConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('consent_records')
        .select('granted, granted_at')
        .eq('user_id', userId)
        .eq('consent_type', consentType)
        .order('granted_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return data?.granted || false
    } catch (error) {
      console.error('Failed to check consent status:', error)
      return false
    }
  }
}

/**
 * データ削除管理クラス
 */
export class DataDeletionManager {
  /**
   * データ削除リクエストを作成
   */
  static async requestDataDeletion(
    userId: string,
    requestType: 'partial' | 'complete',
    dataTypes: string[] = [],
    reason?: string
  ): Promise<string> {
    try {
      const confirmationToken = crypto.randomUUID()
      const deletionRequest = {
        user_id: userId,
        request_type: requestType,
        data_types: dataTypes,
        reason,
        requested_at: new Date().toISOString(),
        scheduled_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30日後
        status: 'pending' as const,
        confirmation_token: confirmationToken,
        verification_required: requestType === 'complete'
      }

      const { error } = await supabase
        .from('data_deletion_requests')
        .insert(deletionRequest)

      if (error) throw error

      // 監査ログに記録
      await PrivacyManager.logPrivacyAction(userId, 'data_deletion', {
        requestType,
        dataTypes,
        scheduledAt: deletionRequest.scheduled_at
      })

      return confirmationToken
    } catch (error) {
      console.error('Failed to request data deletion:', error)
      throw new Error('Data deletion request failed')
    }
  }

  /**
   * データ削除リクエストを確認・実行
   */
  static async confirmDataDeletion(confirmationToken: string): Promise<boolean> {
    try {
      // リクエスト情報を取得
      const { data: request, error: fetchError } = await supabase
        .from('data_deletion_requests')
        .select('*')
        .eq('confirmation_token', confirmationToken)
        .eq('status', 'pending')
        .single()

      if (fetchError || !request) {
        throw new Error('Invalid or expired confirmation token')
      }

      // 削除実行
      const success = await this.executeDataDeletion(request)

      // ステータス更新
      await supabase
        .from('data_deletion_requests')
        .update({
          status: success ? 'completed' : 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('confirmation_token', confirmationToken)

      return success
    } catch (error) {
      console.error('Failed to confirm data deletion:', error)
      return false
    }
  }

  /**
   * 実際のデータ削除を実行
   */
  private static async executeDataDeletion(request: {
    user_id: string
    request_type: 'partial' | 'complete'
    data_types: string[] | null
  }): Promise<boolean> {
    try {
      const userId = request.user_id
      const requestType = request.request_type
      const dataTypes = request.data_types || []

      if (requestType === 'complete') {
        // 完全削除：全てのユーザーデータを削除
        await this.deleteAllUserData(userId)
      } else {
        // 部分削除：指定されたデータタイプのみ削除
        await this.deletePartialUserData(userId, dataTypes)
      }

      return true
    } catch (error) {
      console.error('Data deletion execution failed:', error)
      return false
    }
  }

  /**
   * 全ユーザーデータの削除
   */
  private static async deleteAllUserData(userId: string): Promise<void> {
    const tables = [
      'goals',
      'progress_entries', 
      'categories',
      'user_profiles',
      'privacy_settings',
      'consent_records',
      'privacy_audit_log'
    ]

    for (const table of tables) {
      await supabase.from(table).delete().eq('user_id', userId)
    }

    // Supabase Authからも削除
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) {
      console.error('Failed to delete auth user:', error)
    }
  }

  /**
   * 部分ユーザーデータの削除
   */
  private static async deletePartialUserData(userId: string, dataTypes: string[]): Promise<void> {
    const tableMapping: Record<string, string> = {
      'goals': 'goals',
      'progress': 'progress_entries',
      'categories': 'categories',
      'profile': 'user_profiles'
    }

    for (const dataType of dataTypes) {
      const table = tableMapping[dataType]
      if (table) {
        await supabase.from(table).delete().eq('user_id', userId)
      }
    }
  }
}

/**
 * GDPR準拠管理クラス
 */
export class GDPRCompliance {
  private static readonly GDPR_RIGHTS: GDPR = {
    rightToAccess: true,
    rightToRectification: true,
    rightToErasure: true,
    rightToRestrictProcessing: true,
    rightToDataPortability: true,
    rightToObject: true,
    rightNotToBeSubject: true
  }

  /**
   * データアクセス権の行使（データエクスポート）
   */
  static async exerciseRightToAccess(userId: string): Promise<Record<string, unknown>> {
    try {
      const userData: Record<string, unknown> = {}

      // 各テーブルからデータを取得
      const tables = ['goals', 'progress_entries', 'categories', 'user_profiles']
      
      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', userId)

        if (!error && data) {
          userData[table] = data
        }
      }

      // プライバシー設定と同意記録も含める
      userData.privacy_settings = await PrivacyManager.getPrivacySettings(userId)
      userData.consent_records = await ConsentManager.getConsentStatus(userId)

      // 監査ログに記録
      await PrivacyManager.logPrivacyAction(userId, 'data_access', {
        exportedTables: Object.keys(userData),
        recordCount: Object.values(userData).flat().length
      })

      return userData
    } catch (error) {
      console.error('Failed to exercise right to access:', error)
      throw new Error('Data access request failed')
    }
  }

  /**
   * 削除権の行使（忘れられる権利）
   */
  static async exerciseRightToErasure(userId: string, reason?: string): Promise<string> {
    return await DataDeletionManager.requestDataDeletion(userId, 'complete', [], reason)
  }

  /**
   * データポータビリティ権の行使
   */
  static async exerciseRightToDataPortability(userId: string): Promise<Blob> {
    try {
      const userData = await this.exerciseRightToAccess(userId)
      const jsonData = JSON.stringify(userData, null, 2)
      return new Blob([jsonData], { type: 'application/json' })
    } catch (error) {
      console.error('Failed to exercise right to data portability:', error)
      throw new Error('Data portability request failed')
    }
  }

  /**
   * GDPR権利の確認
   */
  static getGDPRRights(): GDPR {
    return { ...this.GDPR_RIGHTS }
  }
}

/**
 * プライバシーシステムの初期化
 */
export async function initializePrivacySystem(): Promise<void> {
  try {
    // 必要な初期化処理
    console.log('🛡️ Privacy system initialized')
  } catch (error) {
    console.error('Failed to initialize privacy system:', error)
    throw new Error('Privacy system initialization failed')
  }
}