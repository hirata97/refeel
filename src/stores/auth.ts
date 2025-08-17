import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  // 状態
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  // 計算プロパティ
  const isAuthenticated = computed(() => !!user.value && !!session.value)
  const userProfile = computed(() => {
    if (!user.value) return null
    return {
      id: user.value.id,
      email: user.value.email,
      lastSignIn: user.value.last_sign_in_at,
      createdAt: user.value.created_at
    }
  })

  // アクション
  const setUser = (newUser: User | null) => {
    user.value = newUser
  }

  const setSession = (newSession: Session | null) => {
    session.value = newSession
    if (newSession?.user) {
      user.value = newSession.user
    }
  }

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  const clearError = () => {
    error.value = null
  }

  // 認証状態の初期化
  const initialize = async () => {
    try {
      setLoading(true)
      clearError()
      
      // 現在のセッションを取得
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw sessionError
      }

      if (session) {
        setSession(session)
      } else {
        setUser(null)
        setSession(null)
      }
    } catch (err) {
      console.error('認証状態の初期化エラー:', err)
      setError(err instanceof Error ? err.message : '認証状態の初期化に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // ログイン
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      clearError()

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        throw signInError
      }

      if (data.session && data.user) {
        setSession(data.session)
        return { success: true, user: data.user }
      }

      throw new Error('ログインに失敗しました')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ログインに失敗しました'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // ユーザー登録
  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true)
      clearError()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      })

      if (signUpError) {
        throw signUpError
      }

      if (data.user) {
        // サインアップ時は確認メールが送信される場合があるため、
        // セッションがない場合もある
        if (data.session) {
          setSession(data.session)
        }
        return { success: true, user: data.user, needsConfirmation: !data.session }
      }

      throw new Error('ユーザー登録に失敗しました')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ユーザー登録に失敗しました'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // ログアウト
  const signOut = async () => {
    try {
      setLoading(true)
      clearError()

      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) {
        throw signOutError
      }

      // 状態をクリア
      setUser(null)
      setSession(null)
      
      // ローカルストレージもクリア
      localStorage.removeItem('user')

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ログアウトに失敗しました'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // セッションの有効性確認
  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        throw error
      }

      if (session) {
        setSession(session)
        return true
      }
      
      // セッションが無効な場合は状態をクリア
      setUser(null)
      setSession(null)
      return false
    } catch (err) {
      console.error('セッション更新エラー:', err)
      setError(err instanceof Error ? err.message : 'セッションの更新に失敗しました')
      
      // エラーの場合も状態をクリア
      setUser(null)
      setSession(null)
      return false
    }
  }

  // 認証状態変更リスナーの設定
  const setupAuthListener = () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('認証状態変更:', event, session)
      
      switch (event) {
        case 'SIGNED_IN':
          if (session) {
            setSession(session)
          }
          break
        case 'SIGNED_OUT':
          setUser(null)
          setSession(null)
          localStorage.removeItem('user')
          break
        case 'TOKEN_REFRESHED':
          if (session) {
            setSession(session)
          }
          break
        case 'USER_UPDATED':
          if (session?.user) {
            setUser(session.user)
          }
          break
      }
      
      setLoading(false)
    })

    return subscription
  }

  return {
    // 状態
    user,
    session,
    loading,
    error,
    
    // 計算プロパティ
    isAuthenticated,
    userProfile,
    
    // アクション
    initialize,
    signIn,
    signUp,
    signOut,
    refreshSession,
    setupAuthListener,
    setError,
    clearError
  }
})