<template>
  <v-container class="settings-page">
    <h1 class="text-h4 mb-4">設定</h1>
    <p class="text-body-1 mb-4">ここではアプリの設定を行います。</p>

    <!-- タブナビゲーション -->
    <v-tabs v-model="activeTab" class="mb-4">
      <v-tab value="theme">テーマ</v-tab>
      <v-tab value="notifications">通知</v-tab>
      <v-tab value="profile">プロフィール</v-tab>
      <v-tab value="data">データ管理</v-tab>
      <v-tab value="privacy">プライバシー</v-tab>
      <v-tab value="emotion-tags">感情タグ</v-tab>
    </v-tabs>

    <!-- タブコンテンツ -->
    <v-tabs-window v-model="activeTab">
      <!-- テーマ設定 -->
      <v-tabs-window-item value="theme">
        <ThemeSettingsCard />
      </v-tabs-window-item>

      <!-- 通知設定 -->
      <v-tabs-window-item value="notifications">
        <NotificationSettings />
      </v-tabs-window-item>

      <!-- プロフィール管理 -->
      <v-tabs-window-item value="profile">
        <ProfileSettingsCard />
      </v-tabs-window-item>

      <!-- データ管理 -->
      <v-tabs-window-item value="data">
        <DataTab />
      </v-tabs-window-item>

      <!-- プライバシー設定 -->
      <v-tabs-window-item value="privacy">
        <PrivacySettings />
      </v-tabs-window-item>

      <!-- 感情タグ管理 -->
      <v-tabs-window-item value="emotion-tags">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2" size="24">mdi-emoticon-happy</v-icon>
            感情タグ管理
          </v-card-title>
          <v-card-subtitle>日記で使用される感情タグの管理ができます。</v-card-subtitle>
          <v-card-text>
            <EmotionTagManager />
          </v-card-text>
        </v-card>
      </v-tabs-window-item>
    </v-tabs-window>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useBrowserNotificationStore } from '@/stores/browserNotifications'
import { useProfileStore } from '@/stores/profile'
import { useDataManagementStore } from '@/stores/dataManagement'
import { useTheme } from 'vuetify'
import ThemeSettingsCard from '@/components/settings/ThemeSettingsCard.vue'
import ProfileSettingsCard from '@/components/settings/ProfileSettingsCard.vue'
import DataTab from '@/components/settings/DataTab.vue'
import PrivacySettings from '@/components/settings/PrivacySettings.vue'
import NotificationSettings from '@/components/NotificationSettings.vue'
import EmotionTagManager from '@/components/EmotionTagManager.vue'

// タブの状態管理
const activeTab = ref<string>('theme')

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const notificationStore = useBrowserNotificationStore()
const profileStore = useProfileStore()
const dataManagementStore = useDataManagementStore()
const vuetifyTheme = useTheme()

// システムテーマリスナーのクリーンアップ関数
let cleanupThemeListener: (() => void) | null = null

// 認証状態をチェック
onMounted(() => {
  if (!authStore.isAuthenticated) {
    // 認証されていない場合はログインページにリダイレクト
    router.push('/login')
    return
  }

  // Vuetifyテーマインスタンスをテーマストアに設定
  themeStore.setVuetifyTheme(vuetifyTheme)

  // テーマストアを初期化
  cleanupThemeListener = themeStore.initialize()

  // その他のストアの初期化
  notificationStore.initialize()
  profileStore.initialize()
  dataManagementStore.initialize()
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
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease;
}

.v-chip {
  transition:
    color 0.3s ease,
    background-color 0.3s ease;
}
</style>
