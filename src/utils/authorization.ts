import { useAuthStore } from '@/stores/auth'
import { Permission, ResourceType, getUserRole, UserRole } from './access-control'
import type { User } from '@supabase/supabase-js'

// 認可コンテキスト
export interface AuthorizationContext {
  user: User | null
  resource?: {
    type: ResourceType
    id: string
    ownerId?: string
    metadata?: Record<string, unknown>
  }
  action: Permission
  clientInfo?: {
    ip?: string
    userAgent?: string
    timestamp: number
  }
}

// 認可結果
export interface AuthorizationResult {
  granted: boolean
  reason?: string
  conditions?: string[]
  metadata?: Record<string, unknown>
}

// 条件付き認可ルール
export interface ConditionalRule {
  condition: (context: AuthorizationContext) => boolean
  message: string
}

// 認可ルールエンジン
export class AuthorizationEngine {
  private static instance: AuthorizationEngine
  private conditionalRules: Map<Permission, ConditionalRule[]> = new Map()

  static getInstance(): AuthorizationEngine {
    if (!AuthorizationEngine.instance) {
      AuthorizationEngine.instance = new AuthorizationEngine()
      AuthorizationEngine.instance.initializeRules()
    }
    return AuthorizationEngine.instance
  }

  private initializeRules() {
    // 目標作成の条件
    this.addConditionalRule(Permission.CREATE_GOAL, {
      condition: (context) => {
        const role = getUserRole(context.user)
        if (role === UserRole.GUEST) return false

        // ユーザーは1日10個まで目標作成可能（例）
        return true // 実際の実装では制限チェック
      },
      message: '目標作成の上限に達しています',
    })

    // 日記編集の条件
    this.addConditionalRule(Permission.UPDATE_DIARY, {
      condition: (context) => {
        if (!context.resource) return false

        // 作成から24時間以内のみ編集可能（例）
        const createdAt = context.resource.metadata?.created_at as string | undefined
        if (createdAt) {
          const hoursSinceCreation = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
          return hoursSinceCreation <= 24
        }
        return true
      },
      message: '作成から24時間を超えた日記は編集できません',
    })

    // 管理者パネルアクセスの条件
    this.addConditionalRule(Permission.ACCESS_ADMIN_PANEL, {
      condition: () => {
        // 特定の時間帯のみアクセス可能（例）
        const hour = new Date().getHours()
        return hour >= 9 && hour <= 18 // 9:00-18:00
      },
      message: '管理者パネルは営業時間内（9:00-18:00）のみアクセス可能です',
    })
  }

  addConditionalRule(permission: Permission, rule: ConditionalRule) {
    if (!this.conditionalRules.has(permission)) {
      this.conditionalRules.set(permission, [])
    }
    this.conditionalRules.get(permission)!.push(rule)
  }

  // 認可チェック
  authorize(context: AuthorizationContext): AuthorizationResult {
    const { user, action, resource } = context

    // 基本認証チェック
    if (!user) {
      return {
        granted: false,
        reason: '認証が必要です',
      }
    }

    // ロール基盤のアクセス制御
    const role = getUserRole(user)
    if (!this.hasBasicPermission(role, action)) {
      return {
        granted: false,
        reason: `権限が不足しています: ${action}`,
      }
    }

    // リソース所有権チェック
    if (resource && !this.checkResourceAccess(user, resource, action)) {
      return {
        granted: false,
        reason: 'リソースへのアクセス権限がありません',
      }
    }

    // 条件付きルールのチェック
    const conditionalRules = this.conditionalRules.get(action) || []
    for (const rule of conditionalRules) {
      if (!rule.condition(context)) {
        return {
          granted: false,
          reason: rule.message,
        }
      }
    }

    return {
      granted: true,
      metadata: {
        role,
        checkedAt: new Date().toISOString(),
      },
    }
  }

  private hasBasicPermission(role: UserRole, action: Permission): boolean {
    // access-control.tsの権限マップを参照
    const rolePermissions = {
      [UserRole.ADMIN]: Object.values(Permission),
      [UserRole.USER]: [
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
      [UserRole.GUEST]: [Permission.READ_GOAL, Permission.READ_DIARY],
    }

    return rolePermissions[role]?.includes(action) || false
  }

  private checkResourceAccess(
    user: User,
    resource: { type: ResourceType; id: string; ownerId?: string },
    action: Permission,
  ): boolean {
    const role = getUserRole(user)

    // 管理者は全リソースアクセス可能
    if (role === UserRole.ADMIN) {
      return true
    }

    // 所有者チェック
    if (resource.ownerId && resource.ownerId !== user.id) {
      // 読み取り専用アクションは他のユーザーのリソースにもアクセス可能（設定による）
      const readOnlyActions = [Permission.READ_GOAL, Permission.READ_DIARY]
      return readOnlyActions.includes(action)
    }

    return true
  }
}

// 認可デコレーター関数
export const requireAuthorization = (
  permission: Permission,
  getResourceInfo?: () => { type: ResourceType; id: string; ownerId?: string; metadata?: unknown },
) => {
  return (target: unknown, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      const authStore = useAuthStore()
      const engine = AuthorizationEngine.getInstance()

      const context: AuthorizationContext = {
        user: authStore.user,
        action: permission,
        resource: getResourceInfo?.() as
          | { type: ResourceType; id: string; ownerId?: string; metadata?: Record<string, unknown> }
          | undefined,
        clientInfo: {
          timestamp: Date.now(),
        },
      }

      const result = engine.authorize(context)

      if (!result.granted) {
        throw new Error(`認可エラー: ${result.reason}`)
      }

      return method.apply(this, args)
    }

    return descriptor
  }
}

// Vue Composable
export const useAuthorization = () => {
  const engine = AuthorizationEngine.getInstance()
  const authStore = useAuthStore()

  const authorize = (
    permission: Permission,
    resourceInfo?: { type: ResourceType; id: string; ownerId?: string; metadata?: unknown },
  ): AuthorizationResult => {
    const context: AuthorizationContext = {
      user: authStore.user,
      action: permission,
      resource: resourceInfo as
        | { type: ResourceType; id: string; ownerId?: string; metadata?: Record<string, unknown> }
        | undefined,
      clientInfo: {
        timestamp: Date.now(),
      },
    }

    return engine.authorize(context)
  }

  const checkPermission = (permission: Permission): boolean => {
    return authorize(permission).granted
  }

  const checkResourceAccess = (
    permission: Permission,
    resourceInfo: { type: ResourceType; id: string; ownerId?: string; metadata?: unknown },
  ): boolean => {
    return authorize(permission, resourceInfo).granted
  }

  return {
    authorize,
    checkPermission,
    checkResourceAccess,
    addConditionalRule: (permission: Permission, rule: ConditionalRule) =>
      engine.addConditionalRule(permission, rule),
  }
}
