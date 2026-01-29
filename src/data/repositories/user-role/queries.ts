import { eq, inArray } from 'drizzle-orm'

import type { Database } from '../../clients'
import type { InviteInfo, UserRoleRecord } from './types'

import { db } from '../../clients'
import { userRolesTable, usersTable } from '../../schema'

export const findByUserId = async (
  userId: string,
  tx?: Database,
): Promise<UserRoleRecord | undefined> => {
  const executor = tx || db

  const [found] = await executor
    .select()
    .from(userRolesTable)
    .where(eq(userRolesTable.userId, userId))

  return found
}

export const findInvites = async (
  userIds: string[],
  tx?: Database,
): Promise<Map<string, InviteInfo>> => {
  if (userIds.length === 0) {
    return new Map()
  }

  const executor = tx || db
  const rows = await executor
    .select({
      userId: userRolesTable.userId,
      inviterId: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      invitedAt: userRolesTable.assignedAt,
    })
    .from(userRolesTable)
    .innerJoin(usersTable, eq(userRolesTable.invitedBy, usersTable.id))
    .where(inArray(userRolesTable.userId, userIds))

  return new Map(rows.map(r => [r.userId, {
    inviterId: r.inviterId,
    inviterName: r.lastName ? `${r.firstName} ${r.lastName}` : r.firstName,
    invitedAt: r.invitedAt,
  }]))
}
