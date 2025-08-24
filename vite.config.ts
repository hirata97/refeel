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
    // チャンクサイズの警告閾値を調整
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // セキュリティ向上のためランダムなファイル名生成
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]',
        // チャンク分割の最適化
        manualChunks: {
          // Vue関連ライブラリをベンダーチャンクに分離
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // Vuetifyを独立したチャンクに分離
          'vuetify-vendor': ['vuetify'],
          // Chart.jsを独立したチャンクに分離
          'chart-vendor': ['chart.js', 'vue-chartjs'],
          // Supabaseクライアントを独立したチャンクに分離
          'supabase-vendor': ['@supabase/supabase-js'],
          // セキュリティ関連ユーティリティを独立したチャンクに分離
          'security-utils': ['dompurify']
        }
      }
    },
    // ソースマップ設定（本番環境では無効）
    sourcemap: false,
    // 最小化設定
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 本番環境でconsole.logを削除
        drop_debugger: true // 本番環境でdebuggerを削除
      }
    }
  }
})
