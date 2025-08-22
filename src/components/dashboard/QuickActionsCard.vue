<template>
  <BaseCard title="クイックアクション" class="quick-actions-card">
    <div class="actions-grid">
      <v-btn
        v-for="action in visibleActions"
        :key="action.id"
        :color="action.color"
        :variant="action.variant"
        :to="action.to"
        class="action-button"
        size="large"
        @click="handleActionClick(action)"
      >
        <v-icon start>{{ action.icon }}</v-icon>
        {{ action.label }}
      </v-btn>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BaseCard } from '@/components/base'
import type { QuickAction } from '@/types/dashboard'

interface Props {
  /** クイックアクション */
  actions: QuickAction[]
}

interface Emits {
  (e: 'action-click', action: QuickAction): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visibleActions = computed(() => {
  return props.actions.filter(action => action.visible)
})

const handleActionClick = (action: QuickAction) => {
  if (action.onClick) {
    action.onClick()
  }
  emit('action-click', action)
}
</script>

<style scoped>
.quick-actions-card {
  height: 100%;
}

.actions-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-button {
  width: 100%;
  height: 56px;
  justify-content: flex-start;
  text-transform: none;
  font-weight: 500;
}

.action-button .v-icon {
  margin-right: 12px;
}

/* タブレット以上では横並び */
@media (min-width: 768px) {
  .actions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  
  .action-button {
    height: 48px;
  }
}

/* デスクトップでは縦並びに戻す */
@media (min-width: 1024px) {
  .actions-grid {
    display: flex;
    flex-direction: column;
  }
}
</style>