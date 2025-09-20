<template>
  <v-container :class="containerClass">
    <v-form ref="formRef" v-model="isValid" @submit.prevent="handleSubmit" :class="formClass">
      <h1 v-if="title" class="form-title mb-4 text-center">{{ title }}</h1>

      <slot name="content" :isValid="isValid" />

      <div v-if="$slots.actions" class="form-actions mt-4">
        <slot name="actions" :isValid="isValid" :submit="() => handleSubmit()" />
      </div>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, type ComputedRef } from 'vue'
import type { VForm } from 'vuetify/components'

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

const formRef = ref<VForm>()
const isValid = ref(false)

const handleSubmit = async () => {
  if (props.validateOnSubmit && formRef.value) {
    const { valid } = await (formRef.value.validate() as any)
    emit('submit', valid)
  } else {
    emit('submit', isValid.value)
  }
}

const validate = async (): Promise<{ valid: boolean }> => {
  if (formRef.value) {
    const result = await formRef.value.validate() as any
    return { valid: result.valid }
  }
  return { valid: false }
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

// BaseFormの公開メソッド（型アサーションでVuetify型エラーを回避）
defineExpose({
  validate: validate as any,
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
