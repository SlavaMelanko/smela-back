import { and, count, desc, eq, inArray, sql } from 'drizzle-orm'

import type { Role, Status } from '@/types'

import type { Database } from '../../clients'
import type { PaginatedResult, PaginationParams } from '../pagination'
import type { User } from './types'

import { db } from '../../clients'
import { usersTable } from '../../schema'
import { calcOffset } from '../pagination'

export const findUserById = async (
  userId: string,
  tx?: Database,
): Promise<User | undefined> => {
  const executor = tx || db

  const [foundUser] = await executor
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))

  return foundUser
}

export const findUserByEmail = async (
  email: string,
  tx?: Database,
): Promise<User | undefined> => {
  const executor = tx || db

  const [foundUser] = await executor
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))

  return foundUser
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
    const conditions = [inArray(usersTable.role, roles)]

    if (statuses && statuses.length > 0) {
      conditions.push(inArray(usersTable.status, statuses))
    }

    if (search && search.length > 0) {
      // Use concatenated expression to leverage GIN index (idx_users_search_trgm)
      conditions.push(
        sql`(id::text || ' ' || first_name || ' ' || COALESCE(last_name, '') || ' ' || email) ILIKE ${`%${search}%`}`,
      )
    }

    return and(...conditions)
  }

  const whereClause = buildWhereConditions()

  const [countResult, users] = await Promise.all([
    executor.select({ value: count() }).from(usersTable).where(whereClause),
    executor
      .select()
      .from(usersTable)
      .where(whereClause)
      .orderBy(desc(usersTable.createdAt))
      .limit(limit)
      .offset(offset),
  ])

  const totalCount = countResult[0]?.value ?? 0

  return {
    users,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  }
}
