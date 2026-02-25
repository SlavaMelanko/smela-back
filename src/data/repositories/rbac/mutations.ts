import { sql } from 'drizzle-orm'

import type { Permissions } from '@/routes/@shared/permissions-schema'
import type { Role } from '@/types'

import type { Database } from '../../clients'
import type { CreateUserRoleInput, UserRoleRecord } from './types'

import { db } from '../../clients'
import { userPermissionsTable, userRolesTable } from '../../schema'
import { findAllPermissions, findRolePermissions } from './queries'

export const assignRole = async (
  input: CreateUserRoleInput,
  tx?: Database,
): Promise<UserRoleRecord> => {
  const executor = tx || db

  const [created] = await executor
    .insert(userRolesTable)
    .values(input)
    .returning()

  return created
}

export const setUserPermissions = async (
  userId: string,
  role: Role,
  permissions: Permissions,
  tx?: Database,
): Promise<void> => {
  const executor = tx || db

  const [rolePerms, allPerms] = await Promise.all([
    findRolePermissions(role, tx),
    findAllPermissions(tx),
  ])

  const roleDefaultIds = new Set(rolePerms.map(p => p.permissionId))

  // Store only deltas: grants for non-default permissions, revocations for overridden defaults
  const overrides = allPerms
    .filter((p) => {
      const specified = permissions[p.resource]?.[p.action]
      const isDefault = roleDefaultIds.has(p.id)

      return specified !== undefined && specified !== isDefault
    })
    .map(p => ({ userId, permissionId: p.id, granted: permissions[p.resource]![p.action] }))

  if (overrides.length === 0) {
    return
  }

  await executor
    .insert(userPermissionsTable)
    .values(overrides)
    .onConflictDoUpdate({
      target: [userPermissionsTable.userId, userPermissionsTable.permissionId],
      set: { granted: sql`excluded.granted` },
    })
}
