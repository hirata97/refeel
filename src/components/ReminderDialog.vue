<template>
  <v-dialog :model-value="modelValue" max-width="600" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title>
        <v-icon left>mdi-bell-plus</v-icon>
        {{ isEditing ? 'リマインダーを編集' : 'リマインダーを追加' }}
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-row>
            <!-- タイトル -->
            <v-col cols="12">
              <v-text-field
                v-model="formData.title"
                label="タイトル"
                variant="outlined"
                :rules="[rules.required]"
                required
              />
            </v-col>

            <!-- メッセージ -->
            <v-col cols="12">
              <v-textarea
                v-model="formData.message"
                label="メッセージ"
                variant="outlined"
                rows="3"
                :rules="[rules.required]"
                required
              />
            </v-col>

            <!-- 時間 -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.time"
                label="通知時間"
                type="time"
                variant="outlined"
                :rules="[rules.required]"
                required
              />
            </v-col>

            <!-- タイプ -->
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.type"
                :items="reminderTypes"
                label="タイプ"
                variant="outlined"
                :rules="[rules.required]"
                required
              />
            </v-col>

            <!-- 曜日選択 -->
            <v-col cols="12">
              <v-label class="text-subtitle-2 mb-2">通知する曜日</v-label>
              <v-row>
                <v-col 
                  v-for="day in weekDays" 
                  :key="day.value" 
                  cols="12" 
                  sm="6" 
                  md="4" 
                  lg="3"
                >
                  <v-checkbox
                    v-model="formData.days"
                    :label="day.text"
                    :value="day.value"
                    color="primary"
                    hide-details
                  />
                </v-col>
              </v-row>
              <v-row class="mt-2">
                <v-col cols="12">
                  <v-btn 
                    variant="text" 
                    size="small" 
                    @click="selectAllDays"
                  >
                    すべて選択
                  </v-btn>
                  <v-btn 
                    variant="text" 
                    size="small" 
                    @click="selectWeekdays"
                  >
                    平日のみ
                  </v-btn>
                  <v-btn 
                    variant="text" 
                    size="small" 
                    @click="selectWeekends"
                  >
                    土日のみ
                  </v-btn>
                  <v-btn 
                    variant="text" 
                    size="small" 
                    @click="clearDays"
                  >
                    クリア
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>

            <!-- スヌーズ設定 -->
            <v-col cols="12">
              <v-switch
                v-model="formData.snoozeEnabled"
                label="スヌーズ機能を有効にする"
                color="primary"
              />
            </v-col>

            <v-col v-if="formData.snoozeEnabled" cols="12" md="6">
              <v-text-field
                v-model.number="formData.snoozeDuration"
                label="スヌーズ時間（分）"
                type="number"
                variant="outlined"
                min="1"
                max="60"
                :rules="[rules.required, rules.snoozeRange]"
              />
            </v-col>

            <!-- 有効状態 -->
            <v-col cols="12">
              <v-switch
                v-model="formData.enabled"
                label="リマインダーを有効にする"
                color="primary"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="handleCancel">キャンセル</v-btn>
        <v-btn 
          color="primary" 
          :loading="saving"
          @click="handleSubmit"
        >
          {{ isEditing ? '更新' : '作成' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { ReminderSettings, ReminderType, WeekDay } from '@/utils/notifications'

interface Props {
  modelValue: boolean
  reminder?: ReminderSettings | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', reminderData: Omit<ReminderSettings, 'id'>): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local state
const formRef = ref()
const saving = ref(false)

const isEditing = computed(() => Boolean(props.reminder?.id))

const formData = ref<Omit<ReminderSettings, 'id'>>({
  enabled: true,
  time: '20:00',
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  type: 'diary_entry',
  title: '',
  message: '',
  snoozeEnabled: true,
  snoozeDuration: 10
})

// Constants
const reminderTypes = [
  { title: '日記記入', value: 'diary_entry' },
  { title: '目標レビュー', value: 'goal_review' },
  { title: '週間サマリー', value: 'weekly_summary' },
  { title: '月間サマリー', value: 'monthly_summary' },
  { title: 'カスタム', value: 'custom' }
]

const weekDays = [
  { text: '月曜日', value: 'monday' },
  { text: '火曜日', value: 'tuesday' },
  { text: '水曜日', value: 'wednesday' },
  { text: '木曜日', value: 'thursday' },
  { text: '金曜日', value: 'friday' },
  { text: '土曜日', value: 'saturday' },
  { text: '日曜日', value: 'sunday' }
]

// Validation rules
const rules = {
  required: (value: string) => !!value || '必須項目です',
  snoozeRange: (value: number) => (value >= 1 && value <= 60) || '1-60分の範囲で入力してください'
}

// Methods
const selectAllDays = () => {
  formData.value.days = weekDays.map(day => day.value as WeekDay)
}

const selectWeekdays = () => {
  formData.value.days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
}

const selectWeekends = () => {
  formData.value.days = ['saturday', 'sunday']
}

const clearDays = () => {
  formData.value.days = []
}

const resetForm = () => {
  if (props.reminder) {
    // 編集モード
    formData.value = {
      enabled: props.reminder.enabled,
      time: props.reminder.time,
      days: [...props.reminder.days],
      type: props.reminder.type,
      title: props.reminder.title,
      message: props.reminder.message,
      sound: props.reminder.sound,
      snoozeEnabled: props.reminder.snoozeEnabled,
      snoozeDuration: props.reminder.snoozeDuration
    }
  } else {
    // 新規作成モード - デフォルト値を設定
    const defaults = getDefaultsByType('diary_entry')
    formData.value = {
      enabled: true,
      time: '20:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      type: 'diary_entry',
      title: defaults.title,
      message: defaults.message,
      snoozeEnabled: true,
      snoozeDuration: 10
    }
  }
}

const getDefaultsByType = (type: ReminderType) => {
  const defaults = {
    diary_entry: {
      title: '日記を書く時間です',
      message: '今日の目標の進捗を記録しましょう'
    },
    goal_review: {
      title: '目標をレビューしましょう',
      message: '設定した目標の進捗を確認しましょう'
    },
    weekly_summary: {
      title: '週間振り返りの時間です',
      message: '今週の成果を振り返ってみましょう'
    },
    monthly_summary: {
      title: '月間サマリーの確認',
      message: '今月の目標達成度を確認しましょう'
    },
    custom: {
      title: 'リマインダー',
      message: 'カスタムリマインダーです'
    }
  }
  
  return defaults[type] || defaults.custom
}

const handleSubmit = async () => {
  const { valid } = await formRef.value?.validate()
  
  if (!valid) return
  
  if (formData.value.days.length === 0) {
    // 曜日が選択されていない場合のバリデーション
    return
  }

  saving.value = true
  
  try {
    emit('save', { ...formData.value })
  } finally {
    saving.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
}

// Watch for type changes to update default title/message
watch(() => formData.value.type, (newType) => {
  if (!isEditing.value) {
    const defaults = getDefaultsByType(newType)
    formData.value.title = defaults.title
    formData.value.message = defaults.message
  }
})

// Watch for dialog opening to reset form
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})
</script>

<style scoped>
.v-label {
  opacity: 0.87;
}
</style>