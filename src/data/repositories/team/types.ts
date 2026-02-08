import type { teamMembersTable, teamsTable } from '../../schema'

export type TeamRecord = typeof teamsTable.$inferSelect
export type TeamMemberRecord = typeof teamMembersTable.$inferSelect

export type CreateTeamInput = typeof teamsTable.$inferInsert
export type UpdateTeamInput = Partial<Omit<CreateTeamInput, 'id' | 'createdAt'>>

export type CreateTeamMemberInput = typeof teamMembersTable.$inferInsert

export type Team = TeamRecord
export type TeamMember = TeamMemberRecord

export interface TeamMemberDetails {
  id: string
  firstName: string
  lastName: string | null
  email: string
  status: string
  position: string | null
  invitedBy: string | null
  joinedAt: Date | null
}

export type TeamWithMembers = Team & {
  members: TeamMemberDetails[]
}

export type TeamMemberWithTeam = TeamMember & {
  team: Team
}
