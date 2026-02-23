import type { Role } from '@/types'

import type { userPermissionsTable, userRolesTable } from '../../schema'

export type UserPermissionRecord = typeof userPermissionsTable.$inferSelect
export type UserRoleRecord = typeof userRolesTable.$inferSelect

export interface CreateUserRoleInput {
  userId: string
  role: Role
  invitedBy?: string
}

export interface Inviter {
  id: string
  firstName: string
  lastName: string | null
}
