import { and, count, desc, eq, inArray, isNull, sql } from 'drizzle-orm'

import type { Status } from '@/types'

import { Role } from '@/types'

import type { Database } from '../../clients'
import type { PaginatedResult, PaginationParams } from '../pagination'
import type { User } from './types'

import { db } from '../../clients'
import { userRolesTable, usersTable } from '../../schema'
import { calcOffset } from '../pagination'

const selectUserWithRole = (executor: Database) =>
  executor
    .select({
      id: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
      status: usersTable.status,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
      role: userRolesTable.role,
    })
    .from(usersTable)
    .leftJoin(userRolesTable, eq(usersTable.id, userRolesTable.userId))

const toUser = (row: { role: string | null } & Record<string, unknown>): User => ({
  ...row,
  role: row.role ?? Role.User,
}) as User

const findUserBy = async (
  condition: ReturnType<typeof eq>,
  tx?: Database,
): Promise<User | undefined> => {
  const executor = tx || db

  const [row] = await selectUserWithRole(executor)
    .where(condition)

  return row ? toUser(row) : undefined
}

export const findUserById = async (userId: string, tx?: Database) =>
  findUserBy(eq(usersTable.id, userId), tx)

export const findUserByEmail = async (email: string, tx?: Database) =>
  findUserBy(eq(usersTable.email, email), tx)

export interface SearchParams {
  search?: string
  roles: Role[]
  statuses?: Status[]
}

export interface SearchResult {
  users: User[]
  pagination: PaginatedResult
}

const buildRoleCondition = (roles: Role[]) => {
  if (roles.length === 0) {
    return undefined
  }

  // "User" is the default role — users without a row in user_roles are regular
  // users, so we match them via NULL.
  if (roles.includes(Role.User)) {
    return isNull(userRolesTable.userId)
  }

  // Elevated roles (Admin, Owner) have
  // explicit rows and are matched with inArray
  return inArray(userRolesTable.role, roles)
}

export const search = async (
  filters: SearchParams,
  pagination: PaginationParams,
  tx?: Database,
): Promise<SearchResult> => {
  const executor = tx || db
  const { search, roles, statuses } = filters
  const { page, limit } = pagination
  const offset = calcOffset(pagination)

  const buildWhereConditions = () => {
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
        sql`(id::text || ' ' || first_name || ' ' || COALESCE(last_name, '') || ' ' || email) ILIKE ${`%${search}%`}`,
      )
    }

    return conditions.length > 0 ? and(...conditions) : undefined
  }

  const whereClause = buildWhereConditions()

  const searchQuery = selectUserWithRole(executor)

  const countQuery = executor
    .select({ value: count() })
    .from(usersTable)
    .leftJoin(userRolesTable, eq(usersTable.id, userRolesTable.userId))

  const [rows, countResult] = await Promise.all([
    searchQuery
      .where(whereClause)
      .orderBy(desc(usersTable.createdAt))
      .limit(limit)
      .offset(offset),
    countQuery
      .where(whereClause),
  ])

  const totalCount = countResult[0]?.value ?? 0

  return {
    users: rows.map(toUser),
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  }
}
