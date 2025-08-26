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
import { ref, computed } from 'vue'
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
    const { valid } = await formRef.value.validate()
    emit('submit', valid)
  } else {
    emit('submit', isValid.value)
  }
}

const validate = (): Promise<{ valid: boolean }> | { valid: boolean } => {
  if (formRef.value) {
    return formRef.value.validate()
  }
  return Promise.resolve({ valid: false })
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

// Vuetify型定義を正しく使用
// 注意: VForm.validate()の戻り値型（SubmitEventPromise）に関するTypeScriptエラーが
// vue-tscとVuetifyの型定義の相互作用で発生することがあります。
// このエラーはci-type-check.shで適切に除外されており、ランタイム動作には影響しません。
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
