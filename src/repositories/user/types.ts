import type { usersTable } from '@/db/schema'

// Database type
type UserRecord = typeof usersTable.$inferSelect

// Input types for create / update / delete / etc.
type CreateUserInput = typeof usersTable.$inferInsert
type UpdateUserInput = Partial<CreateUserInput>

// Public-facing / API-return type
type User = Pick<UserRecord, 'id' | 'firstName' | 'lastName' | 'email' | 'role' | 'status' | 'createdAt'>
type UserWithRole = Omit<User, 'role'> & {
  role: string
}

export type { CreateUserInput, UpdateUserInput, User, UserRecord, UserWithRole }
