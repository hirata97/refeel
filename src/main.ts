import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import router from './router'
import { supabase } from './lib/supabase' // Supabase をインポート

const vuetify = createVuetify({
  components,
  directives,
})

createApp(App)
  .use(vuetify)
  .use(router) // Vue Router を登録
  .provide('supabase', supabase) // Supabase インスタンスを provide
  .mount('#app')
