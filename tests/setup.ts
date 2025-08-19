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
    template: `
      <div 
        :class="alertClasses" 
        class="v-alert"
      >
        <slot name="title" />
        <slot />
        <button v-if="closable" @click="handleClose" class="v-alert__close">Close</button>
        <slot name="append" />
      </div>
    `,
    props: {
      type: { type: String, default: 'info' },
      variant: { type: String, default: 'tonal' },
      closable: { type: Boolean, default: false },
      color: String,
      icon: [String, Boolean]
    },
    emits: ['click:close'],
    computed: {
      alertClasses() {
        const classes = ['v-alert']
        
        const type = this.type || 'info'
        const variant = this.variant || 'tonal'
        
        classes.push(`v-alert--type-${type}`)
        classes.push(`v-alert--variant-${variant}`)
        
        if (this.color) classes.push(`v-alert--color-${this.color}`)
        
        return classes
      }
    },
    methods: {
      handleClose() {
        this.$emit('click:close')
      }
    }
  },
  'v-form': {
    template: '<form class="v-form" @submit.prevent="handleSubmit" :class="$attrs.class"><slot /></form>',
    props: {
      modelValue: { type: Boolean, default: false }
    },
    emits: ['submit', 'update:modelValue'],
    data() {
      return {
        isValid: false
      }
    },
    methods: {
      handleSubmit(event) {
        this.$emit('submit', event)
      },
      async validate() {
        // バリデーション結果のモック
        this.isValid = true
        this.$emit('update:modelValue', this.isValid)
        return { valid: this.isValid }
      },
      reset() {
        // フォームリセットのモック
        this.isValid = false
        this.$emit('update:modelValue', this.isValid)
      },
      resetValidation() {
        // バリデーションリセットのモック
        this.isValid = false
        this.$emit('update:modelValue', this.isValid)
      }
    }
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