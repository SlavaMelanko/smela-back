import { and, count, desc, eq, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

import type { Database } from '../../clients'
import type { PaginationParams } from '../pagination'
import type { Team, TeamMemberDetails, TeamSearchParams, TeamSearchResult, TeamWithMemberCount, UserTeamInfo } from './types'

import { db } from '../../clients'
import { teamMembersTable, teamsTable, usersTable } from '../../schema'
import { buildPagination, calcOffset } from '../pagination'
import { lastActiveSubquery } from '../refresh-token/queries'

const buildWhereConditions = ({ search }: TeamSearchParams) => {
  const conditions = []

  if (search && search.length > 0) {
    // Use concatenated expression to leverage GIN index (idx_teams_search_trgm)
    conditions.push(
      sql`(${teamsTable.id}::text || ' ' || ${teamsTable.name} || ' ' || COALESCE(${teamsTable.website}, '') || ' ' || COALESCE(${teamsTable.description}, '')) ILIKE ${`%${search}%`}`,
    )
  }

  return and(...conditions)
}

export const searchTeams = async (
  filters: TeamSearchParams,
  pagination: PaginationParams,
  tx?: Database,
): Promise<TeamSearchResult> => {
  const executor = tx || db

  const whereClause = buildWhereConditions(filters)

  const [teams, countResult] = await Promise.all([
    executor
      .select()
      .from(teamsTable)
      .where(whereClause)
      .orderBy(desc(teamsTable.createdAt))
      .limit(pagination.limit)
      .offset(calcOffset(pagination)),
    executor
      .select({ value: count() })
      .from(teamsTable)
      .where(whereClause),
  ])

  return {
    teams,
    pagination: buildPagination(pagination, countResult),
  }
}

export const findTeamById = async (
  teamId: string,
  tx?: Database,
): Promise<Team | undefined> => {
  const executor = tx || db

  const [team] = await executor
    .select()
    .from(teamsTable)
    .where(eq(teamsTable.id, teamId))

  return team
}

/**
 * Gets all team members or a single member if userId is specified
 */
export const findTeamMembers = async (
  teamId: string,
  userId?: string,
  tx?: Database,
): Promise<TeamMemberDetails[]> => {
  const executor = tx || db
  const invitersTable = alias(usersTable, 'inviters')

  const whereConditions = [eq(teamMembersTable.teamId, teamId)]
  if (userId) {
    whereConditions.push(eq(teamMembersTable.userId, userId))
  }

  const lastActiveSq = lastActiveSubquery(executor)

  const rows = await executor
    .select({
      id: teamMembersTable.userId,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
      status: usersTable.status,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
      lastActive: lastActiveSq.lastActive,
      position: teamMembersTable.position,
      joinedAt: teamMembersTable.joinedAt,
      inviter: {
        id: invitersTable.id,
        firstName: invitersTable.firstName,
        lastName: invitersTable.lastName,
      },
    })
    .from(teamMembersTable)
    .innerJoin(usersTable, eq(teamMembersTable.userId, usersTable.id))
    .leftJoin(invitersTable, eq(teamMembersTable.invitedBy, invitersTable.id))
    .leftJoin(lastActiveSq, eq(teamMembersTable.userId, lastActiveSq.userId))
    .where(and(...whereConditions))
    .orderBy(desc(teamMembersTable.joinedAt))

  return rows
}

export const countTeamMembers = async (
  teamId: string,
  tx?: Database,
): Promise<number> => {
  const executor = tx || db

  const [result] = await executor
    .select({ value: count() })
    .from(teamMembersTable)
    .where(eq(teamMembersTable.teamId, teamId))

  return result?.value ?? 0
}

export const findTeamMember = async (
  teamId: string,
  userId: string,
  tx?: Database,
): Promise<TeamMemberDetails | undefined> => {
  const members = await findTeamMembers(teamId, userId, tx)

  return members[0]
}

export const findTeamWithMemberCount = async (
  teamId: string,
  tx?: Database,
): Promise<TeamWithMemberCount | undefined> => {
  const [team, memberCount] = await Promise.all([
    findTeamById(teamId, tx),
    countTeamMembers(teamId, tx),
  ])

  if (!team) {
    return undefined
  }

  return {
    ...team,
    memberCount,
  }
}

export const findUserTeam = async (
  userId: string,
  tx?: Database,
): Promise<UserTeamInfo | undefined> => {
  const executor = tx || db

  const [result] = await executor
    .select({
      id: teamsTable.id,
      name: teamsTable.name,
      position: teamMembersTable.position,
    })
    .from(teamMembersTable)
    .innerJoin(teamsTable, eq(teamMembersTable.teamId, teamsTable.id))
    .where(eq(teamMembersTable.userId, userId))

  return result
}
