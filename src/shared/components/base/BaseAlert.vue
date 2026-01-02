<template>
  <v-alert
    v-if="show"
    :type="type"
    :variant="variant"
    :closable="closable"
    :color="color"
    :icon="icon"
    class="base-alert mb-3"
    @click:close="handleClose"
  >
    <template v-if="$slots.title" #title>
      <slot name="title" />
    </template>

    <slot>{{ message }}</slot>

    <template v-if="$slots.append" #append>
      <slot name="append" />
    </template>
  </v-alert>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  message?: string
  type?: 'success' | 'info' | 'warning' | 'error'
  variant?: 'tonal' | 'outlined' | 'plain' | 'elevated'
  closable?: boolean
  color?: string
  icon?: string | false
  modelValue?: boolean
  autoHide?: boolean
  autoHideDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  variant: 'tonal',
  closable: false,
  modelValue: true,
  autoHide: false,
  autoHideDelay: 3000,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const show = ref(props.modelValue)

watch(
  () => props.modelValue,
  (newValue) => {
    show.value = newValue
  },
)

watch(show, (newValue) => {
  emit('update:modelValue', newValue)
})

// 自動非表示機能
let autoHideTimer: NodeJS.Timeout | null = null
if (props.autoHide && show.value) {
  autoHideTimer = setTimeout(() => {
    handleClose()
  }, props.autoHideDelay)
}

const handleClose = () => {
  show.value = false
  emit('close')
  if (autoHideTimer) {
    clearTimeout(autoHideTimer)
    autoHideTimer = null
  }
}

// コンポーネントが破棄される時にタイマーをクリア
import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => {
  if (autoHideTimer) {
    clearTimeout(autoHideTimer)
  }
})
</script>

<style scoped>
.base-alert {
  margin-bottom: 16px;
}
</style>
