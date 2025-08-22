<template>
  <div class="global-notification-container">
    <v-snackbar
      v-for="notification in notifications"
      :key="notification.id"
      v-model="visibleStates[notification.id]"
      :color="getSnackbarColor(notification.type)"
      :timeout="notification.persistent ? -1 : notification.timeout"
      :multi-line="!!notification.message"
      location="top right"
      class="global-snackbar"
      @update:model-value="(value) => handleVisibilityChange(notification.id, value)"
    >
      <div class="notification-content">
        <div class="notification-title">
          <v-icon :icon="getIcon(notification.type)" size="small" class="me-2" />
          {{ notification.title }}
        </div>
        <div v-if="notification.message" class="notification-message">
          {{ notification.message }}
        </div>
      </div>

      <template v-if="notification.actions || notification.persistent" #actions>
        <v-btn
          v-for="action in notification.actions || []"
          :key="action.text"
          variant="text"
          size="small"
          @click="action.action"
        >
          {{ action.text }}
        </v-btn>
        <v-btn
          variant="text"
          icon="mdi-close"
          size="small"
          @click="removeNotification(notification.id)"
        />
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useNotificationStore } from '@/stores/notification'

const notificationStore = useNotificationStore()
const { notifications, removeNotification } = notificationStore

// 各通知の表示状態を管理
const visibleStates = ref<Record<string, boolean>>({})

// 通知の種類に応じたアイコンを取得
const getIcon = (type: string): string => {
  const iconMap = {
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle',
    warning: 'mdi-alert',
    info: 'mdi-information'
  }
  return iconMap[type as keyof typeof iconMap] || 'mdi-information'
}

// 通知の種類に応じた色を取得
const getSnackbarColor = (type: string): string => {
  const colorMap = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info'
  }
  return colorMap[type as keyof typeof colorMap] || 'info'
}

// 表示状態の変更を処理
const handleVisibilityChange = (id: string, visible: boolean): void => {
  if (!visible) {
    // 少し遅延させてからストアから削除（アニメーション完了後）
    setTimeout(() => {
      removeNotification(id)
      delete visibleStates.value[id]
    }, 300)
  }
}

// 新しい通知が追加されたときに表示状態を設定
watch(
  () => notifications,
  (newNotifications) => {
    newNotifications.forEach(notification => {
      if (!(notification.id in visibleStates.value)) {
        visibleStates.value[notification.id] = true
      }
    })
  },
  { deep: true, immediate: true }
)

// コンポーネントマウント時の初期化
onMounted(() => {
  notifications.forEach(notification => {
    visibleStates.value[notification.id] = true
  })
})
</script>

<style scoped>
.global-notification-container {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9999;
  pointer-events: none;
}

.global-snackbar {
  pointer-events: auto;
  margin-bottom: 8px;
}

.notification-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notification-title {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.notification-message {
  font-size: 0.875rem;
  opacity: 0.9;
  line-height: 1.4;
}
</style>