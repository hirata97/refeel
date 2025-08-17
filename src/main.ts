import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import vuetify from './plugins/vuetify'
import validationPlugin from './plugins/validation'
import router from './router'
import { supabase } from './lib/supabase' // Supabase をインポート
import { useAuthStore } from './stores/auth'
import { AuditLogger, AuditEventType, logAuthEvent } from './utils/audit-logger'

const app = createApp(App)
const pinia = createPinia()

app
  .use(pinia)
  .use(vuetify)
  .use(validationPlugin)
  .use(router) // Vue Router を登録
  .provide('supabase', supabase) // Supabase インスタンスを provide

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
logAuthEvent(AuditEventType.SYSTEM_WARNING, 'アプリケーションが開始されました')

// アプリケーション終了時の処理
window.addEventListener('beforeunload', () => {
  // 認証リスナーを解除
  authSubscription.unsubscribe()
  
  // セッション監視を停止
  if (sessionMonitoringCleanup) {
    sessionMonitoringCleanup()
  }
  
  // 監査ログサービスを終了
  auditLogger.destroy()
  
  // アプリケーション終了をログに記録
  logAuthEvent(AuditEventType.SYSTEM_WARNING, 'アプリケーションが終了されました')
})

// エラーハンドリング
window.addEventListener('error', (event) => {
  auditLogger.logSecurityEvent(
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
