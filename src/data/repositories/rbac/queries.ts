import { and, eq, sql } from 'drizzle-orm'

import type { Action, Resource, Role } from '@/types'

import type { Database } from '../../clients'

import { db } from '../../clients'
import { permissionsTable, rolePermissionsTable, userPermissionsTable } from '../../schema'

export interface PermissionRow {
  action: Action
  resource: Resource
  default: boolean
  override: boolean | null // null = no user override, use role default
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

export const findUserPermissions = async (
  userId: string,
  role: Role,
  tx?: Database,
): Promise<PermissionRow[]> => {
  const executor = tx || db

  return executor
    .select({
      action: permissionsTable.action,
      resource: permissionsTable.resource,
      default: sql<boolean>`${rolePermissionsTable.id} IS NOT NULL`,
      override: userPermissionsTable.granted,
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
}
