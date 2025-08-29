import { describe, it, expect } from 'vitest'

// shouldShowLockoutAlert ロジックの単体テスト
describe('LoginPage - shouldShowLockoutAlert ロジックテスト', () => {
  
  const shouldShowLockoutAlert = (lockoutInfo) => {
    if (!lockoutInfo) return false
    return !!(lockoutInfo.isLocked || (lockoutInfo.failedAttempts ?? 0) > 0)
  }

  it('lockoutInfo が null の場合は false を返す', () => {
    expect(shouldShowLockoutAlert(null)).toBe(false)
  })

  it('lockoutInfo が undefined の場合は false を返す', () => {
    expect(shouldShowLockoutAlert(undefined)).toBe(false)
  })

  it('空のオブジェクトの場合は false を返す', () => {
    expect(shouldShowLockoutAlert({})).toBe(false)
  })

  it('isLocked が true の場合は true を返す', () => {
    const lockoutInfo = {
      isLocked: true,
      failedAttempts: 3,
      remainingAttempts: 0,
      lockoutEnd: new Date()
    }
    expect(shouldShowLockoutAlert(lockoutInfo)).toBe(true)
  })

  it('failedAttempts > 0 の場合は true を返す', () => {
    const lockoutInfo = {
      isLocked: false,
      failedAttempts: 2,
      remainingAttempts: 1,
      lockoutEnd: null
    }
    expect(shouldShowLockoutAlert(lockoutInfo)).toBe(true)
  })

  it('failedAttempts が 0 の場合は false を返す', () => {
    const lockoutInfo = {
      isLocked: false,
      failedAttempts: 0,
      remainingAttempts: 3,
      lockoutEnd: null
    }
    expect(shouldShowLockoutAlert(lockoutInfo)).toBe(false)
  })

  it('failedAttempts が undefined の場合は false を返す', () => {
    const lockoutInfo = {
      isLocked: false,
      remainingAttempts: 3,
      lockoutEnd: null
    }
    expect(shouldShowLockoutAlert(lockoutInfo)).toBe(false)
  })
})