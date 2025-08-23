/**
 * データ管理機能ストア
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type {
  DataManagementSettings,
  ExportData,
  ImportData,
} from '@/types/settings'
import { DEFAULT_DATA_MANAGEMENT_SETTINGS } from '@/types/settings'

export const useDataManagementStore = defineStore('dataManagement', () => {
  // 状態
  const settings = ref<DataManagementSettings>({ ...DEFAULT_DATA_MANAGEMENT_SETTINGS })
  const loading = ref<boolean>(false)
  const lastError = ref<string | null>(null)
  const exportProgress = ref<number>(0)
  const importProgress = ref<number>(0)

  // 計算プロパティ
  const isExporting = computed(() => exportProgress.value > 0 && exportProgress.value < 100)
  const isImporting = computed(() => importProgress.value > 0 && importProgress.value < 100)
  const storageUsage = ref<{ used: number; total: number }>({ used: 0, total: 0 })

  // ストレージ使用量の取得
  const fetchStorageUsage = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('認証されていません')
      }

      // 日記データのサイズを取得
      const { data: diaries, error: diaryError } = await supabase
        .from('diaries')
        .select('content, created_at')
        .eq('user_id', user.id)

      if (diaryError) {
        throw new Error(`日記データ取得エラー: ${diaryError.message}`)
      }

      // データサイズの概算計算（文字数ベース）
      const estimatedSize = diaries?.reduce((total, diary) => {
        return total + (diary.content?.length || 0) + 50 // メタデータの概算
      }, 0) || 0

      storageUsage.value = {
        used: estimatedSize,
        total: 1024 * 1024 * 100, // 100MBの制限（仮想的な値）
      }
    } catch (error) {
      console.error('ストレージ使用量取得エラー:', error)
    }
  }

  // データのエクスポート
  const exportData = async (exportOptions: ExportData): Promise<Blob | null> => {
    loading.value = true
    exportProgress.value = 0
    lastError.value = null

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('認証されていません')
      }

      exportProgress.value = 10

      const exportedData: Record<string, unknown> = {
        exportInfo: {
          exportedAt: new Date().toISOString(),
          version: '1.0.0',
          userId: user.id,
          format: exportOptions.format,
        },
      }

      // 日記データの取得
      if (exportOptions.dataTypes.includes('diaries')) {
        exportProgress.value = 30

        let query = supabase
          .from('diaries')
          .select('*')
          .eq('user_id', user.id)

        if (exportOptions.dateRange) {
          query = query
            .gte('created_at', exportOptions.dateRange.from)
            .lte('created_at', exportOptions.dateRange.to)
        }

        const { data: diaries, error: diaryError } = await query.order('created_at', { ascending: true })

        if (diaryError) {
          throw new Error(`日記データエクスポートエラー: ${diaryError.message}`)
        }

        exportedData.diaries = diaries
        exportProgress.value = 60
      }

      // 設定データの取得
      if (exportOptions.dataTypes.includes('settings')) {
        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (settingsError && settingsError.code !== 'PGRST116') {
          throw new Error(`設定データエクスポートエラー: ${settingsError.message}`)
        }

        exportedData.settings = settingsData || {}
        exportProgress.value = 80
      }

      // プロフィールデータの取得
      if (exportOptions.dataTypes.includes('profile')) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          throw new Error(`プロフィールデータエクスポートエラー: ${profileError.message}`)
        }

        exportedData.profile = profileData || {}
        exportProgress.value = 90
      }

      // データのフォーマット
      let content: string
      let mimeType: string
      let _fileName: string

      if (exportOptions.format === 'json') {
        content = JSON.stringify(exportedData, null, 2)
        mimeType = 'application/json'
        _fileName = `goal_diary_backup_${new Date().toISOString().split('T')[0]}.json`
      } else if (exportOptions.format === 'csv') {
        // CSV形式の場合は日記データのみをエクスポート
        if (exportedData.diaries && Array.isArray(exportedData.diaries) && exportedData.diaries.length > 0) {
          const headers = Object.keys(exportedData.diaries[0] as Record<string, unknown>).join(',')
          const rows = exportedData.diaries.map((diary: Record<string, unknown>) =>
            Object.values(diary).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
          )
          content = [headers, ...rows].join('\n')
        } else {
          content = 'No diary data to export'
        }
        mimeType = 'text/csv'
        _fileName = `goal_diary_diaries_${new Date().toISOString().split('T')[0]}.csv`
      } else {
        throw new Error('サポートされていないエクスポート形式です')
      }

      exportProgress.value = 100

      return new Blob([content], { type: mimeType })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'データのエクスポートに失敗しました'
      console.error('エクスポートエラー:', error)
      lastError.value = errorMessage
      return null
    } finally {
      loading.value = false
      exportProgress.value = 0
    }
  }

  // データのインポート
  const importData = async (importOptions: ImportData): Promise<boolean> => {
    loading.value = true
    importProgress.value = 0
    lastError.value = null

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('認証されていません')
      }

      importProgress.value = 10

      // ファイルの読み込み
      const fileContent = await readFileContent(importOptions.file)
      importProgress.value = 30

      let importedData: Record<string, unknown>
      if (importOptions.format === 'json') {
        importedData = JSON.parse(fileContent)
      } else if (importOptions.format === 'csv') {
        // CSV形式のパース（簡単な実装）
        const lines = fileContent.split('\n')
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''))
        const rows = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, ''))
          const obj: Record<string, unknown> = {}
          headers.forEach((header, index) => {
            obj[header] = values[index]
          })
          return obj
        })
        importedData = { diaries: rows }
      } else {
        throw new Error('サポートされていないインポート形式です')
      }

      importProgress.value = 50

      // データの検証
      if (importOptions.validateData && !validateImportedData(importedData)) {
        throw new Error('インポートデータの形式が正しくありません')
      }

      // 日記データのインポート
      if (importedData.diaries && Array.isArray(importedData.diaries)) {
        const diaries = importedData.diaries.map((diary: Record<string, unknown>) => ({
          ...diary,
          user_id: user.id,
          created_at: diary.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

        if (importOptions.conflictResolution === 'overwrite') {
          // 既存データを削除してから新しいデータを挿入
          const { error: deleteError } = await supabase
            .from('diaries')
            .delete()
            .eq('user_id', user.id)

          if (deleteError) {
            throw new Error(`既存データ削除エラー: ${deleteError.message}`)
          }
        }

        const { error: insertError } = await supabase
          .from('diaries')
          .upsert(diaries, { onConflict: importOptions.conflictResolution === 'merge' ? 'id' : undefined })

        if (insertError) {
          throw new Error(`日記データインポートエラー: ${insertError.message}`)
        }
      }

      importProgress.value = 80

      // 設定データのインポート
      if (importedData.settings) {
        const { error: settingsError } = await supabase
          .from('user_settings')
          .upsert([{ user_id: user.id, ...importedData.settings }])

        if (settingsError) {
          throw new Error(`設定データインポートエラー: ${settingsError.message}`)
        }
      }

      importProgress.value = 100
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'データのインポートに失敗しました'
      console.error('インポートエラー:', error)
      lastError.value = errorMessage
      return false
    } finally {
      loading.value = false
      importProgress.value = 0
    }
  }

  // 全データの削除
  const deleteAllData = async (): Promise<boolean> => {
    loading.value = true
    lastError.value = null

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('認証されていません')
      }

      // 日記データの削除
      const { error: diaryError } = await supabase
        .from('diaries')
        .delete()
        .eq('user_id', user.id)

      if (diaryError) {
        throw new Error(`日記データ削除エラー: ${diaryError.message}`)
      }

      // 設定データの削除
      const { error: settingsError } = await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', user.id)

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw new Error(`設定データ削除エラー: ${settingsError.message}`)
      }

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '全データの削除に失敗しました'
      console.error('データ削除エラー:', error)
      lastError.value = errorMessage
      return false
    } finally {
      loading.value = false
    }
  }

  // 設定の更新
  const updateSettings = async (newSettings: Partial<DataManagementSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
    await saveToStorage()
  }

  // ローカルストレージに保存
  const saveToStorage = async () => {
    try {
      localStorage.setItem('data-management-settings', JSON.stringify(settings.value))
    } catch (error) {
      console.error('データ管理設定の保存に失敗:', error)
    }
  }

  // ローカルストレージから読み込み
  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem('data-management-settings')
      if (saved) {
        settings.value = { ...DEFAULT_DATA_MANAGEMENT_SETTINGS, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.error('データ管理設定の読み込みに失敗:', error)
    }
  }

  // ファイル内容の読み込み
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'))
      reader.readAsText(file)
    })
  }

  // インポートデータの検証
  const validateImportedData = (data: unknown): boolean => {
    if (!data || typeof data !== 'object') {
      return false
    }
    const dataObj = data as Record<string, unknown>
    // 基本的な構造の検証
    if (dataObj.diaries && !Array.isArray(dataObj.diaries)) {
      return false
    }

    return true
  }

  // 初期化
  const initialize = () => {
    loadFromStorage()
    fetchStorageUsage()
  }

  return {
    // 状態
    settings,
    loading,
    lastError,
    exportProgress,
    importProgress,
    storageUsage,

    // 計算プロパティ
    isExporting,
    isImporting,

    // アクション
    fetchStorageUsage,
    exportData,
    importData,
    deleteAllData,
    updateSettings,
    saveToStorage,
    loadFromStorage,
    initialize,
  }
})

export default useDataManagementStore