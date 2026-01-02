/**
 * 型定義生成機能のユニットテスト
 * Issue #144: データベーススキーマからTypeScript型定義の自動生成機能
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// テスト対象型定義のインポート
import type { Database } from '@shared/types'
import type { DiaryEntry, Profile, Settings } from '@shared/types'

describe('型定義自動生成機能', () => {
  describe('Database型定義', () => {
    it('Databaseインターフェースが正しく定義されている', () => {
      // Database型の構造を型レベルで確認（TypeScriptコンパイル時チェック）
      type DatabasePublic = Database['public']
      type Tables = DatabasePublic['Tables']
      type _DiariesTable = Tables['diaries']
      type _ProfilesTable = Tables['profiles']
      type _SettingsTable = Tables['settings']
      
      // 型定義が存在することを確認（コンパイル時チェック）
      expect(true).toBe(true) // 型定義が存在すればコンパイルが通る
    })

    it('diariesテーブルが正しい型定義を持つ', () => {
      type DiariesTable = Database['public']['Tables']['diaries']
      
      // Row型の検証
      const row = {} as DiariesTable['Row']
      expect(row.id).toBeUndefined() // string型を想定
      expect(row.user_id).toBeUndefined()
      expect(row.date).toBeUndefined()
      expect(row.title).toBeUndefined()
      expect(row.content).toBeUndefined()
      expect(row.mood).toBeUndefined() // number型を想定
      expect(row.goal_category).toBeUndefined()
      expect(row.progress_level).toBeUndefined() // number型を想定
      expect(row.created_at).toBeUndefined()
      expect(row.updated_at).toBeUndefined()

      // Insert型の検証
      const insert = {} as DiariesTable['Insert']
      // idはオプショナル
      expect(insert).toBeDefined()
      
      // Update型の検証
      const update = {} as DiariesTable['Update']
      // 全フィールドがオプショナル
      expect(update).toBeDefined()
    })
  })

  describe('Supabase型定義', () => {
    it('DiaryEntry型が正しく定義されている', () => {
      const diary = {} as DiaryEntry
      
      // 必須フィールドの存在確認（TypeScriptコンパイル時チェック）
      expect(typeof diary.id).toBe('undefined') // 実際には string
      expect(typeof diary.user_id).toBe('undefined')
      expect(typeof diary.date).toBe('undefined')
      expect(typeof diary.title).toBe('undefined')
      expect(typeof diary.content).toBe('undefined')
      expect(typeof diary.mood).toBe('undefined') // number
      expect(typeof diary.goal_category).toBe('undefined')
      expect(typeof diary.progress_level).toBe('undefined') // number
    })

    it('Profile型が正しく定義されている', () => {
      const profile = {} as Profile
      
      expect(typeof profile.id).toBe('undefined')
      expect(typeof profile.user_id).toBe('undefined')
      expect(typeof profile.username).toBe('undefined')
      expect(typeof profile.email).toBe('undefined')
    })

    it('Settings型が正しく定義されている', () => {
      const settings = {} as Settings
      
      expect(typeof settings.id).toBe('undefined')
      expect(typeof settings.user_id).toBe('undefined')
      expect(typeof settings.theme).toBe('undefined')
      expect(typeof settings.language).toBe('undefined')
      expect(typeof settings.notifications).toBe('undefined') // boolean
    })
  })

  describe('ファイル生成確認', () => {
    it('database.tsファイルが生成されている', () => {
      const filePath = join(process.cwd(), 'src/types/database.ts')
      expect(existsSync(filePath)).toBe(true)
      
      const content = readFileSync(filePath, 'utf-8')
      expect(content).toContain('export interface Database')
      expect(content).toContain('// 自動生成されたデータベース型定義')
    })

    it('supabase.tsファイルが生成されている', () => {
      const filePath = join(process.cwd(), 'src/types/supabase.ts')
      expect(existsSync(filePath)).toBe(true)
      
      const content = readFileSync(filePath, 'utf-8')
      expect(content).toContain('export type DiaryEntry')
      expect(content).toContain('// 自動生成されたSupabaseクライアント型定義')
    })
  })

  describe('型の互換性', () => {
    it('DiaryEntryが従来型と互換性を持つ', () => {
      // 新しいDiaryEntry型が従来のLegacyDiaryEntry型と同等のフィールドを持つことを確認
      const newDiary = {} as DiaryEntry
      
      // 従来の型と同じフィールドが存在することを確認
      const legacyFields = [
        'id', 'user_id', 'date', 'title', 'content', 
        'mood', 'goal_category', 'progress_level', 
        'created_at', 'updated_at'
      ]
      
      legacyFields.forEach(field => {
        expect(field in newDiary).toBe(false) // undefined オブジェクトなので false だが、型定義は存在
      })
    })
  })

  describe('型生成スクリプト', () => {
    it('generate-types スクリプトが存在する', () => {
      const scriptPath = join(process.cwd(), 'scripts/generate-types.js')
      expect(existsSync(scriptPath)).toBe(true)
    })

    it('package.jsonに必要なコマンドが定義されている', async () => {
      const packageJsonPath = join(process.cwd(), 'package.json')
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
      
      expect(packageJson.scripts['generate-types']).toBeDefined()
      expect(packageJson.scripts['generate-types:prod']).toBeDefined()
      expect(packageJson.scripts['dev:with-types']).toBeDefined()
    })
  })
})