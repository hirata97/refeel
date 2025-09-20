<template>
  <v-snackbar
    v-model="showPrompt"
    :timeout="15000"
    location="bottom"
    color="primary"
    elevation="8"
  >
    <div class="d-flex align-center">
      <v-icon class="mr-3">
        mdi-download
      </v-icon>
      <div class="flex-grow-1">
        <div class="text-subtitle2 font-weight-medium">
          Refeelをインストール
        </div>
        <div class="text-caption">
          {{ installMessage }}
        </div>
      </div>
    </div>

    <template #actions>
      <v-btn
        variant="text"
        size="small"
        @click="dismissPrompt"
      >
        後で
      </v-btn>
      <v-btn
        variant="tonal"
        size="small"
        @click="handleInstall"
        :loading="installing"
      >
        インストール
      </v-btn>
    </template>
  </v-snackbar>

  <!-- iOS用インストール手順ダイアログ -->
  <v-dialog
    v-model="showIOSDialog"
    max-width="400"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">
          mdi-apple
        </v-icon>
        {{ iosInstructions.title }}
      </v-card-title>

      <v-card-text>
        <v-list class="pa-0">
          <v-list-item
            v-for="(step, index) in iosInstructions.steps"
            :key="index"
            class="pa-0 mb-2"
          >
            <template #prepend>
              <v-avatar
                size="24"
                color="primary"
                class="mr-3"
              >
                <span class="text-caption">{{ index + 1 }}</span>
              </v-avatar>
            </template>
            <v-list-item-title class="text-body-2">
              {{ step }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          color="primary"
          @click="showIOSDialog = false"
        >
          わかりました
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- PWA更新通知 -->
  <v-snackbar
    v-model="showUpdatePrompt"
    :timeout="0"
    location="top"
    color="info"
  >
    <div class="d-flex align-center">
      <v-icon class="mr-3">
        mdi-update
      </v-icon>
      <div class="flex-grow-1">
        <div class="text-subtitle2">
          新しいバージョンが利用可能です
        </div>
        <div class="text-caption">
          最新機能を利用するために更新してください
        </div>
      </div>
    </div>

    <template #actions>
      <v-btn
        variant="text"
        size="small"
        @click="showUpdatePrompt = false"
      >
        後で
      </v-btn>
      <v-btn
        variant="tonal"
        size="small"
        @click="updateApp"
        :loading="updating"
      >
        更新
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePWAInstall } from '@/composables/usePWAInstall'

const {
  isInstallable,
  isInstalled,
  isIOS,
  showInstallPrompt,
  showIOSInstallInstructions,
  trackInstallEvent
} = usePWAInstall()

const showPrompt = ref(false)
const showIOSDialog = ref(false)
const showUpdatePrompt = ref(false)
const installing = ref(false)
const updating = ref(false)

const iosInstructions = showIOSInstallInstructions()

const installMessage = computed(() => {
  if (isIOS.value) {
    return 'オフラインでも利用できるアプリとして追加'
  }
  return 'デスクトップやホーム画面に追加してすぐにアクセス'
})

// インストール処理
const handleInstall = async () => {
  installing.value = true

  try {
    await trackInstallEvent('prompt_shown')

    if (isIOS.value) {
      // iOS の場合は手順ダイアログを表示
      showPrompt.value = false
      showIOSDialog.value = true
      await trackInstallEvent('install_accepted')
    } else {
      // 他のプラットフォームはネイティブプロンプト
      const success = await showInstallPrompt()

      if (success) {
        await trackInstallEvent('install_accepted')
        showPrompt.value = false
      } else {
        await trackInstallEvent('install_dismissed')
      }
    }
  } catch (error) {
    console.error('インストール処理エラー:', error)
  } finally {
    installing.value = false
  }
}

// プロンプト非表示
const dismissPrompt = async () => {
  showPrompt.value = false
  await trackInstallEvent('install_dismissed')

  // 1日後まで表示しない
  const dismissedUntil = new Date()
  dismissedUntil.setDate(dismissedUntil.getDate() + 1)
  localStorage.setItem('pwa_prompt_dismissed_until', dismissedUntil.toISOString())
}

// PWA更新処理
const updateApp = () => {
  updating.value = true

  // Service Worker の更新をトリガー
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.update()
      }
    })
  }

  // ページをリロード
  setTimeout(() => {
    window.location.reload()
  }, 1000)
}

// インストールプロンプト表示ロジック
const checkShouldShowPrompt = () => {
  // 既にインストール済みの場合は表示しない
  if (isInstalled.value) return false

  // インストール不可能な場合は表示しない
  if (!isInstallable.value && !isIOS.value) return false

  // 過去に非表示にされた場合は期限をチェック
  const dismissedUntil = localStorage.getItem('pwa_prompt_dismissed_until')
  if (dismissedUntil && new Date(dismissedUntil) > new Date()) {
    return false
  }

  // 複数回の訪問後に表示（初回訪問では表示しない）
  const visitCount = parseInt(localStorage.getItem('pwa_visit_count') || '0')
  return visitCount >= 2
}

// 訪問回数をカウント
const incrementVisitCount = () => {
  const visitCount = parseInt(localStorage.getItem('pwa_visit_count') || '0')
  localStorage.setItem('pwa_visit_count', (visitCount + 1).toString())
}

// Service Worker更新検知
const setupUpdateDetection = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      showUpdatePrompt.value = true
    })
  }
}

onMounted(() => {
  incrementVisitCount()
  setupUpdateDetection()

  // 2秒後にインストールプロンプトの表示判定
  setTimeout(() => {
    if (checkShouldShowPrompt()) {
      showPrompt.value = true
    }
  }, 2000)
})
</script>

<style scoped>
.v-snackbar :deep(.v-snackbar__wrapper) {
  min-height: 68px;
}

.v-snackbar :deep(.v-snackbar__content) {
  padding: 16px;
}
</style>