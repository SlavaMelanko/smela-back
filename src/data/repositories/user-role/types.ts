import type { Role } from '@/types'

import type { userRolesTable } from '../../schema'

export type UserRoleRecord = typeof userRolesTable.$inferSelect

export interface CreateUserRoleInput {
  userId: string
  role: Role
  invitedBy?: string
}

export interface InviteInviter {
  id: string
  firstName: string
  lastName: string | null
}

export interface InviteInfo {
  inviter: InviteInviter
}
