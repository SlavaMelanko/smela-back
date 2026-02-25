import { and, eq, inArray, isNotNull, isNull, or } from 'drizzle-orm'

import type { Role } from '@/types'

import type { Database } from '../../clients'
import type { ActivePermissionRow, Inviter, RolePermissionRow, UserRoleRecord } from './types'

import { db } from '../../clients'
import { permissionsTable, rolePermissionsTable, userPermissionsTable, userRolesTable, usersTable } from '../../schema'

export const findAllPermissions = async (
  tx?: Database,
): Promise<(typeof permissionsTable.$inferSelect)[]> => {
  return (tx || db).select().from(permissionsTable)
}

export const findRolePermissions = async (
  role: Role,
  tx?: Database,
): Promise<RolePermissionRow[]> => {
  return (tx || db)
    .select({
      permissionId: rolePermissionsTable.permissionId,
      action: permissionsTable.action,
      resource: permissionsTable.resource,
    })
    .from(rolePermissionsTable)
    .innerJoin(permissionsTable, eq(permissionsTable.id, rolePermissionsTable.permissionId))
    .where(eq(rolePermissionsTable.role, role))
}

/**
 * Returns all permissions effectively granted to a user given their role.
 *
 * A permission is included when:
 * - The user has an explicit grant (`granted = true`), or
 * - No user override exists and the role has the permission by default
 *
 * Explicit revocations (`granted = false`) and unset permissions are excluded.
 * Roles without defaults (e.g. User) rely entirely on explicit grants.
 */
export const findUserPermissions = async (
  userId: string,
  role: Role,
  tx?: Database,
): Promise<ActivePermissionRow[]> => {
  return (tx || db)
    .select({
      action: permissionsTable.action,
      resource: permissionsTable.resource,
    })
    .from(permissionsTable)
    .leftJoin(rolePermissionsTable, and(
      eq(rolePermissionsTable.permissionId, permissionsTable.id),
      eq(rolePermissionsTable.role, role),
    ))
    .leftJoin(userPermissionsTable, and(
      eq(userPermissionsTable.permissionId, permissionsTable.id),
      eq(userPermissionsTable.userId, userId),
    ))
    .where(
      or(
        eq(userPermissionsTable.granted, true),
        and(
          isNull(userPermissionsTable.granted),
          isNotNull(rolePermissionsTable.id),
        ),
      ),
    )
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
