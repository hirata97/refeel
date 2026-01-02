/**
 * ユーザープロフィール管理ストア
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@core/lib/supabase'
import type { UserProfile } from '@/types/settings'
import { DEFAULT_USER_PROFILE } from '@/types/settings'
import { createLogger } from '@/utils/logger'

const logger = createLogger('PROFILE')

export const useProfileStore = defineStore('profile', () => {
  // 状態
  const profile = ref<UserProfile | null>(null)
  const loading = ref<boolean>(false)
  const lastError = ref<string | null>(null)
  const uploading = ref<boolean>(false)

  // 計算プロパティ
  const displayName = computed(() => profile.value?.display_name || '')
  const avatarUrl = computed(() => profile.value?.avatar_url || '')
  const hasProfile = computed(() => profile.value !== null)
  const isComplete = computed(() => {
    if (!profile.value) return false
    return !!(
      profile.value.display_name &&
      profile.value.timezone &&
      profile.value.preferred_language
    )
  })

  // プロフィールの取得
  const fetchProfile = async (): Promise<UserProfile | null> => {
    loading.value = true
    lastError.value = null

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        throw new Error(`認証エラー: ${authError.message}`)
      }

      if (!user) {
        throw new Error('認証されていません')
      }

      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()

      if (error && error.code !== 'PGRST116') {
        // "not found" エラー以外
        throw new Error(`プロフィール取得エラー: ${error.message}`)
      }

      if (data) {
        profile.value = data as UserProfile
      } else {
        // プロフィールが存在しない場合は初期値で作成
        await createProfile()
      }

      return profile.value
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'プロフィールの取得に失敗しました'
      logger.error('プロフィール取得エラー:', error)
      lastError.value = errorMessage
      return null
    } finally {
      loading.value = false
    }
  }

  // プロフィールの作成
  const createProfile = async (): Promise<UserProfile | null> => {
    loading.value = true
    lastError.value = null

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error('認証されていません')
      }

      const newProfile: Partial<UserProfile> = {
        ...DEFAULT_USER_PROFILE,
        display_name: user.email?.split('@')[0] || 'ユーザー',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert([{ id: user.id, ...newProfile }])
        .select()
        .single()

      if (error) {
        throw new Error(`プロフィール作成エラー: ${error.message}`)
      }

      profile.value = data as UserProfile
      return profile.value
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'プロフィールの作成に失敗しました'
      logger.error('プロフィール作成エラー:', error)
      lastError.value = errorMessage
      return null
    } finally {
      loading.value = false
    }
  }

  // プロフィールの更新
  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!profile.value) {
      lastError.value = 'プロフィールが読み込まれていません'
      return false
    }

    loading.value = true
    lastError.value = null

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error('認証されていません')
      }

      // 入力値の検証
      if (updates.display_name !== undefined) {
        if (!updates.display_name.trim()) {
          throw new Error('表示名は必須です')
        }
        if (updates.display_name.length > 50) {
          throw new Error('表示名は50文字以下で入力してください')
        }
      }

      if (updates.timezone !== undefined && !isValidTimezone(updates.timezone)) {
        throw new Error('無効なタイムゾーンです')
      }

      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        throw new Error(`プロフィール更新エラー: ${error.message}`)
      }

      profile.value = data as UserProfile
      return true
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'プロフィールの更新に失敗しました'
      logger.error('プロフィール更新エラー:', error)
      lastError.value = errorMessage
      return false
    } finally {
      loading.value = false
    }
  }

  // アバター画像のアップロード
  const uploadAvatar = async (file: File): Promise<string | null> => {
    uploading.value = true
    lastError.value = null

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error('認証されていません')
      }

      // ファイルの検証
      if (!file.type.startsWith('image/')) {
        throw new Error('画像ファイルのみアップロード可能です')
      }

      if (file.size > 5 * 1024 * 1024) {
        // 5MB制限
        throw new Error('ファイルサイズは5MB以下にしてください')
      }

      // ファイル名の生成
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}_${Date.now()}.${fileExt}`

      // 既存のアバターを削除（もしあれば）
      if (profile.value?.avatar_url) {
        const oldFileName = profile.value.avatar_url.split('/').pop()
        if (oldFileName) {
          await supabase.storage.from('avatars').remove([oldFileName])
        }
      }

      // 新しいファイルをアップロード
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
        })

      if (uploadError) {
        throw new Error(`アップロードエラー: ${uploadError.message}`)
      }

      // パブリックURLを取得
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(uploadData.path)

      // プロフィールを更新
      const success = await updateProfile({ avatar_url: publicUrl })

      if (!success) {
        throw new Error('プロフィールの更新に失敗しました')
      }

      return publicUrl
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'アバターのアップロードに失敗しました'
      logger.error('アバターアップロードエラー:', error)
      lastError.value = errorMessage
      return null
    } finally {
      uploading.value = false
    }
  }

  // アバター画像の削除
  const removeAvatar = async (): Promise<boolean> => {
    if (!profile.value?.avatar_url) {
      return true // すでに削除済み
    }

    loading.value = true
    lastError.value = null

    try {
      // ストレージからファイルを削除
      const fileName = profile.value.avatar_url.split('/').pop()
      if (fileName) {
        const { error: deleteError } = await supabase.storage.from('avatars').remove([fileName])

        if (deleteError) {
          logger.warn('ストレージからの削除に失敗:', deleteError)
          // ストレージ削除の失敗は非クリティカルなのでログのみ
        }
      }

      // プロフィールを更新
      const success = await updateProfile({ avatar_url: undefined })
      return success
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'アバターの削除に失敗しました'
      logger.error('アバター削除エラー:', error)
      lastError.value = errorMessage
      return false
    } finally {
      loading.value = false
    }
  }

  // タイムゾーンの検証
  const isValidTimezone = (timezone: string): boolean => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone })
      return true
    } catch {
      return false
    }
  }

  // プロフィールのリセット
  const resetProfile = () => {
    profile.value = null
    lastError.value = null
    loading.value = false
    uploading.value = false
  }

  // 初期化
  const initialize = async () => {
    await fetchProfile()
  }

  return {
    // 状態
    profile,
    loading,
    lastError,
    uploading,

    // 計算プロパティ
    displayName,
    avatarUrl,
    hasProfile,
    isComplete,

    // アクション
    fetchProfile,
    getProfile: fetchProfile, // ProfileSettingsCardとの互換性のためのエイリアス
    createProfile,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    resetProfile,
    initialize,
  }
})

export default useProfileStore
