import { and, count, desc, eq, sql } from 'drizzle-orm'

import type { Database } from '../../clients'
import type { PaginatedResult, PaginationParams } from '../pagination'
import type { Team, TeamMemberDetails, TeamWithMembers } from './types'

import { db } from '../../clients'
import { teamMembersTable, teamsTable, usersTable } from '../../schema'
import { calcOffset } from '../pagination'

export interface TeamSearchParams {
  search?: string
}

export interface TeamSearchResult {
  teams: Team[]
  pagination: PaginatedResult
}

export const searchTeams = async (
  filters: TeamSearchParams,
  pagination: PaginationParams,
  tx?: Database,
): Promise<TeamSearchResult> => {
  const executor = tx || db
  const { search } = filters
  const { page, limit } = pagination
  const offset = calcOffset(pagination)

  const buildWhereConditions = () => {
    const conditions = []

    if (search && search.length > 0) {
      // Use concatenated expression to leverage GIN index (idx_teams_search_trgm)
      conditions.push(
        sql`(id::text || ' ' || name || ' ' || COALESCE(website, '') || ' ' || COALESCE(description, '')) ILIKE ${`%${search}%`}`,
      )
    }

    return and(...conditions)
  }

  const whereClause = buildWhereConditions()

  const [countResult, teams] = await Promise.all([
    executor.select({ value: count() }).from(teamsTable).where(whereClause),
    executor
      .select()
      .from(teamsTable)
      .where(whereClause)
      .orderBy(desc(teamsTable.createdAt))
      .limit(limit)
      .offset(offset),
  ])

  const totalCount = countResult[0]?.value ?? 0

  return {
    teams,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
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

export const findTeamByName = async (
  name: string,
  tx?: Database,
): Promise<Team | undefined> => {
  const executor = tx || db

  const [team] = await executor
    .select()
    .from(teamsTable)
    .where(eq(teamsTable.name, name))

  return team
}

export const findTeamMembers = async (
  teamId: string,
  tx?: Database,
): Promise<TeamMemberDetails[]> => {
  const executor = tx || db

  return executor
    .select({
      id: teamMembersTable.userId,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
      status: usersTable.status,
      position: teamMembersTable.position,
      invitedBy: teamMembersTable.invitedBy,
      joinedAt: teamMembersTable.joinedAt,
    })
    .from(teamMembersTable)
    .innerJoin(usersTable, eq(teamMembersTable.userId, usersTable.id))
    .where(eq(teamMembersTable.teamId, teamId))
}

export const findTeamMember = async (
  userId: string,
  teamId: string,
  tx?: Database,
): Promise<TeamMemberDetails | undefined> => {
  const executor = tx || db

  const [member] = await executor
    .select({
      id: teamMembersTable.userId,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
      status: usersTable.status,
      position: teamMembersTable.position,
      invitedBy: teamMembersTable.invitedBy,
      joinedAt: teamMembersTable.joinedAt,
    })
    .from(teamMembersTable)
    .innerJoin(usersTable, eq(teamMembersTable.userId, usersTable.id))
    .where(
      and(
        eq(teamMembersTable.userId, userId),
        eq(teamMembersTable.teamId, teamId),
      ),
    )

  return member
}

export const findTeamWithMembers = async (
  teamId: string,
  tx?: Database,
): Promise<TeamWithMembers | undefined> => {
  const [team, members] = await Promise.all([
    findTeamById(teamId, tx),
    findTeamMembers(teamId, tx),
  ])

  if (!team) {
    return undefined
  }

  return {
    ...team,
    members,
  }
}

export const findUserTeam = async (
  userId: string,
  tx?: Database,
): Promise<Team | undefined> => {
  const executor = tx || db

  const [result] = await executor
    .select({
      id: teamsTable.id,
      name: teamsTable.name,
      website: teamsTable.website,
      description: teamsTable.description,
      createdAt: teamsTable.createdAt,
      updatedAt: teamsTable.updatedAt,
    })
    .from(teamMembersTable)
    .innerJoin(teamsTable, eq(teamMembersTable.teamId, teamsTable.id))
    .where(eq(teamMembersTable.userId, userId))

  return result
}
