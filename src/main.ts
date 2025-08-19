import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import vuetify from './plugins/vuetify'
import router from './router'
import { supabase } from './lib/supabase' // Supabase をインポート
import { useAuthStore } from './stores/auth'
import { initializeSecurity } from './utils/security'
import { AuditLogger, AuditEventType } from './utils/audit-logger'

const app = createApp(App)
const pinia = createPinia()

app
  .use(pinia)
  .use(vuetify)
  .use(router) // Vue Router を登録
  .provide('supabase', supabase) // Supabase インスタンスを provide

// セキュリティ機能の初期化
initializeSecurity()

// 認証ストアの初期化
const authStore = useAuthStore()

// 監査ログサービスの初期化
const auditLogger = AuditLogger.getInstance()

// 認証イベントリスナーを設定
const authSubscription = authStore.setupAuthListener()

// セッション監視を開始
let sessionMonitoringCleanup: (() => void) | null = null
if (typeof authStore.startSessionMonitoring === 'function') {
  sessionMonitoringCleanup = authStore.startSessionMonitoring()
}

// アプリケーション開始をログに記録
auditLogger.log(AuditEventType.SYSTEM_INFO, 'アプリケーションが開始されました')

// アプリケーション終了時の処理
window.addEventListener('beforeunload', () => {
  // 認証リスナーを解除
  authSubscription.unsubscribe()
  
  // セッション監視を停止
  if (sessionMonitoringCleanup) {
    sessionMonitoringCleanup()
  }
  
  // アプリケーション終了をログに記録
  auditLogger.log(AuditEventType.SYSTEM_INFO, 'アプリケーションが終了されました')
})

// エラーハンドリング
window.addEventListener('error', (event) => {
  console.error('JavaScriptエラー:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  })
  
  auditLogger.log(
    AuditEventType.SYSTEM_ERROR,
    'JavaScriptエラーが発生しました',
    {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    }
  )
})

// 認証状態を初期化してからアプリをマウント
authStore.initialize().finally(() => {
  app.mount('#app')
})
