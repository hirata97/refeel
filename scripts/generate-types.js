#!/usr/bin/env node

/**
 * Supabase型定義自動生成スクリプト
 * 
 * 機能:
 * 1. ローカルのSupabase環境から型定義を生成
 * 2. 生成された型定義をsrc/types/に配置
 * 3. 既存コードとの互換性チェック
 */

import { execSync } from 'child_process'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import prettier from 'prettier'
import { join } from 'path'

const PROJECT_ROOT = process.cwd()
const TYPES_DIR = join(PROJECT_ROOT, 'src/types')
const GENERATED_TYPES_FILE = join(TYPES_DIR, 'database.ts')
const SUPABASE_TYPES_FILE = join(TYPES_DIR, 'supabase.ts')

// 環境変数から設定を取得
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

// PROJECT_IDの抽出ロジック（より堅牢に）
function extractProjectId(url) {
  if (!url) {
    log('VITE_SUPABASE_URL が設定されていません', 'error')
    return null
  }
  
  // 複数のパターンに対応
  const patterns = [
    /https:\/\/([a-zA-Z0-9]+)\.supabase\.co/,  // 標準パターン
    /https:\/\/([a-zA-Z0-9\-_]+)\.supabase\.co/, // ハイフン・アンダースコア対応
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      log(`PROJECT_ID を抽出しました: ${match[1]}`, 'success')
      return match[1]
    }
  }
  
  log(`URL形式が不正です: ${url}`, 'error')
  return null
}

const PROJECT_ID = extractProjectId(SUPABASE_URL)

/**
 * ログ出力関数
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'
  console.log(`${prefix} [${timestamp}] ${message}`)
}

/**
 * エラーハンドリング付きコマンド実行
 */
function execCommand(command, description) {
  try {
    log(`実行中: ${description}`)
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' })
    log(`完了: ${description}`, 'success')
    return output
  } catch (error) {
    log(`失敗: ${description} - ${error.message}`, 'error')
    throw error
  }
}

/**
 * 型定義ディレクトリの準備
 */
function prepareTyepesDirectory() {
  if (!existsSync(TYPES_DIR)) {
    mkdirSync(TYPES_DIR, { recursive: true })
    log('型定義ディレクトリを作成しました', 'success')
  }
}

/**
 * 指定ファイルを Prettier で整形して書き込む
 */
async function formatAndWrite(filePath, content) {
  try {
    let prettierConfig = null
    if (typeof prettier.resolveConfig === 'function') {
      try {
        prettierConfig = await prettier.resolveConfig(filePath)
      } catch (e) {
        // ignore
      }
    }
    const formatted = prettier.format(content, { ...(prettierConfig || {}), filepath: filePath })
    writeFileSync(filePath, formatted)
    log(`Prettierで整形しました: ${filePath}`, 'success')
  } catch (e) {
    log(`Prettier 整形に失敗しました: ${e.message}`, 'error')
  }
}

/**
 * ローカル環境用の型定義生成（モックデータベース使用）
 */
async function generateTypesLocal() {
  log('ローカル環境用の型定義を生成しています...')
  
  // 基本的なデータベース型定義のテンプレート
  const databaseTypeTemplate = `// 自動生成されたデータベース型定義
// 生成日時: ${new Date().toISOString()}

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
`

  // Supabaseクライアント型定義のテンプレート
  const supabaseTypeTemplate = `// 自動生成されたSupabaseクライアント型定義
// 生成日時: ${new Date().toISOString()}

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
`

  // ファイル書き込み
  writeFileSync(GENERATED_TYPES_FILE, databaseTypeTemplate)
  writeFileSync(SUPABASE_TYPES_FILE, supabaseTypeTemplate)

  // Prettier で整形（失敗しても処理を続行）
  try {
    await formatAndWrite(GENERATED_TYPES_FILE, databaseTypeTemplate)
    await formatAndWrite(SUPABASE_TYPES_FILE, supabaseTypeTemplate)
  } catch (e) {
    log(`Prettier 整形中にエラーが発生しました: ${e.message}`, 'error')
  }

  log('ローカル型定義を生成しました', 'success')
}

/**
 * 本番環境用の型定義生成（実際のSupabase接続）
 */
async function generateTypesProduction() {
  // 環境変数の検証
  log('本番環境用の型定義生成を開始します...')
  log(`SUPABASE_URL: ${SUPABASE_URL ? '設定済み' : '未設定'}`)
  log(`ACCESS_TOKEN: ${ACCESS_TOKEN ? '設定済み' : '未設定'}`)
  log(`PROJECT_ID: ${PROJECT_ID || '取得失敗'}`)
  
  if (!PROJECT_ID) {
    log('PROJECT_ID が取得できません。環境変数を確認してください:', 'error')
    log(`  VITE_SUPABASE_URL: ${SUPABASE_URL || 'undefined'}`, 'error')
    log(`  SUPABASE_ACCESS_TOKEN: ${ACCESS_TOKEN ? '設定済み' : 'undefined'}`, 'error')
    throw new Error('PROJECT_ID が環境変数から取得できません')
  }
  
  if (!ACCESS_TOKEN) {
    log('SUPABASE_ACCESS_TOKEN が設定されていません', 'error')
    throw new Error('SUPABASE_ACCESS_TOKEN が必要です')
  }

  try {
    // Supabase CLIを使用して型定義生成を試行
    log(`PROJECT_ID ${PROJECT_ID} を使用して型定義を生成しています...`)
    const typesOutput = execCommand(
      `npx supabase gen types typescript --project-id ${PROJECT_ID}`,
      'Supabaseから型定義を取得'
    )
    
    // 生成された型定義をファイルに保存
    const wrappedTypes = `// 自動生成されたデータベース型定義
// 生成日時: ${new Date().toISOString()}
// Supabase Project ID: ${PROJECT_ID}

${typesOutput}
`
    
    writeFileSync(GENERATED_TYPES_FILE, wrappedTypes)
    try {
      await formatAndWrite(GENERATED_TYPES_FILE, wrappedTypes)
    } catch (e) {
      log(`Prettier 整形中にエラーが発生しました: ${e.message}`, 'error')
    }
    log('本番環境の型定義を生成しました', 'success')
    
  } catch (error) {
    log(`本番環境での型定義生成に失敗: ${error.message}`, 'error')
    log('ローカル環境用にフォールバックします', 'error')
    await generateTypesLocal()
  }
}

/**
 * 既存コードとの互換性チェック
 */
function validateTypeCompatibility() {
  try {
    log('型チェックを実行しています...')
    execCommand('npm run ci:type-check', '型チェック実行')
    log('型チェックが成功しました', 'success')
    return true
  } catch (error) {
    log('型チェックでエラーが発生しました', 'error')
    console.error(error.stdout || error.message)
    return false
  }
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    log('=== Supabase型定義自動生成開始 ===')
    
    // 1. 準備
    prepareTyepesDirectory()
    
    // 2. 型定義生成
    const useProduction = process.argv.includes('--production') || process.env.NODE_ENV === 'production'
    
    if (useProduction) {
      await generateTypesProduction()
    } else {
      await generateTypesLocal()
    }
    
    // 3. 互換性チェック
    const isValid = validateTypeCompatibility()
    
    if (isValid) {
      log('=== 型定義生成が正常に完了しました ===', 'success')
    } else {
      log('=== 型定義生成は完了しましたが、型エラーがあります ===', 'error')
      process.exit(1)
    }
    
  } catch (error) {
    log(`型定義生成中にエラーが発生しました: ${error.message}`, 'error')
    process.exit(1)
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}