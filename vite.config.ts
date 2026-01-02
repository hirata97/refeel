import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Refeel - Reflect + Feel',
        short_name: 'Refeel',
        description:
          'モチベーション変化を測定・分析するWebアプリケーション。日々の振り返りで内省を深め、感情と要因を可視化します。',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
              },
              plugins: [
                {
                  cacheKeyWillBeUsed: async ({ request }: { request: Request }) => {
                    const url = new URL(request.url)
                    // Remove auth tokens from cache key for security
                    url.searchParams.delete('apikey')
                    return url.href
                  },
                },
              ],
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
    },
  },
  server: {
    headers: {
      // Content Security Policy - Hardened
      // Removed: unsafe-eval (no eval usage confirmed)
      // Removed: unsafe-inline from script-src (XSS protection)
      // Kept: unsafe-inline for style-src (Vuetify dynamic theming compatibility)
      // Restricted: img-src to specific trusted domains (removed wildcard https:)
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: https://*.supabase.co https://cdn.jsdelivr.net; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none';",
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
    },
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
          'security-utils': ['dompurify'],
        },
      },
    },
    // ソースマップ設定（本番環境では無効）
    sourcemap: false,
    // 最小化設定
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 本番環境でconsole.logを削除
        drop_debugger: true, // 本番環境でdebuggerを削除
      },
    },
  },
})
