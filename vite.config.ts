import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    headers: {
      // Content Security Policy
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none';",
      // XSS Protection
      'X-XSS-Protection': '1; mode=block',
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      // Prevent framing (clickjacking protection)
      'X-Frame-Options': 'DENY',
      // Referrer Policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      // Permissions Policy
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    }
  },
  build: {
    rollupOptions: {
      output: {
        // セキュリティ向上のためランダムなファイル名生成
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]',
      }
    }
  }
})
