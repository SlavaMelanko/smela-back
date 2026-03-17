import { and, count, desc, eq, inArray, isNull, sql } from 'drizzle-orm'

import { Role } from '@/types'

import type { Database } from '../../clients'
import type { PaginationParams } from '../pagination'
import type { SearchParams, SearchResult, User } from './types'

import { db } from '../../clients'
import { teamMembersTable, teamsTable, userRoleTable, usersTable } from '../../schema'
import { buildPagination, calcOffset } from '../pagination'
import { lastActiveSubquery } from '../refresh-token/queries'

const selectUserBase = (executor: Database) =>
  executor
    .select({
      id: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
      status: usersTable.status,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
      role: sql<Role>`COALESCE(${userRoleTable.role}, ${Role.User})`,
    })
    .from(usersTable)
    .leftJoin(userRoleTable, eq(usersTable.id, userRoleTable.userId))

const selectUserExtended = (executor: Database) => {
  const lastActiveSq = lastActiveSubquery(executor)

  return executor
    .select({
      id: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
      status: usersTable.status,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
      lastActive: lastActiveSq.lastActive,
      role: sql<Role>`COALESCE(${userRoleTable.role}, ${Role.User})`,
      team: {
        id: teamsTable.id,
        name: teamsTable.name,
      },
    })
    .from(usersTable)
    .leftJoin(userRoleTable, eq(usersTable.id, userRoleTable.userId))
    .leftJoin(teamMembersTable, eq(usersTable.id, teamMembersTable.userId))
    .leftJoin(teamsTable, eq(teamMembersTable.teamId, teamsTable.id))
    .leftJoin(lastActiveSq, eq(usersTable.id, lastActiveSq.userId))
}

const findUserBy = async (
  condition: ReturnType<typeof eq>,
  tx?: Database,
): Promise<User | undefined> => {
  const executor = tx || db

  const [row] = await selectUserBase(executor).where(condition)

  return row
}

export const findUserById = async (userId: string, tx?: Database) =>
  findUserBy(eq(usersTable.id, userId), tx)

export const findUserByIdExtended = async (
  userId: string,
  tx?: Database,
): Promise<User | undefined> => {
  const executor = tx || db

  const [row] = await selectUserExtended(executor).where(eq(usersTable.id, userId))

  if (!row) {
    return undefined
  }

  const { team, ...user } = row

  return team?.id != null ? { ...user, team } : user
}

export const findUserByEmail = async (email: string, tx?: Database) =>
  findUserBy(eq(usersTable.email, email), tx)

const buildRoleCondition = (roles: Role[]) => {
  if (roles.length === 0) {
    return undefined
  }

  // "User" is the default role — users without a row in user_role
  // are regular users, so we match them via NULL.
  if (roles.includes(Role.User)) {
    return isNull(userRoleTable.userId)
  }

  // Elevated roles (Admin, Owner) have explicit rows and are matched with inArray
  return inArray(userRoleTable.role, roles)
}

const buildWhereConditions = ({ search, roles, statuses }: SearchParams) => {
  const conditions = []

  const roleCondition = buildRoleCondition(roles)
  if (roleCondition) {
    conditions.push(roleCondition)
  }

  if (statuses && statuses.length > 0) {
    conditions.push(inArray(usersTable.status, statuses))
  }

  if (search && search.length > 0) {
    // Use concatenated expression to leverage GIN index (idx_users_search_trgm)
    conditions.push(
      sql`(${usersTable.id}::text || ' ' || ${usersTable.firstName} || ' ' || COALESCE(${usersTable.lastName}, '') || ' ' || ${usersTable.email}) ILIKE ${`%${search}%`}`,
    )
  }

  return conditions.length > 0 ? and(...conditions) : undefined
}

export const search = async (
  filters: SearchParams,
  pagination: PaginationParams,
  tx?: Database,
): Promise<SearchResult> => {
  const executor = tx || db

  const searchQuery = selectUserExtended(executor)

  const countQuery = executor
    .select({ value: count() })
    .from(usersTable)
    .leftJoin(userRoleTable, eq(usersTable.id, userRoleTable.userId))

  const whereClause = buildWhereConditions(filters)

  const [users, countResult] = await Promise.all([
    searchQuery
      .where(whereClause)
      .orderBy(desc(usersTable.createdAt))
      .limit(pagination.limit)
      .offset(calcOffset(pagination)),
    countQuery
      .where(whereClause),
  ])

  return {
    users: users.map(({ team, ...user }) => team?.id ? { ...user, team } : user),
    pagination: buildPagination(pagination, countResult),
  }
}
