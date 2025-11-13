import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  accountLockoutManager,
  passwordValidator,
  passwordHistoryManager,
  enhancedSessionManager,
  auditLogger,
  AuditEventType,
  performSecurityCheck,
} from '@/utils/auth'
import type { LockoutStatus, PasswordValidationResult } from '@/utils/auth'
import { createLogger } from '@/utils/logger'

const logger = createLogger('SECURITY')

/**
 * セキュリティ関連機能を管理するストア
 * 認証ストアから分離して、セキュリティ機能の管理を専門化
 */
export const useSecurityStore = defineStore('security', () => {
  // セキュリティ状態
  const lockoutStatus = ref<LockoutStatus | null>(null)
  const passwordValidationResult = ref<PasswordValidationResult | null>(null)

  // セキュリティ関連の計算プロパティ
  const isAccountLocked = computed(() => lockoutStatus.value?.isLocked || false)

  const securityStats = computed(() => {
    return (userId: string) => enhancedSessionManager.getSecurityStats(userId)
  })

  // セキュリティチェック
  const performInputSecurityCheck = (input: string) => {
    return performSecurityCheck(input)
  }

  // アカウントロックアウト管理
  const checkLockoutStatus = async (email: string) => {
    try {
      const status = await accountLockoutManager.checkLockoutStatus(email)
      lockoutStatus.value = status
      return status
    } catch (err) {
      logger.error('ロックアウトステータス確認エラー:', err)
      return null
    }
  }

  const recordLoginAttempt = async (
    email: string,
    success: boolean,
    clientIP: string,
    userAgent: string,
  ) => {
    return await accountLockoutManager.recordLoginAttempt(email, success, clientIP, userAgent)
  }

  const shouldLockAccount = async (email: string) => {
    return await accountLockoutManager.shouldLockAccount(email)
  }

  const lockAccount = async (email: string, attemptCount: number) => {
    return await accountLockoutManager.lockAccount(email, attemptCount)
  }

  // パスワード管理
  const validatePassword = (
    password: string,
    email?: string,
    name?: string,
  ): PasswordValidationResult => {
    const result = passwordValidator.validatePassword(password, email, name)
    passwordValidationResult.value = result
    return result
  }

  const hashPassword = async (password: string) => {
    return await passwordValidator.hashPassword(password)
  }

  const getStrengthLabel = (score: number) => {
    return passwordValidator.getStrengthLabel(score)
  }

  // パスワード履歴管理
  const addToPasswordHistory = async (userId: string, passwordHash: string) => {
    return await passwordHistoryManager.addToHistory(userId, passwordHash)
  }

  const isPasswordReused = async (userId: string, passwordHash: string) => {
    return await passwordHistoryManager.isPasswordReused(userId, passwordHash)
  }

  // セッション管理
  const createSession = async (
    userId: string,
    sessionId: string,
    userAgent: string,
    clientIP: string,
  ) => {
    return await enhancedSessionManager.createSession(userId, sessionId, userAgent, clientIP)
  }

  const terminateSession = async (sessionId: string, reason: string) => {
    return await enhancedSessionManager.terminateSession(sessionId, reason)
  }

  const getActiveUserSessions = (userId: string) => {
    return enhancedSessionManager.getActiveUserSessions(userId)
  }

  const getUserDevices = (userId: string) => {
    return enhancedSessionManager.getUserDevices(userId)
  }

  const terminateAllUserSessions = async (userId: string, exceptSessionId?: string) => {
    return await enhancedSessionManager.terminateAllUserSessions(userId, exceptSessionId)
  }

  // 監査ログ
  const logSecurityEvent = async (
    eventType: AuditEventType,
    description: string,
    metadata?: Record<string, unknown>,
  ) => {
    return await auditLogger.log(eventType, description, metadata)
  }

  // 状態クリア
  const clearSecurityState = () => {
    lockoutStatus.value = null
    passwordValidationResult.value = null
  }

  return {
    // 状態
    lockoutStatus,
    passwordValidationResult,

    // 計算プロパティ
    isAccountLocked,
    securityStats,

    // メソッド
    performInputSecurityCheck,
    checkLockoutStatus,
    recordLoginAttempt,
    shouldLockAccount,
    lockAccount,
    validatePassword,
    hashPassword,
    getStrengthLabel,
    addToPasswordHistory,
    isPasswordReused,
    createSession,
    terminateSession,
    getActiveUserSessions,
    getUserDevices,
    terminateAllUserSessions,
    logSecurityEvent,
    clearSecurityState,
  }
})
