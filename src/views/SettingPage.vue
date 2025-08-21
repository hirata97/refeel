<template>
  <v-container class="settings-page">
    <v-typography variant="h4" class="mb-4">設定</v-typography>
    <v-typography variant="body1" class="mb-4">ここではアプリの設定を行います。</v-typography>

    <!-- 設定カード -->
    <v-row dense>
      <!-- テーマ設定 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2" size="24">mdi-palette</v-icon>
            テーマ設定
          </v-card-title>
          <v-card-subtitle>アプリの表示テーマを変更できます。</v-card-subtitle>
          <v-card-text>
            <v-select
              v-model="themeStore.selectedTheme"
              :items="themeOptions"
              item-title="title"
              item-value="value"
              label="テーマを選択"
              prepend-inner-icon="mdi-theme-light-dark"
              variant="outlined"
              @update:model-value="handleThemeChange"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props" :title="item.raw.title">
                  <template v-slot:prepend>
                    <v-icon :icon="item.raw.icon" class="mr-3"></v-icon>
                  </template>
                </v-list-item>
              </template>
            </v-select>
            
            <!-- 現在のテーマ状態表示 -->
            <v-chip
              :color="themeStore.isDarkMode ? 'secondary' : 'primary'"
              variant="outlined"
              class="mt-3"
            >
              <v-icon start :icon="themeStore.isDarkMode ? 'mdi-moon-waning-crescent' : 'mdi-white-balance-sunny'"></v-icon>
              現在: {{ themeStore.isDarkMode ? 'ダークモード' : 'ライトモード' }}
            </v-chip>
          </v-card-text>
          
          <v-card-actions>
            <v-btn
              variant="text"
              @click="toggleTheme"
              :prepend-icon="themeStore.isDarkMode ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent'"
            >
              {{ themeStore.isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore, type ThemeName } from '@/stores/theme'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

// テーマオプション
const themeOptions = computed(() => themeStore.getThemeOptions())

// テーマ変更ハンドラ
const handleThemeChange = (newTheme: ThemeName) => {
  themeStore.setTheme(newTheme)
}

// テーマトグル
const toggleTheme = () => {
  themeStore.toggleTheme()
}

// システムテーマリスナーのクリーンアップ関数
let cleanupThemeListener: (() => void) | null = null

// 認証状態をチェック
onMounted(() => {
  if (!authStore.isAuthenticated) {
    // 認証されていない場合はログインページにリダイレクト
    router.push('/login')
    return
  }
  
  // テーマストアを初期化
  cleanupThemeListener = themeStore.initialize()
})

// コンポーネント破棄時のクリーンアップ
onUnmounted(() => {
  if (cleanupThemeListener) {
    cleanupThemeListener()
  }
})

</script>

<style scoped>
/* 設定ページ全体のスタイル */
.settings-page {
  padding: 24px;
  border-radius: 8px;
  min-height: 100vh; /* ページ全体をカバーする高さ */
  transition: background-color 0.3s ease;
}

/* マージンのスタイル */
.mb-4 {
  margin-bottom: 16px;
}

/* テーマ切り替えアニメーション */
.v-card {
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.v-chip {
  transition: color 0.3s ease, background-color 0.3s ease;
}
</style>
