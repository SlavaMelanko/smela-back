import type { Action, Resource, Role } from '@/types'

import type { userPermissionsTable, userRolesTable } from '../../schema'

// Database types
export type UserPermissionRecord = typeof userPermissionsTable.$inferSelect
export type UserRoleRecord = typeof userRolesTable.$inferSelect

// Input types for create / update / delete / etc
export interface CreateUserRoleInput {
  userId: string
  role: Role
  invitedBy?: string
}

// Public-facing / API-return types
export interface Inviter {
  id: string
  firstName: string
  lastName: string | null
}

export interface ActivePermissionRow {
  action: Action
  resource: Resource
}

export interface RolePermissionRow {
  permissionId: number
  action: Action
  resource: Resource
}
