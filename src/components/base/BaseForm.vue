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

const formRef = ref()
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

// Vuetify型定義の競合を回避するため、unknown経由で型アサーション
defineExpose({
  validate: validate as () => Promise<{ valid: boolean }> | { valid: boolean },
  reset,
  resetValidation,
  isValid: computed(() => isValid.value),
} as unknown as {
  validate: () => Promise<{ valid: boolean }>
  reset: () => void
  resetValidation: () => void
  isValid: ComputedRef<boolean>
})
</script>

<style scoped>
.form-title {
  font-size: 1.5rem;
  font-weight: 600;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
