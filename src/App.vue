<template>
  <v-app>
    <!-- スキップリンク（アクセシビリティ対応） -->
    <SkipLink />

    <!-- サイドバー -->
    <v-navigation-drawer
      app
      v-model="drawer"
      clipped
      :temporary="true"
      :disable-resize-watcher="disableSidebarToggle"
    >
      <v-list density="compact">
        <!-- サイドバー項目をループで表示 -->
        <v-list-item v-for="item in items" :key="item.title" :to="item.link" router link>
          <template #prepend>
            <v-icon>{{ item.prependIcon }}</v-icon>
          </template>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app clipped-left class="ps-4" color="primary">
      <v-app-bar-nav-icon :disabled="disableSidebarToggle" @click="toggleDrawer" />

      <v-app-bar-title>Refeel</v-app-bar-title>

      <template #append>
        <!-- ユーザーメニュー -->
        <v-btn class="text-none me-2" height="48" icon slim>
          <v-avatar
            color="surface-light"
            image="https://cdn.vuetifyjs.com/images/john.png"
            size="32"
          />

          <v-menu activator="parent">
            <v-list density="compact" nav>
              <v-list-item
                append-icon="mdi-cog-outline"
                link
                title="Settings"
                @click="goToSettings"
              />
              <v-list-item append-icon="mdi-logout" link title="Logout" @click="handleLogout" />
            </v-list>
          </v-menu>
        </v-btn>
      </template>
    </v-app-bar>

    <!-- メインコンテンツ (router-view) -->
    <v-main id="main-content">
      <div class="pa-4">
        <router-view></router-view>
      </div>
    </v-main>

    <!-- グローバル通知システム -->
    <GlobalNotification />

    <!-- PWAインストール促進 -->
    <PWAInstallPrompt />

    <!-- グローバルローディング -->
    <v-overlay v-model="loadingStore.globalLoading" class="align-center justify-center">
      <v-progress-circular indeterminate size="64" />
    </v-overlay>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { useLoadingStore } from '@/stores/loading'
import GlobalNotification from '@/components/notifications/GlobalNotification.vue'
import PWAInstallPrompt from '@/components/PWAInstallPrompt.vue'
import SkipLink from '@/components/a11y/SkipLink.vue'
import { createLogger } from '@/utils/logger'

const logger = createLogger('APP')

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const loadingStore = useLoadingStore()

// サイドバーの開閉状態
const drawer = ref(false)

// サイドバーに表示する項目
const items = ref([
  {
    title: 'ダッシュボード',
    prependIcon: 'mdi-view-dashboard-outline',
    link: '/dashboard',
  },
  {
    title: '日記登録',
    prependIcon: 'mdi-pencil-outline',
    link: '/diary-register',
  },
  {
    title: '日記閲覧',
    prependIcon: 'mdi-book-open-outline',
    link: '/diary-view',
  },
  {
    title: '週間振り返り',
    prependIcon: 'mdi-calendar-week',
    link: '/weekly-reflection',
  },
  {
    title: '設定',
    prependIcon: 'mdi-cog-outline',
    link: '/setting',
  },
  {
    title: 'ヘルプ',
    prependIcon: 'mdi-help-circle-outline',
    link: '/help',
  },
])

// ログアウト処理
const handleLogout = async () => {
  try {
    await loadingStore.withLoading('logout', async () => {
      const result = await authStore.signOut()
      if (result.success) {
        notificationStore.showSuccess('ログアウトしました')
        await router.push('/login')
      } else {
        logger.error('ログアウトエラー:', result.error)
        notificationStore.showError('ログアウトに失敗しました', 'ログアウトに失敗しました')
      }
    })
  } catch (error) {
    logger.error('ログアウトエラー:', error)
    notificationStore.showError(
      'ログアウトに失敗しました',
      error instanceof Error ? error.message : 'Unknown error',
    )
  }
}

// 設定ページに移動
const goToSettings = () => {
  router.push('/setting')
}

// サイドバーの開閉ボタンを無効にするかどうかを決定
const disableSidebarToggle = computed(() => {
  const noSidebarRoutes = ['/', '/login', '/register']
  return noSidebarRoutes.includes(route.path)
})

// サイドバーの開閉を切り替える関数
const toggleDrawer = () => {
  if (!disableSidebarToggle.value) {
    drawer.value = !drawer.value
  }
}
</script>

<style scoped>
/* Vuetifyのappプロパティにより自動的に適切なレイアウトが適用される */
</style>
