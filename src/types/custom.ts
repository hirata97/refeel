// カスタム型定義（手動管理ファイル）
// 生成日時: 2025-08-25T07:50:00.000Z
// 注意: このファイルは手動で管理され、自動生成されません

// 既存コードとの互換性のために残す型定義
export interface LegacyDiaryEntry {
  id: string
  user_id: string
  date: string
  title: string
  content: string
  mood: number
  goal_category: string
  progress_level: number
  created_at: string
  updated_at: string
}

// アカウント型定義
export interface Account {
  id: string
  user_id: string
  email: string
  username?: string
  created_at: string
  updated_at: string
}

// その他のカスタム型定義
export interface CacheEntry<T> {
  data: T
  timestamp: number
  expires: number
}

export type CacheKey = 'diaries' | 'accounts' | 'user_profile'

// フォームデータ型定義
export interface DiaryFormData {
  title: string
  content: string
  mood: number
  goal_category: string
  progress_level: number
  date?: string
}

// API レスポンス型定義
export interface PaginatedResponse<T> {
  data: T[]
  count: number
  totalPages: number
}

// エラー型定義
export interface ApiError {
  message: string
  code?: string
  details?: unknown
}