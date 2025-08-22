<template>
  <v-layout>
    <!-- サイドバー -->
    <v-navigation-drawer
      :permanent="false"
      v-model="drawer"
      :disable-resize-watcher="disableSidebarToggle"
    >
      <v-list density="compact">
        <!-- サイドバー項目をループで表示 -->
        <v-list-item v-for="item in items" :key="item.title" :to="item.link" router link>
          <v-list-item-icon>
            <v-icon>{{ item.prependIcon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- ツールバー -->
    <v-app-bar class="ps-4" color="deep-purple">
      <!-- サイドバーの開閉ボタン -->
      <v-app-bar-nav-icon :disabled="disableSidebarToggle" @click="toggleDrawer" />

      <v-app-bar-title>日記アプリゆる開発</v-app-bar-title>

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
    <v-main>
      <div class="pa-4">
        <router-view></router-view>
      </div>
    </v-main>

    <!-- グローバル通知システム -->
    <GlobalNotification />

    <!-- グローバルローディング -->
    <v-overlay v-model="loadingStore.globalLoading" class="align-center justify-center">
      <v-progress-circular indeterminate size="64" />
    </v-overlay>
  </v-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { useLoadingStore } from '@/stores/loading'
import GlobalNotification from '@/components/GlobalNotification.vue'

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
    title: 'Dashboard',
    prependIcon: 'mdi-view-dashboard-outline',
    link: '/dashboard',
  },
  {
    title: 'Diary Register',
    prependIcon: 'mdi-pencil-outline',
    link: '/diary-register',
  },
  {
    title: 'Diary View',
    prependIcon: 'mdi-book-open-outline',
    link: '/diary-view',
  },
  {
    title: 'Diary Report',
    prependIcon: 'mdi-file-chart-outline',
    link: '/diary-report',
  },
  {
    title: 'Setting',
    prependIcon: 'mdi-cog-outline',
    link: '/setting',
  },
  {
    title: 'Help',
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
        console.error('ログアウトエラー:', result.error)
        notificationStore.showError(
          'ログアウトに失敗しました',
          'ログアウトに失敗しました'
        )
      }
    })
  } catch (error) {
    console.error('ログアウトエラー:', error)
    notificationStore.showError(
      'ログアウトに失敗しました',
      error instanceof Error ? error.message : 'Unknown error'
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
/* 必要に応じてスタイルを追加 */
.v-layout {
  position: relative;
}

.v-navigation-drawer {
  z-index: 1;
}

.v-app-bar {
  z-index: 2;
}

.v-main {
  z-index: 0;
  position: relative;
}
</style>
