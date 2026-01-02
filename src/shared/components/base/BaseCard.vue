<template>
  <v-card :elevation="elevation" :variant="variant" :color="color" class="base-card">
    <v-card-title v-if="title || $slots.title" class="base-card-title">
      <slot name="title">{{ title }}</slot>
    </v-card-title>

    <v-card-subtitle v-if="subtitle || $slots.subtitle" class="base-card-subtitle">
      <slot name="subtitle">{{ subtitle }}</slot>
    </v-card-subtitle>

    <v-card-text v-if="$slots.default" class="base-card-content">
      <slot />
    </v-card-text>

    <v-card-actions v-if="$slots.actions" class="base-card-actions">
      <slot name="actions" />
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  elevation?: number
  variant?: 'elevated' | 'flat' | 'tonal' | 'outlined' | 'text' | 'plain'
  color?: string
}

withDefaults(defineProps<Props>(), {
  elevation: 2,
  variant: 'elevated',
})
</script>

<style scoped>
/* デザイントークン準拠スタイリング */
.base-card {
  margin-bottom: var(--spacing-md);
  border-radius: var(--border-radius-card);
}

.base-card-title {
  font-weight: 600;
  font-size: var(--font-size-h6);
}

.base-card-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: var(--font-size-body2);
}

.base-card-content {
  padding: var(--card-padding);
}

.base-card-actions {
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-md);
}
</style>
