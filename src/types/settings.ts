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
  /** リマインダー曜日 */
  reminderDays: number[]
  /** 目標期限アラート */
  goalDeadlineAlert: boolean
  /** 達成通知 */
  achievementNotification: boolean
  /** 通知音の有効化 */
  soundEnabled: boolean
  /** 通知の表示時間 (ミリ秒) */
  displayDuration: number
}

// ユーザープロフィール
export interface UserProfile {
  /** ユーザーID */
  user_id: string
  /** ユーザー表示名 */
  display_name: string
  /** 自己紹介 */
  bio?: string
  /** アバター画像URL */
  avatar_url?: string
  /** 言語設定 */
  preferred_language: string
  /** タイムゾーン */
  timezone: string
  /** プロフィール公開設定 */
  public_profile: boolean
  /** 達成状況表示設定 */
  show_achievements: boolean
  /** プロフィール作成日時 */
  created_at: string
  /** プロフィール更新日時 */
  updated_at: string
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
  reminderDays: [1, 2, 3, 4, 5], // 月-金
  goalDeadlineAlert: true,
  achievementNotification: true,
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
  display_name: '',
  bio: '',
  avatar_url: '',
  preferred_language: 'ja',
  timezone: 'Asia/Tokyo',
  public_profile: false,
  show_achievements: true,
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