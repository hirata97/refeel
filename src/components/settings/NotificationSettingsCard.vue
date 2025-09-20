<template>
  <v-card class="notification-settings-card">
    <v-card-title>
      <v-icon class="me-2">mdi-bell</v-icon>
      通知設定
    </v-card-title>

    <v-card-text>
      <!-- 通知権限の状態 -->
      <v-alert v-if="!notificationStore.hasPermission" type="info" variant="tonal" class="mb-4">
        <template #text> ブラウザの通知を受け取るには、通知の許可が必要です。 </template>
        <template #append>
          <v-btn
            color="primary"
            variant="text"
            size="small"
            @click="requestNotificationPermission"
            :loading="permissionLoading"
          >
            許可する
          </v-btn>
        </template>
      </v-alert>

      <v-alert v-else type="success" variant="tonal" class="mb-4"> 通知の許可が有効です </v-alert>

      <v-divider class="mb-4" />

      <!-- 通知設定 -->
      <div class="notification-settings">
        <v-row>
          <v-col cols="12" md="6">
            <v-switch
              v-model="localSettings.enabled"
              label="通知を有効にする"
              color="primary"
              hide-details
              @update:model-value="updateSettings"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-switch
              v-model="localSettings.diaryReminder"
              label="日記リマインダー"
              color="primary"
              :disabled="!localSettings.enabled"
              hide-details
              @update:model-value="updateSettings"
            />
          </v-col>
        </v-row>

        <v-row v-if="localSettings.diaryReminder">
          <v-col cols="12" md="6">
            <v-select
              v-model="localSettings.reminderTime"
              :items="timeOptions"
              label="リマインダー時刻"
              density="compact"
              variant="outlined"
              :disabled="!localSettings.enabled"
              @update:model-value="updateSettings"
            >
              <template #prepend-inner>
                <v-icon>mdi-clock</v-icon>
              </template>
            </v-select>
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="localSettings.reminderDays"
              :items="dayOptions"
              label="リマインダー曜日"
              multiple
              chips
              density="compact"
              variant="outlined"
              :disabled="!localSettings.enabled"
              @update:model-value="updateSettings"
            >
              <template #prepend-inner>
                <v-icon>mdi-calendar-week</v-icon>
              </template>
            </v-select>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="6">
            <v-switch
              v-model="localSettings.goalDeadlineAlert"
              label="目標期限アラート"
              color="primary"
              :disabled="!localSettings.enabled"
              hide-details
              @update:model-value="updateSettings"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-switch
              v-model="localSettings.achievementNotification"
              label="達成通知"
              color="primary"
              :disabled="!localSettings.enabled"
              hide-details
              @update:model-value="updateSettings"
            />
          </v-col>
        </v-row>
      </div>

      <v-divider class="my-4" />

      <!-- テスト通知 -->
      <v-row>
        <v-col cols="12">
          <v-btn
            color="secondary"
            variant="outlined"
            prepend-icon="mdi-bell-ring"
            @click="sendTestNotification"
            :disabled="!notificationStore.canShowNotifications"
            :loading="testLoading"
          >
            テスト通知を送信
          </v-btn>
        </v-col>
      </v-row>

      <!-- 設定の説明 -->
      <v-expansion-panels class="mt-4">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon class="me-2">mdi-information</v-icon>
            通知設定について
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <ul class="text-body-2">
              <li><strong>日記リマインダー:</strong> 日記を書く時間をお知らせします</li>
              <li><strong>目標期限アラート:</strong> 設定した目標の期限が近づくとお知らせします</li>
              <li><strong>達成通知:</strong> 目標を達成したときにお祝いメッセージを表示します</li>
            </ul>
            <v-alert type="info" variant="text" density="compact" class="mt-2">
              ブラウザの通知設定も有効にしてください。
            </v-alert>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useBrowserNotificationStore } from '@/stores/browserNotifications'
import type { NotificationSettings } from '@/types/settings'

// Props
interface Props {
  modelValue?: Partial<NotificationSettings>
}

interface Emits {
  (e: 'update:modelValue', value: NotificationSettings): void
  (e: 'settingsUpdated', settings: NotificationSettings): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
})

const emit = defineEmits<Emits>()

// Store
const notificationStore = useBrowserNotificationStore()

// State
const permissionLoading = ref(false)
const testLoading = ref(false)
const localSettings = ref<NotificationSettings>({
  ...notificationStore.settings,
  ...props.modelValue,
})

// Options
const timeOptions = [
  { title: '8:00', value: '08:00' },
  { title: '9:00', value: '09:00' },
  { title: '10:00', value: '10:00' },
  { title: '18:00', value: '18:00' },
  { title: '19:00', value: '19:00' },
  { title: '20:00', value: '20:00' },
  { title: '21:00', value: '21:00' },
  { title: '22:00', value: '22:00' },
]

const dayOptions = [
  { title: '日', value: 0 },
  { title: '月', value: 1 },
  { title: '火', value: 2 },
  { title: '水', value: 3 },
  { title: '木', value: 4 },
  { title: '金', value: 5 },
  { title: '土', value: 6 },
]

// Methods
const requestNotificationPermission = async () => {
  permissionLoading.value = true
  try {
    await notificationStore.requestPermission()
  } catch (error) {
    console.error('通知許可の要求に失敗:', error)
  } finally {
    permissionLoading.value = false
  }
}

const updateSettings = async () => {
  try {
    await notificationStore.updateSettings(localSettings.value)
    emit('update:modelValue', localSettings.value)
    emit('settingsUpdated', localSettings.value)
  } catch (error) {
    console.error('通知設定の更新に失敗:', error)
  }
}

const sendTestNotification = async () => {
  testLoading.value = true
  try {
    await notificationStore.showNotification(
      'Goal Categorization Diaryからのテスト通知です。設定が正しく動作しています！',
    )
  } catch (error) {
    console.error('テスト通知の送信に失敗:', error)
  } finally {
    testLoading.value = false
  }
}

// Watchers
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      localSettings.value = { ...localSettings.value, ...newValue }
    }
  },
  { deep: true },
)

watch(
  () => notificationStore.settings,
  (newSettings) => {
    localSettings.value = { ...localSettings.value, ...newSettings }
  },
  { deep: true },
)
</script>

<style scoped>
.notification-settings-card {
  height: 100%;
}

.notification-settings {
  min-height: 200px;
}
</style>
