// 自動生成されたデータベース型定義
// 生成日時: 2025-09-20T05:45:09.440Z

export interface Database {
  public: {
    Tables: {
      diaries: {
        Row: {
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
          encrypted_data?: string
          tags?: string[]
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          title: string
          content: string
          mood?: number
          goal_category: string
          progress_level?: number
          created_at?: string
          updated_at?: string
          encrypted_data?: string
          tags?: string[]
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          title?: string
          content?: string
          mood?: number
          goal_category?: string
          progress_level?: number
          created_at?: string
          updated_at?: string
          encrypted_data?: string
          tags?: string[]
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          username: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          username: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          user_id: string
          theme: string
          language: string
          notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string
          language?: string
          notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string
          language?: string
          notifications?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
