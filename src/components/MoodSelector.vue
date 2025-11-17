<template>
  <v-card variant="outlined" class="mood-selector">
    <v-card-subtitle class="pb-2">気分</v-card-subtitle>
    <v-card-text class="pt-0">
      <v-btn-toggle
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        color="primary"
        variant="outlined"
        divided
        mandatory
        class="mood-buttons"
      >
        <v-btn
          v-for="level in moodLevels"
          :key="level.value"
          :value="level.value"
          size="small"
          class="mood-btn"
        >
          <v-icon size="small">{{ level.icon }}</v-icon>
          <span class="ml-1">{{ level.value }}</span>
        </v-btn>
      </v-btn-toggle>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  modelValue: number
}

interface Emits {
  (e: 'update:modelValue', value: number): void
}

defineProps<Props>()
defineEmits<Emits>()

const moodLevels = [
  { value: 1, icon: 'mdi-emoticon-dead' },
  { value: 2, icon: 'mdi-emoticon-sad' },
  { value: 3, icon: 'mdi-emoticon-cry' },
  { value: 4, icon: 'mdi-emoticon-neutral' },
  { value: 5, icon: 'mdi-emoticon' },
  { value: 6, icon: 'mdi-emoticon-happy' },
  { value: 7, icon: 'mdi-emoticon-excited' },
  { value: 8, icon: 'mdi-emoticon-cool' },
  { value: 9, icon: 'mdi-emoticon-kiss' },
  { value: 10, icon: 'mdi-emoticon-lol' },
]
</script>

<style scoped>
.mood-selector {
  margin: 16px 0;
}

.mood-buttons {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.mood-btn {
  flex: 1;
  margin: 0 1px;
  min-height: 48px;
  flex-direction: column;
  font-size: 0.75rem;
}

@media (max-width: 600px) {
  .mood-btn {
    min-height: 40px;
    font-size: 0.7rem;
  }
}
</style>
