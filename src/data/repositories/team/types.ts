import type { teamMembersTable, teamsTable } from '../../schema'
import type { PaginatedResult } from '../pagination'

// Database types
export type TeamRecord = typeof teamsTable.$inferSelect
export type TeamMemberRecord = typeof teamMembersTable.$inferSelect

// Input types for create / update / delete / etc
export type CreateTeamInput = typeof teamsTable.$inferInsert
export type UpdateTeamInput = Partial<Omit<CreateTeamInput, 'id' | 'createdAt'>>
export type CreateTeamMemberInput = typeof teamMembersTable.$inferInsert

// Public-facing / API-return types
export type Team = TeamRecord
export type TeamMember = TeamMemberRecord

export interface TeamMemberInviter {
  id: string | null
  firstName: string | null
  lastName: string | null
}

export interface TeamMemberDetails {
  id: string
  firstName: string
  lastName: string | null
  email: string
  status: string
  createdAt: Date
  updatedAt: Date
  lastActive: Date | null
  position: string | null
  inviter: TeamMemberInviter | null
  joinedAt: Date | null
}

export type TeamWithMemberCount = Team & {
  memberCount: number
}

export interface UserTeamInfo {
  id: string
  name: string
  position: string | null
}

export interface TeamSearchParams {
  search?: string
}

export interface TeamSearchResult {
  teams: Team[]
  pagination: PaginatedResult
}
