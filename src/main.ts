import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import vuetify from './plugins/vuetify'
import router from './router'
import { supabase } from './lib/supabase' // Supabase をインポート
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app
  .use(pinia)
  .use(vuetify)
  .use(router) // Vue Router を登録
  .provide('supabase', supabase) // Supabase インスタンスを provide

// 認証ストアの初期化
const authStore = useAuthStore()

// 認証イベントリスナーを設定
const authSubscription = authStore.setupAuthListener()

// アプリケーション終了時にリスナーを解除
window.addEventListener('beforeunload', () => {
  authSubscription.unsubscribe()
})

// 認証状態を初期化してからアプリをマウント
authStore.initialize().finally(() => {
  app.mount('#app')
})
