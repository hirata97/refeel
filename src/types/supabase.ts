// 自動生成されたSupabaseクライアント型定義
// 生成日時: 2025-11-13T02:12:41.164Z

import type { Database } from './database'

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// 具体的な型エイリアス
export type DiaryEntry = Tables<'diaries'>
export type DiaryInsert = Inserts<'diaries'>
export type DiaryUpdate = Updates<'diaries'>

export type Profile = Tables<'profiles'>
export type ProfileInsert = Inserts<'profiles'>
export type ProfileUpdate = Updates<'profiles'>

export type Settings = Tables<'settings'>
export type SettingsInsert = Inserts<'settings'>
export type SettingsUpdate = Updates<'settings'>

// 既存コードとの互換性のための型エイリアス
export type RecentDiary = DiaryEntry & {
  isRecent?: boolean
}

export type DashboardData = {
  totalEntries: number
  recentEntries: DiaryEntry[]
  progressSummary: {
    [category: string]: {
      count: number
      averageProgress: number
    }
  }
}
