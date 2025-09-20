/**
 * 暗号化関連の型定義
 */

export interface EncryptedData {
  data: string // 暗号化されたデータ（HEX文字列）
  iv: string // 初期化ベクター（HEX文字列）
  algorithm: string // 暗号化アルゴリズム
  timestamp: number // 暗号化実行時刻
  version: string // バージョン情報
}

export interface EncryptionKeyInfo {
  keyData: JsonWebKey // JWK形式のキーデータ
  algorithm: string // アルゴリズム名
  keyLength: number // キー長
  createdAt: number // キー生成時刻
  version: string // バージョン情報
}

export interface EncryptionConfig {
  enabled: boolean // 暗号化の有効/無効
  algorithm: string // 使用する暗号化アルゴリズム
  keyLength: number // キー長
  rotationInterval: number // キーローテーション間隔（ミリ秒）
  sensitiveFields: string[] // 暗号化対象フィールド
  encryptByDefault: boolean // デフォルトで暗号化するか
  requireEncryption: string[] // 必ず暗号化が必要なフィールド
}

export interface PrivacySettings {
  userId: string // ユーザーID
  dataEncryption: boolean // データ暗号化の有効/無効
  shareAnalytics: boolean // アナリティクス共有の許可
  shareUsageData: boolean // 使用データ共有の許可
  allowCookies: boolean // Cookie使用の許可
  dataRetentionPeriod: number // データ保持期間（日数）
  publicProfile: boolean // プロフィール公開
  shareProgress: boolean // 進捗共有の許可
  emailNotifications: boolean // メール通知の許可
  dataExport: boolean // データエクスポート権限
  dataDelete: boolean // データ削除権限
  updatedAt: string // 設定更新日時
  version: number // 設定バージョン
}

export interface DataDeletionRequest {
  userId: string // ユーザーID
  requestType: 'partial' | 'complete' // 削除タイプ
  dataTypes: string[] // 削除対象データタイプ
  reason?: string // 削除理由（任意）
  requestedAt: string // リクエスト日時
  scheduledAt?: string // 削除実行予定日時
  status: 'pending' | 'processing' | 'completed' | 'failed' // 処理状況
  confirmationToken?: string // 確認トークン
  verificationRequired: boolean // 本人確認が必要か
}

export interface DataRetentionPolicy {
  dataType: string // データタイプ
  retentionPeriod: number // 保持期間（日数）
  autoDelete: boolean // 自動削除の有効/無効
  encryptionRequired: boolean // 暗号化必須か
  backupRequired: boolean // バックアップ必須か
  auditRequired: boolean // 監査ログ必須か
  description: string // ポリシーの説明
}

export interface PrivacyAuditLog {
  id: string // ログID
  userId: string // ユーザーID
  action: PrivacyAction // 実行されたアクション
  dataType?: string // 対象データタイプ
  details: Record<string, unknown> // 詳細情報
  timestamp: string // 実行時刻
  ipAddress?: string // IPアドレス
  userAgent?: string // ユーザーエージェント
  result: 'success' | 'failure' | 'partial' // 実行結果
}

export type PrivacyAction =
  | 'data_access' // データアクセス
  | 'data_export' // データエクスポート
  | 'data_deletion' // データ削除
  | 'privacy_settings_update' // プライバシー設定更新
  | 'consent_given' // 同意付与
  | 'consent_withdrawn' // 同意撤回
  | 'data_encryption' // データ暗号化
  | 'data_decryption' // データ復号化
  | 'key_rotation' // キーローテーション
  | 'breach_detected' // 侵害検出

export interface ConsentRecord {
  userId: string // ユーザーID
  consentType: ConsentType // 同意タイプ
  granted: boolean // 同意の有無
  grantedAt: string // 同意日時
  withdrawnAt?: string // 撤回日時
  version: string // 同意書バージョン
  ipAddress: string // 同意時IPアドレス
  userAgent: string // 同意時ユーザーエージェント
  evidence?: string // 同意の証跡
}

export type ConsentType =
  | 'data_processing' // データ処理
  | 'analytics' // アナリティクス
  | 'marketing' // マーケティング
  | 'cookies' // Cookie使用
  | 'third_party_sharing' // 第三者共有
  | 'data_retention' // データ保持

export interface DataSubject {
  userId: string // ユーザーID
  email: string // メールアドレス
  registeredAt: string // 登録日時
  privacySettings: PrivacySettings // プライバシー設定
  consents: ConsentRecord[] // 同意記録
  dataRetention: DataRetentionPolicy[] // データ保持ポリシー
  auditLog: PrivacyAuditLog[] // 監査ログ
  lastActivity: string // 最終活動日時
}

export interface EncryptionStatus {
  isEnabled: boolean // 暗号化が有効か
  algorithm: string // 使用アルゴリズム
  keyAge: number // キーの経過時間（ミリ秒）
  lastRotation?: string // 最後のキーローテーション
  encryptedFields: string[] // 暗号化されたフィールド
  totalEncryptedRecords: number // 暗号化済みレコード数
  healthStatus: 'healthy' | 'warning' | 'critical' // ヘルス状態
}

export interface GDPR {
  rightToAccess: boolean // アクセス権
  rightToRectification: boolean // 修正権
  rightToErasure: boolean // 削除権（忘れられる権利）
  rightToRestrictProcessing: boolean // 処理制限権
  rightToDataPortability: boolean // データポータビリティ権
  rightToObject: boolean // 異議申立権
  rightNotToBeSubject: boolean // 自動的処理対象とならない権利
}
