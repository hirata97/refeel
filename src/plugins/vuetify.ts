import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#673AB7', // Deep Purple 500
          secondary: '#424242',
          background: '#f5f7fa',
          surface: '#ffffff',
          'primary-darken-1': '#512DA8', // Deep Purple 700
          'secondary-darken-1': '#212121',
          error: '#f44336',
          warning: '#ff9800',
          info: '#2196f3',
          success: '#4caf50',
          // カスタムテーマカラー
          'primary-lighten-1': '#7986CB', // Deep Purple 400
          'primary-lighten-2': '#9C27B0', // Purple accent
          'surface-variant': '#F3E5F5', // Purple 50
        },
      },
      dark: {
        colors: {
          primary: '#7C4DFF', // Deep Purple A200
          secondary: '#90CAF9',
          background: '#121212',
          surface: '#1E1E1E',
          'primary-darken-1': '#651FFF', // Deep Purple A400
          'secondary-darken-1': '#64B5F6',
          error: '#CF6679',
          warning: '#FFB74D',
          info: '#81D4FA',
          success: '#81C784',
          // カスタムテーマカラー（ダーク）
          'primary-lighten-1': '#9575CD', // Deep Purple 300
          'primary-lighten-2': '#BA68C8', // Purple 300
          'surface-variant': '#2A1B3D', // Dark Purple variant
        },
      },
    },
  },
})
