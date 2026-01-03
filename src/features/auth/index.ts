// Stores
export { useAuthStore } from './stores'
export { useSecurityStore } from './stores/security'

// Components
export { default as PasswordChange } from './components/PasswordChange.vue'
export { default as SessionManagement } from './components/SessionManagement.vue'

// Composables
export { useAuthGuard } from './composables/useAuthGuard'

// Services
export * from './services/password-manager'
export * from './services/lockout-manager'
export * from './services/session-manager'
export * from './services/audit-logger'
export * from './services/account-lockout'
export * from './services/authorization'
export * from './services/access-control'
export * from './services/password-policy'
export * from './services/enhanced-session-management'
export * from './services/incident-response'

// Security
export * from './security'

// Utils
export * from './utils/guards'

// Types
export * from './types'
