import type { Role, Status } from '@/types'

import type { usersTable } from '../../schema'

// Database type
export type UserRecord = typeof usersTable.$inferSelect

// Input types for create / update / delete / etc
export type CreateUserInput = typeof usersTable.$inferInsert
export type UpdateUserInput = Partial<CreateUserInput>

// Public-facing / API-return type
export type User = Omit<UserRecord, 'role' | 'status'> & {
  role: Role
  status: Status
}

export type NormalizedUser = Omit<User, 'tokenVersion'>
