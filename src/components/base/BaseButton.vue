<template>
  <v-btn
    :color="color"
    :variant="variant"
    :size="size"
    :loading="loading"
    :disabled="disabled"
    :block="block"
    :type="type"
    @click="$emit('click', $event)"
  >
    <slot />
  </v-btn>
</template>

<script setup lang="ts">
interface Props {
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  variant?: 'elevated' | 'flat' | 'tonal' | 'outlined' | 'text' | 'plain'
  size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large'
  loading?: boolean
  disabled?: boolean
  block?: boolean
  type?: 'button' | 'submit' | 'reset'
}

withDefaults(defineProps<Props>(), {
  color: 'primary',
  variant: 'elevated',
  size: 'default',
  loading: false,
  disabled: false,
  block: false,
  type: 'button',
})

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<style scoped>
/* デザイントークン準拠ボタンスタイル */
:deep(.v-btn) {
  border-radius: var(--border-radius-button);
  font-weight: 500;
  text-transform: none; /* 日本語UIのためキャピタライゼーション無効 */
}

/* サイズ別スタイル */
:deep(.v-btn--size-small) {
  min-height: 32px;
  padding: 0 var(--spacing-sm);
}

:deep(.v-btn--size-default) {
  min-height: var(--button-height-medium);
  padding: 0 var(--spacing-md);
}

:deep(.v-btn--size-large) {
  min-height: 48px;
  padding: 0 var(--spacing-lg);
}
</style>
