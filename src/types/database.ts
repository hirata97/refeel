// 自動生成されたデータベース型定義
// 生成日時: 2025-08-25T12:54:38.286Z

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
          mood_reason?: string
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
          mood_reason?: string
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
          mood_reason?: string
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
      emotion_tags: {
        Row: {
          id: string
          name: string
          category: string
          color: string
          description?: string
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          color?: string
          description?: string
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          color?: string
          description?: string
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      diary_emotion_tags: {
        Row: {
          id: string
          diary_id: string
          emotion_tag_id: string
          created_at: string
        }
        Insert: {
          id?: string
          diary_id: string
          emotion_tag_id: string
          created_at?: string
        }
        Update: {
          id?: string
          diary_id?: string
          emotion_tag_id?: string
          created_at?: string
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
