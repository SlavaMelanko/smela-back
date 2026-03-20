import { and, eq, inArray } from 'drizzle-orm'

import type { PermissionsInput } from '@/types'

import type { Database } from '../../clients'
import type { CreateUserRoleInput, UserRoleRecord } from './types'

import { db } from '../../clients'
import { userPermissionsTable, userRoleTable } from '../../schema'
import { collapsePermissions } from './normalize'
import { findAllPermissions } from './queries'

export const assignRole = async (
  input: CreateUserRoleInput,
  tx?: Database,
): Promise<UserRoleRecord> => {
  const executor = tx || db

  const [created] = await executor
    .insert(userRoleTable)
    .values(input)
    .returning()

  return created
}

export const setUserPermissions = async (
  userId: string,
  permissions: PermissionsInput,
  tx?: Database,
): Promise<void> => {
  const executor = tx || db
  const normalized = collapsePermissions(permissions)
  const allPerms = await findAllPermissions(tx)

  const grant = async () => {
    const toGrant = allPerms
      .filter(p => normalized[p.resource]?.[p.action] === true)
      .map(p => ({ userId, permissionId: p.id }))

    if (toGrant.length === 0) {
      return
    }

    await executor
      .insert(userPermissionsTable)
      .values(toGrant)
      .onConflictDoNothing()
  }

  const revoke = async () => {
    const toRevoke = allPerms
      .filter(p => !normalized[p.resource]?.[p.action])
      .map(p => p.id)

    if (toRevoke.length === 0) {
      return
    }

    await executor
      .delete(userPermissionsTable)
      .where(
        and(
          eq(userPermissionsTable.userId, userId),
          inArray(userPermissionsTable.permissionId, toRevoke),
        ),
      )
  }

  await Promise.all([grant(), revoke()])
}
