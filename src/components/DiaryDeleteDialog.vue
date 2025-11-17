<template>
  <v-dialog :model-value="modelValue" @update:model-value="handleDialogUpdate" max-width="500">
    <v-card>
      <v-card-title class="text-h5 text-error">
        <v-icon icon="mdi-alert-circle" class="mr-2" />
        日記の削除確認
      </v-card-title>
      <v-card-text>
        <v-alert type="warning" variant="tonal" class="mb-4">
          この操作は取り消せません。削除された日記は復旧できません。
        </v-alert>

        <p class="mb-3"><strong>削除対象の日記:</strong></p>
        <v-card variant="outlined" class="mb-4">
          <v-card-title class="text-subtitle-1">{{ diary?.title }}</v-card-title>
          <v-card-text>
            <p class="text-body-2 text-medium-emphasis mb-2">
              作成日: {{ diary ? formatDate(diary.created_at) : '' }}
            </p>
            <p class="text-body-2">
              {{ diary?.content?.slice(0, 100)
              }}{{ (diary?.content?.length || 0) > 100 ? '...' : '' }}
            </p>
          </v-card-text>
        </v-card>

        <p class="text-body-2 text-medium-emphasis">本当にこの日記を削除しますか？</p>

        <!-- 二段階確認 -->
        <v-checkbox
          v-model="confirmed"
          label="削除することを理解し、同意します"
          color="error"
          class="mt-4"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel" :disabled="isDeleting"> キャンセル </v-btn>
        <v-btn
          color="error"
          variant="flat"
          :disabled="!confirmed"
          :loading="isDeleting"
          @click="handleConfirm"
        >
          削除実行
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DiaryEntry } from '@/stores/data'

interface Props {
  modelValue: boolean
  diary: DiaryEntry | null
  isDeleting: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const confirmed = ref(false)

// ダイアログが開かれたときに確認をリセット
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      confirmed.value = false
    }
  },
)

const handleConfirm = () => {
  if (confirmed.value) {
    emit('confirm')
  }
}

const handleDialogUpdate = (value: boolean) => {
  emit('update:modelValue', value)
  if (!value) {
    confirmed.value = false
  }
}

const handleCancel = () => {
  confirmed.value = false
  emit('update:modelValue', false)
  emit('cancel')
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ja-JP')
}
</script>
