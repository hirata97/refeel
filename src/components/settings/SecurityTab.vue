<template>
  <v-card>
    <v-card-title>
      <v-icon class="mr-2" size="24">mdi-palette</v-icon>
      テーマ設定
    </v-card-title>
    <v-card-subtitle>アプリの表示テーマを変更できます。</v-card-subtitle>
    <v-card-text>
      <v-select
        :model-value="themeStore.selectedTheme"
        :items="themeOptions"
        item-title="title"
        item-value="value"
        label="テーマを選択"
        prepend-inner-icon="mdi-theme-light-dark"
        variant="outlined"
        @update:model-value="handleThemeChange"
      >
        <template #item="{ props, item }">
          <v-list-item v-bind="props" :title="item.raw.title">
            <template #prepend>
              <v-icon :icon="item.raw.icon" class="mr-3" />
            </template>
          </v-list-item>
        </template>
      </v-select>

      <!-- 現在のテーマ状態表示 -->
      <v-chip
        :color="themeStore.isDarkMode ? 'secondary' : 'primary'"
        variant="outlined"
        class="mt-3"
      >
        <v-icon
          start
          :icon="themeStore.isDarkMode ? 'mdi-moon-waning-crescent' : 'mdi-white-balance-sunny'"
        />
        現在: {{ themeStore.isDarkMode ? 'ダークモード' : 'ライトモード' }}
      </v-chip>
    </v-card-text>

    <v-card-actions>
      <v-btn
        variant="text"
        @click="toggleTheme"
        :prepend-icon="
          themeStore.isDarkMode ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent'
        "
      >
        {{ themeStore.isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え' }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { useThemeStore, type ThemeName } from '../../stores/theme'
import { useTheme } from 'vuetify'

const themeStore = useThemeStore()
const theme = useTheme()

// テーマ設定オプション
const themeOptions = [
  {
    title: '自動（システム設定に従う）',
    value: 'auto',
    icon: 'mdi-brightness-auto',
  },
  {
    title: 'ライトモード',
    value: 'light',
    icon: 'mdi-white-balance-sunny',
  },
  {
    title: 'ダークモード',
    value: 'dark',
    icon: 'mdi-moon-waning-crescent',
  },
]

const handleThemeChange = (value: string) => {
  const themeName = value === 'auto' ? 'system' : (value as ThemeName)
  themeStore.setTheme(themeName)
  theme.global.name.value = themeStore.isDarkMode ? 'dark' : 'light'
}

const toggleTheme = () => {
  const newTheme = themeStore.isDarkMode ? 'light' : 'dark'
  handleThemeChange(newTheme)
}
</script>
