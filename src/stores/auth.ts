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
  const sessionExpiresAt = ref<number | null>(null)
  const lastActivity = ref<number>(Date.now())
  const sessionTimeout = ref<number>(30 * 60 * 1000) // 30分のタイムアウト

  // 計算プロパティ
  const isAuthenticated = computed(() => !!user.value && !!session.value && !isSessionExpired.value)
  const userProfile = computed(() => {
    if (!user.value) return null
    return {
      id: user.value.id,
      email: user.value.email,
      lastSignIn: user.value.last_sign_in_at,
      createdAt: user.value.created_at
    }
  })
  
  const isSessionExpired = computed(() => {
    if (!sessionExpiresAt.value) return false
    return Date.now() > sessionExpiresAt.value
  })

  const timeUntilExpiry = computed(() => {
    if (!sessionExpiresAt.value) return 0
    return Math.max(0, sessionExpiresAt.value - Date.now())
  })

  // セッション活動時間の更新
  const updateLastActivity = () => {
    lastActivity.value = Date.now()
  }

  // セッションタイムアウトの設定
  const setSessionTimeout = (timeout: number) => {
    sessionTimeout.value = timeout
  }

  // アクション
  const setUser = (newUser: User | null) => {
    user.value = newUser
    updateLastActivity()
  }

  const setSession = (newSession: Session | null) => {
    session.value = newSession
    if (newSession?.user) {
      user.value = newSession.user
      // セッション有効期限を設定（Supabaseのexpires_atを使用、またはデフォルト値）
      const expiresAt = newSession.expires_at 
        ? newSession.expires_at * 1000 
        : Date.now() + sessionTimeout.value
      sessionExpiresAt.value = expiresAt
    } else {
      sessionExpiresAt.value = null
    }
    updateLastActivity()
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

  // セッションの強制無効化
  const invalidateSession = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      sessionExpiresAt.value = null
      localStorage.removeItem('user')
      localStorage.removeItem('lastActivity')
      console.log('セッションを強制無効化しました')
    } catch (err) {
      console.error('セッション無効化エラー:', err)
    }
  }

  // セッションIDの再生成
  const regenerateSession = async () => {
    try {
      if (!session.value) {
        throw new Error('セッションが存在しません')
      }

      // 新しいセッションを要求
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        throw error
      }

      if (data.session) {
        setSession(data.session)
        console.log('セッションIDを再生成しました')
        return { success: true }
      }

      throw new Error('セッション再生成に失敗しました')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'セッション再生成に失敗しました'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // セッションの有効性を確認し、期限切れの場合は無効化
  const validateSession = async () => {
    if (!session.value) return false

    try {
      // アクティビティタイムアウトチェック
      const inactiveTime = Date.now() - lastActivity.value
      if (inactiveTime > sessionTimeout.value) {
        console.log('セッションがタイムアウトしました')
        await invalidateSession()
        return false
      }

      // セッション有効期限チェック
      if (isSessionExpired.value) {
        console.log('セッションの有効期限が切れました')
        await invalidateSession()
        return false
      }

      // Supabaseセッションの有効性確認
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        console.log('Supabaseセッションが無効です')
        await invalidateSession()
        return false
      }

      updateLastActivity()
      return true
    } catch (err) {
      console.error('セッション検証エラー:', err)
      await invalidateSession()
      return false
    }
  }

  // 認証状態の初期化
  const initialize = async () => {
    try {
      setLoading(true)
      clearError()
      
      // 保存された最終活動時間を復元
      const savedActivity = localStorage.getItem('lastActivity')
      if (savedActivity) {
        lastActivity.value = parseInt(savedActivity, 10)
      }

      // 現在のセッションを取得
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw sessionError
      }

      if (session) {
        setSession(session)
        // セッションの有効性を検証
        const isValid = await validateSession()
        if (!isValid) {
          setUser(null)
          setSession(null)
        }
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
        // セッションIDを再生成（セキュリティ強化）
        await regenerateSession()
        // 最終活動時間を保存
        localStorage.setItem('lastActivity', lastActivity.value.toString())
        
        console.log('ログイン成功、セッションを作成しました')
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
          localStorage.setItem('lastActivity', lastActivity.value.toString())
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
      sessionExpiresAt.value = null
      
      // ローカルストレージもクリア
      localStorage.removeItem('user')
      localStorage.removeItem('lastActivity')

      console.log('ログアウトしました')
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
        localStorage.setItem('lastActivity', lastActivity.value.toString())
        console.log('セッションを更新しました')
        return true
      }
      
      // セッションが無効な場合は状態をクリア
      await invalidateSession()
      return false
    } catch (err) {
      console.error('セッション更新エラー:', err)
      setError(err instanceof Error ? err.message : 'セッションの更新に失敗しました')
      
      // エラーの場合も状態をクリア
      await invalidateSession()
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
            localStorage.setItem('lastActivity', lastActivity.value.toString())
          }
          break
        case 'SIGNED_OUT':
          setUser(null)
          setSession(null)
          sessionExpiresAt.value = null
          localStorage.removeItem('user')
          localStorage.removeItem('lastActivity')
          break
        case 'TOKEN_REFRESHED':
          if (session) {
            setSession(session)
            localStorage.setItem('lastActivity', lastActivity.value.toString())
          }
          break
        case 'USER_UPDATED':
          if (session?.user) {
            setUser(session.user)
            updateLastActivity()
          }
          break
      }
      
      setLoading(false)
    })

    return subscription
  }

  // セッション監視の開始
  const startSessionMonitoring = () => {
    // 1分ごとにセッションの有効性をチェック
    const interval = setInterval(async () => {
      if (session.value) {
        await validateSession()
      }
    }, 60000) // 1分

    return () => clearInterval(interval)
  }

  return {
    // 状態
    user,
    session,
    loading,
    error,
    sessionExpiresAt,
    lastActivity,
    sessionTimeout,
    
    // 計算プロパティ
    isAuthenticated,
    userProfile,
    isSessionExpired,
    timeUntilExpiry,
    
    // アクション
    initialize,
    signIn,
    signUp,
    signOut,
    refreshSession,
    setupAuthListener,
    setError,
    clearError,
    updateLastActivity,
    setSessionTimeout,
    invalidateSession,
    regenerateSession,
    validateSession,
    startSessionMonitoring
  }
})