import { config } from '@vue/test-utils'

// Vuetifyコンポーネントのモック設定
config.global.stubs = {
  'v-btn': {
    template: '<button :class="buttonClasses" :type="type" :disabled="disabled" @click="handleClick"><slot /></button>',
    props: {
      color: { type: String, default: 'primary' },
      variant: { type: String, default: 'elevated' },
      size: { type: String, default: 'default' },
      loading: { type: Boolean, default: false },
      disabled: { type: Boolean, default: false },
      block: { type: Boolean, default: false },
      type: { type: String, default: 'button' }
    },
    emits: ['click'],
    computed: {
      buttonClasses() {
        const classes = ['v-btn']
        
        // BaseButton のデフォルト値を使用
        const color = this.color || 'primary'
        const variant = this.variant || 'elevated'
        const size = this.size || 'default'
        
        classes.push(`v-btn--color-${color}`)
        classes.push(`v-btn--variant-${variant}`)
        classes.push(`v-btn--size-${size}`)
        
        if (this.loading) classes.push('v-btn--loading')
        if (this.disabled) classes.push('v-btn--disabled')
        if (this.block) classes.push('v-btn--block')
        
        return classes
      }
    },
    methods: {
      handleClick(event) {
        // disabled状態ではクリックイベントを発火しない
        if (!this.disabled) {
          this.$emit('click', event)
        }
      }
    }
  },
  'v-alert': {
    template: '<div class="v-alert" v-if="show"><slot /></div>',
    props: ['modelValue'],
    data() {
      return { show: this.modelValue !== false }
    }
  },
  'v-form': {
    template: '<form class="v-form" @submit="$emit(\'submit\', $event)"><slot /></form>',
    emits: ['submit']
  },
  'v-card': {
    template: '<div class="v-card"><slot /></div>'
  },
  'v-card-title': {
    template: '<div class="v-card-title"><slot /></div>'
  },
  'v-card-subtitle': {
    template: '<div class="v-card-subtitle"><slot /></div>'
  },
  'v-card-text': {
    template: '<div class="v-card-text"><slot /></div>'
  },
  'v-card-actions': {
    template: '<div class="v-card-actions"><slot /></div>'
  },
  'v-container': {
    template: '<div class="v-container"><slot /></div>'
  }
}

// CSSファイルのモック（必要に応じて）
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// ResizeObserver のモック
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}