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
.base-card {
  margin-bottom: 16px;
}

.base-card-title {
  font-weight: 600;
  font-size: 1.2rem;
}

.base-card-subtitle {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.9rem;
}

.base-card-content {
  padding: 16px;
}

.base-card-actions {
  padding: 8px 16px 16px;
}
</style>
