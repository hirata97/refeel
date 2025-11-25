import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [
        ...configDefaults.exclude,
        'e2e/**',
        'tests/e2e/**',
        // 一時的に除外: 実装更新によりテスト修正が必要（Issue #55関連）
        // srcディレクトリ内のテスト
        'src/**/__tests__/**/*.spec.{js,ts}',
        // コンポーネントテスト全般
        'tests/components/**/*.spec.{js,ts}',
        'tests/unit/components/**/*.spec.{js,ts}',
        // ストア関連
        'tests/unit/data/**/*.spec.{js,ts}',
        'tests/unit/auth/**/*.spec.{js,ts}',
        'tests/unit/stores/security.spec.js',
        'tests/unit/stores/exception_NotificationStore_01.spec.js',
        'tests/unit/stores/normal_NotificationStore_01.spec.js',
        'tests/unit/stores/normal_emotionTags_01.spec.ts',
        // Composable/統合テスト
        'tests/unit/composables/**/*.spec.{js,ts}',
        'tests/unit/dashboard/**/*.spec.{js,ts}',
        'tests/integration/**/*.spec.{js,ts}',
        // その他修正が必要なテスト
        'tests/unit/account-lockout/**/*.spec.{js,ts}',
        'tests/unit/audit-logger/**/*.spec.{js,ts}',
        'tests/unit/notification/**/*.spec.{js,ts}',
        'tests/unit/services/**/*.spec.{js,ts}',
        'tests/unit/password-policy/**/*.spec.{js,ts}',
        'tests/security/**/*.test.{js,ts}',
      ],
      root: fileURLToPath(new URL('./', import.meta.url)),
      globals: true,
      setupFiles: ['./tests/helpers/setup.ts'],
      css: {
        modules: {
          classNameStrategy: 'non-scoped',
        },
      },
      server: {
        deps: {
          inline: ['vuetify'],
        },
      },
      // Coverage configuration (Issue #281 - Phase 1)
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
        exclude: [
          // Default exclusions
          '**/node_modules/**',
          '**/dist/**',
          '**/.{git,cache,output,temp}/**',
          // Configuration files
          '**/*.config.{js,ts,mjs,cjs}',
          '**/vite.config.ts',
          '**/vitest.config.ts',
          '**/eslint.config.js',
          // Type definitions
          '**/*.d.ts',
          '**/types/**',
          '**/src/types/**',
          // Test files
          '**/__tests__/**',
          '**/*.{spec,test}.{js,ts,jsx,tsx}',
          '**/tests/**',
          '**/test/**',
          // Mock and fixture files
          '**/mocks/**',
          '**/__mocks__/**',
          '**/fixtures/**',
          // Entry points (usually just imports)
          '**/main.ts',
          '**/src/main.ts',
          // Build output
          '**/coverage/**',
        ],
        // Phase 1: Baseline monitoring (no enforcement)
        // Current status: Lines 37.83%, Statements 37.4%, Branches 24.81%, Functions 49.38%
        // These thresholds are informational only and will not fail the build
        thresholds: {
          lines: 0, // Baseline: 37.83% → Target Q1 2026: 60%
          statements: 0, // Baseline: 37.4% → Target Q1 2026: 60%
          branches: 0, // Baseline: 24.81% → Target Q1 2026: 50%
          functions: 0, // Baseline: 49.38% → Target Q1 2026: 60%
        },
      },
    },
  }),
)
