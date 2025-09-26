import type { usersTable } from '@/db/schema'
import type { Role, Status } from '@/types'

// Database type
type UserRecord = typeof usersTable.$inferSelect

// Input types for create / update / delete / etc
type CreateUserInput = typeof usersTable.$inferInsert
type UpdateUserInput = Partial<CreateUserInput>

// Public-facing / API-return type
type User = Omit<UserRecord, 'role' | 'status'> & {
  role: Role
  status: Status
}

export type { CreateUserInput, UpdateUserInput, User, UserRecord }
