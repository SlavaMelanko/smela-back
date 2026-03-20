import type { Role } from '@/types'

import type { permissionsTable, userPermissionsTable, userRoleTable } from '../../schema'

// Database types
export type UserPermissionRecord = typeof userPermissionsTable.$inferSelect
export type UserRoleRecord = typeof userRoleTable.$inferSelect

// Input types for create / update / delete / etc
export interface CreateUserRoleInput {
  userId: string
  role: Role
  invitedBy?: string
}

// Public-facing / API-return types
export type ActivePermissionRow = Pick<typeof permissionsTable.$inferSelect, 'action' | 'resource'>

export interface Inviter {
  id: string
  firstName: string
  lastName: string | null
}
