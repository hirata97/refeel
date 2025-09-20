import { ref, computed } from 'vue'
import { accountLockoutManager } from '../../utils/account-lockout'
import type { LockoutStatus } from '../../utils/account-lockout'

export const createLockoutStore = () => {
  // ロックアウト関連の状態
  const lockoutStatus = ref<LockoutStatus | null>(null)

  // 計算プロパティ
  const isAccountLocked = computed(() => lockoutStatus.value?.isLocked || false)

  // ロックアウト管理アクション
  const checkLockoutStatus = async (email: string) => {
    try {
      const status = await accountLockoutManager.checkLockoutStatus(email)
      lockoutStatus.value = status
      return status
    } catch (err) {
      console.error('ロックアウトステータス確認エラー:', err)
      return null
    }
  }

  return {
    // 状態
    lockoutStatus,

    // 計算プロパティ
    isAccountLocked,

    // アクション
    checkLockoutStatus,
  }
}
