<template>
  <BaseCard :title="title" class="stat-card">
    <div class="stat-content">
      <div class="stat-value">
        <span class="value">{{ formattedValue }}</span>
        <span class="unit">{{ unit }}</span>
      </div>
      <div class="stat-icon">
        <v-icon :color="iconColor" size="48">{{ icon }}</v-icon>
      </div>
    </div>
    <div v-if="description" class="stat-description">
      {{ description }}
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BaseCard } from '@/components/base'

interface Props {
  /** タイトル */
  title: string
  /** 値 */
  value: number | string
  /** 単位 */
  unit?: string
  /** アイコン名 */
  icon: string
  /** アイコンカラー */
  iconColor?: string
  /** 説明文 */
  description?: string
  /** フォーマット関数 */
  formatter?: (value: number | string) => string
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
  iconColor: 'primary',
  description: '',
  formatter: (value: number | string) => value.toString(),
})

const formattedValue = computed(() => {
  return props.formatter(props.value)
})
</script>

<style scoped>
.stat-card {
  height: 100%;
  transition: transform 0.2s ease-in-out;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stat-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.value {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--v-theme-primary);
  line-height: 1;
}

.unit {
  font-size: 1rem;
  color: var(--v-theme-on-surface-variant);
  font-weight: normal;
}

.stat-icon {
  opacity: 0.8;
}

.stat-description {
  font-size: 0.875rem;
  color: var(--v-theme-on-surface-variant);
  line-height: 1.4;
}

/* レスポンシブ対応 */
@media (max-width: 600px) {
  .value {
    font-size: 2rem;
  }
  
  .stat-icon {
    display: none;
  }
}
</style>