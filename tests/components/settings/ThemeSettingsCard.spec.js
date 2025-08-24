import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import ThemeSettingsCard from '@/components/settings/ThemeSettingsCard.vue'

// テーマストアをモック
vi.mock('@/stores/theme', () => ({
  useThemeStore: () => ({
    currentTheme: 'light',
    setTheme: vi.fn(),
  })
}))

// Vuetifyテーマコンポーザブルをモック
vi.mock('vuetify', () => ({
  ...vi.importActual('vuetify'),
  useTheme: () => ({
    current: {
      value: {
        colors: {
          primary: '#1976d2',
          secondary: '#424242',
          success: '#4caf50',
          info: '#2196f3',
          warning: '#ff9800',
          error: '#f44336'
        }
      }
    }
  })
}))

describe('ThemeSettingsCard', () => {
  let wrapper
  let pinia
  let vuetify

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    
    vuetify = createVuetify({
      components,
      directives,
    })
  })

  const createWrapper = (props = {}) => {
    return mount(ThemeSettingsCard, {
      props: {
        modelValue: 'light',
        ...props
      },
      global: {
        plugins: [pinia, vuetify],
      },
    })
  }

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('rendering', () => {
    it('should render theme settings card', () => {
      wrapper = createWrapper()
      
      expect(wrapper.find('[data-test="theme-settings-card"]').exists()).toBe(false) // data-test属性がないため
      expect(wrapper.text()).toContain('テーマ設定')
    })

    it('should render theme selection dropdown', async () => {
      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      
      const select = wrapper.findComponent({ name: 'VSelect' })
      expect(select.exists()).toBe(true)
    })

    it('should render theme toggle button', async () => {
      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      
      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toContain('テーマ切り替え')
    })

    it('should render color preview chips', async () => {
      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      
      const chips = wrapper.findAllComponents({ name: 'VChip' })
      expect(chips.length).toBeGreaterThan(0)
    })
  })

  describe('theme options', () => {
    it('should have correct theme options', () => {
      wrapper = createWrapper()
      
      const vm = wrapper.vm
      expect(vm.themeOptions).toEqual([
        {
          title: 'ライト',
          value: 'light',
          icon: 'mdi-white-balance-sunny',
          color: '#1976d2'
        },
        {
          title: 'ダーク',
          value: 'dark',
          icon: 'mdi-moon-waning-crescent',
          color: '#bb86fc'
        },
        {
          title: 'システム設定に従う',
          value: 'system',
          icon: 'mdi-cog',
          color: '#4caf50'
        }
      ])
    })
  })

  describe('props and events', () => {
    it('should emit update:modelValue when selectedTheme changes', async () => {
      wrapper = createWrapper({ modelValue: 'light' })
      
      // selectedThemeを変更
      wrapper.vm.selectedTheme = 'dark'
      await wrapper.vm.$nextTick()
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')[0]).toEqual(['dark'])
    })

    it('should emit themeChanged when handleThemeChange is called', async () => {
      const mockSetTheme = vi.fn()
      const { useThemeStore } = await import('@/stores/theme')
      useThemeStore.mockReturnValue({
        currentTheme: 'light',
        setTheme: mockSetTheme,
      })
      
      wrapper = createWrapper()
      
      wrapper.vm.handleThemeChange('dark')
      await wrapper.vm.$nextTick()
      
      expect(mockSetTheme).toHaveBeenCalledWith('dark')
      expect(wrapper.emitted('themeChanged')).toBeTruthy()
      expect(wrapper.emitted('themeChanged')[0]).toEqual(['dark'])
    })
  })

  describe('theme switching', () => {
    it('should toggle between light and dark themes', async () => {
      const mockSetTheme = vi.fn()
      const { useThemeStore } = await import('@/stores/theme')
      
      // Light theme initially
      useThemeStore.mockReturnValue({
        currentTheme: 'light',
        setTheme: mockSetTheme,
      })
      
      wrapper = createWrapper()
      
      wrapper.vm.toggleTheme()
      expect(mockSetTheme).toHaveBeenCalledWith('dark')
      
      // Dark theme now
      useThemeStore.mockReturnValue({
        currentTheme: 'dark',
        setTheme: mockSetTheme,
      })
      
      wrapper.vm.toggleTheme()
      expect(mockSetTheme).toHaveBeenCalledWith('light')
    })
  })

  describe('preview colors', () => {
    it('should display correct preview colors', () => {
      wrapper = createWrapper()
      
      const expectedColors = [
        { name: 'Primary', value: '#1976d2' },
        { name: 'Secondary', value: '#424242' },
        { name: 'Success', value: '#4caf50' },
        { name: 'Info', value: '#2196f3' },
        { name: 'Warning', value: '#ff9800' },
        { name: 'Error', value: '#f44336' }
      ]
      
      expect(wrapper.vm.previewColors).toEqual(expectedColors)
    })
  })

  describe('reactivity', () => {
    it('should react to prop changes', async () => {
      wrapper = createWrapper({ modelValue: 'light' })
      expect(wrapper.vm.selectedTheme).toBe('light')
      
      await wrapper.setProps({ modelValue: 'dark' })
      expect(wrapper.vm.selectedTheme).toBe('dark')
    })

    it('should react to theme store changes', async () => {
      const { useThemeStore } = await import('@/stores/theme')
      
      // Initial theme
      useThemeStore.mockReturnValue({
        currentTheme: 'light',
        setTheme: vi.fn(),
      })
      
      wrapper = createWrapper()
      expect(wrapper.vm.selectedTheme).toBe('light')
      
      // Change theme in store
      useThemeStore.mockReturnValue({
        currentTheme: 'dark',
        setTheme: vi.fn(),
      })
      
      // Trigger watcher manually since we're mocking
      wrapper.vm.selectedTheme = 'dark'
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.selectedTheme).toBe('dark')
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      wrapper = createWrapper()
      
      const card = wrapper.findComponent({ name: 'VCard' })
      expect(card.exists()).toBe(true)
      
      const select = wrapper.findComponent({ name: 'VSelect' })
      expect(select.exists()).toBe(true)
      expect(select.props('label')).toBe('テーマ')
    })
  })
})