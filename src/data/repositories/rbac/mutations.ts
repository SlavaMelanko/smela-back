import { and, eq, inArray } from 'drizzle-orm'

import type { Permissions } from '@/routes/@shared/permissions-schema'

import type { Database } from '../../clients'
import type { CreateUserRoleInput, UserRoleRecord } from './types'

import { db } from '../../clients'
import { userPermissionsTable, userRolesTable } from '../../schema'
import { findAllPermissions } from './queries'

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
  permissions: Permissions,
  tx?: Database,
): Promise<void> => {
  const executor = tx || db

  const allPerms = await findAllPermissions(tx)

  const toGrant = allPerms
    .filter(p => permissions[p.resource]?.[p.action] === true)
    .map(p => ({ userId, permissionId: p.id }))

  const toRevoke = allPerms
    .filter(p => permissions[p.resource]?.[p.action] === false)
    .map(p => p.id)

  if (toGrant.length > 0) {
    await executor
      .insert(userPermissionsTable)
      .values(toGrant)
      .onConflictDoNothing()
  }

  if (toRevoke.length > 0) {
    await executor
      .delete(userPermissionsTable)
      .where(
        and(
          eq(userPermissionsTable.userId, userId),
          inArray(userPermissionsTable.permissionId, toRevoke),
        ),
      )
  }
}
