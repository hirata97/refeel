<template>
  <v-card class="theme-settings-card">
    <v-card-title>
      <v-icon class="me-2">mdi-palette</v-icon>
      テーマ設定
    </v-card-title>

    <v-card-text>
      <v-row>
        <!-- テーマ選択 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="selectedTheme"
            :items="themeOptions"
            label="テーマ"
            density="compact"
            variant="outlined"
            @update:model-value="handleThemeChange"
          >
            <template #prepend-inner>
              <v-icon>mdi-palette</v-icon>
            </template>
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-icon :color="item.raw.color">{{ item.raw.icon }}</v-icon>
                </template>
              </v-list-item>
            </template>
          </v-select>
        </v-col>

        <!-- テーマ切り替えボタン -->
        <v-col cols="12" md="6" class="d-flex align-center">
          <v-btn
            :color="currentTheme"
            variant="outlined"
            prepend-icon="mdi-invert-colors"
            @click="toggleTheme"
          >
            テーマ切り替え
          </v-btn>
        </v-col>
      </v-row>

      <!-- カラープレビュー -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card variant="outlined" class="pa-4">
            <v-card-title class="text-subtitle-2 pb-2">プレビュー</v-card-title>
            <div class="d-flex gap-2 flex-wrap">
              <v-chip
                v-for="color in previewColors"
                :key="color.name"
                :color="color.value"
                size="small"
              >
                {{ color.name }}
              </v-chip>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useThemeStore, type ThemeName } from '@/stores/theme'
import { useTheme } from 'vuetify'

// Props
interface Props {
  modelValue?: ThemeName
}

interface Emits {
  (e: 'update:modelValue', value: ThemeName): void
  (e: 'themeChanged', theme: ThemeName): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 'light',
})

const emit = defineEmits<Emits>()

// Stores & Composables
const themeStore = useThemeStore()
const vuetifyTheme = useTheme()

// テーマ選択状態
const selectedTheme = computed({
  get: () => props.modelValue || themeStore.currentTheme,
  set: (value: ThemeName) => {
    emit('update:modelValue', value)
  },
})

// 現在のテーマ
const currentTheme = computed(() => vuetifyTheme.current.value.colors.primary)

// テーマオプション
const themeOptions = [
  {
    title: 'ライト',
    value: 'light' as ThemeName,
    icon: 'mdi-white-balance-sunny',
    color: '#1976d2',
  },
  {
    title: 'ダーク',
    value: 'dark' as ThemeName,
    icon: 'mdi-moon-waning-crescent',
    color: '#bb86fc',
  },
  {
    title: 'システム設定に従う',
    value: 'system' as ThemeName,
    icon: 'mdi-cog',
    color: '#4caf50',
  },
]

// プレビュー用カラー
const previewColors = computed(() => [
  { name: 'Primary', value: vuetifyTheme.current.value.colors.primary },
  { name: 'Secondary', value: vuetifyTheme.current.value.colors.secondary },
  { name: 'Success', value: vuetifyTheme.current.value.colors.success },
  { name: 'Info', value: vuetifyTheme.current.value.colors.info },
  { name: 'Warning', value: vuetifyTheme.current.value.colors.warning },
  { name: 'Error', value: vuetifyTheme.current.value.colors.error },
])

// Methods
const handleThemeChange = (theme: ThemeName) => {
  themeStore.setTheme(theme)
  emit('themeChanged', theme)
}

const toggleTheme = () => {
  const currentTheme = themeStore.currentTheme
  const newTheme: ThemeName = currentTheme === 'light' ? 'dark' : 'light'
  handleThemeChange(newTheme)
}

// テーマストアの変更を監視
watch(
  () => themeStore.currentTheme,
  (newTheme) => {
    if (newTheme !== selectedTheme.value) {
      selectedTheme.value = newTheme
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.theme-settings-card {
  height: 100%;
}
</style>
