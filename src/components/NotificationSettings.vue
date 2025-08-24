<template>
  <v-container fluid class="px-0">
    <v-row>
      <!-- リマインダー設定 -->
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon left>mdi-bell-outline</v-icon>
            リマインダー設定
          </v-card-title>
          
          <v-card-text>
            <!-- 通知許可状態 -->
            <v-alert 
              v-if="!reminderStore.hasNotificationPermission" 
              type="warning" 
              variant="tonal"
              class="mb-4"
            >
              <template #prepend>
                <v-icon>mdi-alert</v-icon>
              </template>
              <div>
                <strong>通知許可が必要です</strong>
                <p class="mb-2">リマインダー機能を利用するにはブラウザの通知許可が必要です。</p>
                <v-btn 
                  color="warning" 
                  size="small" 
                  @click="reminderStore.requestNotificationPermission()"
                >
                  通知を許可する
                </v-btn>
              </div>
            </v-alert>

            <!-- 基本設定 -->
            <v-row>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="reminderStore.notificationSettings.browserNotifications"
                  label="ブラウザ通知"
                  color="primary"
                  @change="updateNotificationSettings"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="reminderStore.notificationSettings.sound"
                  label="通知音"
                  color="primary"
                  @change="updateNotificationSettings"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="reminderStore.notificationSettings.vibration"
                  label="バイブレーション"
                  color="primary"
                  @change="updateNotificationSettings"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-btn 
                  variant="outlined" 
                  prepend-icon="mdi-test-tube"
                  @click="reminderStore.testNotification()"
                >
                  テスト通知
                </v-btn>
              </v-col>
            </v-row>

            <!-- 静寂時間設定 -->
            <v-divider class="my-4" />
            
            <v-row>
              <v-col cols="12">
                <v-switch
                  v-model="reminderStore.notificationSettings.quietHours.enabled"
                  label="静寂時間を有効にする"
                  color="primary"
                  @change="updateNotificationSettings"
                />
              </v-col>
            </v-row>

            <v-row v-if="reminderStore.notificationSettings.quietHours.enabled">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="reminderStore.notificationSettings.quietHours.startTime"
                  label="開始時刻"
                  type="time"
                  variant="outlined"
                  @change="updateNotificationSettings"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="reminderStore.notificationSettings.quietHours.endTime"
                  label="終了時刻"
                  type="time"
                  variant="outlined"
                  @change="updateNotificationSettings"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- リマインダー一覧 -->
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon left>mdi-clock-outline</v-icon>
            リマインダー一覧
            <v-spacer />
            <v-btn 
              color="primary" 
              prepend-icon="mdi-plus"
              @click="showAddReminderDialog = true"
            >
              追加
            </v-btn>
          </v-card-title>

          <v-card-text>
            <div v-if="reminderStore.reminders.length === 0" class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1">mdi-bell-sleep</v-icon>
              <p class="text-grey-darken-1 mt-4">リマインダーが設定されていません</p>
            </div>

            <v-list v-else>
              <v-list-item
                v-for="reminder in reminderStore.reminders"
                :key="reminder.id"
                class="border-b"
              >
                <template #prepend>
                  <v-switch
                    :model-value="reminder.enabled"
                    color="primary"
                    @change="reminderStore.toggleReminder(reminder.id)"
                  />
                </template>

                <v-list-item-title>{{ reminder.title }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ reminder.time }} - {{ formatDays(reminder.days) }}
                </v-list-item-subtitle>

                <template #append>
                  <v-btn 
                    icon="mdi-pencil" 
                    size="small" 
                    variant="text"
                    @click="editReminder(reminder)"
                  />
                  <v-btn 
                    icon="mdi-delete" 
                    size="small" 
                    variant="text" 
                    color="error"
                    @click="confirmDeleteReminder(reminder)"
                  />
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 進捗通知設定 -->
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon left>mdi-trending-up</v-icon>
            進捗通知設定
          </v-card-title>

          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="reminderStore.progressSettings.streakNotifications"
                  label="連続記録達成通知"
                  color="primary"
                  @change="updateProgressSettings"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="reminderStore.progressSettings.goalAchievementNotifications"
                  label="目標達成通知"
                  color="primary"
                  @change="updateProgressSettings"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="reminderStore.progressSettings.weeklyReports"
                  label="週間レポート"
                  color="primary"
                  @change="updateProgressSettings"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="reminderStore.progressSettings.monthlyReports"
                  label="月間レポート"
                  color="primary"
                  @change="updateProgressSettings"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="reminderStore.progressSettings.motivationalMessages"
                  label="モチベーション強化メッセージ"
                  color="primary"
                  @change="updateProgressSettings"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 次回リマインダー情報 -->
      <v-col v-if="reminderStore.nextReminder" cols="12">
        <v-card variant="tonal" color="info">
          <v-card-text class="text-center">
            <v-icon size="32" class="mb-2">mdi-clock-time-four</v-icon>
            <div class="text-h6">次回のリマインダー</div>
            <div class="text-body-1">
              {{ reminderStore.nextReminder.reminder.title }}
            </div>
            <div class="text-body-2 text-medium-emphasis">
              {{ formatNextReminderTime(reminderStore.nextReminder.nextTime) }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- リマインダー追加・編集ダイアログ -->
    <ReminderDialog
      v-model="showAddReminderDialog"
      :reminder="editingReminder"
      @save="handleReminderSave"
      @cancel="handleReminderCancel"
    />

    <!-- 削除確認ダイアログ -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>リマインダーを削除</v-card-title>
        <v-card-text>
          <p>「{{ deletingReminder?.title }}」を削除しますか？</p>
          <p class="text-grey-darken-1 text-body-2">この操作は取り消せません。</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showDeleteDialog = false">キャンセル</v-btn>
          <v-btn color="error" @click="handleReminderDelete">削除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useReminderStore } from '@/stores/reminder'
import type { ReminderSettings, WeekDay } from '@/utils/notifications'
import ReminderDialog from './ReminderDialog.vue'

const reminderStore = useReminderStore()

// Local state
const showAddReminderDialog = ref(false)
const showDeleteDialog = ref(false)
const editingReminder = ref<ReminderSettings | null>(null)
const deletingReminder = ref<ReminderSettings | null>(null)

// Methods
const updateNotificationSettings = () => {
  reminderStore.updateNotificationSettings(reminderStore.notificationSettings)
}

const updateProgressSettings = () => {
  reminderStore.updateProgressSettings(reminderStore.progressSettings)
}

const editReminder = (reminder: ReminderSettings) => {
  editingReminder.value = { ...reminder }
  showAddReminderDialog.value = true
}

const confirmDeleteReminder = (reminder: ReminderSettings) => {
  deletingReminder.value = reminder
  showDeleteDialog.value = true
}

const handleReminderSave = (reminderData: Omit<ReminderSettings, 'id'>) => {
  if (editingReminder.value?.id) {
    reminderStore.updateReminder(editingReminder.value.id, reminderData)
  } else {
    reminderStore.addReminder(reminderData)
  }
  
  showAddReminderDialog.value = false
  editingReminder.value = null
}

const handleReminderCancel = () => {
  showAddReminderDialog.value = false
  editingReminder.value = null
}

const handleReminderDelete = () => {
  if (deletingReminder.value) {
    reminderStore.removeReminder(deletingReminder.value.id)
    showDeleteDialog.value = false
    deletingReminder.value = null
  }
}

const formatDays = (days: WeekDay[]): string => {
  const dayNames: Record<WeekDay, string> = {
    monday: '月',
    tuesday: '火',
    wednesday: '水',
    thursday: '木',
    friday: '金',
    saturday: '土',
    sunday: '日'
  }
  
  if (days.length === 7) {
    return '毎日'
  }
  
  if (days.length === 5 && !days.includes('saturday') && !days.includes('sunday')) {
    return '平日のみ'
  }
  
  if (days.length === 2 && days.includes('saturday') && days.includes('sunday')) {
    return '土日のみ'
  }
  
  return days.map(day => dayNames[day]).join(', ')
}

const formatNextReminderTime = (time: Date | null): string => {
  if (!time) return ''
  
  const now = new Date()
  const diff = time.getTime() - now.getTime()
  
  if (diff < 0) return '実行済み'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours < 24) {
    return `${hours}時間${minutes}分後`
  }
  
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  
  return `${days}日${remainingHours}時間後`
}

// Lifecycle
onMounted(() => {
  reminderStore.initializeReminders()
})
</script>

<style scoped>
.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
</style>