import type { Role, Status } from '@/types'

import type { usersTable } from '../../schema'
import type { PaginatedResult } from '../pagination'

// Database type
export type UserRecord = typeof usersTable.$inferSelect

// Input types for create / update / delete / etc
export type CreateUserInput = typeof usersTable.$inferInsert
export type UpdateUserInput = Partial<CreateUserInput>

export interface TeamInfo {
  id: string
  name: string
}

// Public-facing / API-return type
export type User = UserRecord & {
  role: Role
  lastActive?: Date | null
  team?: TeamInfo
}

export interface SearchParams {
  search?: string
  roles: Role[]
  statuses?: Status[]
}

export interface SearchResult {
  users: User[]
  pagination: PaginatedResult
}
