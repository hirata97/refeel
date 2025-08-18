import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL or Key is missing')
}

// CSRFトークンをヘッダーに追加するカスタムヘッダー関数（現在未使用）
// const getCustomHeaders = () => {
//   const headers: Record<string, string> = {}
//   
//   // CSRFトークンをヘッダーに追加（一時的に無効化）
//   // const csrfHeaders = CSRFProtection.addTokenToHeaders()
//   // Object.assign(headers, csrfHeaders)
//   
//   // セキュリティヘッダーを追加
//   headers['X-Requested-With'] = 'XMLHttpRequest'
//   headers['Content-Type'] = 'application/json'
//   
//   return headers
// }

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // セキュリティ強化のためセッションストレージを使用
    storage: window.sessionStorage,
  },
})

// Supabaseリクエストのインターセプター（型安全性のため一時的にコメントアウト）
// const originalRpc = supabase.rpc
// supabase.rpc = function(fn: string, args?: Record<string, unknown>, options?: Record<string, unknown>) {
//   // RPCリクエストにCSRFトークンを追加
//   const enhancedOptions = {
//     ...options,
//     headers: {
//       ...options?.headers,
//       ...getCustomHeaders(),
//     },
//   }
//   
//   return originalRpc.call(this, fn, args, enhancedOptions)
// }
