<template>
  <v-container :class="containerClass">
    <v-form ref="formRef" v-model="isValid" @submit.prevent="onFormSubmit" :class="formClass">
      <h1 v-if="title" class="form-title mb-4 text-center">{{ title }}</h1>

      <slot name="content" :isValid="isValid" />

      <div v-if="$slots.actions" class="form-actions mt-4">
        <slot name="actions" :isValid="isValid" :submit="handleSubmit" />
      </div>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { VForm } from 'vuetify/components'

// Vuetify型定義（Issue #213対応）
interface FormValidationResult {
  valid: boolean
  errors: Array<{
    id: number | string
    errorMessages: string[]
  }>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VFormInstance = VForm & any

interface Props {
  title?: string
  containerClass?: string
  formClass?: string
  validateOnSubmit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  containerClass: '',
  formClass: '',
  validateOnSubmit: true,
})

const emit = defineEmits<{
  submit: [isValid: boolean]
}>()

const formRef = ref<VFormInstance>()
const isValid = ref(false)

// Issue #213対応: フォームのsubmitイベントハンドラーを分離
// onFormSubmit: DOMイベントを受け取る（Vuetifyの@submitで使用）
const onFormSubmit = (): void => {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  handleSubmit()
}

// handleSubmit: プログラマティックな呼び出し用（スロット経由で公開）
const handleSubmit = async (): Promise<void> => {
  if (props.validateOnSubmit && formRef.value) {
    const result = (await formRef.value.validate()) as { valid: boolean }
    emit('submit', result.valid)
  } else {
    emit('submit', isValid.value)
  }
}

const validate = (): Promise<FormValidationResult> => {
  return new Promise(async (resolve) => {
    if (formRef.value) {
      const result = await formRef.value.validate()
      resolve({
        valid: result.valid,
        errors: result.errors || [],
      })
    } else {
      resolve({ valid: false, errors: [] })
    }
  })
}

const reset = () => {
  if (formRef.value) {
    formRef.value.reset()
  }
}

const resetValidation = () => {
  if (formRef.value) {
    formRef.value.resetValidation()
  }
}

// BaseFormの公開メソッド
defineExpose({
  validate,
  reset,
  resetValidation,
  isValid: computed(() => isValid.value),
})
</script>

<style scoped>
/* デザイントークン準拠フォームスタイル */
.form-title {
  font-size: var(--font-size-h5);
  font-weight: 600;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-top: var(--form-field-spacing);
}

/* フォームコンテナのパディング調整 */
:deep(.v-container) {
  padding: var(--spacing-md);
}

/* フォームフィールド間のスペーシング */
:deep(.v-form > .v-field) {
  margin-bottom: var(--form-field-spacing);
}

:deep(.v-form > .v-card) {
  margin-bottom: var(--section-margin);
}
</style>
