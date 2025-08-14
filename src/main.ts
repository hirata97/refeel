import { createApp } from 'vue'
import App from './App.vue'

import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import vuetify from './plugins/vuetify'
import router from './router'
import { supabase } from './lib/supabase' // Supabase をインポート

createApp(App)
  .use(vuetify)
  .use(router) // Vue Router を登録
  .provide('supabase', supabase) // Supabase インスタンスを provide
  .mount('#app')
