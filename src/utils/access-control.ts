import { useAuthStore } from '@/stores/auth'
import { createLogger } from '@/utils/logger'

const logger = createLogger('ACCESS-CONTROL')
import type { User } from '@supabase/supabase-js'

// ロール定義
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

// 権限定義
export enum Permission {
  // 目標管理
  CREATE_GOAL = 'create_goal',
  READ_GOAL = 'read_goal',
  UPDATE_GOAL = 'update_goal',
  DELETE_GOAL = 'delete_goal',

  // 日記管理
  CREATE_DIARY = 'create_diary',
  READ_DIARY = 'read_diary',
  UPDATE_DIARY = 'update_diary',
  DELETE_DIARY = 'delete_diary',

  // ユーザー管理
  READ_USER_PROFILE = 'read_user_profile',
  UPDATE_USER_PROFILE = 'update_user_profile',
  DELETE_USER_ACCOUNT = 'delete_user_account',

  // システム管理
  ACCESS_ADMIN_PANEL = 'access_admin_panel',
  MANAGE_USERS = 'manage_users',
  VIEW_SYSTEM_LOGS = 'view_system_logs',
}

// リソースタイプ
export enum ResourceType {
  GOAL = 'goal',
  DIARY = 'diary',
  USER = 'user',
  SYSTEM = 'system',
}

// ロールと権限のマッピング
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // 管理者は全権限
    ...Object.values(Permission),
  ],
  [UserRole.USER]: [
    // 一般ユーザーは自分のデータのみ
    Permission.CREATE_GOAL,
    Permission.READ_GOAL,
    Permission.UPDATE_GOAL,
    Permission.DELETE_GOAL,
    Permission.CREATE_DIARY,
    Permission.READ_DIARY,
    Permission.UPDATE_DIARY,
    Permission.DELETE_DIARY,
    Permission.READ_USER_PROFILE,
    Permission.UPDATE_USER_PROFILE,
    Permission.DELETE_USER_ACCOUNT,
  ],
  [UserRole.GUEST]: [
    // ゲストは読み取り専用
    Permission.READ_GOAL,
    Permission.READ_DIARY,
  ],
}

// ユーザーロール取得
export const getUserRole = (user: User | null): UserRole => {
  if (!user) return UserRole.GUEST

  // メタデータからロールを取得（デフォルトはUSER）
  const userMetadata = user.user_metadata || {}
  const role = userMetadata.role as UserRole

  return Object.values(UserRole).includes(role) ? role : UserRole.USER
}

// 権限チェック
export const hasPermission = (user: User | null, permission: Permission): boolean => {
  const role = getUserRole(user)
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.includes(permission)
}

// リソース所有権チェック
export const isResourceOwner = (user: User | null, resourceOwnerId: string): boolean => {
  if (!user) return false
  return user.id === resourceOwnerId
}

// リソースアクセスチェック
export const canAccessResource = (
  user: User | null,
  permission: Permission,
  resourceOwnerId?: string,
): boolean => {
  // 基本権限チェック
  if (!hasPermission(user, permission)) {
    return false
  }

  // 管理者は全てのリソースにアクセス可能
  const role = getUserRole(user)
  if (role === UserRole.ADMIN) {
    return true
  }

  // リソース所有者チェック（所有者IDが指定されている場合）
  if (resourceOwnerId) {
    return isResourceOwner(user, resourceOwnerId)
  }

  return true
}

// ルートアクセス制御クラス
export class AccessController {
  private static instance: AccessController
  public authStore = useAuthStore()

  static getInstance(): AccessController {
    if (!AccessController.instance) {
      AccessController.instance = new AccessController()
    }
    return AccessController.instance
  }

  // 認証チェック
  requireAuth(): boolean {
    if (!this.authStore.isAuthenticated) {
      logger.warn('認証が必要です')
      return false
    }
    return true
  }

  // 権限チェック
  requirePermission(permission: Permission): boolean {
    if (!this.requireAuth()) {
      return false
    }

    if (!hasPermission(this.authStore.user, permission)) {
      logger.warn(`権限が不足しています: ${permission}`)
      return false
    }

    return true
  }

  // リソースアクセスチェック
  requireResourceAccess(permission: Permission, resourceOwnerId?: string): boolean {
    if (!this.requireAuth()) {
      return false
    }

    if (!canAccessResource(this.authStore.user, permission, resourceOwnerId)) {
      logger.warn(`リソースへのアクセスが拒否されました: ${permission}`)
      return false
    }

    return true
  }

  // 管理者チェック
  requireAdmin(): boolean {
    if (!this.requireAuth()) {
      return false
    }

    const role = getUserRole(this.authStore.user)
    if (role !== UserRole.ADMIN) {
      logger.warn('管理者権限が必要です')
      return false
    }

    return true
  }

  // 自分自身または管理者チェック
  requireSelfOrAdmin(userId: string): boolean {
    if (!this.requireAuth()) {
      return false
    }

    const role = getUserRole(this.authStore.user)
    const isSelf = this.authStore.user?.id === userId

    if (!isSelf && role !== UserRole.ADMIN) {
      logger.warn('自分自身または管理者権限が必要です')
      return false
    }

    return true
  }
}

// アクセス制御ミドルウェア
export const createAccessMiddleware = (
  requiredPermission: Permission,
  resourceOwnerIdGetter?: () => string | undefined,
) => {
  return () => {
    const controller = AccessController.getInstance()
    const resourceOwnerId = resourceOwnerIdGetter?.()

    return controller.requireResourceAccess(requiredPermission, resourceOwnerId)
  }
}

// Vue Composable
export const useAccessControl = () => {
  const controller = AccessController.getInstance()

  return {
    hasPermission: (permission: Permission) => hasPermission(controller.authStore.user, permission),

    canAccessResource: (permission: Permission, resourceOwnerId?: string) =>
      canAccessResource(controller.authStore.user, permission, resourceOwnerId),

    getUserRole: () => getUserRole(controller.authStore.user),

    requireAuth: () => controller.requireAuth(),
    requirePermission: (permission: Permission) => controller.requirePermission(permission),
    requireResourceAccess: (permission: Permission, resourceOwnerId?: string) =>
      controller.requireResourceAccess(permission, resourceOwnerId),
    requireAdmin: () => controller.requireAdmin(),
    requireSelfOrAdmin: (userId: string) => controller.requireSelfOrAdmin(userId),
  }
}
