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
          primary: '#1976D2',
          secondary: '#424242',
          background: '#f5f7fa',
          surface: '#ffffff',
          'primary-darken-1': '#1565C0',
          'secondary-darken-1': '#212121',
          error: '#f44336',
          warning: '#ff9800',
          info: '#2196f3',
          success: '#4caf50',
        },
      },
      dark: {
        colors: {
          primary: '#2196F3',
          secondary: '#90CAF9',
          background: '#121212',
          surface: '#1E1E1E',
          'primary-darken-1': '#1976D2',
          'secondary-darken-1': '#64B5F6',
          error: '#CF6679',
          warning: '#FFB74D',
          info: '#81D4FA',
          success: '#81C784',
        },
      },
    },
  },
})
