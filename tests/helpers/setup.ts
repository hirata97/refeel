import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// Supabase環境変数のモック設定（テスト環境用）
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
process.env.VITE_SUPABASE_KEY = 'test-anon-key'

// パフォーマンスモニターのグローバルモック設定
vi.mock('@/utils/performance', () => ({
  performanceMonitor: {
    start: vi.fn(),
    end: vi.fn(),
    clear: vi.fn(),
    getAllMetrics: vi.fn(() => []),
    generateReport: vi.fn(() => ''),
  },
  measurePerformance: vi.fn((fn: unknown) => fn),
  usePerformanceMonitor: vi.fn(() => ({
    start: vi.fn(),
    end: vi.fn(),
    measure: vi.fn((fn: unknown) => fn),
    getReport: vi.fn(() => ''),
    clear: vi.fn(),
  })),
  debounce: vi.fn((fn: unknown) => fn),
  throttle: vi.fn((fn: unknown) => fn),
  memoize: vi.fn((fn: unknown) => fn),
  batchProcess: vi.fn(),
  monitorResourceUsage: vi.fn(() => null),
}))

// ロガーのグローバルモック設定（Issue #218の影響対応）
vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(), // console.log互換
  },
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
  })),
}))

// console.log/warn/errorのグローバルモック（既存テストとの互換性維持）
// EPIPEエラー防止のため、テスト環境では出力を抑制
const originalConsole = { ...console }
global.console = {
  ...originalConsole,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: originalConsole.info, // infoは保持（必要な場合のみ）
  debug: originalConsole.debug,
}

// Vuetifyコンポーネントのモック設定
config.global.stubs = {
  'v-btn': {
    template: '<button :class="buttonClasses" :type="type" :disabled="computedDisabled" @click="handleClick"><slot /></button>',
    props: {
      color: { type: String, default: 'primary' },
      variant: { type: String, default: 'elevated' },
      size: { type: String, default: 'default' },
      loading: { type: [Boolean, Object], default: false },
      disabled: { type: Boolean, default: false },
      block: { type: Boolean, default: false },
      type: { type: String, default: 'button' },
      value: { type: [String, Number], default: undefined }
    },
    emits: ['click'],
    computed: {
      computedLoading() {
        // Object形式のloading（refオブジェクトなど）への対応
        if (this.loading && typeof this.loading === 'object' && 'value' in this.loading) {
          return this.loading.value
        }
        return this.loading
      },
      computedDisabled() {
        return this.disabled || this.computedLoading
      },
      buttonClasses() {
        const classes = ['v-btn']
        
        // BaseButton のデフォルト値を使用
        const color = this.color || 'primary'
        const variant = this.variant || 'elevated'
        const size = this.size || 'default'
        
        classes.push(`v-btn--color-${color}`)
        classes.push(`v-btn--variant-${variant}`)
        classes.push(`v-btn--size-${size}`)
        
        if (this.computedLoading) classes.push('v-btn--loading')
        if (this.computedDisabled) classes.push('v-btn--disabled')
        if (this.block) classes.push('v-btn--block')
        
        return classes
      }
    },
    methods: {
      handleClick(event) {
        // disabled状態ではクリックイベントを発火しない
        if (!this.computedDisabled) {
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
  },
  'v-data-table': {
    template: '<table class="v-data-table"><thead><tr><th v-for="header in headers" :key="header.key">{{header.title}}</th></tr></thead><tbody><tr v-for="item in computedItems" :key="item.id || item"><td v-for="header in headers" :key="header.key"><slot :name="`item.${header.key}`" :item="item">{{item[header.key]}}</slot></td></tr></tbody></table>',
    props: {
      headers: { type: Array, default: () => [] },
      items: { type: [Array, Object], default: () => [] },
      loading: { type: [Boolean, Object], default: false },
      hover: { type: Boolean, default: false }
    },
    computed: {
      computedItems() {
        // ref オブジェクトの場合は value を取得
        return this.items && typeof this.items === 'object' && 'value' in this.items 
          ? this.items.value 
          : this.items
      }
    }
  },
  'v-rating': {
    template: '<div class="v-rating"><span v-for="n in 5" :key="n" :class="n <= modelValue ? \'star-filled\' : \'star-empty\'">⭐</span></div>',
    props: {
      modelValue: { type: Number, default: 0 },
      readonly: { type: Boolean, default: false },
      size: { type: String, default: 'default' },
      color: { type: String, default: 'primary' },
      halfIncrements: { type: Boolean, default: false }
    }
  },
  'v-dialog': {
    template: '<div v-if="modelValue" class="v-dialog"><slot /></div>',
    props: {
      modelValue: { type: Boolean, default: false },
      maxWidth: { type: String, default: '' }
    },
    emits: ['update:modelValue']
  },
  'v-typography': {
    template: '<div :class="`v-typography v-typography--${variant}`"><slot /></div>',
    props: {
      variant: { type: String, default: 'body1' }
    }
  },
  'v-pagination': {
    template: '<nav class="v-pagination"><button v-for="page in length" :key="page" @click="$emit(\'update:model-value\', page)">{{page}}</button></nav>',
    props: {
      modelValue: { type: Number, default: 1 },
      length: { type: Number, default: 1 },
      loading: { type: Boolean, default: false }
    },
    emits: ['update:model-value']
  },
  'v-spacer': {
    template: '<div class="v-spacer"></div>'
  },
  'v-icon': {
    template: '<i class="v-icon">{{ icon || "mdi-icon" }}</i>',
    props: {
      icon: { type: String, default: '' },
      size: { type: String, default: 'default' },
      color: { type: String, default: '' }
    }
  },
  'v-text-field': {
    template: '<div class="v-text-field v-field"><label :for="inputId">{{label}}</label><input :id="inputId" :type="type" :placeholder="placeholder" :min="min" :max="max" :maxlength="maxlength" :counter="counter" :clearable="clearable" :value="computedModelValue" @input="handleInput" @blur="$emit(\'blur\', $event)" /></div>',
    props: {
      modelValue: { type: [String, Number, Object], default: '' },
      label: { type: String, default: '' },
      type: { type: String, default: 'text' },
      placeholder: { type: String, default: '' },
      min: { type: [String, Number], default: undefined },
      max: { type: [String, Number], default: undefined },
      maxlength: { type: [String, Number], default: undefined },
      counter: { type: [String, Number], default: undefined },
      clearable: { type: Boolean, default: false },
      outlined: { type: Boolean, default: false },
      errorMessages: { type: Array, default: () => [] },
      rules: { type: Array, default: () => [] },
      variant: { type: String, default: 'filled' },
      density: { type: String, default: 'default' }
    },
    computed: {
      inputId() {
        return `input-${this.label.toLowerCase().replace(/\s+/g, '-')}`
      },
      computedModelValue() {
        // Object形式のmodelValue（refオブジェクトなど）への対応
        if (this.modelValue && typeof this.modelValue === 'object' && 'value' in this.modelValue) {
          return this.modelValue.value
        }
        return this.modelValue
      }
    },
    methods: {
      handleInput(event) {
        this.$emit('update:modelValue', event.target.value)
      }
    },
    emits: ['update:modelValue', 'blur']
  },
  'v-col': {
    template: '<div class="v-col"><slot /></div>',
    props: {
      cols: { type: [String, Number], default: undefined },
      sm: { type: [String, Number], default: undefined },
      md: { type: [String, Number], default: undefined },
      lg: { type: [String, Number], default: undefined }
    }
  },
  'v-row': {
    template: '<div class="v-row"><slot /></div>',
    props: {
      align: { type: String, default: undefined },
      justify: { type: String, default: undefined }
    }
  },
  'v-label': {
    template: '<label class="v-label"><slot /></label>',
    props: {
      for: { type: String, default: '' }
    }
  },
  'v-chip': {
    template: '<div class="v-chip"><slot /><button v-if="closable" @click="$emit(\'click:close\')" aria-label="close">×</button></div>',
    props: {
      closable: { type: Boolean, default: false },
      size: { type: String, default: 'default' },
      color: { type: String, default: 'default' },
      variant: { type: String, default: 'tonal' }
    },
    emits: ['click:close']
  },
  'DiaryFilter': {
    template: '<div class="diary-filter"><slot /></div>',
    props: {
      filters: { type: Object, default: () => ({}) },
      loading: { type: [Boolean, Object], default: false }
    },
    emits: ['update:filters', 'apply-filters', 'clear-filters']
  },
  // DiaryRegisterPageで使用されるVuetifyコンポーネント
  'v-select': {
    template: '<div class="v-select"><label>{{label}}</label><select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="item in items" :key="item.value" :value="item.value">{{item.title || item.label}}</option></select><div class="v-select__template" style="display: none;"><slot name="item" v-for="item in items" :key="item.value" :item="{ raw: item }" /></div></div>',
    props: {
      modelValue: { type: [String, Number], default: '' },
      items: { type: Array, default: () => [] },
      label: { type: String, default: '' },
      itemTitle: { type: String, default: 'title' },
      itemValue: { type: String, default: 'value' },
      outlined: { type: Boolean, default: false }
    },
    emits: ['update:modelValue']
  },
  'v-textarea': {
    template: '<div class="v-textarea"><label>{{label}}</label><textarea :placeholder="placeholder" :rows="rows" :value="computedModelValue" @input="handleInput" @blur="$emit(\'blur\', $event)" class="mb-3"></textarea></div>',
    props: {
      modelValue: { type: [String, Number, Object], default: '' },
      label: { type: String, default: '' },
      placeholder: { type: String, default: '' },
      outlined: { type: Boolean, default: false },
      rows: { type: [String, Number], default: 3 }
    },
    computed: {
      computedModelValue() {
        // Object形式のmodelValue（refオブジェクトなど）への対応
        if (this.modelValue && typeof this.modelValue === 'object' && 'value' in this.modelValue) {
          return this.modelValue.value
        }
        return this.modelValue
      }
    },
    methods: {
      handleInput(event) {
        this.$emit('update:modelValue', event.target.value)
      }
    },
    emits: ['update:modelValue', 'blur']
  },
  'v-sheet': {
    template: '<div class="v-sheet" :class="sheetClasses"><slot /></div>',
    props: {
      elevation: { type: [String, Number], default: 0 },
      color: { type: String, default: '' },
      maxWidth: { type: [String, Number], default: '' }
    },
    computed: {
      sheetClasses() {
        const classes = ['v-sheet']
        if (this.elevation) classes.push(`v-sheet--elevation-${this.elevation}`)
        if (this.color) classes.push(`v-sheet--color-${this.color}`)
        return classes
      }
    }
  },
  'v-btn-toggle': {
    template: '<div class="v-btn-toggle" :class="toggleClasses"><slot /></div>',
    props: {
      modelValue: { type: [String, Number, Array, Object], default: null },
      color: { type: String, default: 'primary' },
      variant: { type: String, default: 'outlined' },
      divided: { type: Boolean, default: false },
      mandatory: { type: Boolean, default: false }
    },
    computed: {
      computedModelValue() {
        // Object形式のmodelValue（refオブジェクトなど）への対応
        if (this.modelValue && typeof this.modelValue === 'object' && 'value' in this.modelValue) {
          return this.modelValue.value
        }
        return this.modelValue
      },
      toggleClasses() {
        const classes = ['v-btn-toggle']
        if (this.color) classes.push(`v-btn-toggle--${this.color}`)
        if (this.variant) classes.push(`v-btn-toggle--${this.variant}`)
        if (this.divided) classes.push('v-btn-toggle--divided')
        if (this.mandatory) classes.push('v-btn-toggle--mandatory')
        return classes
      }
    },
    emits: ['update:modelValue']
  },
  'v-list-item': {
    template: '<li class="v-list-item"><slot /></li>',
    props: {
      value: { type: [String, Number], default: undefined }
    }
  },
  'v-list-item-title': {
    template: '<div class="v-list-item-title"><slot /></div>'
  },
  'v-list-item-subtitle': {
    template: '<div class="v-list-item-subtitle"><slot /></div>'
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

// visualViewport のモック（Vuetifyコンポーネント用）
Object.defineProperty(global, 'visualViewport', {
  writable: true,
  value: {
    width: 1024,
    height: 768,
    offsetLeft: 0,
    offsetTop: 0,
    pageLeft: 0,
    pageTop: 0,
    scale: 1,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  },
})