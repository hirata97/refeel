/**
 * 設定機能の型定義
 */

// 通知設定
export interface NotificationSettings {
  /** ブラウザ通知の有効化 */
  enabled: boolean
  /** 日記リマインダー通知 */
  diaryReminder: boolean
  /** リマインダーの時刻 (HH:MM形式) */
  reminderTime: string
  /** 通知音の有効化 */
  soundEnabled: boolean
  /** 通知の表示時間 (ミリ秒) */
  displayDuration: number
}

// ユーザープロフィール
export interface UserProfile {
  /** ユーザー表示名 */
  displayName: string
  /** アバター画像URL */
  avatarUrl?: string
  /** タイムゾーン */
  timezone: string
  /** 言語設定 */
  language: string
  /** プロフィール作成日時 */
  createdAt: string
  /** プロフィール更新日時 */
  updatedAt: string
}

// データ管理設定
export interface DataManagementSettings {
  /** 自動保存の有効化 */
  autoSave: boolean
  /** 自動保存間隔 (秒) */
  autoSaveInterval: number
  /** バックアップの有効化 */
  backupEnabled: boolean
  /** バックアップ頻度 ('daily' | 'weekly' | 'monthly') */
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  /** データ保持期間 (日数) */
  dataRetentionDays: number
}

// アプリケーション設定
export interface ApplicationSettings {
  /** デフォルト気分値 (1-10) */
  defaultMoodValue: number
  /** 日付フォーマット */
  dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY'
  /** 時刻フォーマット */
  timeFormat: '24h' | '12h'
  /** 1ページあたりの表示件数 */
  itemsPerPage: number
  /** アニメーション有効化 */
  animationsEnabled: boolean
}

// プライバシー・セキュリティ設定
export interface PrivacySettings {
  /** データ収集の許可 */
  dataCollectionConsent: boolean
  /** アナリティクスの許可 */
  analyticsConsent: boolean
  /** セッション保持期間 (日数) */
  sessionRetentionDays: number
  /** 自動ログアウト時間 (分) */
  autoLogoutMinutes: number
}

// 統合設定インターフェース
export interface UserSettings {
  /** 通知設定 */
  notifications: NotificationSettings
  /** データ管理設定 */
  dataManagement: DataManagementSettings
  /** アプリケーション設定 */
  application: ApplicationSettings
  /** プライバシー設定 */
  privacy: PrivacySettings
  /** 設定更新日時 */
  updatedAt: string
}

// 設定のデフォルト値
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  diaryReminder: false,
  reminderTime: '20:00',
  soundEnabled: true,
  displayDuration: 5000,
}

export const DEFAULT_DATA_MANAGEMENT_SETTINGS: DataManagementSettings = {
  autoSave: true,
  autoSaveInterval: 30,
  backupEnabled: false,
  backupFrequency: 'weekly',
  dataRetentionDays: 365,
}

export const DEFAULT_APPLICATION_SETTINGS: ApplicationSettings = {
  defaultMoodValue: 5,
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  itemsPerPage: 10,
  animationsEnabled: true,
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  dataCollectionConsent: false,
  analyticsConsent: false,
  sessionRetentionDays: 7,
  autoLogoutMinutes: 480, // 8時間
}

export const DEFAULT_USER_PROFILE: Partial<UserProfile> = {
  displayName: '',
  timezone: 'Asia/Tokyo',
  language: 'ja',
}

// エクスポート・インポート用の型
export interface ExportData {
  /** エクスポート形式 */
  format: 'json' | 'csv'
  /** データの種類 */
  dataTypes: Array<'diaries' | 'settings' | 'profile'>
  /** 期間フィルター */
  dateRange?: {
    from: string
    to: string
  }
  /** 圧縮の有効化 */
  compressed: boolean
}

export interface ImportData {
  /** インポート形式 */
  format: 'json' | 'csv'
  /** インポートファイル */
  file: File
  /** 既存データの扱い */
  conflictResolution: 'overwrite' | 'merge' | 'skip'
  /** 検証の有効化 */
  validateData: boolean
}

// 通知権限の状態
export type NotificationPermission = 'default' | 'granted' | 'denied'

// 設定の検証結果
export interface SettingsValidationResult {
  /** 検証成功フラグ */
  isValid: boolean
  /** エラーメッセージ */
  errors: Array<{
    field: string
    message: string
  }>
  /** 警告メッセージ */
  warnings: Array<{
    field: string
    message: string
  }>
}