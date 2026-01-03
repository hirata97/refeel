/**
 * 認証関連のユーティリティ関数とセキュリティ機能
 *
 * 注意: ルートガードやコンポーネントでは直接 useAuthStore() を使用することを推奨します。
 * このファイルは後方互換性と共通ロジックのために提供されています。
 */

// ===== 型定義 =====
export * from '@features/auth/types'

// ===== 認証ガード・ユーティリティ =====
export * from './guards'

// ===== セッション管理 =====
export * from './session-manager'

// ===== ロックアウト管理 =====
export * from './lockout-manager'

// ===== パスワード管理 =====
export * from './password-manager'

// ===== 監査ログ =====
export * from './audit-logger'
