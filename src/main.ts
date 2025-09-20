import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import './styles/global.css'
import vuetify from './plugins/vuetify'
import router from './router'
import { supabase } from './lib/supabase' // Supabase をインポート
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import { initializeSecurity } from './utils/security'
import { AuditLogger, AuditEventType } from './utils/audit-logger'
import { syncService } from './services/syncService'

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

// テーマストアの初期化
const themeStore = useThemeStore()

// 監査ログサービスの初期化
const auditLogger = AuditLogger.getInstance()

// 認証イベントリスナーを設定
const authSubscription = authStore.setupAuthListener()

// セッション監視を開始
let sessionMonitoringCleanup: (() => void) | null = null
if (typeof authStore.startSessionMonitoring === 'function') {
  sessionMonitoringCleanup = authStore.startSessionMonitoring()
}

// テーマストアを初期化（システムテーマリスナーを設定）
let themeListenerCleanup: (() => void) | null = null

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

  // テーマリスナーを解除
  if (themeListenerCleanup) {
    themeListenerCleanup()
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
    stack: event.error?.stack,
  })

  auditLogger.log(AuditEventType.SYSTEM_ERROR, 'JavaScriptエラーが発生しました', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
  })
})

// PWA Service Worker登録
const registerPWA = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Vite PWA Pluginが自動生成するService Workerを登録
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      console.log('PWA Service Worker登録成功:', registration.scope)

      // 更新チェック
      registration.addEventListener('updatefound', () => {
        console.log('PWA Service Worker更新が見つかりました')
      })

      return registration
    } catch (error) {
      console.error('PWA Service Worker登録失敗:', error)
    }
  }
}

// 認証状態を初期化してからアプリをマウント
authStore.initialize().finally(async () => {
  // アプリをマウント
  app.mount('#app')

  // テーマストアを初期化（Vuetifyインスタンスは各コンポーネントで設定）
  themeListenerCleanup = themeStore.initialize()

  // PWA Service Workerを登録
  await registerPWA()

  // 認証済みユーザーの場合、オフライン機能を初期化
  if (authStore.isAuthenticated && authStore.user) {
    // オンライン/オフライン監視を設定
    syncService.setupOnlineListener(authStore.user.id)

    // 定期同期を設定（15分間隔）
    syncService.setupPeriodicSync(authStore.user.id, 15)

    // 初回同期を実行
    if (navigator.onLine) {
      try {
        await syncService.syncData(authStore.user.id)
        console.log('初回データ同期完了')
      } catch (error) {
        console.error('初回データ同期エラー:', error)
      }
    }
  }
})
