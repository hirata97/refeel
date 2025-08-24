<template>
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <v-card>
      <v-card-title class="text-h5 text-error">
        <v-icon class="mr-2" color="error">mdi-delete-forever</v-icon>
        データ削除リクエスト
      </v-card-title>

      <v-card-text>
        <v-alert
          type="warning"
          variant="tonal"
          class="mb-4"
          :text="
            requestType === 'complete' 
              ? 'この操作は取り消すことができません。アカウントと関連するすべてのデータが完全に削除されます。'
              : '選択したデータタイプが削除されます。この操作は取り消すことができません。'
          "
        />

        <v-form ref="form" v-model="isFormValid">
          <v-radio-group v-model="requestType" label="削除タイプを選択してください">
            <v-radio
              label="部分削除 - 特定のデータのみ削除"
              value="partial"
            />
            <v-radio
              label="完全削除 - アカウントとすべてのデータを削除"
              value="complete"
            />
          </v-radio-group>

          <v-expand-transition>
            <div v-if="requestType === 'partial'">
              <v-checkbox
                v-for="dataType in availableDataTypes"
                :key="dataType.value"
                v-model="selectedDataTypes"
                :label="dataType.label"
                :value="dataType.value"
                :disabled="dataType.required"
                hide-details
                class="mb-2"
              />
            </div>
          </v-expand-transition>

          <v-textarea
            v-model="reason"
            label="削除理由（任意）"
            rows="3"
            outlined
            class="mt-4"
            placeholder="データ削除の理由をお聞かせください（任意）"
          />

          <v-expand-transition>
            <div v-if="requestType === 'complete'" class="mt-4">
              <v-text-field
                v-model="confirmationText"
                :rules="confirmationRules"
                label="確認のため「削除します」と入力してください"
                outlined
                required
              />
            </div>
          </v-expand-transition>
        </v-form>

        <v-divider class="my-4" />

        <div class="text-caption text-medium-emphasis">
          <v-icon size="small" class="mr-1">mdi-information</v-icon>
          <strong>重要:</strong>
          <ul class="ml-4 mt-2">
            <li>削除リクエストは30日後に実行されます</li>
            <li>30日以内であればキャンセル可能です</li>
            <li>完全削除の場合は本人確認が必要です</li>
            <li>削除実行後のデータ復旧はできません</li>
          </ul>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          text
          @click="closeDialog"
          :disabled="loading"
        >
          キャンセル
        </v-btn>
        <v-btn
          color="error"
          variant="flat"
          @click="submitRequest"
          :disabled="!canSubmit || loading"
          :loading="loading"
        >
          削除リクエスト送信
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { DataDeletionManager } from '@/utils/privacy'
import { useAuthStore } from '@/stores/auth'
import type { VForm } from 'vuetify/components'

// Props & Emits
interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submitted', token: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Composables
const authStore = useAuthStore()

// Reactive data
const dialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const form = ref<VForm>()
const isFormValid = ref(false)
const loading = ref(false)
const requestType = ref<'partial' | 'complete'>('partial')
const selectedDataTypes = ref<string[]>([])
const reason = ref('')
const confirmationText = ref('')

// Available data types for partial deletion
const availableDataTypes = [
  { label: '目標データ', value: 'goals', required: false },
  { label: '進捗記録', value: 'progress', required: false },
  { label: 'カテゴリ設定', value: 'categories', required: false },
  { label: 'タグ設定', value: 'tags', required: false },
  { label: 'プロフィール情報', value: 'profile', required: false }
]

// Validation rules
const confirmationRules = [
  (v: string) => !!v || '確認テキストの入力は必須です',
  (v: string) => v === '削除します' || '正確に「削除します」と入力してください'
]

// Computed
const canSubmit = computed(() => {
  if (!isFormValid.value || loading.value) return false
  
  if (requestType.value === 'complete') {
    return confirmationText.value === '削除します'
  } else {
    return selectedDataTypes.value.length > 0
  }
})

// Watch
watch(requestType, (newType) => {
  if (newType === 'complete') {
    selectedDataTypes.value = []
    confirmationText.value = ''
  }
})

// Methods
const closeDialog = () => {
  dialog.value = false
  resetForm()
}

const resetForm = () => {
  requestType.value = 'partial'
  selectedDataTypes.value = []
  reason.value = ''
  confirmationText.value = ''
  form.value?.resetValidation()
}

const submitRequest = async () => {
  if (!canSubmit.value || !authStore.user) return

  loading.value = true

  try {
    const token = await DataDeletionManager.requestDataDeletion(
      authStore.user.id,
      requestType.value,
      requestType.value === 'partial' ? selectedDataTypes.value : [],
      reason.value || undefined
    )

    emit('submitted', token)
    closeDialog()

    // Success notification
    // TODO: Toast notification implementation
    console.log('データ削除リクエストが送信されました。確認メールをご確認ください。')

  } catch (error) {
    console.error('データ削除リクエストに失敗しました:', error)
    // TODO: Error notification implementation
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.v-card-title {
  word-break: keep-all;
}

.text-caption ul {
  font-size: 0.75rem;
}

.text-caption li {
  margin-bottom: 4px;
}
</style>