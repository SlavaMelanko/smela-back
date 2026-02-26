import { eq, inArray } from 'drizzle-orm'

import type { Database } from '../../clients'
import type { ActivePermissionRow, Inviter, UserRoleRecord } from './types'

import { db } from '../../clients'
import { permissionsTable, userPermissionsTable, userRolesTable, usersTable } from '../../schema'

export const findAllPermissions = async (
  tx?: Database,
): Promise<(typeof permissionsTable.$inferSelect)[]> => {
  return (tx || db).select().from(permissionsTable)
}

export const findUserPermissions = async (
  userId: string,
  tx?: Database,
): Promise<ActivePermissionRow[]> => {
  return (tx || db)
    .select({
      action: permissionsTable.action,
      resource: permissionsTable.resource,
    })
    .from(userPermissionsTable)
    .innerJoin(permissionsTable, eq(permissionsTable.id, userPermissionsTable.permissionId))
    .where(eq(userPermissionsTable.userId, userId))
}

export const findRole = async (
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

export const findInviters = async (
  userIds: string[],
  tx?: Database,
): Promise<Map<string, Inviter>> => {
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
    })
    .from(userRolesTable)
    .innerJoin(usersTable, eq(userRolesTable.invitedBy, usersTable.id))
    .where(inArray(userRolesTable.userId, userIds))

  return new Map(rows.map(r => [r.userId, {
    id: r.inviterId,
    firstName: r.firstName,
    lastName: r.lastName,
  }]))
}
