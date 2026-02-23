import { and, eq, isNotNull, isNull, or } from 'drizzle-orm'

import type { Action, Resource, Role } from '@/types'

import type { Database } from '../../clients'

import { db } from '../../clients'
import { permissionsTable, rolePermissionsTable, userPermissionsTable } from '../../schema'

export interface ActivePermissionRow {
  action: Action
  resource: Resource
}

export interface RolePermissionRow {
  permissionId: number
  action: Action
  resource: Resource
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
 * - The user has an explicit override (`granted = true`), or
 * - No user override exists and the role has the permission by default
 *
 * Explicit revocations (`granted = false`) are excluded.
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
