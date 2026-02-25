import { sql } from 'drizzle-orm'

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

  const overrides = allPerms
    .filter(p => permissions[p.resource]?.[p.action] !== undefined)
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
