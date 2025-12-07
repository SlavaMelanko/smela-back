import { and, count, eq, inArray } from 'drizzle-orm'

import type { Role, Status } from '@/types'

import type { Database } from '../../clients'
import type { PaginatedResult, PaginationParams } from '../pagination'
import type { User, UserRecord } from './types'

import { db } from '../../clients'
import { usersTable } from '../../schema'
import { calcOffset } from '../pagination'

export const toTypeSafeUser = (user: UserRecord): User | undefined => {
  if (!user) {
    return undefined
  }

  return {
    ...user,
    status: user.status as Status,
    role: user.role as Role,
  }
}

export const findUserById = async (
  userId: number,
  tx?: Database,
): Promise<User | undefined> => {
  const executor = tx || db

  const [foundUser] = await executor
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))

  return toTypeSafeUser(foundUser)
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

  return toTypeSafeUser(foundUser)
}

export interface SearchParams {
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
  const { roles, statuses } = filters
  const { page, limit } = pagination
  const offset = calcOffset(pagination)

  const buildWhereConditions = () => {
    const conditions = [inArray(usersTable.role, roles)]

    if (statuses && statuses.length > 0) {
      conditions.push(inArray(usersTable.status, statuses))
    }

    return and(...conditions)
  }

  const whereClause = buildWhereConditions()

  const [countResult, users] = await Promise.all([
    executor.select({ value: count() }).from(usersTable).where(whereClause),
    executor.select().from(usersTable).where(whereClause).limit(limit).offset(offset),
  ])

  const totalCount = countResult[0]?.value ?? 0

  return {
    users: users.map(u => toTypeSafeUser(u)!),
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  }
}
