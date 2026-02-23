import { sql } from 'drizzle-orm'

import type { Permissions } from '@/routes/@shared/permissions-schema'
import type { Role } from '@/types'

import type { Database } from '../../clients'
import type { CreateUserRoleInput, UserRoleRecord } from './types'

import { db } from '../../clients'
import { userPermissionsTable, userRolesTable } from '../../schema'
import { findRolePermissions } from './queries'

export const setUserPermissions = async (
  userId: string,
  role: Role,
  permissions: Permissions,
  tx?: Database,
): Promise<void> => {
  const executor = tx || db

  const rolePerms = await findRolePermissions(role, tx)
  const revocations = rolePerms
    .filter(p => permissions[p.resource]?.[p.action] === false)
    .map(p => ({ userId, permissionId: p.permissionId, granted: false }))

  if (revocations.length === 0) {
    return
  }

  await executor
    .insert(userPermissionsTable)
    .values(revocations)
    .onConflictDoUpdate({
      target: [userPermissionsTable.userId, userPermissionsTable.permissionId],
      set: { granted: sql`excluded.granted` },
    })
}

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
