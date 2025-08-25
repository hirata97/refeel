/**
 * デザイントークンシステム
 * Issue #153 Phase 2: 一貫性のあるデザイン体系の構築
 */

// =============================================================================
// Spacing System (8px grid system based on Vuetify)
// =============================================================================
export const SPACING = {
  // Base unit: 4px (Vuetify's base)
  xs: '4px',   // pa-1, ma-1
  sm: '8px',   // pa-2, ma-2  
  md: '16px',  // pa-4, ma-4
  lg: '24px',  // pa-6, ma-6
  xl: '32px',  // pa-8, ma-8
  xxl: '48px', // pa-12, ma-12
  
  // Component specific
  component: {
    cardPadding: '16px',      // v-card内部パディング
    sectionMargin: '16px',    // セクション間マージン
    formSection: '16px',      // フォームセクション
    buttonSpacing: '8px',     // ボタン間スペース
  }
} as const

// =============================================================================
// Typography System (Material Design 3 準拠)
// =============================================================================
export const TYPOGRAPHY = {
  // Vuetify text classes
  display: {
    large: {
      fontSize: '57px',
      lineHeight: '64px',
      fontWeight: 400,
      class: 'text-h1'
    },
    medium: {
      fontSize: '45px', 
      lineHeight: '52px',
      fontWeight: 400,
      class: 'text-h2'
    },
    small: {
      fontSize: '36px',
      lineHeight: '44px', 
      fontWeight: 400,
      class: 'text-h3'
    }
  },
  
  headline: {
    large: {
      fontSize: '32px',
      lineHeight: '40px',
      fontWeight: 400,
      class: 'text-h4'
    },
    medium: {
      fontSize: '28px',
      lineHeight: '36px',
      fontWeight: 400,
      class: 'text-h5'
    },
    small: {
      fontSize: '24px',
      lineHeight: '32px',
      fontWeight: 400,
      class: 'text-h6'
    }
  },
  
  body: {
    large: {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 400,
      class: 'text-body-1'
    },
    medium: {
      fontSize: '14px',
      lineHeight: '20px', 
      fontWeight: 400,
      class: 'text-body-2'
    }
  },
  
  label: {
    large: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 500,
      class: 'text-subtitle-1'
    },
    medium: {
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: 500,
      class: 'text-subtitle-2'
    }
  }
} as const

// =============================================================================
// Color System (テーマストアと連携)
// =============================================================================
export const COLOR_TOKENS = {
  // Primary colors (Deep Purple系)
  primary: {
    50: '#F3E5F5',   // surface-variant (light)
    400: '#7986CB',  // primary-lighten-1
    500: '#673AB7',  // primary (light)
    600: '#5E35B1',
    700: '#512DA8',  // primary-darken-1 (light)
    A200: '#7C4DFF', // primary (dark)
    A400: '#651FFF', // primary-darken-1 (dark)
  },
  
  // Semantic colors
  semantic: {
    success: '#4caf50',
    warning: '#ff9800', 
    error: '#f44336',
    info: '#2196f3',
  },
  
  // Surface colors
  surface: {
    light: {
      background: '#f5f7fa',
      surface: '#ffffff',
      variant: '#F3E5F5',
      text: '#000000',
    },
    dark: {
      background: '#121212',
      surface: '#1E1E1E', 
      variant: '#2A1B3D',
      text: '#FFFFFF',
    }
  }
} as const

// =============================================================================
// Component Tokens
// =============================================================================
export const COMPONENT_TOKENS = {
  card: {
    borderRadius: '8px',
    elevation: {
      low: '2dp',
      medium: '4dp',
      high: '8dp',
    },
    padding: {
      small: SPACING.sm,
      medium: SPACING.md,
      large: SPACING.lg,
    }
  },
  
  button: {
    borderRadius: '4px',
    height: {
      small: '32px',
      medium: '40px', 
      large: '48px',
    },
    padding: {
      horizontal: SPACING.md,
      vertical: SPACING.sm,
    }
  },
  
  form: {
    fieldSpacing: SPACING.md,
    sectionSpacing: SPACING.lg,
    labelSpacing: SPACING.xs,
  },
  
  layout: {
    containerPadding: SPACING.md,
    sectionSpacing: SPACING.lg,
    contentMaxWidth: '1200px',
  }
} as const

// =============================================================================
// CSS Custom Properties Generator
// =============================================================================
export const generateCSSCustomProperties = () => {
  return {
    // Spacing
    '--spacing-xs': SPACING.xs,
    '--spacing-sm': SPACING.sm,
    '--spacing-md': SPACING.md,
    '--spacing-lg': SPACING.lg,
    '--spacing-xl': SPACING.xl,
    '--spacing-xxl': SPACING.xxl,
    
    // Component spacing
    '--card-padding': COMPONENT_TOKENS.card.padding.medium,
    '--section-margin': SPACING.lg,
    '--form-field-spacing': COMPONENT_TOKENS.form.fieldSpacing,
    
    // Typography
    '--font-size-h1': TYPOGRAPHY.display.large.fontSize,
    '--font-size-h2': TYPOGRAPHY.display.medium.fontSize,
    '--font-size-h3': TYPOGRAPHY.display.small.fontSize,
    '--font-size-h4': TYPOGRAPHY.headline.large.fontSize,
    '--font-size-h5': TYPOGRAPHY.headline.medium.fontSize,
    '--font-size-h6': TYPOGRAPHY.headline.small.fontSize,
    '--font-size-body1': TYPOGRAPHY.body.large.fontSize,
    '--font-size-body2': TYPOGRAPHY.body.medium.fontSize,
    
    // Colors (CSS variables are updated by theme store)
    '--color-primary-50': COLOR_TOKENS.primary[50],
    '--color-primary-400': COLOR_TOKENS.primary[400],
    '--color-primary-500': COLOR_TOKENS.primary[500],
    '--color-primary-600': COLOR_TOKENS.primary[600],
    '--color-primary-700': COLOR_TOKENS.primary[700],
    '--color-primary-a200': COLOR_TOKENS.primary.A200,
    '--color-primary-a400': COLOR_TOKENS.primary.A400,
    
    // Component tokens
    '--border-radius-card': COMPONENT_TOKENS.card.borderRadius,
    '--border-radius-button': COMPONENT_TOKENS.button.borderRadius,
    '--button-height-medium': COMPONENT_TOKENS.button.height.medium,
    '--layout-max-width': COMPONENT_TOKENS.layout.contentMaxWidth,
  }
}

// =============================================================================
// Utility Classes Helper
// =============================================================================
export const getUtilityClasses = () => ({
  // Spacing utilities (既存のVuetifyクラスを活用)
  spacing: {
    paddingSmall: 'pa-2',      // 8px
    paddingMedium: 'pa-4',     // 16px  
    paddingLarge: 'pa-6',      // 24px
    marginSmall: 'ma-2',       // 8px
    marginMedium: 'ma-4',      // 16px
    marginLarge: 'ma-6',       // 24px
  },
  
  // Typography utilities
  typography: {
    displayLarge: 'text-h1',
    displayMedium: 'text-h2', 
    displaySmall: 'text-h3',
    headlineLarge: 'text-h4',
    headlineMedium: 'text-h5',
    headlineSmall: 'text-h6',
    bodyLarge: 'text-body-1',
    bodyMedium: 'text-body-2',
    labelLarge: 'text-subtitle-1',
    labelMedium: 'text-subtitle-2',
  },
  
  // Color utilities (Vuetifyテーマベース)
  colors: {
    primary: 'text-primary',
    secondary: 'text-secondary', 
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
    info: 'text-info',
  }
})

// =============================================================================
// Type Definitions
// =============================================================================
export type SpacingToken = keyof typeof SPACING
export type TypographyToken = keyof typeof TYPOGRAPHY
export type ColorToken = keyof typeof COLOR_TOKENS
export type ComponentToken = keyof typeof COMPONENT_TOKENS

// Design token selectors for TypeScript support
export type DesignTokens = {
  spacing: typeof SPACING
  typography: typeof TYPOGRAPHY
  colors: typeof COLOR_TOKENS
  components: typeof COMPONENT_TOKENS
}